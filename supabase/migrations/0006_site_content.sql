-- ============================================================
-- NEXUS — admin-editable site content
-- Hero tagline/subtitle and the suggested prompt chips move out of
-- code and into the profile row, so the owner controls them.
-- ============================================================

alter table profile add column if not exists site jsonb not null default '{}';

update profile set site = '{
  "tagline": "an AI portfolio you can talk to",
  "subtitle": "Ask anything. Watch the retrieval pipeline think — embeddings, vector search, and grounded generation, live.",
  "suggestedPrompts": ["Who are you?", "Show AI projects", "Strongest skills?", "Tell me about your internships", "I''d like to connect"]
}'::jsonb
where site = '{}'::jsonb;
