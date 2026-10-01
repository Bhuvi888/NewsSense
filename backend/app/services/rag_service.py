import logging
from sqlalchemy.orm import Session

from app.config import settings
from app.prompts.rag_prompt import (
    SYSTEM_PROMPT,
    build_user_prompt,
)
from app.repositories.article_repository import ArticleRepository
from app.services.vector_store import vector_store
from app.services.groq_client import RotatingGroqClient, get_groq_client


logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 6
TOP_K_CHUNKS = 8
TOP_K_ARTICLES = 5
MAX_RETRIEVAL_DISTANCE = 0.50


def _get_client() -> RotatingGroqClient:
    return get_groq_client()


def _build_conversation_history(
    conversation_history: list[dict] | None,
) -> list[dict[str, str]]:
    """
    Convert application conversation history into OpenAI messages.

    Expected application message format:

        {
            "role": "user" | "assistant",
            "content": "..."
        }
    """

    if not conversation_history:
        return []

    contents: list[dict[str, str]] = []

    for message in conversation_history[-MAX_HISTORY_MESSAGES:]:
        role = message.get("role")
        content = message.get("content", "").strip()

        if not content:
            continue

        if role not in {"assistant", "user"}:
            logger.warning(
                "Ignoring unknown conversation role: %s",
                role,
            )
            continue

        contents.append({"role": role, "content": content})

    return contents


def _generate_answer(client: RotatingGroqClient, messages) -> str:
    response = client.create_chat_completion(
        model=settings.groq_model,
        messages=messages,
        temperature=0.2,
        max_tokens=800,
    )
    answer = response.choices[0].message.content

    if not answer:
        raise RuntimeError("Groq returned an empty response.")

    return answer.strip()


def _article_to_rag_dict(article) -> dict:
    """
    Convert a SQLAlchemy Article into the plain dictionary
    format expected by the RAG prompt.
    """

    document_parts = []

    if article.title:
        document_parts.append(article.title)

    if article.summary:
        document_parts.append(article.summary)

    if article.content:
        document_parts.append(article.content)

    return {
        "article_id": article.id,
        "title": article.title or "",
        "source": article.source or "",
        "source_url": article.source_url or "",
        "category": article.category or "",
        "published_at": (
            article.published_at.isoformat()
            if article.published_at
            else ""
        ),
        "document": "\n\n".join(document_parts),
    }


def ask(
    db: Session,
    question: str,
    conversation_history: list[dict] | None = None,
) -> dict:
    """
    Execute the complete RAG pipeline.

    1. Retrieve relevant article IDs from ChromaDB.
    2. Fetch authoritative articles from MySQL.
    3. Convert articles into RAG dictionaries.
    4. Build the RAG prompt.
    5. Send the prompt and conversation history to Gemini.
    6. Return the generated answer and article sources.
    """

    question = question.strip()

    if not question:
        return {
            "answer": "Please provide a question.",
            "sources": [],
        }

    # ---------------------------------------------------------
    # 1. Retrieve relevant article IDs from ChromaDB
    # ---------------------------------------------------------
    
    retrieval_results = vector_store.search(
        query=question,
        top_k=TOP_K_CHUNKS,
        max_distance=MAX_RETRIEVAL_DISTANCE
    )

    if not retrieval_results:
        return {
            "answer": (
                "I couldn't find any relevant news articles "
                "in the database. Please ingest some RSS feeds "
                "and try again."
            ),
            "sources": [],
        }

    # Collapse chunk hits into ranked articles while retaining the retrieved
    # chunk text. The generator should answer from the embedded passages, not
    # from the entire MySQL article body.
    chunks_by_article: dict[str, list[str]] = {}
    ranked_article_ids: list[str] = []

    for result in retrieval_results:
        article_id = result.get("article_id")
        document = result.get("document", "").strip()

        if not article_id or not document:
            continue

        if article_id not in chunks_by_article:
            chunks_by_article[article_id] = []
            ranked_article_ids.append(article_id)

        chunks_by_article[article_id].append(document)

    article_ids = ranked_article_ids[:TOP_K_ARTICLES]

    # ---------------------------------------------------------
    # 2. Fetch authoritative article records from MySQL
    # ---------------------------------------------------------

    articles = ArticleRepository.get_by_ids(
        db,
        article_ids,
    )

    articles_by_id = {
        article.id: article
        for article in articles
    }

    # Restore Chroma's ranking order.
    retrieved_articles = [
        articles_by_id[article_id]
        for article_id in article_ids
        if article_id in articles_by_id
    ]

    if not retrieved_articles:
        return {
            "answer": (
                "I couldn't find the retrieved articles "
                "in the database."
            ),
            "sources": [],
        }

    # ---------------------------------------------------------
    # 3. Convert SQLAlchemy Articles to RAG dictionaries
    # ---------------------------------------------------------

    rag_articles = []
    for article in retrieved_articles:
        article_context = "\n\n".join(
            chunks_by_article.get(article.id, [])
        )
        rag_article = _article_to_rag_dict(article)
        rag_article["document"] = article_context
        rag_articles.append(rag_article)

    # ---------------------------------------------------------
    # 4. Build the RAG prompt
    # ---------------------------------------------------------

    user_prompt = build_user_prompt(
        question,
        rag_articles,
    )

    # ---------------------------------------------------------
    # 5. Build Groq conversation
    # ---------------------------------------------------------

    contents = _build_conversation_history(
        conversation_history
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *contents,
        {"role": "user", "content": user_prompt},
    ]

    # ---------------------------------------------------------
    # 6. Generate answer
    # ---------------------------------------------------------

    try:
        client = _get_client()

        answer = _generate_answer(
            client,
            messages,
        )

    except Exception:
        logger.exception(
            "Groq API call failed."
        )

        answer = (
            "I couldn't generate an answer right now. "
            "Please try again."
        )

    # ---------------------------------------------------------
    # 7. Build source list from authoritative MySQL records
    # ---------------------------------------------------------

    sources = []

    for article in retrieved_articles:
        sources.append(
            {
                "title": article.title or "",
                "source": article.source or "",
                "url": article.source_url or "",
                "published_at": (
                    article.published_at.isoformat()
                    if article.published_at
                    else ""
                ),
            }
        )

    return {
        "answer": answer,
        "sources": sources,
    }
