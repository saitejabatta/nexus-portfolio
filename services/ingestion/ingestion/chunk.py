"""Recursive, overlap-aware chunking. Pure stdlib (no tokenizer dependency).

We approximate tokens as words * 1.3 — good enough for chunk sizing without
pulling in a heavyweight tokenizer. Swap in tiktoken later if exact counts matter.
"""

from __future__ import annotations

import re

from .models import Chunk, Document

_PARAGRAPH = re.compile(r"\n\s*\n")
_SENTENCE = re.compile(r"(?<=[.!?])\s+")


def estimate_tokens(text: str) -> int:
    words = len(text.split())
    return max(1, round(words * 1.3))


def _split_units(text: str) -> list[str]:
    """Split into paragraphs, falling back to sentences for long ones."""
    units: list[str] = []
    for para in _PARAGRAPH.split(text):
        para = para.strip()
        if not para:
            continue
        if estimate_tokens(para) <= 600:
            units.append(para)
        else:
            units.extend(s.strip() for s in _SENTENCE.split(para) if s.strip())
    return units


def chunk_document(
    doc: Document, target_tokens: int = 500, overlap_tokens: int = 75
) -> list[Chunk]:
    units = _split_units(doc.raw_content)
    chunks: list[Chunk] = []
    buf: list[str] = []
    buf_tokens = 0

    def flush() -> None:
        nonlocal buf, buf_tokens
        if not buf:
            return
        content = "\n\n".join(buf).strip()
        chunks.append(
            Chunk(
                document_id=doc.id,
                content=content,
                token_count=estimate_tokens(content),
                metadata={
                    "source_type": doc.source_type,
                    "source_ref": doc.source_ref,
                    "title": doc.title,
                    **doc.metadata,
                },
            )
        )
        # Carry overlap: keep trailing units up to overlap_tokens.
        carry: list[str] = []
        carry_tokens = 0
        for unit in reversed(buf):
            t = estimate_tokens(unit)
            if carry_tokens + t > overlap_tokens:
                break
            carry.insert(0, unit)
            carry_tokens += t
        buf = carry
        buf_tokens = carry_tokens

    for unit in units:
        t = estimate_tokens(unit)
        if buf_tokens + t > target_tokens and buf:
            flush()
        buf.append(unit)
        buf_tokens += t
    flush()

    return chunks
