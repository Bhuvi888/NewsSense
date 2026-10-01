from app.services.rss_service import (
    RSS_FEEDS,
    fetch_feed,
    parse_published_at,
)


def main():

    print("=" * 80)
    print("RSS FEED VERIFICATION")
    print("=" * 80)

    total_entries = 0
    failed_feeds = 0

    for index, feed_config in enumerate(
        RSS_FEEDS,
        start=1,
    ):

        print(
            f"\n[{index}/{len(RSS_FEEDS)}] "
            f"{feed_config['name']}"
        )

        try:

            feed = fetch_feed(feed_config)

            entries = feed.entries

            print(
                f"  Entries: {len(entries)}"
            )

            if not entries:
                print("  STATUS: FAILED - no entries")
                failed_feeds += 1
                continue

            total_entries += len(entries)

            # Test date parsing on first entry
            first_entry = entries[0]

            published_at = parse_published_at(
                first_entry
            )

            print(
                f"  First article: "
                f"{first_entry.get('title', '')}"
            )

            print(
                f"  Published: {published_at}"
            )

            print("  STATUS: OK")

        except Exception as exc:

            failed_feeds += 1

            print(
                f"  STATUS: FAILED"
            )

            print(
                f"  Error: {exc}"
            )

    print("\n" + "=" * 80)
    print("RSS VERIFICATION SUMMARY")
    print("=" * 80)

    print(
        f"Feeds tested:    {len(RSS_FEEDS)}"
    )

    print(
        f"Failed feeds:    {failed_feeds}"
    )

    print(
        f"Total entries:   {total_entries}"
    )


if __name__ == "__main__":
    main()