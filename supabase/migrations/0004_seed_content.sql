-- ============================================================
-- NEXUS — seed content
-- Mirrors src/lib/data/seed.ts. Once this runs, the admin panel becomes
-- the source of truth; keep seed.ts as the offline fallback only.
-- ============================================================

insert into profile (name, headline, bio, location, socials, system_prompt)
values (
  'Sai Teja',
  'AI Engineer · RAG & Full-Stack',
  'I build production RAG systems, agentic pipelines, and full-stack AI apps where retrieval, orchestration, and clean UX come together.',
  'India',
  '{"github":"https://github.com/saitejabatta","linkedin":"https://www.linkedin.com/in/sai-teja-batta/","email":"battasaiteja25@gmail.com","cal":""}'::jsonb,
  'You are NEXUS, the AI portfolio agent for Sai Teja. Answer as a knowledgeable, concise representative of Sai Teja using only the provided context (projects, skills, experience, resume, repos). Be specific and technical. If retrieval confidence is low, say so honestly rather than inventing details. Offer relevant follow-up questions.'
);

insert into projects (slug, title, summary, description_md, live_url, repo_url, tech_stack, category, status, complexity, challenges_md, learnings_md, features, enabled, sort_order)
values
(
  'nexus-portfolio',
  'NEXUS — AI Portfolio',
  'A portfolio you talk to. Streams a live RAG pipeline visualization while answering as me.',
  'An interactive portfolio built as an AI system: visitors chat with a RAG agent and watch the retrieval pipeline (embed -> vector search -> rerank -> grounded generation) animate in real time.',
  'https://battasaiteja.dev',
  'https://github.com/saitejabatta/nexus-portfolio',
  array['Next.js','TypeScript','Supabase','pgvector','Gemini','Three.js'],
  'ai', 'production', 5,
  'Making the RAG visualization **honest** — every animated stage maps to a real backend event rather than a cosmetic loop.',
  'Designing a streaming SSE pipeline whose stages double as a UI event stream; tying answer confidence to retrieval quality.',
  '["Live RAG pipeline visualizer","Streaming chat with citations + confidence","3D neural background, command palette, boot sequence"]'::jsonb,
  true, 1
),
(
  'atlasai-enterprise-knowledge-engine',
  'AtlasAI — Enterprise Knowledge Engine',
  'Turns natural language into trusted business insights via metadata retrieval, relationship discovery, and explainable SQL generation.',
  'AtlasAI transforms natural-language questions into trusted business insights. It retrieves relevant schema metadata, discovers relationships across tables, generates explainable SQL, and enforces enterprise-grade governance so answers stay auditable and safe over real data warehouses.',
  '',
  'https://github.com/saitejabatta/AtlasAI-Enterprise-Knowledge-Engine',
  array['Python','LLMs','NL-to-SQL','Metadata Retrieval','Data Governance'],
  'ai', 'wip', 4,
  'Generating SQL that is not just correct but **explainable and governed** — grounding queries in real schema metadata and relationships instead of letting the LLM guess at table structure.',
  'Schema-aware retrieval for text-to-SQL, relationship discovery across enterprise data models, and building governance guardrails around generated queries.',
  '["Natural-language to SQL generation","Metadata retrieval + relationship discovery","Explainable, auditable query output","Enterprise governance guardrails"]'::jsonb,
  true, 2
),
(
  'meeting-health-dashboard',
  'Meeting Health Dashboard',
  'An AI meeting-intelligence pipeline — transcription, topic clustering, and sentiment analytics surfaced in a live dashboard.',
  'Turns raw meeting audio into organizational insight. Audio is transcribed with Whisper, chunked and embedded for retrieval with LangChain + FAISS, and clustered into topics with BERTopic/UMAP/HDBSCAN; sentiment and health signals are then surfaced through an interactive Streamlit dashboard.',
  '',
  'https://github.com/saitejabatta/Meeting_Health_Dashboard',
  array['Python','Whisper','LangChain','FAISS','BERTopic','Streamlit','OpenAI'],
  'ai', 'wip', 4,
  'Turning noisy, unstructured meeting audio into structured, trustworthy health signals — from transcription accuracy through topic modeling to a dashboard people actually want to check.',
  'End-to-end audio-to-insight pipelines: Whisper transcription, embedding-based retrieval, unsupervised topic clustering, and packaging analysis as a live Streamlit product.',
  '["Whisper-based transcription","RAG-backed meeting search (LangChain + FAISS)","Topic clustering (BERTopic/UMAP/HDBSCAN)","Interactive Streamlit health dashboard"]'::jsonb,
  true, 3
),
(
  'vichat',
  'VisionVideoChat (VIchat)',
  'A VLM-based chat assistant that answers questions about images and short videos, with timestamped evidence.',
  'A vision-language chat assistant that reasons over images and short video clips, returning answers grounded in optional evidence — timestamps and keyframes — so responses stay verifiable rather than just plausible-sounding.',
  '',
  'https://github.com/saitejabatta/VIchat',
  array['Python','FastAPI','PyTorch','Transformers','OpenCV','Streamlit'],
  'ai', 'wip', 4,
  'Keeping vision-language answers grounded — surfacing the actual keyframe/timestamp evidence behind a claim instead of an unverifiable free-text answer.',
  'Sampling strategies for video-to-frame inference, serving VLM inference behind a FastAPI backend, and evaluating multimodal chat quality.',
  '["Image + short-video question answering","Timestamp/keyframe evidence for answers","FastAPI inference server","Benchmark/eval runners"]'::jsonb,
  true, 4
),
(
  'snowflake-ecommerce-warehouse',
  'Snowflake E-commerce Data Warehouse',
  'A raw -> stage -> mart Snowflake warehouse over real e-commerce data, with dimensional modeling and KPI queries.',
  'A dimensional data warehouse built in Snowflake following a raw -> stage -> mart architecture: internal stages and file formats for ingestion, cleaning/standardization at the stage layer, and dimension/fact tables plus views at the mart layer, backing a set of business KPI queries.',
  '',
  'https://github.com/saitejabatta/snowflake-ecommerce-warehouse',
  array['Snowflake','SQL','Data Modeling','ETL'],
  'data', 'wip', 3,
  'Designing a clean dimensional model (facts/dimensions) and a repeatable raw->stage->mart pipeline that stays easy to re-run end to end.',
  'Snowflake internal stages and COPY INTO ingestion, dimensional modeling, and writing KPI/analytics queries directly against a mart layer.',
  '["Raw -> stage -> mart pipeline","Dimension & fact tables with views","KPI analysis queries","Data quality checks"]'::jsonb,
  true, 5
);

