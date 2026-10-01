from app.services.vector_store import vector_store


QUERIES = [
    "What is happening with AI?",
    "India Afghanistan cricket",
    "What are the latest developments in technology?",
    "What is happening in global politics?",
    "cooking pasta",
    "how to repair a bicycle",
]


def main():

    print("=" * 80)
    print("CHUNK RETRIEVAL TEST")
    print("=" * 80)

    for query in QUERIES:

        print("\n")
        print("-" * 80)
        print(f"QUERY: {query}")
        print("-" * 80)

        results = vector_store.search(
            query=query,
            top_k=10,
            max_distance=0.50,
        )

        if not results:
            print("No results.")
            continue

        for rank, result in enumerate(
            results,
            start=1,
        ):

            metadata = result["metadata"]

            print(
                f"\nRank {rank}"
            )

            print(
                f"Distance: {result['distance']:.4f}"
            )

            print(
                f"Article ID: {result['article_id']}"
            )

            print(
                f"Chunk Index: {result['chunk_index']}"
            )

            print(
                f"Source: {metadata.get('source')}"
            )

            print(
                f"Title: {metadata.get('title')}"
            )

            document = result["document"]

            preview = document[:300].replace(
                "\n",
                " ",
            )

            print(
                f"Chunk: {preview}..."
            )


if __name__ == "__main__":
    main()