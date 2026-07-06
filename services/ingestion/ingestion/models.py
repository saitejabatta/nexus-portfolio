"""Dataclasses shared across the pipeline."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Document:
    """A normalized source document before chunking."""

    source_type: str  # repo_readme | resume | project | skill | experience | blog
    source_ref: str  # repo full_name / file path / row id
    title: str
    raw_content: str
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def id(self) -> str:
        return hashlib.sha1(
            f"{self.source_type}:{self.source_ref}".encode()
        ).hexdigest()


@dataclass
class Chunk:
    """A chunk of a document, optionally with its embedding."""

    document_id: str
    content: str
    token_count: int
    metadata: dict[str, Any] = field(default_factory=dict)
    embedding: list[float] | None = None

    @property
    def content_hash(self) -> str:
        """Stable hash → enables idempotent, incremental re-ingestion."""
        return hashlib.sha1(self.content.encode()).hexdigest()
