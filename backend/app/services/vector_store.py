import logging

import chromadb

from app.config import settings
from app.services.chunking_service import chunk_article
from app.services.embedding_service import embedding_service


logger = logging.getLogger(__name__)


class ChromaVectorStore:
    def __init__(self, collection_name: str, embedding_service):
        self.embedding_service = embedding_service
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_directory
        )
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def _build_chunks(self, article) -> list[str]:
        return chunk_article(article.content) if article.content else []

    def index_article(self, article) -> int:
        chunks = self._build_chunks(article)
        if not chunks:
            raise ValueError(f"Article {article.id} has no content to index.")

        embeddings = self.embedding_service.embed_documents(chunks)
        published_str = (
            article.published_at.isoformat() if article.published_at else ""
        )
        ids = [f"{article.id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "article_id": article.id,
                "chunk_index": i,
                "title": article.title or "",
                "source": article.source or "",
                "source_url": article.source_url or "",
                "category": article.category or "",
                "published_at": published_str,
            }
            for i in range(len(chunks))
        ]
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )
        return len(chunks)

    def search(
        self,
        query: str,
        top_k: int = 10,
        max_distance: float | None = None,
    ) -> list[dict]:
        collection_count = self.collection.count()
        if collection_count == 0:
            return []

        query_embedding = self.embedding_service.embed_query(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection_count),
            include=["documents", "metadatas", "distances"],
        )

        ids = results.get("ids", [[]])[0]
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        items = []
        for i, item_id in enumerate(ids):
            metadata = metadatas[i] if i < len(metadatas) else {}
            distance = distances[i] if i < len(distances) else None
            if max_distance is not None and distance is not None and distance > max_distance:
                continue
            items.append(
                {
                    "chunk_id": item_id,
                    "article_id": metadata.get("article_id"),
                    "chunk_index": metadata.get("chunk_index"),
                    "document": documents[i] if i < len(documents) else "",
                    "distance": distance,
                    "metadata": metadata,
                }
            )
        return items

    def reset_collection(self) -> None:
        try:
            self.client.delete_collection(self.collection_name)
        except Exception:
            pass
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )


class _CollectionCount:
    def __init__(self, store: "AzureSearchVectorStore"):
        self.store = store

    def count(self) -> int:
        return self.store.count()


