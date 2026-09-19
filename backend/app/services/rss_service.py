import hashlib
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import feedparser
import httpx


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
    # Mint
{
    "name": "Mint Sports",
    "category": "Sports",
    "url": "https://www.livemint.com/rss/sports",
},
{
    "name": "Mint Companies",
    "category": "Business",
    "url": "https://www.livemint.com/rss/companies",
},
{
    "name": "Mint Markets",
    "category": "Business",
    "url": "https://www.livemint.com/rss/markets",
},
{
    "name": "Mint Politics",
    "category": "Politics",
    "url": "https://www.livemint.com/rss/politics",
},
{
    "name": "Mint Science",
    "category": "Science",
    "url": "https://www.livemint.com/rss/science",
},
{
    "name": "Mint AI",
    "category": "AI",
    "url": "https://www.livemint.com/rss/AI",
},
{
    "name": "Mint Technology",
    "category": "Technology",
    "url": "https://www.livemint.com/rss/technology",
},
]


def make_article_id(url: str) -> str:
    return hashlib.sha256(
        url.encode("utf-8")
    ).hexdigest()


def parse_published_at(
    entry: Any,
) -> datetime | None:

    raw_date = (
        entry.get("published")
        or entry.get("updated")
    )

    if not raw_date:
        return None

    try:
        parsed_date = parsedate_to_datetime(raw_date)

        if parsed_date.tzinfo is None:
            return (
                parsed_date
                .replace(tzinfo=timezone.utc)
                .replace(tzinfo=None)
            )

        return (
            parsed_date
            .astimezone(timezone.utc)
            .replace(tzinfo=None)
        )

    except (TypeError, ValueError):
        return None


def get_entry_content(entry: Any) -> str:
    content_items = entry.get("content", [])

    if content_items:
        return content_items[0].get("value", "")

    return (
        entry.get("summary", "")
        or entry.get("description", "")
    )


def fetch_feed(feed_config: dict[str, str]):
    headers = {
        "User-Agent": (
            "Newsense/0.1 RSS Reader "
            "(educational project)"
        ),
    }

    with httpx.Client(
        timeout=20.0,
        follow_redirects=True,
        headers=headers,
    ) as client:

        response = client.get(
            feed_config["url"]
        )

        response.raise_for_status()

        return feedparser.parse(
            response.content
        )