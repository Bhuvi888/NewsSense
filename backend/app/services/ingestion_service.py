from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models import Article
from app.repositories.article_repository import ArticleRepository
from app.services.article_cleaner import (
    clean_article_content,
    clean_summary,
    clean_title,
    validate_article,
    word_count,
)
from app.services.article_extractor import article_extractor
from app.services.rss_service import (
    RSS_FEEDS,
    fetch_feed,
    make_article_id,
    parse_published_at,
)
from app.services.vector_store import vector_store


class IngestionService:

    def process_entry(
        self,
        db: Session,
        entry,
        source: str,
        category: str,
        index_to_chroma: bool = False,
    ) -> dict:

        title = clean_title(entry.get("title"))
        source_url = entry.get("link")
        summary = clean_summary(entry.get("summary"))
        author = clean_summary(entry.get("author"))
        published_at = parse_published_at(entry)

        # --------------------------------------------------
        # Basic validation
        # --------------------------------------------------

        if not source_url:
            return {
                "status": "skipped",
                "reason": "missing_url",
            }

        # --------------------------------------------------
        # Duplicate check
        # --------------------------------------------------

        existing = ArticleRepository.get_by_source_url(
            db,
            source_url,
        )

        if existing:
            return {
                "status": "duplicate",
                "article_id": existing.id,
            }

        # --------------------------------------------------
        # Article extraction
        # --------------------------------------------------

        extracted = article_extractor.extract(source_url)

        if not extracted:
            return {
                "status": "skipped",
                "reason": "extraction_failed",
            }

        # --------------------------------------------------
        # Cleaning
        # --------------------------------------------------

        content = clean_article_content(
            extracted.content,
            title,
        )

        # --------------------------------------------------
        # Validation
        # --------------------------------------------------

        valid, reason = validate_article(
            title=title,
            source_url=source_url,
            content=content,
        )

        if not valid:
            return {
                "status": "skipped",
                "reason": reason,
            }

        # --------------------------------------------------
        # Create Article
        # --------------------------------------------------

        article = Article(
            id=make_article_id(source_url),
            title=title,
            source=source,
            source_url=source_url,
            published_at=published_at,
            category=category,
            author=author or None,
            summary=summary or None,
            content=content,
            content_source="trafilatura",
            content_extracted_at=datetime.utcnow(),
            content_word_count=word_count(content),
            image_url=None,
            ingested_at=datetime.utcnow(),
        )

        # --------------------------------------------------
        # Database persistence
        # --------------------------------------------------

        try:
            ArticleRepository.create(db, article)

            db.commit()
            db.refresh(article)

        except Exception as exc:

            db.rollback()

            print(
                f"Database insert failed for "
                f"{source_url}: {exc}"
            )

            return {
                "status": "failed",
                "reason": "database_error",
                "error": str(exc),
            }

        # --------------------------------------------------
        # Chroma indexing
        # --------------------------------------------------

        if index_to_chroma:

            try:

                vector_store.index_article(article)

            except Exception as exc:

                print(
                    f"Warning: Chroma indexing failed "
                    f"for {article.id}: {exc}"
                )

        # --------------------------------------------------
        # Success
        # --------------------------------------------------

        return {
            "status": "inserted",
            "article_id": article.id,
            "word_count": article.content_word_count,
        }


ingestion_service = IngestionService()


def run_ingestion(db: Session) -> dict[str, Any]:
    """Fetch configured feeds, persist new articles, and index them."""
    stats: dict[str, Any] = {
        "feeds_processed": 0,
        "articles_found": 0,
        "articles_added": 0,
        "duplicates_skipped": 0,
        "errors": [],
    }

    for feed_config in RSS_FEEDS:
        try:
            feed = fetch_feed(feed_config)
            stats["feeds_processed"] += 1

            for entry in feed.entries:
                stats["articles_found"] += 1
                result = ingestion_service.process_entry(
                    db=db,
                    entry=entry,
                    source=feed_config["name"],
                    category=feed_config["category"],
                    index_to_chroma=True,
                )

                if result.get("status") == "inserted":
                    stats["articles_added"] += 1
                elif result.get("status") == "duplicate":
                    stats["duplicates_skipped"] += 1
                elif result.get("status") == "failed":
                    stats["errors"].append(
                        f"{feed_config['name']}: "
                        f"{result.get('reason', 'unknown error')}"
                    )

            db.commit()

        except Exception as exc:
            db.rollback()
            stats["errors"].append(
                f"{feed_config['name']}: {exc}"
            )

    return stats


def get_ingestion_status(db: Session) -> dict[str, Any]:
    """Return MySQL article and last-ingestion status."""
    return {
        "article_count": ArticleRepository.count(db),
        "latest_ingestion_at": ArticleRepository.latest_ingestion(db),
        "vector_count": vector_store.collection.count(),
        "vector_collection": vector_store.collection_name,
    }


def backfill_vectors(db: Session) -> dict[str, Any]:
    """Rebuild the derived Chroma index from MySQL articles."""
    articles = ArticleRepository.get_all(db)
    vector_store.reset_collection()
    indexed = 0
    chunks = 0
    errors: list[str] = []

    for article in articles:
        try:
            chunks += vector_store.index_article(article)
            indexed += 1
        except Exception as exc:
            errors.append(f"{article.id}: {exc}")

    return {
        "total_articles": len(articles),
        "indexed": indexed,
        "chunks": chunks,
        "vector_count": vector_store.collection.count(),
        "errors": errors,
    }
