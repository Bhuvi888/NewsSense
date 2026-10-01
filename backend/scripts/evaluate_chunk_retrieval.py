import json
import math
from pathlib import Path

from app.services.vector_store import vector_store


# ============================================================
# CONFIGURATION
# ============================================================

TOP_K_CHUNKS = 10
MAX_DISTANCE = 0.50

# Path to the uploaded evaluation file.
# Copy the JSON into your project, for example:
#
# backend/
# ├── evaluation/
# │   └── evaluation_candidates_bge_final.json
#
# Then update this path if necessary.
EVALUATION_FILE = Path(
    "evaluation_candidates_bge_final.json"
)


# ============================================================
# RELEVANCE LABELS
# ============================================================
#
# IMPORTANT:
# These are ARTICLE TITLES, not chunk IDs.
#
# 1 = relevant
# 0 = irrelevant
#
# The OOD queries are explicitly strict:
#
# cooking pasta:
#     no article in the corpus is considered relevant.
#
# how to repair a bicycle:
#     bike theft/protection is NOT considered bicycle repair.
#
# We will fill the remaining labels from the original
# benchmark judgments rather than inventing them.
# ============================================================

RELEVANT_TITLES = {

    "latest developments in artificial intelligence": {
        # Fill with the original benchmark's relevant titles.
    },

    "AI developments and new technology": {
        # Fill with the original benchmark's relevant titles.
    },

    "latest technology news": {
        # Fill with the original benchmark's relevant titles.
    },

    "semiconductor technology developments": {
        # Fill with the original benchmark's relevant titles.
    },

    "Indian politics": {
        # Fill with the original benchmark's relevant titles.
    },

    "latest political developments in India": {
        # Fill with the original benchmark's relevant titles.
    },

    "business news": {
        # Fill with the original benchmark's relevant titles.
    },

    "Indian companies and markets": {
        # Fill with the original benchmark's relevant titles.
    },

    "latest science news": {
        # Fill with the original benchmark's relevant titles.
    },

    "space and scientific discoveries": {
        # Fill with the original benchmark's relevant titles.
    },

    "sports news": {
        # Fill with the original benchmark's relevant titles.
    },

    "India Afghanistan cricket": {
        # Fill with the original benchmark's relevant titles.
    },

    "latest news from India": {
        # Fill with the original benchmark's relevant titles.
    },

    "world news": {
        # Fill with the original benchmark's relevant titles.
    },

    # Strict OOD judgments.
    "cooking pasta": set(),

    "how to repair a bicycle": set(),
}


# ============================================================
# METRICS
# ============================================================

def precision_at_k(
    retrieved: list[str],
    relevant: set[str],
) -> float:

    if not retrieved:
        return 0.0

    hits = sum(
        1
        for title in retrieved
        if title in relevant
    )

    return hits / len(retrieved)


def recall_at_k(
    retrieved: list[str],
    relevant: set[str],
) -> float:

    if not relevant:
        return 1.0 if not retrieved else 0.0

    hits = sum(
        1
        for title in retrieved
        if title in relevant
    )

    return min(
        hits / len(relevant),
        1.0,
    )


def reciprocal_rank(
    retrieved: list[str],
    relevant: set[str],
) -> float:

    for rank, title in enumerate(
        retrieved,
        start=1,
    ):
        if title in relevant:
            return 1.0 / rank

    return 0.0


def ndcg(
    retrieved: list[str],
    relevant: set[str],
) -> float:

    if not retrieved or not relevant:
        return 0.0

    dcg = 0.0

    for rank, title in enumerate(
        retrieved,
        start=1,
    ):
        if title in relevant:
            dcg += 1.0 / math.log2(rank + 1)

    ideal_count = min(
        len(relevant),
        len(retrieved),
    )

    idcg = sum(
        1.0 / math.log2(rank + 1)
        for rank in range(
            1,
            ideal_count + 1,
        )
    )

    if idcg == 0:
        return 0.0

    return dcg / idcg


# ============================================================
# CHUNK → ARTICLE DEDUPLICATION
# ============================================================

