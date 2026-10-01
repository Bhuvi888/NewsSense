"""Generate machine-authored Ragas test cases from the Newsense corpus.

The output is a candidate golden set. Review the generated answers before
using them as ground truth for a serious benchmark.
"""

import json
import random
from pathlib import Path

from app.config import settings
from app.database import SessionLocal
from app.models import Article
from app.services.groq_client import get_groq_client


OUTPUT = Path("evaluation/ragas_golden_set.json")
CASE_COUNT = 5


def select_articles(articles: list[Article]) -> list[Article]:
    """Select a deterministic, source/category-diverse sample."""
    rng = random.Random(42)
    shuffled = articles[:]
    rng.shuffle(shuffled)

    selected = []
    seen_groups = set()

    for article in shuffled:
        group = (article.source or "unknown", article.category or "unknown")
        if group not in seen_groups:
            selected.append(article)
            seen_groups.add(group)
        if len(selected) >= CASE_COUNT:
            return selected

    return selected


def build_client():
    return get_groq_client()


def generate_case(client, article: Article) -> dict:
    content = (article.content or "")[:3000]
    prompt = f"""Create one factual RAG evaluation case from this single news article.

Rules:
- Ask a question that can be answered only from this article.
- The answer must be concise and supported directly by the article.
- Do not add facts that are not in the article.
- Return JSON only with keys: question, reference, reference_contexts.
- reference_contexts must contain one short verbatim passage from the article.

Article title: {article.title}
Source: {article.source}

Article content:
{content}
"""

    response = client.create_chat_completion(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": "You create factual RAG evaluation cases.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=800,
        reasoning_effort="low",
        response_format={"type": "json_object"},
    )
    case = json.loads(response.choices[0].message.content)
    case.update(
        {
            "article_id": article.id,
            "article_title": article.title or "",
            "source": article.source or "",
            "category": article.category or "",
        }
    )
    return case


def main() -> None:
    client = build_client()
    db = SessionLocal()

    try:
        articles = (
            db.query(Article)
            .filter(Article.content.isnot(None), Article.content != "")
            .order_by(Article.id)
            .all()
        )
        selected = select_articles(articles)
        cases = []

        for index, article in enumerate(selected, start=1):
            try:
                case = generate_case(client, article)
                cases.append(case)
                print(f"Generated {index}/{len(selected)}: {article.title}")
            except Exception as exc:
                print(f"Skipped {index}/{len(selected)}: {exc}")

    finally:
        db.close()

    if not cases:
        raise RuntimeError(
            "No cases were generated; preserving the existing evaluation file."
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(cases, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(cases)} candidate cases to {OUTPUT}")
    print("Review the answers and passages before treating them as ground truth.")


if __name__ == "__main__":
    main()
