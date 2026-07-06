"""Parse a résumé PDF into a Document. Lazy-imports pdfplumber; returns [] if no
file is provided so the pipeline runs without a résumé present.
"""

from __future__ import annotations

from pathlib import Path

from ..models import Document


def fetch_resume(pdf_path: str | Path | None) -> list[Document]:
    if not pdf_path:
        return []
    path = Path(pdf_path)
    if not path.exists():
        return []

    import pdfplumber  # lazy import

    pages: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if text.strip():
                pages.append(text)

    raw = "\n\n".join(pages).strip()
    if not raw:
        return []

    return [
        Document(
            source_type="resume",
            source_ref=path.name,
            title="Résumé",
            raw_content=raw,
            metadata={"pages": len(pages)},
        )
    ]
