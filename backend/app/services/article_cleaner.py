import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup


# Known RSS feed/navigation items that are not individual news articles.
NON_ARTICLE_TITLES = {
    "tech now",
    "tech life",
    "the papers",
    "americast",
}


def clean_html(raw_html: str | None) -> str:
    """Convert HTML into clean plain text."""
    if not raw_html:
        return ""

    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(" ", strip=True)

    return re.sub(r"\s+", " ", text).strip()


def is_valid_url(url: str | None) -> bool:
    """Check whether a URL is a valid HTTP/HTTPS URL."""
    if not url:
        return False

    try:
        parsed = urlparse(url)

        return (
            parsed.scheme in {"http", "https"}
            and bool(parsed.netloc)
        )

    except Exception:
        return False


def is_non_article_title(title: str | None) -> bool:
    """Check whether a title is a known non-article feed item."""
    if not title:
        return False

    normalized = re.sub(r"\s+", " ", title).strip().lower()

    return normalized in NON_ARTICLE_TITLES


def validate_article(
    title: str,
    source_url: str,
    summary: str,
    content: str,
) -> tuple[bool, str | None]:
    """
    Validate an article before storing it.

    Returns:
        (True, None) if valid
        (False, reason) if rejected
    """

    if not is_valid_url(source_url):
        return False, "invalid_url"

    if is_non_article_title(title):
        return False, "known_non_article"

    # Do NOT reject short articles.
    # RSS feeds can contain legitimate articles with short summaries.
    if not summary.strip() and not content.strip():
        return False, "no_content"

    return True, None