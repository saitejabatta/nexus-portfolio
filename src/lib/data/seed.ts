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
      github: "https://github.com/", // TODO: real profile URL
      linkedin: "https://linkedin.com/in/", // TODO
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
      liveUrl: "", // TODO
      repoUrl: "", // TODO
      techStack: ["Next.js", "TypeScript", "Supabase", "pgvector", "Gemini", "Three.js"],
      category: "ai",
      status: "wip",
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
      slug: "ai-meeting-assistant",
      title: "AI Meeting Assistant",
      summary:
        "Real-time meeting copilot across Teams, Meet & Zoom — transcription, summaries, and action items.",
      descriptionMd:
        "A managed-bot meeting assistant that joins calls on all three major platforms, transcribes in real time, and produces summaries and action items.",
      liveUrl: "",
      repoUrl: "",
      techStack: ["Python", "FastAPI", "LLMs", "WebSockets", "Speech-to-Text"],
      category: "ai",
      status: "wip",
      complexity: 4,
      challengesMd:
        "Unifying a single bot API across three platforms with different join/media models.",
      learningsMd:
        "Real-time audio pipelines, streaming transcription, and platform bot integrations.",
      features: ["Multi-platform join", "Live transcription", "Summaries & action items"],
      enabled: true,
      sortOrder: 2,
    },
    {
      slug: "enterprise-docintel",
      title: "Enterprise Document Intelligence",
      summary:
        "Upload → OCR → auto-classification → semantic search over enterprise documents.",
      descriptionMd:
        "A document intelligence platform that ingests files, runs OCR, classifies document types, and enables semantic search across the corpus.",
      liveUrl: "",
      repoUrl: "",
      techStack: ["Python", "FastAPI", "OCR", "Vector Search", "React"],
      category: "ai",
      status: "wip",
      complexity: 4,
      challengesMd:
        "Reliable OCR + classification across messy real-world document layouts.",
      learningsMd:
        "Document ingestion pipelines, OCR post-processing, and classification under noisy input.",
      features: ["OCR ingestion", "Automatic classification", "Semantic search"],
      enabled: true,
      sortOrder: 3,
    },
  ],

  skills: [
    { name: "Retrieval-Augmented Generation", category: "AI / RAG", proficiency: 5, enabled: true },
    { name: "Embeddings & Vector Search", category: "AI / RAG", proficiency: 5, enabled: true },
    { name: "Prompt & Context Engineering", category: "AI / RAG", proficiency: 4, enabled: true },
    { name: "Python", category: "Backend", proficiency: 5, enabled: true },
    { name: "FastAPI", category: "Backend", proficiency: 4, enabled: true },
    { name: "PostgreSQL / pgvector", category: "Backend", proficiency: 4, enabled: true },
    { name: "TypeScript", category: "Frontend", proficiency: 4, enabled: true },
    { name: "React / Next.js", category: "Frontend", proficiency: 4, enabled: true },
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
