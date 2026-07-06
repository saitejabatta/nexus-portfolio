"""FastAPI app exposing the worker. The Next admin 'Re-index' button (Phase 8)
calls POST /ingest. Lazy on fastapi so the CLI works without it installed.

  uvicorn ingestion.api:app --port 8000
"""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from .config import CONFIG
from .pipeline import run_pipeline

app = FastAPI(title="NEXUS Ingestion", version="0.1.0")


class IngestRequest(BaseModel):
    portfolio: bool = True
    github: bool = True
    resume_path: str | None = None
    dry_run: bool = False


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "embeddings": "gemini" if CONFIG.has_gemini else "offline-stub",
        "storage": "supabase" if CONFIG.has_supabase else "local-json",
    }


@app.post("/ingest")
def ingest(req: IngestRequest) -> dict:
    report = run_pipeline(
        portfolio=req.portfolio,
        github=req.github,
        resume_path=req.resume_path,
        persist=not req.dry_run,
    )
    return report.as_dict()
