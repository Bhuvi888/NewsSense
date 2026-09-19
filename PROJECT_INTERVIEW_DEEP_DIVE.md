# NewsSense — Technical Interview Deep Dive

## 1. Project summary

NewsSense is a news-intelligence web application. It collects articles from configured RSS feeds, cleans and stores them, indexes them for semantic retrieval, and exposes both a browsable news archive and an AI question-answering experience.

The project has two main user journeys:

1. **News discovery:** browse the latest articles, filter by category/source/search text, inspect publisher aggregates, and save articles locally in the browser.
2. **News intelligence:** ask a question in natural language. The backend retrieves the most relevant indexed articles and sends only that context to Gemini, returning an answer plus source metadata for citation cards.

The most important technical idea is the RAG pipeline:

```text
RSS feeds -> parse/clean -> SQLite -> embeddings -> ChromaDB
                                                    ^
User question -> embedding -> similarity search -> prompt with context
                                                    -> Gemini answer + sources
```

## 2. A concise interview introduction

> “NewsSense is a React and FastAPI news platform with a retrieval-augmented generation feature. The backend ingests articles from five RSS feeds, normalizes the content, persists article metadata and text in SQLite, and creates normalized MiniLM embeddings stored in a persistent ChromaDB collection. For an AI question, the service embeds the question, retrieves the top five semantically similar articles, builds a constrained prompt, and calls Gemini 2.0 Flash. The response includes the generated answer and the retrieved article URLs so the UI can show citations. I chose a relational store for authoritative article data and a vector store for semantic retrieval, while keeping the first version local and simple to operate.”

Follow this with a specific scale/limitation statement:

> “This is a prototype-scale architecture. The main production changes I would make are asynchronous ingestion, stronger deduplication and content extraction, hybrid retrieval with freshness filtering, authenticated server-side user state, observability, and automated evaluation of retrieval and answer faithfulness.”

## 3. Current architecture

### 3.1 Components

| Component | Current implementation | Responsibility |
|---|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS, Axios | Pages, routing, filters, chat UI, loading/error states |
| Query state | TanStack React Query for the news feed | Fetch/cache server data for `GET /api/news` |
| Backend API | FastAPI + Uvicorn | HTTP API, validation, CORS, dependency-injected DB sessions |
| Relational store | SQLite through SQLAlchemy 2 | Canonical article records, source/category aggregations |
| Vector store | Persistent ChromaDB, cosine distance | Embeddings and semantic article retrieval |
| Embedding model | Sentence Transformers `all-MiniLM-L6-v2` | Local text/query embeddings |
| LLM | Google Gemini `gemini-2.0-flash` | Grounded answer generation |
| Ingestion source | RSS feeds from TechCrunch, The Verge, BBC, and The Hindu | External article discovery |
| Browser persistence | `localStorage` | Saved article IDs and followed source IDs |

### 3.2 Backend layering

```text
FastAPI routes
  - routes_news.py       -> news_service.py       -> SQLAlchemy/SQLite
  - routes_ingestion.py  -> rss_service.py        -> RSS HTTP + DB + vector_store
  - routes_ask.py        -> rag_service.py        -> vector_store + Gemini
  - routes_health.py

Supporting services
  - article_cleaner.py   -> HTML to normalized text
  - embedding_service.py -> SentenceTransformer model singleton
  - vector_store.py      -> ChromaDB singleton and metadata mapping
  - rag_prompt.py        -> system prompt and context formatting
```

This is a modular monolith: one deployable backend, but responsibilities are separated into routes, services, persistence, schemas, and prompt construction. That is a sensible first architecture because it keeps local development and debugging straightforward while leaving clear seams for later extraction into workers or services.

### 3.3 Frontend structure

```text
App / BrowserRouter
  -> Layout (header/sidebar/navigation)
  -> Dashboard       -> useNews -> GET /api/news
  -> Explore         -> useNews/useTopics -> filtering + bookmarks
  -> Sources         -> useSources -> GET /api/news/sources
  -> AskAI           -> api.askAI -> POST /api/ask
```

