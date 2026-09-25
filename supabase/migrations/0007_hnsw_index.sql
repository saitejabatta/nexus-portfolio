-- ============================================================
-- NEXUS — swap the chunk vector index from ivfflat to HNSW.
--
-- ivfflat computes its list centroids once, at CREATE INDEX time. Ours was
-- built on an empty table (lists = 100), so every later row lands in lists
-- with meaningless centroids and a default probes=1 search scans ~1% of them —
-- queries silently miss most chunks. HNSW has no training step: it stays
-- accurate as rows are inserted, which suits a small, frequently rebuilt index.
-- ============================================================

drop index if exists idx_chunks_embedding;

create index if not exists idx_chunks_embedding_hnsw on chunks
  using hnsw (embedding vector_cosine_ops);
