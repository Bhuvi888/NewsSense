from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Newsense API"
    api_prefix: str = "/api"

    database_url: str = "sqlite:///./newsense.db"
    database_ssl_ca: str = ""
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_recycle: int = 1800
    chroma_persist_directory: str = "./chroma_data"
    chroma_host: str = ""
    chroma_port: int = 8000
    chroma_token: str = ""
    chroma_ssl: bool = True
    vector_store_backend: str = "chroma"
    azure_search_endpoint: str = ""
    azure_search_api_key: str = ""
    azure_search_index_name: str = "newsense-articles-v2"
    azure_search_vector_dimensions: int = 768
    gemini_api_key: str = ""
    groq_api_key: str = ""
    groq_api_keys: str = ""
    groq_api_key_1: str = ""
    groq_api_key_2: str = ""
    groq_api_key_3: str = ""
    groq_api_key_4: str = ""
    groq_model: str = "openai/gpt-oss-20b"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # General fallback image stored when an article has no valid image URL.
    default_article_image: str = (
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c"
        "?q=80&w=800&auto=format&fit=crop"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_groq_api_keys(self) -> list[str]:
        """Return configured Groq keys in rotation order, without duplicates."""
        configured = []

        if self.groq_api_keys:
            configured.extend(self.groq_api_keys.split(","))

        configured.extend(
            [
                self.groq_api_key_1,
                self.groq_api_key_2,
                self.groq_api_key_3,
                self.groq_api_key_4,
                self.groq_api_key,
            ]
        )

        keys = []
        for key in configured:
            key = key.strip()
            if key and key not in keys:
                keys.append(key)
        return keys


settings = Settings()
