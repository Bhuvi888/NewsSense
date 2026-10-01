"""Backfill image_url for articles already stored with a NULL/placeholder image.

Re-fetches each article's source_url, extracts the og:image meta tag, validates
it, and updates the row. Articles with no valid image get the general fallback.

Usage:
    python scripts/backfill_images.py            # only rows with NULL image_url
    python scripts/backfill_images.py --all       # re-resolve every article
"""

import argparse

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Article
from app.services.article_extractor import article_extractor
from app.services.image_service import resolve_image_url

COMMIT_EVERY = 50


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--all",
        action="store_true",
        help="Re-resolve images for every article, not just NULL ones.",
    )
    args = parser.parse_args()

    db = SessionLocal()

    stats = {"processed": 0, "updated": 0, "placeholder": 0, "failed": 0}

    try:
        stmt = select(Article)
        if not args.all:
            stmt = stmt.where(Article.image_url.is_(None))

        articles = db.scalars(stmt).all()
        total = len(articles)

        print(f"Backfilling images for {total} article(s)...")

        for index, article in enumerate(articles, start=1):
            stats["processed"] += 1

            og_image = None
            try:
                html, _, _ = article_extractor.fetch_html(
                    article.source_url
                )
                og_image = article_extractor.extract_image_url(html)
            except Exception as exc:
                stats["failed"] += 1
                print(
                    f"[{index}/{total}] fetch failed "
                    f"({article.source_url}): {exc}"
                )

            image_url = resolve_image_url([og_image])

            if image_url == article.image_url:
                continue

            article.image_url = image_url
            stats["updated"] += 1

            if og_image is None:
                stats["placeholder"] += 1

            print(
                f"[{index}/{total}] {article.title[:50]} -> "
                f"{'placeholder' if og_image is None else 'og:image'}"
            )

            # Commit in batches so progress is durable if the container
            # restarts mid-run, and re-running only touches remaining rows.
            if stats["updated"] % COMMIT_EVERY == 0:
                db.commit()

        db.commit()

        print("\nBackfill complete.")
        print(f"  Processed:  {stats['processed']}")
        print(f"  Updated:    {stats['updated']}")
        print(f"  Placeholder:{stats['placeholder']}")
        print(f"  Fetch fail: {stats['failed']}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