The backend returns article-shaped data. The frontend enriches it for presentation—for example, it derives display dates, fallback image behavior, source colors, and local follow/bookmark state.

## 4. End-to-end workflows

### 4.1 Application startup

1. `main.py` creates the FastAPI application.
2. Settings are loaded from environment variables and `backend/.env` through Pydantic Settings.
3. SQLite engine/session configuration is created. SQLite receives `check_same_thread=False` so sessions can be used in FastAPI's request execution model.
4. `Base.metadata.create_all(bind=engine)` creates missing tables.
5. A persistent ChromaDB client and collection are initialized at module import time.
6. The embedding model is loaded as a module-level singleton.
7. Routers are mounted under `/api` and CORS is configured for the Vite development origins.

Interview note: `create_all` is convenient for a prototype, but schema migrations should use Alembic in a deployed system. Also, model/vector-store initialization at import time increases startup latency and can make health checks fail during cold start.

### 4.2 RSS ingestion workflow

The endpoint is `POST /api/ingestion/run`.

1. The route receives a SQLAlchemy session through FastAPI's `Depends(get_db)`.
2. `rss_service.ingest_all_feeds` creates one `httpx.Client` with a 20-second timeout, redirects enabled, and a custom user agent.
3. Each configured RSS URL is fetched sequentially.
4. `feedparser` parses the response bytes.
5. For each entry, the service reads the link and creates an ID using:

   ```python
   sha256(article_url.encode("utf-8")).hexdigest()
   ```

6. Existing IDs are skipped. The database also has a unique constraint on `source_url` as a second deduplication guard.
7. Title, summary, and content/description are passed through BeautifulSoup and whitespace normalization.
8. Publication dates are parsed from RFC-style feed dates and normalized to UTC before timezone information is removed.
9. An `Article` record is added to SQLite.
10. The article is immediately embedded and upserted into ChromaDB using the same article ID.
11. The database transaction is committed after each feed. If a feed fails, that feed is rolled back and processing continues with the next feed.
12. The endpoint returns counts for feeds, discovered articles, additions, duplicates, and errors.

Important behavior: a vector-index failure is recorded in the response, but `VectorStore.index_article` also catches and logs its own exception. This means the caller may not always receive the detailed vector failure it expects. A cleaner design would define one error-handling policy at the service boundary.

### 4.3 News browsing workflow

The main endpoint is `GET /api/news` with optional `limit`, `offset`, `category`, `source`, and `search` parameters.

1. The route passes query parameters to `news_service.get_latest_articles`.
2. SQLAlchemy builds a query dynamically.
3. Category and source use equality filters.
4. Search uses case-insensitive `LIKE` matching over title, summary, and content.
5. Results are ordered by publication time descending, paginated, and returned through a Pydantic response model.
6. Dashboard treats the first result as the featured story and the next records as latest news/briefs.
7. Explore maintains category, search, and saved-only state in the URL query string, then applies bookmark filtering in the browser.

### 4.4 Source and topic aggregation

`GET /api/news/sources` groups articles by source and returns count plus latest publication time. `GET /api/news/topics` groups by the article category and orders categories by count.

The backend is the source of truth for counts. The frontend adds presentation-only metadata such as generated colors, descriptions, and follower counts. The follower count is deterministic but synthetic; it is not an actual social metric.

### 4.5 AI question workflow

The endpoint is `POST /api/ask` with:

```json
{
  "question": "What is happening in technology?",
  "conversation_history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

1. The frontend sends the current question and prior chat messages.
2. FastAPI validates the request with Pydantic.
3. `rag_service.ask` embeds the question with the same embedding model used during ingestion.
4. ChromaDB performs cosine similarity search and returns up to five articles, including document text, metadata, and distances.
5. `build_user_prompt` creates a numbered context block containing title, source, publication time, and indexed text.
6. The last six conversation messages are mapped to Gemini's `user`/`model` roles.
7. Gemini is called with a low temperature of `0.3` and a `1024` token output cap.
8. The system prompt instructs the model to use only supplied context, cite `[1]`-style sources, acknowledge missing information, and keep the answer concise.
9. The service returns the model text plus metadata for every retrieved article.
10. The React chat renders Markdown for the answer and clickable source cards for the citations.

If the collection is empty, the service returns a helpful ingestion message without calling Gemini. If the Gemini call fails, the service logs the exception and returns a user-friendly fallback instead of propagating the raw provider error.

### 4.6 Bookmark and follow workflows

Bookmarks and followed sources are client-only:

1. React loads IDs from `localStorage`.
2. A click toggles the ID in local state.
3. The updated array is written back to `localStorage`.
4. Explore filters the already-fetched articles locally.

This avoids authentication and backend schema work, which is appropriate for a demo, but it means preferences do not follow the user across browsers or devices and cannot be audited server-side.

## 5. Data model and storage decisions

### 5.1 Article table

| Field | Purpose |
|---|---|
| `id` | Deterministic SHA-256 hash of the article URL |
| `title` | Normalized headline, capped at 500 characters |
| `source` | Feed publisher name |
| `source_url` | Canonical external article URL, unique |
| `published_at` | Feed publication time, nullable |
| `category` | Configured feed category |
| `author` | Optional feed author |
| `summary`, `content` | Cleaned text used by UI and retrieval |
| `image_url` | Optional image field; current RSS pipeline does not populate it |
| `ingested_at` | Time the record entered the system |

The relational database is authoritative for article details, filtering, pagination, and aggregate counts. ChromaDB is a retrieval projection. The shared article ID is the key relationship between the two stores.

### 5.2 Why two stores?

SQL is good at exact predicates, ordering, uniqueness, and aggregations. A vector database is good at nearest-neighbor search over semantic representations. Using SQL alone would make natural-language similarity awkward; using only a vector store would make source counts, exact filters, and reliable record updates less natural.

The tradeoff is consistency: there is no distributed transaction across SQLite and ChromaDB. A record can exist in SQL while its vector indexing fails. The backfill endpoint partially addresses this by re-indexing all SQL articles and using ChromaDB upserts.

## 6. Retrieval-augmented generation details

### Embedding and similarity

`all-MiniLM-L6-v2` converts article text and questions into dense vectors locally. Embeddings are normalized before storage, and ChromaDB is configured for cosine distance. Normalization makes cosine similarity a natural comparison and avoids magnitude differences dominating the result.

### Document construction

The indexed document concatenates title, summary, and content, then truncates the combined text to 1,500 characters. This keeps indexing and prompting bounded, but it can lose important facts located later in an article. It also means one vector represents an entire truncated article rather than multiple semantic chunks.

### Prompt grounding

The system prompt is a behavioral guardrail, not a formal guarantee. It tells Gemini to use only retrieved context and cite sources, but the application does not currently parse or verify citation numbers. The source cards shown in the UI are the retrieved top-five records, not necessarily the subset the model actually cited.

### Current RAG limitations an interviewer may probe

- Retrieval is semantic-only; exact names, dates, and rare terms may be missed.
- There is no similarity-distance threshold, so weak matches can still reach Gemini.
- There is no reranking, freshness weighting, source diversity rule, or duplicate-story clustering.
- Full article text is not chunked, and only the first 1,500 combined characters are indexed.
- Conversation history is passed to Gemini, but prior turns are not used to rewrite the current question before retrieval.
- Citation correctness is requested in the prompt but not programmatically validated.
- The LLM receives retrieved context but the answer endpoint does not return retrieval scores or an explicit “confidence” signal.

## 7. Architecture decisions and tradeoffs

### FastAPI

FastAPI provides typed request/response contracts through Pydantic, automatic OpenAPI documentation, dependency injection for database sessions, and a straightforward route structure. Synchronous route functions are easy to reason about, but long RSS and LLM calls occupy worker capacity; async endpoints or background workers are better for production throughput.

### SQLite

SQLite has zero operational overhead and is ideal for a single-user/local prototype. It is not the right default for many concurrent writers, horizontal API replicas, or large-scale search. PostgreSQL would be the natural production relational upgrade.

### Local Sentence Transformer

Local embeddings reduce per-document API cost and keep ingestion independent of an external embedding provider. The tradeoff is model download/startup memory, CPU latency, and potentially lower retrieval quality than newer domain-tuned models.

### ChromaDB

Persistent ChromaDB gives a simple local vector index with metadata and upsert support. A managed vector service or PostgreSQL with pgvector becomes more attractive when the application needs replication, backups, access control, multi-instance writes, or operational observability.

### Gemini 2.0 Flash

The model is a good latency/cost choice for short news answers. The provider call is isolated behind `rag_service`, making model replacement possible. The current implementation should additionally validate the API key at startup, handle rate limits explicitly, and avoid returning a generic success-shaped response for all provider failures.

### React + Vite

Vite gives fast development feedback and a small client setup. React Router separates page navigation, while React Query handles server data for the primary news list. Some other hooks use manual `useEffect` fetching, so a future cleanup could standardize caching, retries, and invalidation across all API data.

## 8. Main challenges and strong interview explanations

### Challenge 1: Making heterogeneous feeds fit one schema

RSS feeds differ in field names, date formats, HTML structure, and availability of summary/content/author fields. The implementation uses fallback chains (`content`, then `summary`, then `description`), a cleaner for HTML, nullable model fields, and defensive date parsing. The right explanation is that normalization at the ingestion boundary keeps downstream UI and retrieval code simple.

### Challenge 2: Preventing duplicate ingestion

The system hashes the article URL into a stable ID and checks it before insertion. This makes repeated ingestion idempotent for unchanged URLs and lets ChromaDB safely upsert by the same ID. The next improvement would canonicalize URLs—removing tracking parameters, normalizing schemes/hosts, and following redirects—because raw URL strings are not always equivalent.

### Challenge 3: Keeping SQL and vector data aligned

The system intentionally treats SQLite as the canonical store and ChromaDB as a derived index. Index failures are collected while ingestion continues. The backfill endpoint repairs missing vector records. In production, I would add an `index_status`/`embedding_version` column, an outbox or queue, retryable indexing jobs, and reconciliation metrics.

### Challenge 4: Reducing hallucination risk

The RAG prompt constrains the model to supplied articles, requires citations, and asks it to admit insufficient evidence. Retrieval top-k is limited to five and temperature is low. This reduces risk but does not prove factuality. Stronger controls include distance thresholds, answer citation parsing, quote/evidence verification, freshness rules, and offline faithfulness evaluation.

### Challenge 5: Balancing prototype simplicity with responsiveness

The current ingestion and AI routes are synchronous. This keeps control flow simple but makes request latency depend on RSS network calls, embedding work, disk I/O, and Gemini latency. A production design would make ingestion a background job and stream AI tokens or expose an asynchronous job status for long-running work.

### Challenge 6: Building useful UI state without a user system

The project delivers bookmarks and follows quickly with local storage. That is a deliberate scope decision: no auth, user table, or preference API is required. The cost is device-local state and weak multi-user support. I would preserve the UI contract but move persistence behind authenticated endpoints when accounts are introduced.

## 9. API surface

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Basic service health response |
| `POST` | `/api/ingestion/run` | Fetch and ingest all configured feeds |
| `GET` | `/api/ingestion/status` | Article count and latest ingestion timestamp |
| `POST` | `/api/ingestion/backfill-vectors` | Re-index all SQL articles into ChromaDB |
| `GET` | `/api/news` | Paginated/filterable article list |
| `GET` | `/api/news/{article_id}` | Full article detail |
| `GET` | `/api/news/sources` | Source counts and latest article times |
| `GET` | `/api/news/topics` | Category counts |
| `POST` | `/api/ask` | RAG answer with source metadata |

## 10. Weaknesses and improvements

### Highest-priority improvements

1. **Move ingestion out of the request path.** Use Celery, RQ, Dramatiq, or a managed queue plus a worker. Schedule it periodically, retry individual feeds with exponential backoff, and make the endpoint enqueue a job rather than wait for all feeds.
2. **Use PostgreSQL for production.** Add indexes on `published_at`, `category`, `source`, and search fields. Use Alembic migrations and a connection pool.
3. **Make indexing reliable.** Persist indexing state, retry failures, version embeddings, and run a reconciliation job comparing SQL IDs with vector IDs.
4. **Improve retrieval.** Chunk content with overlap, retrieve more candidates, rerank them, combine BM25/full-text and vector search, apply freshness/source-diversity rules, and enforce a minimum similarity threshold.
5. **Improve content quality.** Fetch the linked article when the feed only contains a short summary, respect robots/terms, extract article text carefully, and parse RSS media enclosures for `image_url`.
6. **Add evaluation.** Create a fixed question set with expected relevant articles. Measure Recall@K/MRR for retrieval and answer citation precision, citation recall, groundedness, latency, and token cost.
7. **Add security and reliability controls.** Validate request lengths, rate-limit `/ask` and ingestion, protect operational endpoints, keep secrets out of source control, add structured logs, tracing, metrics, and provider timeout/circuit-breaker behavior.
8. **Persist user state server-side.** Add authentication, users, bookmarks, followed sources, and per-user conversation/session storage.

### Code-quality improvements

- Validate `limit` and `offset` with bounds; currently a client can request impractically large values.
- Use a shared API base URL from environment configuration instead of hard-coding `127.0.0.1:8000` in the frontend.
- Add tests for date parsing, HTML cleaning, URL hashing/canonicalization, ingestion idempotency, query filters, vector failures, and RAG prompt construction.
- Avoid silently swallowing errors in frontend source/topic helpers when the UI needs to distinguish fallback data from real backend data.
- Standardize data fetching on React Query or standardize manual hooks with a shared error/retry policy.
- Add explicit ordering tie-breakers such as `published_at DESC, ingested_at DESC, id DESC`.
- Use timezone-aware timestamps consistently; the current code converts aware feed dates to UTC and then drops timezone information.
- Validate that assistant citations refer to valid retrieved source numbers before displaying a citation-aware answer.

## 11. Likely technical interview questions and answer outlines

### System design and backend

**Why did you use both SQLite and ChromaDB?**  
SQLite is authoritative for exact lookup, filtering, uniqueness, pagination, and aggregations. ChromaDB is optimized for nearest-neighbor semantic retrieval. The article ID links the derived vector record to the canonical SQL record.

**What happens if the vector write fails after the SQL insert?**  
The article can remain in SQLite but be absent from retrieval. The current backfill endpoint can repair it. A production design would use a durable indexing job/outbox, status fields, retries, and reconciliation.

**Is ingestion idempotent?**  
Mostly for the same URL: the SHA-256 URL ID and unique URL constraint prevent duplicates, and ChromaDB uses upsert. It is not fully robust to tracking-parameter changes, redirects, or a feed changing the URL for the same story; canonicalization and content fingerprints would improve it.

**Why commit once per feed instead of once at the end?**  
It limits the rollback scope: one bad feed does not discard successful feeds. The tradeoff is that partial ingestion is possible and each feed is its own transaction. For a worker, I would make per-feed or per-batch commits explicit and record job status.

**Why is the route synchronous when FastAPI supports async?**  
The first version favors simple control flow and uses synchronous libraries. Async HTTP calls can improve concurrency, but CPU-bound embedding and model work still need careful worker/process handling. The larger improvement is moving ingestion to a background worker.

**How would you scale this to multiple backend instances?**  
Replace SQLite/local Chroma persistence with shared PostgreSQL and a production vector store or pgvector, externalize the embedding/ingestion worker, add a queue and distributed locks, store assets in object storage, and make configuration/secrets and observability deployment-ready.

### RAG and machine learning

**What is RAG and why use it here?**  
RAG retrieves relevant external documents at query time and provides them to the LLM. News changes continuously, so retrieval is preferable to trying to encode current articles into model weights. It also enables source links and a bounded evidence set.

**Why use cosine similarity?**  
The embeddings are normalized, so cosine similarity compares direction/semantic orientation while reducing sensitivity to vector magnitude. ChromaDB is configured with cosine space for that reason.

**Why use `all-MiniLM-L6-v2`?**  
It is small, fast, runs locally, and is a practical prototype tradeoff. I would benchmark it against domain/multilingual models on a labeled news query set before choosing a production model.

**Why truncate at 1,500 characters?**  
It bounds embedding and prompt size and keeps the first version cheap and predictable. It can lose later evidence, so the next step is paragraph-aware chunking with overlap and retrieval of multiple chunks per article.

**How do you prevent hallucinations?**  
The prompt restricts the model to retrieved context, asks for citations and an honest insufficiency response, and uses low temperature. That is not enough by itself; I would add relevance thresholds, citation validation, evidence checks, and evaluation with adversarial questions.

**How would you handle “latest” questions?**  
Semantic similarity alone is insufficient. Parse time intent, apply a metadata freshness filter/ranking, and possibly retrieve by a time window first. Also expose ingestion freshness so the answer can disclose how current the corpus is.

**How would you handle conflicting reports?**  
Return the disagreement explicitly, cite each source, include publication times, avoid presenting one claim as settled without evidence, and consider source reliability only as a transparent ranking signal—not as a replacement for evidence.

### Frontend

**Why use React Query for news?**  
It provides request lifecycle state and caching for server data. The current project only uses it for the news list; I would extend it to sources/topics and invalidate queries after ingestion.

**Why store bookmarks in localStorage?**  
It is fast, simple, and avoids requiring authentication for a prototype. It is intentionally not cross-device or multi-user. A production version would use authenticated bookmark endpoints and optimistic updates.

**Why put filter state in the URL?**  
It makes filtered views shareable, refresh-safe, and navigable with browser history. Saved IDs remain local because they are user-specific client preferences in this prototype.

**What frontend issues would you improve?**  
Use environment-based API configuration, virtualize long article lists, debounce search, avoid downloading all articles just to filter in the browser, centralize date formatting, and make source/topic loading behavior consistent.

### Testing and operations

**What would you test first?**  
Unit-test pure cleaners/date/ID functions; integration-test ingestion with mocked feeds and a temporary database; test duplicate runs; test API response schemas and 404 behavior; mock embeddings/Chroma/Gemini for RAG tests; and add a small end-to-end test for asking a question and rendering citations.

**What metrics matter?**  
Feed success rate, articles discovered/added/duplicate rate, ingestion duration, index failure count, vector count versus SQL count, retrieval latency, Recall@K, LLM latency, error/rate-limit rate, token cost, citation validity, and user feedback on answer quality.

**How would you debug a bad answer?**  
Log a correlation ID, question, model/version, retrieved article IDs, distances, prompt/token counts, and provider response metadata with privacy controls. First inspect retrieval relevance, then prompt/context truncation, then generation/citation behavior.

## 12. Scenario questions to practice

1. A feed is down for three hours. How does the system behave, and how do you prevent one feed from blocking the others?
2. The same story appears in four publishers. How do you deduplicate or cluster it while preserving source diversity?
3. The vector index has 10,000 records but SQL has 10,500. How do you identify and repair the drift?
4. Users ask questions about articles published five minutes ago. How do you guarantee freshness?
5. Gemini starts returning invalid citations such as `[7]` when only five sources were retrieved. What do you do?
6. Latency rises from two seconds to ten seconds after adding more feeds. Where do you measure and what do you move off the request path?
7. A user asks for political persuasion or unsupported claims. What content and grounding controls belong in the application?
8. Two users use the app at once. Which existing local-state assumptions fail?
9. The embedding model changes. How do you migrate the index without breaking active queries?
10. How would you support multilingual articles and questions?

## 13. A stronger target architecture

```text
Scheduler -> Queue -> Ingestion workers -> Raw/object storage
                              |                 |
                              v                 v
                       PostgreSQL         Chunk + embed workers
                              |                 |
                              +--------> pgvector/vector service