def unique_articles(results: list[dict]) -> list[str]:
    """
    Convert chunk-level retrieval into article-level
    retrieval while preserving Chroma ranking order.

    If an article contributes multiple chunks, only its
    highest-ranked chunk is retained for article-level
    evaluation.
    """

    retrieved_titles = []
    seen_article_ids = set()

    for result in results:

        article_id = result.get("article_id")

        if not article_id:
            continue

        if article_id in seen_article_ids:
            continue

        seen_article_ids.add(article_id)

        title = (
            result
            .get("metadata", {})
            .get("title", "")
            .strip()
        )

        if title:
            retrieved_titles.append(title)

    return retrieved_titles


# ============================================================
# MAIN
# ============================================================

def main():

    if not EVALUATION_FILE.exists():

        raise FileNotFoundError(
            f"Evaluation file not found: "
            f"{EVALUATION_FILE}"
        )

    with open(
        EVALUATION_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        benchmark = json.load(file)

    print("=" * 80)
    print("NEWSENSE CHUNK RETRIEVAL EVALUATION")
    print("=" * 80)

    print(
        f"Queries: {len(benchmark)}"
    )

    print(
        f"Top-K chunks: {TOP_K_CHUNKS}"
    )

    print(
        f"Maximum distance: {MAX_DISTANCE}"
    )

    results_summary = []

    for query_index, query in enumerate(
        benchmark.keys(),
        start=1,
    ):

        relevant = RELEVANT_TITLES.get(
            query,
            set(),
        )

        results = vector_store.search(
            query=query,
            top_k=TOP_K_CHUNKS,
            max_distance=MAX_DISTANCE,
        )

        retrieved = unique_articles(
            results
        )

        precision = precision_at_k(
            retrieved,
            relevant,
        )

        recall = recall_at_k(
            retrieved,
            relevant,
        )

        mrr = reciprocal_rank(
            retrieved,
            relevant,
        )

        ndcg_score = ndcg(
            retrieved,
            relevant,
        )

        print()
        print("=" * 80)

        print(
            f"QUERY {query_index}: {query}"
        )

        print("=" * 80)

        print(
            f"Chunks retrieved: "
            f"{len(results)}"
        )

        print(
            f"Unique articles: "
            f"{len(retrieved)}"
        )

        print(
            f"Precision: "
            f"{precision:.4f}"
        )

        print(
            f"Recall: "
            f"{recall:.4f}"
        )

        print(
            f"MRR: "
            f"{mrr:.4f}"
        )

        print(
            f"nDCG: "
            f"{ndcg_score:.4f}"
        )

        print("\nRetrieved:")

        for rank, title in enumerate(
            retrieved,
            start=1,
        ):

            marker = (
                "✓"
                if title in relevant
                else "✗"
            )

            print(
                f"  {rank}. "
                f"[{marker}] "
                f"{title}"
            )

        results_summary.append(
            {
                "query": query,
                "precision": precision,
                "recall": recall,
                "mrr": mrr,
                "ndcg": ndcg_score,
                "chunks": len(results),
                "articles": len(retrieved),
            }
        )


    # ========================================================
    # AGGREGATE RESULTS
    # ========================================================

    if not results_summary:
        return

    avg_precision = sum(
        item["precision"]
        for item in results_summary
    ) / len(results_summary)

    avg_recall = sum(
        item["recall"]
        for item in results_summary
    ) / len(results_summary)

    avg_mrr = sum(
        item["mrr"]
        for item in results_summary
    ) / len(results_summary)

    avg_ndcg = sum(
        item["ndcg"]
        for item in results_summary
    ) / len(results_summary)

    avg_articles = sum(
        item["articles"]
        for item in results_summary
    ) / len(results_summary)


    print()
    print("=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)

    print(
        f"Average unique articles: "
        f"{avg_articles:.2f}"
    )

    print(
        f"Average Precision: "
        f"{avg_precision:.4f}"
    )

    print(
        f"Average Recall: "
        f"{avg_recall:.4f}"
    )

    print(
        f"Average MRR: "
        f"{avg_mrr:.4f}"
    )

    print(
        f"Average nDCG: "
        f"{avg_ndcg:.4f}"
    )

    print("=" * 80)


if __name__ == "__main__":
    main()