"""CLI entrypoint.

  python -m ingestion.run --dry-run          # process, don't persist
  python -m ingestion.run                     # process + store (local or supabase)
  python -m ingestion.run --resume cv.pdf     # include a résumé PDF
  python -m ingestion.run --no-github         # skip GitHub fetch
"""

from __future__ import annotations

import argparse
import json

from .config import CONFIG
from .pipeline import run_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="NEXUS ingestion worker")
    parser.add_argument("--dry-run", action="store_true", help="don't persist")
    parser.add_argument("--no-portfolio", action="store_true")
    parser.add_argument("--no-github", action="store_true")
    parser.add_argument("--resume", default=None, help="path to résumé PDF")
    args = parser.parse_args()

    print("── NEXUS ingestion ─────────────────────────────")
    print(f"  embeddings : {'gemini' if CONFIG.has_gemini else 'offline stub'}")
    print(f"  storage    : {'supabase' if CONFIG.has_supabase else 'local json'}")
    print(f"  github     : {'on' if not args.no_github else 'off'}"
          f"{' (no GITHUB_USERNAME set)' if not CONFIG.github_username else ''}")
    print("─────────────────────────────────────────────────")

    report = run_pipeline(
        portfolio=not args.no_portfolio,
        github=not args.no_github,
        resume_path=args.resume,
        persist=not args.dry_run,
    )

    print(json.dumps(report.as_dict(), indent=2))
    print("✓ done")


if __name__ == "__main__":
    main()
