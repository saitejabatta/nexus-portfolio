# NEXUS Ingestion Worker

Turns your sources into embedded chunks in pgvector:

```
sources → documents → chunks → embeddings → store
GitHub repos · résumé PDF · portfolio content
```

## Design

- **Offline-capable core.** Chunking, the embedding *stub*, and the local-JSON
  store are pure stdlib, so the whole pipeline runs with **zero dependencies or
  credentials** (great for dev + CI). It transparently upgrades:
  - `GEMINI_API_KEY` set → real `text-embedding-004` embeddings
  - Supabase creds set → writes to `documents` + `chunks` (pgvector)
  - `GITHUB_USERNAME` set → fetches repos + READMEs
  - `--resume cv.pdf` → parses the PDF
- **Idempotent & incremental.** Chunks are keyed by content hash; a re-run
  replaces a document's chunks instead of duplicating.

## Run

```bash
# offline dry run (no install, no creds) — processes the sample portfolio
python -m ingestion.run --dry-run

# process + persist (local out/chunks.json, or Supabase if configured)
python -m ingestion.run

# include a résumé, skip GitHub
python -m ingestion.run --resume ~/cv.pdf --no-github
```

For real embeddings/storage/GitHub:

```bash
pip install -r requirements.txt
export GEMINI_API_KEY=...        NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...   GITHUB_USERNAME=...   GITHUB_TOKEN=...
python -m ingestion.run
```

## Serve (for the admin "Re-index" button, Phase 8)

```bash
uvicorn ingestion.api:app --port 8000
# GET  /health
# POST /ingest   { "github": true, "resume_path": null, "dry_run": false }
```

## Layout

```
ingestion/
  config.py            env + offline defaults
  models.py            Document, Chunk
  chunk.py             recursive overlap chunker (stdlib)
  embed.py             Gemini | offline stub
  store.py             Supabase | local JSON
  pipeline.py          fetch → chunk → embed → store
  run.py               CLI
  api.py               FastAPI
  fetchers/            portfolio · github · resume
data/portfolio.sample.json   offline content (mirrors lib/data/seed.ts)
out/                   local store output (gitignored)
```
