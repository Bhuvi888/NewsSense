import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup


NON_ARTICLE_TITLES = {
    "tech now",
    "tech life",
    "the papers",
    "americast",
    "bbc news app",
}

NON_ARTICLE_PATH_PATTERNS = (
    "/podcast/",
    "/podcasts/",
    "/video/",
    "/videos/",
    "/live/",
    "/gallery/",
    "/galleries/",
)


def normalize_whitespace(text: str | None) -> str:
    if not text:
        return ""

    return re.sub(r"[ \t]+", " ", text).strip()


def clean_title(title: str | None) -> str:
    return normalize_whitespace(title)


def clean_summary(summary: str | None) -> str:
    return normalize_whitespace(summary)


def clean_content(content: str | None) -> str:
    if not content:
        return ""

    content = content.replace("\r\n", "\n").replace("\r", "\n")

    soup = BeautifulSoup(content, "html.parser")
    text = soup.get_text("\n")

    lines = []

    for line in text.split("\n"):
        line = re.sub(r"[ \t]+", " ", line).strip()

        if line:
            lines.append(line)

    return "\n\n".join(lines).strip()


def remove_duplicate_title(
    content: str,
    title: str | None,
) -> str:

    if not content or not title:
        return content

    normalized_content = content.strip()
    normalized_title = title.strip()

    if normalized_content.lower().startswith(
        normalized_title.lower()
    ):
        normalized_content = normalized_content[
            len(normalized_title):
        ].strip()

    return normalized_content


def clean_article_content(
    content: str | None,
    title: str | None = None,
) -> str:

    content = clean_content(content)

    if not content:
        return ""

    content = remove_duplicate_title(content, title)

    return content.strip()


def is_valid_url(url: str | None) -> bool:
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
    if not title:
        return True

    normalized = re.sub(
        r"\s+",
        " ",
        title,
    ).strip().lower()

    return normalized in NON_ARTICLE_TITLES


def is_non_article_url(url: str | None) -> bool:
    if not url:
        return True

    try:
        path = urlparse(url).path.lower()

        return any(
            pattern in path
            for pattern in NON_ARTICLE_PATH_PATTERNS
        )

    except Exception:
        return False


def word_count(text: str | None) -> int:
    if not text:
        return 0

    return len(text.split())


def validate_article(
    title: str,
    source_url: str,
    content: str,
    min_words: int = 80,
):
    if not title or not title.strip():
        return False, "missing_title"

    if not is_valid_url(source_url):
        return False, "invalid_url"

    if is_non_article_title(title):
        return False, "known_non_article"

    if is_non_article_url(source_url):
        return False, "non_article_url"

    if not content or not content.strip():
        return False, "empty_content"

    count = word_count(content)

    if count < min_words:
        return False, f"content_too_short:{count}_words"

    return True, None