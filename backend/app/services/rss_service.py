import hashlib
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import feedparser
import httpx
from sqlalchemy.orm import Session

from app.models import Article
from app.services.article_cleaner import clean_html


RSS_FEEDS = [
    {
        "name": "TechCrunch",
        "category": "Technology",
        "url": "https://techcrunch.com/feed/",
    },
    {
        "name": "The Verge",
        "category": "Technology",
        "url": "https://www.theverge.com/rss/index.xml",
    },
    {
        "name": "BBC News",
        "category": "World",
        "url": "https://feeds.bbci.co.uk/news/rss.xml",
    },
    {
        "name": "BBC Technology",
        "category": "Technology",
        "url": "https://feeds.bbci.co.uk/news/technology/rss.xml",
    },
    {
        "name": "The Hindu",
        "category": "India",
        "url": "https://www.thehindu.com/news/national/feeder/default.rss",
    },
]


def make_article_id(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


def parse_published_at(entry: Any) -> datetime | None:
    raw_date = entry.get("published") or entry.get("updated")

    if not raw_date:
        return None

    try:
        parsed_date = parsedate_to_datetime(raw_date)

        if parsed_date.tzinfo is None:
            return parsed_date.replace(tzinfo=timezone.utc).replace(tzinfo=None)

        return parsed_date.astimezone(timezone.utc).replace(tzinfo=None)
    except (TypeError, ValueError):
        return None


def get_entry_content(entry: Any) -> str:
    content_items = entry.get("content", [])

    if content_items:
        return content_items[0].get("value", "")

    return entry.get("summary", "") or entry.get("description", "")


def ingest_all_feeds(db: Session) -> dict[str, Any]:
    stats = {
        "feeds_processed": 0,
        "articles_found": 0,
        "articles_added": 0,
        "duplicates_skipped": 0,
        "errors": [],
    }

    headers = {
        "User-Agent": "Newsense/0.1 RSS Reader (educational project)",
    }

    with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers) as client:
        for feed_config in RSS_FEEDS:
            try:
                response = client.get(feed_config["url"])
                response.raise_for_status()

                feed = feedparser.parse(response.content)
                stats["feeds_processed"] += 1

                for entry in feed.entries:
                    stats["articles_found"] += 1

                    article_url = entry.get("link", "").strip()

                    if not article_url:
                        continue

                    article_id = make_article_id(article_url)

                    if db.get(Article, article_id):
                        stats["duplicates_skipped"] += 1
                        continue

                    title = clean_html(entry.get("title", "")) or "Untitled Article"
                    summary = clean_html(
                        entry.get("summary", "") or entry.get("description", "")
                    )
                    content = clean_html(get_entry_content(entry))

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

                    db.add(article)
                    stats["articles_added"] += 1

                db.commit()

            except Exception as error:
                db.rollback()
                stats["errors"].append(
                    f"{feed_config['name']}: {str(error)}"
                )

    return stats