insert into skills (name, category, proficiency, enabled, sort_order)
values
('Retrieval-Augmented Generation', 'AI / RAG', 5, true, 1),
('Embeddings & Vector Search', 'AI / RAG', 5, true, 2),
('LangChain', 'AI / RAG', 4, true, 3),
('Prompt & Context Engineering', 'AI / RAG', 4, true, 4),
('Speech-to-Text (Whisper)', 'AI / RAG', 4, true, 5),
('Vision-Language Models', 'AI / RAG', 3, true, 6),
('Python', 'Backend', 5, true, 7),
('FastAPI', 'Backend', 4, true, 8),
('PostgreSQL / pgvector', 'Backend', 4, true, 9),
('Snowflake / SQL', 'Backend', 3, true, 10),
('TypeScript', 'Frontend', 4, true, 11),
('React / Next.js', 'Frontend', 4, true, 12),
('Streamlit', 'Frontend', 4, true, 13),
('Tailwind CSS', 'Frontend', 4, true, 14),
('Docker', 'Infra', 3, true, 15),
('Supabase', 'Infra', 4, true, 16),
('CI/CD', 'Infra', 3, true, 17);

insert into experience (org, role, type, summary_md, highlights, sort_order)
values (
  'Independent / Project work',
  'AI Engineer',
  'job',
  'Shipping applied AI systems end to end — retrieval pipelines, agents, and full-stack AI apps — with a focus on evals, latency, and trustworthy output.',
  array['Built multiple production-style RAG systems','Designed honest pipelines with confidence + citations'],
  1
);
