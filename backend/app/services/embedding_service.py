from sentence_transformers import SentenceTransformer


class EmbeddingService:
    QUERY_INSTRUCTION = (
        "Represent this sentence for searching relevant passages: "
    )

    def __init__(self, model_name: str):
        self.model_name = model_name
        self.model: SentenceTransformer | None = None

    def _get_model(self) -> SentenceTransformer:
        if self.model is None:
            print(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)

        return self.model

    def embed_document(self, text: str) -> list[float]:
        """
        Embed an article/document.

        BGE recommends no retrieval instruction for documents.
        """
        model = self._get_model()

        return model.encode(
            text,
            normalize_embeddings=True,
        ).tolist()

    def embed_query(self, query: str) -> list[float]:
        """
        Embed a user's search query.

        BGE recommends a retrieval instruction for
        short query -> long passage retrieval.
        """
        model = self._get_model()

        query_with_instruction = (
            self.QUERY_INSTRUCTION + query
        )

        return model.encode(
            query_with_instruction,
            normalize_embeddings=True,
        ).tolist()

    def embed_documents(
        self,
        texts: list[str],
    ) -> list[list[float]]:
        model = self._get_model()

        return model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()


embedding_service = EmbeddingService(
    "BAAI/bge-base-en-v1.5"
)