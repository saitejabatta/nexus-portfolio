"""Embeddings — Gemini text-embedding-004 when configured, else an offline stub.

The stub produces deterministic, L2-normalized 768-d vectors from a hash of the
text. It is NOT semantically meaningful — it exists so the full pipeline runs
end-to-end offline (and in CI). Real retrieval quality requires GEMINI_API_KEY.
"""

from __future__ import annotations

import hashlib
import math
import struct

from .config import CONFIG
from .models import Chunk


def _stub_embedding(text: str, dims: int) -> list[float]:
    """Deterministic pseudo-embedding from a SHA-256 stream, L2-normalized."""
    vals: list[float] = []
    counter = 0
    while len(vals) < dims:
        seed = hashlib.sha256(f"{text}|{counter}".encode()).digest()
        # 8 floats per 32-byte digest (4 bytes each)
        for i in range(0, len(seed), 4):
            n = struct.unpack(">I", seed[i : i + 4])[0]
            vals.append((n / 2**32) * 2 - 1)  # → [-1, 1)
            if len(vals) >= dims:
                break
        counter += 1
    norm = math.sqrt(sum(v * v for v in vals)) or 1.0
    return [v / norm for v in vals]


def _gemini_embeddings(texts: list[str]) -> list[list[float]]:
    import google.generativeai as genai  # lazy import

    genai.configure(api_key=CONFIG.gemini_api_key)
    out: list[list[float]] = []
    for t in texts:
        resp = genai.embed_content(
            model=f"models/{CONFIG.embed_model}",
            content=t,
            task_type="retrieval_document",
        )
        out.append(resp["embedding"])
    return out


def embed_chunks(chunks: list[Chunk]) -> tuple[list[Chunk], str]:
    """Attach embeddings to chunks. Returns (chunks, provider_name)."""
    texts = [c.content for c in chunks]
    if CONFIG.has_gemini:
        vectors = _gemini_embeddings(texts)
        provider = f"gemini:{CONFIG.embed_model}"
    else:
        vectors = [_stub_embedding(t, CONFIG.embed_dims) for t in texts]
        provider = "stub:offline"
    for c, v in zip(chunks, vectors):
        c.embedding = v
    return chunks, provider
