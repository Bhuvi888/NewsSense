import logging

import chromadb

from app.config import settings
from app.services.embedding_service import embedding_service


logger = logging.getLogger(__name__)

_MAX_EMBED_CHARS = 1500


class VectorStore:
    def __init__(
        self,
        collection_name: str,
        embedding_service,
    ):
        self.embedding_service = embedding_service

        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_directory
        )

        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def _build_document(self, article) -> str:
        """
        Build the text representation used for the article embedding.
        """

        parts = []

        if article.title:
            parts.append(article.title)

        if article.summary:
            parts.append(article.summary)

        if article.content:
            parts.append(article.content)

        return "\n\n".join(parts)[:_MAX_EMBED_CHARS]

    def index_article(self, article) -> None:
        """
        Create a BGE document embedding and store it in ChromaDB.
        """

        document = self._build_document(article)

        if not document.strip():
            raise ValueError(
                f"Article {article.id} has no text to embed."
            )

        # BGE document embedding
        embedding = self.embedding_service.embed_document(
            document
        )

        published_str = (
            article.published_at.isoformat()
            if article.published_at
            else ""
        )

        self.collection.upsert(
            ids=[article.id],
            embeddings=[embedding],
            documents=[document],
            metadatas=[
                {
                    "article_id": article.id,
                    "title": article.title or "",
                    "source": article.source or "",
                    "source_url": article.source_url or "",
                    "category": article.category or "",
                    "published_at": published_str,
                }
            ],
        )

    def search(
        self,
        query: str,
        top_k: int = 5,
        max_distance: float | None = None,
    ) -> list[dict]:
        """
        Search ChromaDB using a BGE query embedding.

        Returns article IDs and similarity distances.
        """

        collection_count = self.collection.count()

        if collection_count == 0:
            return []

        # BGE query embedding
        query_embedding = self.embedding_service.embed_query(
            query
        )

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection_count),
            include=["metadatas", "distances"],
        )

        ids = results.get("ids", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        items = []

        for i, chroma_id in enumerate(ids):

            metadata = (
                metadatas[i]
                if i < len(metadatas)
                else {}
            )

            distance = (
                distances[i]
                if i < len(distances)
                else None
            )

            # Optional distance threshold
            if (
                max_distance is not None
                and distance is not None
                and distance > max_distance
            ):
                continue

            items.append(
                {
                    "article_id": metadata.get(
                        "article_id",
                        chroma_id,
                    ),
                    "distance": distance,
                }
            )

        return items

    def reset_collection(self) -> None:
        """
        Delete and recreate the Chroma collection.

        Useful when rebuilding the vector index from MySQL.
        """

        self.client.delete_collection(
            self.collection.name
        )

        self.collection = self.client.get_or_create_collection(
            name=self.collection.name,
            metadata={"hnsw:space": "cosine"},
        )


# ---------------------------------------------------------
# Production vector store
# ---------------------------------------------------------

vector_store = VectorStore(
    collection_name="newsense_articles_bge",
    embedding_service=embedding_service,
)