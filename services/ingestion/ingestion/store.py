"""Persistence — Supabase/pgvector when configured, else local JSON.

Idempotent: chunks are keyed by content hash so re-runs replace a document's
chunks cleanly rather than duplicating them.
"""

from __future__ import annotations

import json
from pathlib import Path

from .config import CONFIG
from .models import Chunk, Document

OUT_DIR = Path(__file__).resolve().parent.parent / "out"


def _to_row(doc: Document, chunk: Chunk) -> dict:
    return {
        "document_id": doc.id,
        "source_type": doc.source_type,
        "source_ref": doc.source_ref,
        "title": doc.title,
        "content": chunk.content,
        "token_count": chunk.token_count,
        "content_hash": chunk.content_hash,
        "metadata": chunk.metadata,
        "embedding": chunk.embedding,
    }


def store_local(pairs: list[tuple[Document, list[Chunk]]]) -> Path:
    """Write everything to out/chunks.json for inspection / offline dev."""
    OUT_DIR.mkdir(exist_ok=True)
    rows = [_to_row(doc, c) for doc, chunks in pairs for c in chunks]
    out_file = OUT_DIR / "chunks.json"
    out_file.write_text(json.dumps(rows, indent=2))
    # Also write a compact manifest (no vectors) for quick review.
    manifest = [
        {
            "document_id": doc.id,
            "title": doc.title,
            "source_type": doc.source_type,
            "chunks": len(chunks),
            "tokens": sum(c.token_count for c in chunks),
        }
        for doc, chunks in pairs
    ]
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    return out_file


def store_supabase(pairs: list[tuple[Document, list[Chunk]]]) -> int:
    from supabase import create_client  # lazy import

    client = create_client(CONFIG.supabase_url, CONFIG.supabase_service_key)
    written = 0
    for doc, chunks in pairs:
        # Upsert the parent document.
        client.table("documents").upsert(
            {
                "id": doc.id,
                "source_type": doc.source_type,
                "source_ref": doc.source_ref,
                "title": doc.title,
                "raw_content": doc.raw_content,
                "metadata": doc.metadata,
            },
            on_conflict="id",
        ).execute()
        # Replace its chunks.
        client.table("chunks").delete().eq("document_id", doc.id).execute()
        client.table("chunks").insert(
            [
                {
                    "document_id": doc.id,
                    "content": c.content,
                    "token_count": c.token_count,
                    "metadata": c.metadata,
                    "embedding": c.embedding,
                }
                for c in chunks
            ]
        ).execute()
        written += len(chunks)
    return written


def store(pairs: list[tuple[Document, list[Chunk]]]) -> str:
    if CONFIG.has_supabase:
        n = store_supabase(pairs)
        return f"supabase: {n} chunks upserted"
    path = store_local(pairs)
    return f"local: {path}"
