import type { PortfolioData } from "./types";

/**
 * SEED CONTENT — single source of truth for the portfolio.
 *
 * This is what the site shows until Supabase is provisioned; the same shape is
 * served from the database afterwards (see lib/data/repository.ts). Edit freely
 * — every field here becomes admin-editable in Phase 8.
 *
 * ⚠️ PLACEHOLDER VALUES are marked TODO. Replace links, dates, and any details
 *    that aren't yet accurate. Nothing here should be treated as final copy.
 */
export const SEED: PortfolioData = {
  profile: {
    name: "Sai Teja",
    headline: "AI Engineer · RAG & Full-Stack",
    bio: "I build production RAG systems, agentic pipelines, and full-stack AI apps where retrieval, orchestration, and clean UX come together.",
    location: "India", // TODO: confirm
    socials: {
      github: "https://github.com/saitejabatta",
      linkedin: "https://linkedin.com/in/", // TODO: real profile URL
      email: "battasaiteja25@gmail.com",
    },
    systemPrompt:
      "You are NEXUS, the AI portfolio agent for Sai Teja. Answer as a knowledgeable, concise representative of Sai Teja using only the provided context (projects, skills, experience, resume, repos). Be specific and technical. If retrieval confidence is low, say so honestly rather than inventing details. Offer relevant follow-up questions.",
  },

  projects: [
    {
      slug: "nexus-portfolio",
      title: "NEXUS — AI Portfolio",
      summary:
        "A portfolio you talk to. Streams a live RAG pipeline visualization while answering as me.",
      descriptionMd:
        "An interactive portfolio built as an AI system: visitors chat with a RAG agent and watch the retrieval pipeline (embed → vector search → rerank → grounded generation) animate in real time.",
      liveUrl: "https://nexus-pi-ochre.vercel.app",
      repoUrl: "https://github.com/saitejabatta/nexus-portfolio",
      techStack: ["Next.js", "TypeScript", "Supabase", "pgvector", "Gemini", "Three.js"],
      category: "ai",
      status: "production",
      complexity: 5,
      challengesMd:
        "Making the RAG visualization **honest** — every animated stage maps to a real backend event rather than a cosmetic loop.",
      learningsMd:
        "Designing a streaming SSE pipeline whose stages double as a UI event stream; tying answer confidence to retrieval quality.",
      features: [
        "Live RAG pipeline visualizer",
        "Streaming chat with citations + confidence",
        "3D neural background, command palette, boot sequence",
      ],
      enabled: true,
      sortOrder: 1,
    },
    {
      slug: "atlasai-enterprise-knowledge-engine",
      title: "AtlasAI — Enterprise Knowledge Engine",
      summary:
        "Turns natural language into trusted business insights via metadata retrieval, relationship discovery, and explainable SQL generation.",
      descriptionMd:
        "AtlasAI transforms natural-language questions into trusted business insights. It retrieves relevant schema metadata, discovers relationships across tables, generates explainable SQL, and enforces enterprise-grade governance so answers stay auditable and safe over real data warehouses.",
      liveUrl: "",
      repoUrl: "https://github.com/saitejabatta/AtlasAI-Enterprise-Knowledge-Engine",
      techStack: ["Python", "LLMs", "NL-to-SQL", "Metadata Retrieval", "Data Governance"],
      category: "ai",
      status: "wip",
      complexity: 4,
      challengesMd:
        "Generating SQL that is not just correct but **explainable and governed** — grounding queries in real schema metadata and relationships instead of letting the LLM guess at table structure.",
      learningsMd:
        "Schema-aware retrieval for text-to-SQL, relationship discovery across enterprise data models, and building governance guardrails around generated queries.",
      features: [
        "Natural-language to SQL generation",
        "Metadata retrieval + relationship discovery",
        "Explainable, auditable query output",
        "Enterprise governance guardrails",
      ],
      enabled: true,
      sortOrder: 2,
    },
    {
      slug: "meeting-health-dashboard",
      title: "Meeting Health Dashboard",
      summary:
        "An AI meeting-intelligence pipeline — transcription, topic clustering, and sentiment analytics surfaced in a live dashboard.",
      descriptionMd:
        "Turns raw meeting audio into organizational insight. Audio is transcribed with Whisper, chunked and embedded for retrieval with LangChain + FAISS, and clustered into topics with BERTopic/UMAP/HDBSCAN; sentiment and health signals are then surfaced through an interactive Streamlit dashboard.",
      liveUrl: "",
      repoUrl: "https://github.com/saitejabatta/Meeting_Health_Dashboard",
      techStack: [
        "Python",
        "Whisper",
        "LangChain",
        "FAISS",
        "BERTopic",
        "Streamlit",
        "OpenAI",
      ],
      category: "ai",
      status: "wip",
      complexity: 4,
      challengesMd:
        "Turning noisy, unstructured meeting audio into structured, trustworthy health signals — from transcription accuracy through topic modeling to a dashboard people actually want to check.",
      learningsMd:
        "End-to-end audio-to-insight pipelines: Whisper transcription, embedding-based retrieval, unsupervised topic clustering, and packaging analysis as a live Streamlit product.",
      features: [
        "Whisper-based transcription",
        "RAG-backed meeting search (LangChain + FAISS)",
        "Topic clustering (BERTopic/UMAP/HDBSCAN)",
        "Interactive Streamlit health dashboard",
      ],
      enabled: true,
      sortOrder: 3,
    },
    {
      slug: "vichat",
      title: "VisionVideoChat (VIchat)",
      summary:
        "A VLM-based chat assistant that answers questions about images and short videos, with timestamped evidence.",
      descriptionMd:
        "A vision-language chat assistant that reasons over images and short video clips, returning answers grounded in optional evidence — timestamps and keyframes — so responses stay verifiable rather than just plausible-sounding.",
      liveUrl: "",
      repoUrl: "https://github.com/saitejabatta/VIchat",
      techStack: ["Python", "FastAPI", "PyTorch", "Transformers", "OpenCV", "Streamlit"],
      category: "ai",
      status: "wip",
      complexity: 4,
      challengesMd:
        "Keeping vision-language answers grounded — surfacing the actual keyframe/timestamp evidence behind a claim instead of an unverifiable free-text answer.",
      learningsMd:
        "Sampling strategies for video-to-frame inference, serving VLM inference behind a FastAPI backend, and evaluating multimodal chat quality.",
      features: [
        "Image + short-video question answering",
        "Timestamp/keyframe evidence for answers",
        "FastAPI inference server",
        "Benchmark/eval runners",
      ],
      enabled: true,
      sortOrder: 4,
    },
    {
      slug: "snowflake-ecommerce-warehouse",
      title: "Snowflake E-commerce Data Warehouse",
      summary:
        "A raw → stage → mart Snowflake warehouse over real e-commerce data, with dimensional modeling and KPI queries.",
      descriptionMd:
        "A dimensional data warehouse built in Snowflake following a raw → stage → mart architecture: internal stages and file formats for ingestion, cleaning/standardization at the stage layer, and dimension/fact tables plus views at the mart layer, backing a set of business KPI queries.",
      liveUrl: "",
      repoUrl: "https://github.com/saitejabatta/snowflake-ecommerce-warehouse",
      techStack: ["Snowflake", "SQL", "Data Modeling", "ETL"],
      category: "data",
      status: "wip",
      complexity: 3,
      challengesMd:
        "Designing a clean dimensional model (facts/dimensions) and a repeatable raw→stage→mart pipeline that stays easy to re-run end to end.",
      learningsMd:
        "Snowflake internal stages and COPY INTO ingestion, dimensional modeling, and writing KPI/analytics queries directly against a mart layer.",
      features: [
        "Raw → stage → mart pipeline",
        "Dimension & fact tables with views",
        "KPI analysis queries",
        "Data quality checks",
      ],
      enabled: true,
      sortOrder: 5,
    },
  ],

  skills: [
    { name: "Retrieval-Augmented Generation", category: "AI / RAG", proficiency: 5, enabled: true },
    { name: "Embeddings & Vector Search", category: "AI / RAG", proficiency: 5, enabled: true },
    { name: "LangChain", category: "AI / RAG", proficiency: 4, enabled: true },
    { name: "Prompt & Context Engineering", category: "AI / RAG", proficiency: 4, enabled: true },
    { name: "Speech-to-Text (Whisper)", category: "AI / RAG", proficiency: 4, enabled: true },
    { name: "Vision-Language Models", category: "AI / RAG", proficiency: 3, enabled: true },
    { name: "Python", category: "Backend", proficiency: 5, enabled: true },
    { name: "FastAPI", category: "Backend", proficiency: 4, enabled: true },
    { name: "PostgreSQL / pgvector", category: "Backend", proficiency: 4, enabled: true },
    { name: "Snowflake / SQL", category: "Backend", proficiency: 3, enabled: true },
    { name: "TypeScript", category: "Frontend", proficiency: 4, enabled: true },
    { name: "React / Next.js", category: "Frontend", proficiency: 4, enabled: true },
    { name: "Streamlit", category: "Frontend", proficiency: 4, enabled: true },
    { name: "Tailwind CSS", category: "Frontend", proficiency: 4, enabled: true },
    { name: "Docker", category: "Infra", proficiency: 3, enabled: true },
    { name: "Supabase", category: "Infra", proficiency: 4, enabled: true },
    { name: "CI/CD", category: "Infra", proficiency: 3, enabled: true },
  ],

  // TODO: replace with real roles/dates once confirmed.
  experience: [
    {
      org: "Independent / Project work",
      role: "AI Engineer",
      type: "job",
      summaryMd:
        "Shipping applied AI systems end to end — retrieval pipelines, agents, and full-stack AI apps — with a focus on evals, latency, and trustworthy output.",
      highlights: [
        "Built multiple production-style RAG systems",
        "Designed honest pipelines with confidence + citations",
      ],
      sortOrder: 1,
    },
  ],
};