Frontend -> API gateway -> News API / Search API / Ask API
                                      |
                                      v
                              hybrid retrieval + reranker
                                      |
                                      v
                              LLM gateway -> streamed answer
                                      |
                                      v
                         validated citations + source records
```

Migration sequence:

1. Add tests, migrations, structured logging, and configuration-based URLs.
2. Introduce article canonicalization, feed run records, index status, and retryable jobs.
3. Move SQL to PostgreSQL and vector persistence to a shared production-capable backend.
4. Add chunking, hybrid retrieval, reranking, freshness filters, and citation validation.
5. Add authentication and server-side user preferences.
6. Add dashboards, evaluation datasets, rate limits, and deployment automation.

## 14. What to say about limitations without underselling the project

Do not claim that the application guarantees factual answers or that the generated synthetic follower counts are real. Say:

> “I made explicit prototype tradeoffs. I used local persistence and manual ingestion to keep the project easy to run, and I used a prompt-constrained RAG pipeline to make answers traceable to retrieved articles. The main correctness gap is that prompt citations are not independently verified, and the main scalability gap is synchronous ingestion with local stores. Those are the first areas I would address in a production iteration.”

That answer demonstrates ownership, system understanding, and engineering judgment.

## 15. Final interview checklist

Be ready to explain:

- the difference between the authoritative SQL store and the derived vector index;
- why the article URL hash makes repeated ingestion safe;
- the exact path from question to embedding to top-k retrieval to Gemini;
- why the same embedding model must be used for documents and queries;
- why prompt instructions reduce but do not eliminate hallucinations;
- what happens when feed, database, vector, or LLM operations fail;
- why localStorage was acceptable for bookmarks/follows in this scope;
- how to evolve synchronous ingestion into a queue-backed worker system;
- how to measure retrieval quality and citation faithfulness;
- the difference between current implementation facts and proposed production improvements.

## 16. Source map for code walkthrough

| Interview topic | Files to open |
|---|---|
| App setup, CORS, routers | `backend/app/main.py`, `backend/app/config.py` |
| Database/session model | `backend/app/database.py`, `backend/app/models.py`, `backend/app/schemas.py` |
| RSS ingestion and deduplication | `backend/app/services/rss_service.py`, `backend/app/services/article_cleaner.py` |
| Vector indexing and search | `backend/app/services/embedding_service.py`, `backend/app/services/vector_store.py` |
| Prompting and LLM call | `backend/app/services/rag_service.py`, `backend/app/prompts/rag_prompt.py` |
| API contracts | `backend/app/api/routes_news.py`, `routes_ingestion.py`, `routes_ask.py` |
| Frontend API boundary | `frontend/src/services/api.js` |
| Page navigation and UX | `frontend/src/App.jsx`, `frontend/src/pages/Dashboard.jsx`, `Explore.jsx`, `AskAI.jsx`, `Sources.jsx` |
| Client state choices | `frontend/src/hooks/*.js`, `frontend/src/pages/Explore.jsx`, `frontend/src/pages/Sources.jsx` |
