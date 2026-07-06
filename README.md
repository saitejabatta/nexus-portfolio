# NEXUS — An AI Portfolio That Thinks

A futuristic, interactive AI-engineer portfolio. Visitors don't browse pages — they
chat with a RAG agent that answers as the owner while the full retrieval pipeline
(embed → vector search → rerank → grounded generation) visualizes live on screen.

> Full architecture: see [`../BLUEPRINT.md`](../BLUEPRINT.md).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 |
| Motion / 3D | Framer Motion · React-Three-Fiber *(Phase 1)* |
| Backend | Next.js Route Handlers (SSE) |
| Data | Supabase — Postgres + pgvector + Auth + Storage |
| LLM | Gemini Flash (free) behind a swappable provider adapter |
| Ingestion | Python FastAPI worker *(Phase 5)* |
| Hosting | Vercel (web) + Render / GitHub Actions (ingestion) |

## Getting started

```bash
npm install
cp .env.example .env.local   # nothing required for Phase 0
npm run dev                  # http://localhost:3000
```

## Design system

TRON / holographic, dark-only. Tokens live in [`src/app/globals.css`](src/app/globals.css)
(Tailwind v4 `@theme`). Core accents: cyan `#22D3EE`, blue `#3B82F6`, purple `#A855F7`.
Utilities: `.glass`, `.nexus-grid`, `.glow-cyan`, `.scanline`, `.pulse-dot`, `.caret`.

## Build phases

0. **Foundations** ✅ — scaffold, design tokens, themed shell, Supabase client stub, CI
1. Design system + cinematic shell (boot sequence, neural background, command palette)
2. Chat UI (mocked) → 3. RAG visualizer → 4. Schema/seed → 5. Ingestion → 6. RAG backend
7. Rich cards/tools → 8. Admin CMS → 9. Wow features → 10. PWA/perf → 11. Analytics → 12. Launch