class AzureSearchVectorStore:
    def __init__(self, index_name: str, embedding_service):
        if not settings.azure_search_endpoint or not settings.azure_search_api_key:
            raise RuntimeError(
                "AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_API_KEY are required "
                "when VECTOR_STORE_BACKEND=azure_search."
            )

        from azure.core.credentials import AzureKeyCredential
        from azure.search.documents import SearchClient
        from azure.search.documents.indexes import SearchIndexClient
        from azure.search.documents.indexes.models import (
            HnswAlgorithmConfiguration,
            HnswParameters,
            SearchField,
            SearchFieldDataType,
            SearchIndex,
            SimpleField,
            VectorSearch,
            VectorSearchProfile,
        )

        self.embedding_service = embedding_service
        self.collection_name = index_name
        credential = AzureKeyCredential(settings.azure_search_api_key)
        self._index_client = SearchIndexClient(
            endpoint=settings.azure_search_endpoint,
            credential=credential,
        )
        self._ensure_index(
            SearchIndex,
            SearchField,
            SearchFieldDataType,
            SimpleField,
            VectorSearch,
            VectorSearchProfile,
            HnswAlgorithmConfiguration,
            HnswParameters,
        )
        self._client = SearchClient(
            endpoint=settings.azure_search_endpoint,
            index_name=index_name,
            credential=credential,
        )
        self.collection = _CollectionCount(self)

    def _ensure_index(
        self,
        SearchIndex,
        SearchField,
        SearchFieldDataType,
        SimpleField,
        VectorSearch,
        VectorSearchProfile,
        HnswAlgorithmConfiguration,
        HnswParameters,
    ) -> None:
        fields = [
            SimpleField(name="id", type=SearchFieldDataType.String, key=True),
            SearchField(
                name="content",
                type=SearchFieldDataType.String,
                searchable=True,
            ),
            SearchField(
                name="embedding",
                type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True,
                vector_search_dimensions=settings.azure_search_vector_dimensions,
                vector_search_profile_name="cosine-profile",
            ),
            SimpleField(name="article_id", type=SearchFieldDataType.String, filterable=True),
            SimpleField(name="chunk_index", type=SearchFieldDataType.Int32, filterable=True),
            SearchField(name="title", type=SearchFieldDataType.String, searchable=True),
            SearchField(name="source", type=SearchFieldDataType.String, searchable=True, filterable=True),
            SimpleField(name="source_url", type=SearchFieldDataType.String),
            SearchField(name="category", type=SearchFieldDataType.String, searchable=True, filterable=True),
            SimpleField(name="published_at", type=SearchFieldDataType.String, filterable=True),
        ]
        vector_search = VectorSearch(
            algorithms=[
                HnswAlgorithmConfiguration(
                    name="cosine-hnsw",
                    parameters=HnswParameters(metric="cosine"),
                )
            ],
            profiles=[
                VectorSearchProfile(
                    name="cosine-profile",
                    algorithm_configuration_name="cosine-hnsw",
                )
            ],
        )
        self._index_client.create_or_update_index(
            SearchIndex(
                name=self.collection_name,
                fields=fields,
                vector_search=vector_search,
            )
        )

    def _build_chunks(self, article) -> list[str]:
        return chunk_article(article.content) if article.content else []

    def index_article(self, article) -> int:
        chunks = self._build_chunks(article)
        if not chunks:
            raise ValueError(f"Article {article.id} has no content to index.")

        embeddings = self.embedding_service.embed_documents(chunks)
        published_str = (
            article.published_at.isoformat() if article.published_at else ""
        )
        documents = [
            {
                "id": f"{article.id}_chunk_{i}",
                "content": chunk,
                "embedding": embeddings[i],
                "article_id": str(article.id),
                "chunk_index": i,
                "title": article.title or "",
                "source": article.source or "",
                "source_url": article.source_url or "",
                "category": article.category or "",
                "published_at": published_str,
            }
            for i, chunk in enumerate(chunks)
        ]
        for start in range(0, len(documents), 500):
            self._client.upload_documents(documents[start : start + 500])
        return len(documents)

    def count(self) -> int:
        return self._client.get_document_count()

    def search(
        self,
        query: str,
        top_k: int = 10,
        max_distance: float | None = None,
    ) -> list[dict]:
        count = self.count()
        if count == 0:
            return []

        from azure.search.documents.models import VectorizedQuery

        results = self._client.search(
            search_text=None,
            vector_queries=[
                VectorizedQuery(
                    vector=self.embedding_service.embed_query(query),
                    k_nearest_neighbors=top_k,
                    fields="embedding",
                )
            ],
            top=top_k,
            select=[
                "id",
                "content",
                "article_id",
                "chunk_index",
                "title",
                "source",
                "source_url",
                "category",
                "published_at",
            ],
        )

        items = []
        for result in results:
            score = float(result.get("@search.score", 0.0))
            distance = 1.0 - score
            if max_distance is not None and distance > max_distance:
                continue
            metadata = {
                "article_id": result.get("article_id"),
                "chunk_index": result.get("chunk_index"),
                "title": result.get("title", ""),
                "source": result.get("source", ""),
                "source_url": result.get("source_url", ""),
                "category": result.get("category", ""),
                "published_at": result.get("published_at", ""),
            }
            items.append(
                {
                    "chunk_id": result.get("id"),
                    "article_id": result.get("article_id"),
                    "chunk_index": result.get("chunk_index"),
                    "document": result.get("content", ""),
                    "distance": distance,
                    "metadata": metadata,
                }
            )
        return items

    def reset_collection(self) -> None:
        ids = [
            doc["id"]
            for doc in self._client.search(search_text="*", select=["id"])
        ]
        for start in range(0, len(ids), 500):
            self._client.delete_documents(
                documents=[{"id": item_id} for item_id in ids[start : start + 500]]
            )


if settings.vector_store_backend.lower() == "azure_search":
    vector_store = AzureSearchVectorStore(
        index_name=settings.azure_search_index_name,
        embedding_service=embedding_service,
    )
else:
    vector_store = ChromaVectorStore(
        collection_name="newsense_articles_bge",
        embedding_service=embedding_service,
    )
