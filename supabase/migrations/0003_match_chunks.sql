-- ============================================================
-- NEXUS — vector search RPC
-- Cosine similarity search over chunks, joined to document metadata.
-- Called by src/lib/rag/retriever.ts (onlineRetrieve).
-- ============================================================

create or replace function match_chunks(
  query_embedding vector(768),
  match_count int default 8
)
returns table (
  id           uuid,
  content      text,
  similarity   float,
  source_type  text,
  source_ref   text,
  title        text
)
language sql stable
as $$
  select
    c.id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.source_type,
    d.source_ref,
    d.title
  from chunks c
  join documents d on d.id = c.document_id
  where c.embedding is not null
  order by c.embedding <=> query_embedding   -- <=> = cosine distance (ivfflat)
  limit match_count;
$$;
