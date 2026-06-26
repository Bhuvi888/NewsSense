from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Newsense API"
    api_prefix: str = "/api"

    database_url: str = "sqlite:///./newsense.db"
    chroma_persist_directory: str = "./chroma_data"
    gemini_api_key: str = ""

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()