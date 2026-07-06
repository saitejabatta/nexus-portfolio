"""Environment-driven configuration with safe offline defaults."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    # Embeddings
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")
    embed_model: str = os.getenv("GEMINI_EMBED_MODEL", "text-embedding-004")
    embed_dims: int = 768

    # Storage
    supabase_url: str | None = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_service_key: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # GitHub source
    github_token: str | None = os.getenv("GITHUB_TOKEN")
    github_username: str | None = os.getenv("GITHUB_USERNAME")

    # Chunking
    chunk_target_tokens: int = int(os.getenv("CHUNK_TARGET_TOKENS", "500"))
    chunk_overlap_tokens: int = int(os.getenv("CHUNK_OVERLAP_TOKENS", "75"))

    @property
    def has_gemini(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def has_supabase(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_key)


CONFIG = Config()
