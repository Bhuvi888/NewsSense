from typing import Any

from sqlalchemy.orm import Session

from app.models import Article
from app.repositories.article_repository import ArticleRepository
from app.services.article_cleaner import clean_html
from app.services.rss_service import (
    RSS_FEEDS,
    fetch_feed,
    get_entry_content,
    make_article_id,
    parse_published_at,
)
from app.services.vector_store import vector_store


def run_ingestion(db: Session) -> dict[str, Any]:
    stats = {
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

            feed_articles: list[Article] = []
            seen_article_ids: set[str] = set()

            for entry in feed.entries:
                stats["articles_found"] += 1

                article_url = entry.get("link", "").strip()

                if not article_url:
                    continue

                article_id = make_article_id(article_url)

                if (
                    article_id in seen_article_ids
                    or ArticleRepository.exists_by_id(db, article_id)
                ):
                    stats["duplicates_skipped"] += 1
                    continue

                seen_article_ids.add(article_id)

                title = (
                    clean_html(entry.get("title", ""))
                    or "Untitled Article"
                )

                summary = clean_html(
                    entry.get("summary", "")
                    or entry.get("description", "")
                )

                content = clean_html(
                    get_entry_content(entry)
                )

                article = Article(
                    id=article_id,
                    title=title[:500],
                    source=feed_config["name"],
                    source_url=article_url,
                    published_at=parse_published_at(entry),
                    category=feed_config["category"],
                    author=entry.get("author"),
                    summary=summary,
                    content=content,
                    image_url=None,
                )

                ArticleRepository.create(db, article)
                feed_articles.append(article)

            # First make MySQL authoritative.
            db.commit()

            stats["articles_added"] += len(feed_articles)

            # ChromaDB is derived from MySQL.
            for article in feed_articles:
                try:
                    vector_store.index_article(article)
                except Exception as vec_error:
                    stats["errors"].append(
                        f"Vector index error for "
                        f"{article.source_url}: {str(vec_error)}"
                    )

        except Exception as error:
            db.rollback()

            stats["errors"].append(
                f"{feed_config['name']}: {str(error)}"
            )

    return stats


def get_ingestion_status(db: Session) -> dict[str, Any]:
    return {
        "article_count": ArticleRepository.count(db),
        "latest_ingestion_at": ArticleRepository.latest_ingestion(db),
    }


def backfill_vectors(db: Session) -> dict[str, Any]:
    articles = ArticleRepository.get_all(db)

    indexed = 0
    errors = []

    for article in articles:
        try:
            vector_store.index_article(article)
            indexed += 1
        except Exception as error:
            errors.append(
                f"{article.id}: {str(error)}"
            )

    return {
        "total_articles": len(articles),
        "indexed": indexed,
        "errors": errors,
    }