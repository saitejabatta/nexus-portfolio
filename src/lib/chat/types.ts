import type { Project } from "@/lib/data/types";

export type Role = "user" | "assistant";

/* ── Rich tool-call components (rendered inside an assistant answer) ──────── */
export type RepoCard = {
  name: string;
  description: string;
  language?: string;
  stars?: number;
  url?: string;
  topics: string[];
};
export type ResumeCard = {
  name: string;
  headline: string;
  highlights: string[];
  downloadUrl?: string;
};
export type TimelineItem = {
  title: string;
  subtitle: string;
  period?: string;
  detail?: string;
};

export type MessageComponent =
  | { kind: "projects"; projects: Project[] }
  | { kind: "repos"; repos: RepoCard[] }
  | { kind: "resume"; resume: ResumeCard }
  | { kind: "timeline"; items: TimelineItem[] };

/** The stages of the RAG pipeline, in execution order. */
export type StageId =
  | "query"
  | "embed"
  | "search"
  | "chunks"
  | "rerank"
  | "sources"
  | "assemble"
  | "generate";

export type StageStatus = "pending" | "active" | "done";

export type StageState = { id: StageId; status: StageStatus };

export type RetrievalHit = {
  source: string;
  kind: "repo" | "resume" | "project" | "skill";
  score: number; // 0..1 cosine similarity
};

/** Mock (later real) retrieval metadata that drives the visualization. */
export type Retrieval = {
  embeddingDims: number;
  candidates: number;
  hits: RetrievalHit[];
  repos: string[];
  contextTokens: number;
  confidence: number; // 0..100
};

export type PipelineRun = {
  stages: StageState[];
  retrieval: Retrieval;
  status: "running" | "done";
};

export type Message = {
  id: string;
  role: Role;
  /** Markdown content. For assistant messages this fills in as it streams. */
  content: string;
  /** True while the assistant message is still streaming tokens. */
  streaming?: boolean;
  /** Follow-up prompts suggested after an assistant answer. */
  followups?: string[];
  /** Rich tool-call components rendered with the answer (assistant only). */
  components?: MessageComponent[];
  /** RAG pipeline run that produced this answer (assistant only). */
  pipeline?: PipelineRun;
  createdAt: number;
};

/** A canned answer from the mock engine (replaced by real RAG in Phase 6). */
export type MockAnswer = {
  content: string;
  followups?: string[];
};

/** Ordered stage list with display labels — shared by engine + visualizer. */
export const STAGES: { id: StageId; label: string }[] = [
  { id: "query", label: "Query" },
  { id: "embed", label: "Embed" },
  { id: "search", label: "Vector search" },
  { id: "chunks", label: "Retrieve chunks" },
  { id: "rerank", label: "Rerank" },
  { id: "sources", label: "Link sources" },
  { id: "assemble", label: "Assemble context" },
  { id: "generate", label: "Generate" },
];
