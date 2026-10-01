from app.database import SessionLocal
from app.models import Article
from app.services.vector_store import vector_store


def main():

    db = SessionLocal()

    try:

        articles = (
            db.query(Article)
            .filter(
                Article.content.isnot(None),
                Article.content != "",
            )
            .order_by(Article.id)
            .all()
        )

        print(
            f"Articles to index: {len(articles)}"
        )

        print("\nResetting Chroma collection...")

        vector_store.reset_collection()

        total_chunks = 0
        failed = 0

        for index, article in enumerate(
            articles,
            start=1,
        ):

            try:

                chunk_count = (
                    vector_store.index_article(
                        article
                    )
                )

                total_chunks += chunk_count

                print(
                    f"[{index}/{len(articles)}] "
                    f"{article.source} | "
                    f"{article.title} | "
                    f"{chunk_count} chunks"
                )

            except Exception as exc:

                failed += 1

                print(
                    f"[{index}/{len(articles)}] "
                    f"FAILED | "
                    f"{article.title} | "
                    f"{exc}"
                )

        print("\n" + "=" * 70)
        print("CHROMA REBUILD COMPLETE")
        print("=" * 70)

        print(
            f"Articles processed: {len(articles)}"
        )

        print(
            f"Total chunks:       {total_chunks}"
        )

        print(
            f"Failed articles:    {failed}"
        )

        print(
            f"Chroma count:       "
            f"{vector_store.collection.count()}"
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()