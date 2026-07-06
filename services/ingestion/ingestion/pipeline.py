"""Orchestrates: fetch → chunk → embed → store."""

from __future__ import annotations

from dataclasses import dataclass, field

from .chunk import chunk_document
from .config import CONFIG
from .embed import embed_chunks
from .fetchers.github import fetch_github
from .fetchers.portfolio import fetch_portfolio
from .fetchers.resume import fetch_resume
from .models import Chunk, Document
from .store import store


@dataclass
class IngestReport:
    documents: int = 0
    chunks: int = 0
    tokens: int = 0
    provider: str = ""
    storage: str = ""
    by_source: dict[str, int] = field(default_factory=dict)

    def as_dict(self) -> dict:
        return self.__dict__


def collect_documents(
    *, portfolio: bool = True, github: bool = True, resume_path: str | None = None
) -> list[Document]:
    docs: list[Document] = []
    if portfolio:
        docs += fetch_portfolio()
    if github:
        docs += fetch_github()
    docs += fetch_resume(resume_path)
    return docs


def run_pipeline(
    *,
    portfolio: bool = True,
    github: bool = True,
    resume_path: str | None = None,
    persist: bool = True,
) -> IngestReport:
    docs = collect_documents(portfolio=portfolio, github=github, resume_path=resume_path)

    pairs: list[tuple[Document, list[Chunk]]] = []
    by_source: dict[str, int] = {}
    for doc in docs:
        chunks = chunk_document(
            doc,
            target_tokens=CONFIG.chunk_target_tokens,
            overlap_tokens=CONFIG.chunk_overlap_tokens,
        )
        pairs.append((doc, chunks))
        by_source[doc.source_type] = by_source.get(doc.source_type, 0) + len(chunks)

    all_chunks = [c for _, chunks in pairs for c in chunks]
    _, provider = embed_chunks(all_chunks)

    report = IngestReport(
        documents=len(docs),
        chunks=len(all_chunks),
        tokens=sum(c.token_count for c in all_chunks),
        provider=provider,
        by_source=by_source,
    )

    if persist:
        report.storage = store(pairs)
    return report
