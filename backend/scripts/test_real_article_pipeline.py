import feedparser

from app.services.article_cleaner import (
    clean_article_content,
    clean_summary,
    clean_title,
    validate_article,
    word_count,
)
from app.services.article_extractor import article_extractor


FEED_URL = "https://techcrunch.com/feed/"


def main():

    print("=" * 80)
    print("REAL ARTICLE EXTRACTION + CLEANING TEST")
    print("=" * 80)

    # --------------------------------------------------
    # 1. Fetch RSS
    # --------------------------------------------------

    print("\nFetching RSS feed...")

    feed = feedparser.parse(FEED_URL)

    if not feed.entries:
        print("ERROR: No RSS entries found.")
        return

    entry = feed.entries[0]

    title = clean_title(
        entry.get("title")
    )

    source_url = entry.get("link")

    summary = clean_summary(
        entry.get("summary")
    )

    print("\nSOURCE:")
    print("TechCrunch")

    print("\nTITLE:")
    print(title)

    print("\nURL:")
    print(source_url)

    # --------------------------------------------------
    # 2. Extract full article
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("EXTRACTION")
    print("-" * 80)

    extracted = article_extractor.extract(
        source_url
    )

    if not extracted:
        print("Extraction FAILED")
        return

    print("Extraction: SUCCESS")
    print("Final URL:", extracted.final_url)
    print("HTTP status:", extracted.status_code)

    # --------------------------------------------------
    # 3. Clean article
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("CLEANING")
    print("-" * 80)

    cleaned_content = clean_article_content(
        extracted.content,
        title,
    )

    print("Cleaning: SUCCESS")
    print("Word count:", word_count(cleaned_content))

    # --------------------------------------------------
    # 4. Validate
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("VALIDATION")
    print("-" * 80)

    valid, reason = validate_article(
        title=title,
        source_url=source_url,
        content=cleaned_content,
    )

    print("Valid:", valid)
    print("Reason:", reason)

    # --------------------------------------------------
    # 5. Print preview
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("CONTENT PREVIEW")
    print("-" * 80)

    preview_words = cleaned_content.split()[:300]

    print(
        " ".join(preview_words)
    )

    if len(cleaned_content.split()) > 300:
        print("\n...[preview truncated]...")


if __name__ == "__main__":
    main()