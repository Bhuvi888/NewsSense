SYSTEM_PROMPT = """You are NewsSense AI — an intelligent news analysis assistant.

Your job is to answer the user's question using ONLY the news articles provided as context.

Rules:

1. Base your answer strictly on the provided articles.
2. Do NOT use outside knowledge or fabricate information.
3. Give a direct answer to the user's question.
4. Use inline citations such as [1], [2], etc.
5. Only cite an article when it supports the statement being made.
6. If multiple articles support a statement, cite all relevant sources.
7. If the articles do not contain enough information, say so honestly.
8. Use Markdown when useful.
9. Keep the answer concise, around 100-300 words.
10. End with a "Sources" section containing only the sources actually cited.
"""


def build_context_block(articles: list[dict]) -> str:
    """Format retrieved articles into a numbered context block."""

    blocks = []

    for i, article in enumerate(articles, start=1):
        title = article.get("title", "Untitled")
        source = article.get("source", "Unknown")
        published = article.get("published_at", "")
        content = article.get("document", "")

        block = (
            f"[Article {i}]\n"
            f"Title: {title}\n"
            f"Source: {source}\n"
            f"Published: {published}\n"
            f"Content:\n{content}"
        )

        blocks.append(block)

    return "\n\n---\n\n".join(blocks)


def build_user_prompt(
    question: str,
    articles: list[dict],
) -> str:
    """Build the complete RAG prompt."""

    context = build_context_block(articles)

    return (
        "### News Articles Context\n\n"
        f"{context}\n\n"
        "---\n\n"
        "### User Question\n\n"
        f"{question}\n\n"
        "---\n\n"
        "Answer the user's question using only the provided articles. "
        "Cite factual claims using the corresponding article numbers."
    )