from app.services.article_cleaner import (
    clean_article_content,
    validate_article,
    word_count,
)


def main():

    raw_content = """
    The Future of AI

    The company announced a new artificial intelligence system.

    Advertisement

    Subscribe to our newsletter

    The system is expected to launch later this year.

    Related stories
    """

    cleaned = clean_article_content(
        raw_content,
        "The Future of AI",
    )

    print("=" * 70)
    print("CLEANED ARTICLE")
    print("=" * 70)

    print(cleaned)

    print()
    print("Word count:", word_count(cleaned))

    valid, reason = validate_article(
        title="The Future of AI",
        source_url="https://example.com/article",
        content=cleaned,
        min_words=80,
    )

    print("Valid:", valid)
    print("Reason:", reason)


if __name__ == "__main__":
    main()