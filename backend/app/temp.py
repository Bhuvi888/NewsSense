from app.services.embedding_service import embedding_service

vector = embedding_service.embed(
    "OpenAI released a new language model."
)

print(len(vector))