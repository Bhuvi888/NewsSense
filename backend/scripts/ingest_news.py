from app.database import SessionLocal
from app.services.ingestion_service import ingestion_service
from app.services.rss_service import RSS_FEEDS, fetch_feed


def main():

    print("=" * 80)
    print("NEWSENSE CLEAN ARTICLE INGESTION")
    print("=" * 80)

    db = SessionLocal()

    stats = {
        "feeds": 0,
        "rss_entries": 0,
        "inserted": 0,
        "duplicate": 0,
        "skipped": 0,
        "extraction_failed": 0,
        "validation_failed": 0,
    }

    try:

        for feed_config in RSS_FEEDS:

            source = feed_config["name"]
            category = feed_config["category"]

            print("\n" + "=" * 80)
            print(f"FEED: {source}")
            print(f"CATEGORY: {category}")
            print("=" * 80)

            stats["feeds"] += 1

            try:
                feed = fetch_feed(feed_config)

            except Exception as exc:

                print(
                    f"Feed failed: {source} | {exc}"
                )

                continue

            entries = feed.entries

            stats["rss_entries"] += len(entries)

            print(
                f"RSS entries: {len(entries)}"
            )

            for index, entry in enumerate(
                entries,
                start=1,
            ):

                title = entry.get(
                    "title",
                    "Untitled",
                )

                print(
                    f"\n[{index}/{len(entries)}] "
                    f"{title}"
                )

                result = ingestion_service.process_entry(
                    db=db,
                    entry=entry,
                    source=source,
                    category=category,
                    index_to_chroma=False,
                )

                status = result.get(
                    "status"
                )

                if status == "inserted":

                    stats["inserted"] += 1

                    print(
                        f"  INSERTED | "
                        f"{result.get('word_count')} words"
                    )

                elif status == "duplicate":

                    stats["duplicate"] += 1

                    print(
                        "  DUPLICATE"
                    )

                else:

                    stats["skipped"] += 1

                    reason = result.get(
                        "reason",
                        "unknown",
                    )

                    if reason == "extraction_failed":
                        stats["extraction_failed"] += 1

                    if reason.startswith(
                        "content_too_short"
                    ):
                        stats["validation_failed"] += 1

                    print(
                        f"  SKIPPED | {reason}"
                    )

        print("\n")
        print("=" * 80)
        print("INGESTION COMPLETE")
        print("=" * 80)

        print(
            f"Feeds processed:       {stats['feeds']}"
        )

        print(
            f"RSS entries:            {stats['rss_entries']}"
        )

        print(
            f"Inserted into MySQL:   {stats['inserted']}"
        )

        print(
            f"Duplicates:             {stats['duplicate']}"
        )

        print(
            f"Skipped:                {stats['skipped']}"
        )

        print(
            f"Extraction failures:    {stats['extraction_failed']}"
        )

        print(
            f"Validation failures:    {stats['validation_failed']}"
        )

    finally:

        db.close()


if __name__ == "__main__":
    main()