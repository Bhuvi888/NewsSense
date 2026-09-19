from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_news import router as news_router
from app.api.routes_health import router as health_router
from app.api.routes_ingestion import router as ingestion_router
from app.api.routes_ask import router as ask_router
from app.config import settings
from app.database import Base, engine
import app.models  # noqa: F401


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Newsense API",
    version="0.1.0",
    description="RAG-based News Intelligence Platform API",
)

allowed_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(ingestion_router, prefix=settings.api_prefix)
app.include_router(
    news_router,
    prefix=settings.api_prefix,
)
app.include_router(ask_router, prefix=settings.api_prefix)