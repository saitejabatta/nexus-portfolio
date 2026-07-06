"""Fetch public repos + READMEs for a GitHub user. Lazy-imports httpx so the
core pipeline runs without it. No-ops gracefully if no username is configured.
"""

from __future__ import annotations

import base64

from ..config import CONFIG
from ..models import Document

API = "https://api.github.com"


def _headers() -> dict[str, str]:
    h = {"Accept": "application/vnd.github+json"}
    if CONFIG.github_token:
        h["Authorization"] = f"Bearer {CONFIG.github_token}"
    return h


def fetch_github(username: str | None = None, limit: int = 30) -> list[Document]:
    user = username or CONFIG.github_username
    if not user:
        return []  # nothing configured — skip silently

    import httpx  # lazy import

    docs: list[Document] = []
    with httpx.Client(headers=_headers(), timeout=20) as client:
        repos = client.get(
            f"{API}/users/{user}/repos",
            params={"sort": "pushed", "per_page": limit},
        ).json()

        for repo in repos:
            if repo.get("fork") or repo.get("archived"):
                continue
            full = repo["full_name"]
            readme_md = ""
            r = client.get(f"{API}/repos/{full}/readme")
            if r.status_code == 200:
                content = r.json().get("content", "")
                try:
                    readme_md = base64.b64decode(content).decode("utf-8", "ignore")
                except Exception:
                    readme_md = ""

            body = "\n\n".join(
                filter(
                    None,
                    [
                        repo.get("description"),
                        f"Language: {repo.get('language')}"
                        if repo.get("language")
                        else None,
                        "Topics: " + ", ".join(repo.get("topics", []))
                        if repo.get("topics")
                        else None,
                        readme_md,
                    ],
                )
            )
            docs.append(
                Document(
                    source_type="repo_readme",
                    source_ref=full,
                    title=repo.get("name", full),
                    raw_content=body or repo.get("name", full),
                    metadata={
                        "stars": repo.get("stargazers_count", 0),
                        "language": repo.get("language"),
                        "url": repo.get("html_url"),
                        "pushed_at": repo.get("pushed_at"),
                    },
                )
            )
    return docs
