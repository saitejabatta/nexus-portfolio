"""Turn structured portfolio content (projects/skills/profile/experience) into
Documents. Reads a JSON file that mirrors the frontend SEED (lib/data/seed.ts),
so the same content powers both the site and the knowledge base.
"""

from __future__ import annotations

import json
from pathlib import Path

from ..models import Document

DEFAULT_PATH = Path(__file__).resolve().parents[2] / "data" / "portfolio.sample.json"


def fetch_portfolio(path: Path | None = None) -> list[Document]:
    src = path or DEFAULT_PATH
    data = json.loads(src.read_text())
    docs: list[Document] = []

    profile = data.get("profile", {})
    if profile:
        docs.append(
            Document(
                source_type="profile",
                source_ref="profile",
                title=f"{profile.get('name', 'Profile')} — profile",
                raw_content="\n".join(
                    filter(
                        None,
                        [
                            profile.get("headline"),
                            profile.get("bio"),
                            f"Location: {profile.get('location')}"
                            if profile.get("location")
                            else None,
                        ],
                    )
                ),
                metadata={"name": profile.get("name")},
            )
        )

    for p in data.get("projects", []):
        body = "\n\n".join(
            filter(
                None,
                [
                    p.get("summary"),
                    p.get("descriptionMd"),
                    "Tech stack: " + ", ".join(p.get("techStack", [])),
                    "Challenges: " + p["challengesMd"] if p.get("challengesMd") else None,
                    "What I learned: " + p["learningsMd"] if p.get("learningsMd") else None,
                    "Features: " + ", ".join(p.get("features", []))
                    if p.get("features")
                    else None,
                ],
            )
        )
        docs.append(
            Document(
                source_type="project",
                source_ref=p["slug"],
                title=p["title"],
                raw_content=body,
                metadata={
                    "category": p.get("category"),
                    "status": p.get("status"),
                    "tech_stack": p.get("techStack", []),
                },
            )
        )

    skills = data.get("skills", [])
    if skills:
        by_cat: dict[str, list[str]] = {}
        for s in skills:
            by_cat.setdefault(s.get("category", "Other"), []).append(s["name"])
        body = "\n".join(f"{cat}: {', '.join(names)}" for cat, names in by_cat.items())
        docs.append(
            Document(
                source_type="skill",
                source_ref="skills",
                title="Skills",
                raw_content=body,
                metadata={"count": len(skills)},
            )
        )

    for e in data.get("experience", []):
        docs.append(
            Document(
                source_type="experience",
                source_ref=f"{e.get('org')}-{e.get('role')}",
                title=f"{e.get('role')} · {e.get('org')}",
                raw_content="\n".join(
                    filter(
                        None,
                        [e.get("summaryMd"), "\n".join(e.get("highlights", []))],
                    )
                ),
                metadata={"type": e.get("type")},
            )
        )

    return docs
