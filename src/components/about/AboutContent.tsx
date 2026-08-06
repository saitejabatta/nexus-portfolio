"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Cpu } from "lucide-react";
import { fadeRise, stagger } from "@/lib/design/motion";

// Same 3D background the home page uses — client-only, lazy.
const NeuralBackground = dynamic(
  () => import("@/components/three/NeuralBackground").then((m) => m.NeuralBackground),
  { ssr: false },
);

const STACK: [string, React.ReactNode][] = [
  ["Frontend", <>Next.js 16 <em className="text-text-muted">(App Router)</em>, React 19, TypeScript</>],
  ["Styling / motion", <>Tailwind CSS v4, Framer Motion, React Three Fiber</>],
  ["Transport", <>Server-Sent Events over a Vercel serverless function</>],
  ["Generation", <>Gemini 2.5 Flash <em className="text-text-muted">(streaming)</em>, swappable adapter</>],
  ["Retrieval", <>Gemini text-embedding-004 → pgvector cosine search</>],
  ["Database", <>Supabase Postgres, Row-Level Security, Auth, Storage</>],
  ["Ingestion", <>Standalone Python / FastAPI worker, idempotent chunk + embed</>],
  ["Deploy", <>Vercel + GitHub Actions CI, custom domain, PWA</>],
];

export function AboutContent() {
  return (
    <>
      {/* Background stack — matches the home shell */}
      <NeuralBackground />
      <div className="pointer-events-none fixed inset-0 -z-10 nexus-grid opacity-30" />
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 85% at 50% 40%, rgba(5,7,13,0.55) 0%, rgba(5,7,13,0.78) 55%, rgba(5,7,13,0.92) 100%)",
        }}
      />

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <Cpu className="h-4 w-4 text-cyan" />
          <span className="font-display text-sm font-semibold tracking-widest text-text">
            NEXUS
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-text-faint sm:inline">
            / sai teja
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[11px] text-text-muted transition-colors hover:border-cyan/50 hover:text-cyan"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>back to chat</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-28 pt-28">
        <motion.div variants={stagger(0.06, 0.1)} initial="hidden" animate="show">
          {/* Hero */}
          <motion.p
            variants={fadeRise}
            className="mb-3 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.28em] text-cyan"
          >
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan" />
            learn about me
          </motion.p>
          <motion.h1
            variants={fadeRise}
            className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-text text-glow-cyan sm:text-5xl"
          >
            Under the hood
          </motion.h1>
          <motion.p
            variants={fadeRise}
            className="mt-4 max-w-[62ch] text-balance text-[15px] text-text-muted"
          >
            This site isn&apos;t a static résumé — it&apos;s a live application. Here&apos;s
            how a single question actually travels through it, and one design decision I&apos;m
            proud of. If you like what you read, the chat can tell you the rest.
          </motion.p>

          {/* Figure 1 — request lifecycle */}
          <motion.section variants={fadeRise} className="mt-16">
            <div className="mb-2 flex items-baseline gap-3.5">
              <span className="font-display text-sm font-bold text-text-faint">01</span>
              <h2 className="font-display text-xl font-bold text-text">
                The request lifecycle
              </h2>
            </div>
            <p className="mb-7 max-w-[66ch] text-sm text-text-muted">
              Every question runs this exact path. The eight-node strip is the real control
              flow of an async generator on the server — each node is a{" "}
              <code className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan">
                yield
              </code>{" "}
              that streams one event to the browser the instant it happens. Two of those
              stages make genuine network calls.
            </p>

            <figure className="m-0">
              <div className="glass overflow-x-auto rounded-2xl p-5">
                <LifecycleDiagram />
              </div>
              <figcaption className="mt-3.5 max-w-[70ch] text-[12.5px] leading-relaxed text-text-muted">
                The strip inside the dashed boundary is a single{" "}
                <span className="text-text">async generator</span> — its real control flow,
                not a decorative animation. At <span className="text-text">search</span> it
                embeds the query and runs a cosine-similarity search; at{" "}
                <span className="text-text">generate</span> it streams tokens from Gemini.
                Both round-trips are real, and their outputs are exactly what the on-screen
                confidence score and typing effect show.
              </figcaption>
            </figure>
          </motion.section>

          {/* Figure 2 — RLS */}
          <motion.section variants={fadeRise} className="mt-16">
            <div className="mb-2 flex items-baseline gap-3.5">
              <span className="font-display text-sm font-bold text-text-faint">02</span>
              <h2 className="font-display text-xl font-bold text-text">
                Why admin edits can&apos;t leak
              </h2>
            </div>
            <p className="mb-7 max-w-[66ch] text-sm text-text-muted">
              The admin dashboard talks to the database straight from the browser — there&apos;s
              no separate backend standing guard. The safety comes from where the permission
              check actually lives.
            </p>

            <figure className="m-0">
              <div className="glass overflow-x-auto rounded-2xl p-5">
                <RlsDiagram />
              </div>
              <figcaption className="mt-3.5 max-w-[70ch] text-[12.5px] leading-relaxed text-text-muted">
                The permission check isn&apos;t code a route has to remember to call — it&apos;s a
                policy <span className="text-text">Postgres itself evaluates on every query</span>,
                so no code path can accidentally skip it.
              </figcaption>
            </figure>
          </motion.section>

          {/* Stack */}
          <motion.section variants={fadeRise} className="mt-16">
            <div className="mb-2 flex items-baseline gap-3.5">
              <span className="font-display text-sm font-bold text-text-faint">03</span>
              <h2 className="font-display text-xl font-bold text-text">Stack at a glance</h2>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {STACK.map(([k, v]) => (
                <div key={k} className="bg-bg-elevated px-4 py-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                    {k}
                  </div>
                  <div className="mt-1.5 text-[13px] text-text">{v}</div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            variants={fadeRise}
            className="mt-14 flex flex-wrap items-center gap-3 border-t border-line pt-8"
          >
            <Link
              href="/"
              className="rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20"
            >
              ← ask NEXUS anything
            </Link>
            <a
              href="https://github.com/saitejabatta/nexus-portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line px-4 py-2 font-mono text-xs text-text-muted transition-colors hover:border-cyan/50 hover:text-cyan"
            >
              read the source
            </a>
          </motion.div>
        </motion.div>
      </main>
    </>
  );
}

/* ── Figure 1: the request lifecycle ─────────────────────────────────────── */
function LifecycleDiagram() {
  const nodes: [string, number][] = [
    ["query", 110],
    ["embed", 204],
    ["search", 298],
    ["chunks", 392],
    ["rerank", 486],
    ["sources", 580],
    ["assemble", 674],
    ["generate", 768],
  ];
  return (
    <svg
      viewBox="0 0 880 470"
      className="block h-auto w-full min-w-[640px]"
      role="img"
      aria-label="The browser POSTs a query to a Next.js route handler over SSE; an eight-stage async-generator pipeline runs, dropping out at 'search' to call Gemini embeddings and Supabase pgvector, and at 'generate' to call Gemini 2.5 Flash; results stream back to the browser as they happen."
    >
      <defs>
        <marker id="ab-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-cyan)" />
        </marker>
        <marker id="ab-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-blue)" />
        </marker>
        <marker id="ab-p" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-purple)" />
        </marker>
      </defs>

      {/* Browser */}
      <rect x="345" y="14" width="190" height="52" rx="8" fill="var(--color-bg-panel)" stroke="var(--color-text)" strokeOpacity="0.55" />
      <text x="440" y="36" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="14" fill="var(--color-text)">Browser</text>
      <text x="440" y="53" textAnchor="middle" fontSize="10" fill="var(--color-text-muted)" fontFamily="var(--font-mono)">fetch() · reads the SSE stream</text>

      <line x1="405" y1="66" x2="405" y2="98" stroke="var(--color-cyan)" strokeWidth="1.6" markerEnd="url(#ab-a)" />
      <text x="286" y="85" fontSize="10.5" fill="var(--color-cyan)" fontFamily="var(--font-mono)">POST /api/chat</text>

      <line x1="478" y1="98" x2="478" y2="66" stroke="var(--color-blue)" strokeWidth="1.6" strokeDasharray="3 3" markerEnd="url(#ab-b)" />
      <text x="512" y="85" fontSize="10.5" fill="var(--color-blue)" fontFamily="var(--font-mono)">SSE: stage → token → done</text>

      {/* Route handler container */}
      <rect x="60" y="100" width="760" height="188" rx="10" fill="var(--color-bg-elevated)" stroke="var(--color-cyan)" strokeOpacity="0.28" strokeDasharray="4 4" />
      <text x="80" y="122" fontSize="10.5" letterSpacing="1.5" fill="var(--color-text-faint)" fontFamily="var(--font-mono)">NEXT.JS ROUTE HANDLER · /api/chat · VERCEL SERVERLESS</text>

      <line x1="110" y1="168" x2="768" y2="168" stroke="var(--color-text)" strokeOpacity="0.22" strokeWidth="1" />

      {nodes.map(([label, x]) => {
        const emph = label === "search" ? "var(--color-cyan)" : label === "generate" ? "var(--color-purple)" : null;
        return (
          <g key={label} fontFamily="var(--font-mono)">
            <circle
              cx={x}
              cy="168"
              r={emph ? 8.5 : 7}
              fill={emph ? (label === "search" ? "rgba(34,211,238,.14)" : "rgba(168,85,247,.14)") : "var(--color-bg-elevated)"}
              stroke={emph ?? "var(--color-text)"}
              strokeOpacity={emph ? 1 : 0.7}
              strokeWidth={emph ? 1.6 : 1}
            />
            <text x={x} y="188" textAnchor="middle" fontSize="9.5" fill={emph ?? "var(--color-text-muted)"}>{label}</text>
          </g>
        );
      })}

      <text x="80" y="222" fontSize="9.5" fill="var(--color-text-faint)" fontFamily="var(--font-mono)">async function* orchestrate(query) — each circle is one `yield`</text>

      {/* drops */}
      <line x1="298" y1="178" x2="298" y2="340" stroke="var(--color-cyan)" strokeWidth="1.4" markerStart="url(#ab-a)" markerEnd="url(#ab-a)" />
      <line x1="768" y1="178" x2="768" y2="340" stroke="var(--color-purple)" strokeWidth="1.4" markerStart="url(#ab-p)" markerEnd="url(#ab-p)" />

      {/* retrieval */}
      <rect x="150" y="340" width="168" height="46" rx="7" fill="var(--color-bg-panel)" stroke="var(--color-cyan)" strokeOpacity="0.55" />
      <text x="234" y="359" textAnchor="middle" fontSize="11" fill="var(--color-text)">Gemini API</text>
      <text x="234" y="374" textAnchor="middle" fontSize="9.5" fill="var(--color-text-muted)" fontFamily="var(--font-mono)">text-embedding-004</text>

      <line x1="318" y1="363" x2="335" y2="363" stroke="var(--color-cyan)" strokeWidth="1.4" markerEnd="url(#ab-a)" />

      <rect x="335" y="340" width="220" height="46" rx="7" fill="var(--color-bg-panel)" stroke="var(--color-cyan)" strokeOpacity="0.55" />
      <text x="445" y="359" textAnchor="middle" fontSize="11" fill="var(--color-text)">Supabase Postgres</text>
      <text x="445" y="374" textAnchor="middle" fontSize="9.5" fill="var(--color-text-muted)" fontFamily="var(--font-mono)">pgvector cosine search</text>

      <text x="152" y="404" fontSize="10" fill="var(--color-cyan)" fontFamily="var(--font-mono)">↑ top-8 chunks + similarity scores</text>

      {/* generation */}
      <rect x="650" y="340" width="190" height="46" rx="7" fill="var(--color-bg-panel)" stroke="var(--color-purple)" strokeOpacity="0.6" />
      <text x="745" y="359" textAnchor="middle" fontSize="11" fill="var(--color-text)">Gemini 2.5 Flash</text>
      <text x="745" y="374" textAnchor="middle" fontSize="9.5" fill="var(--color-text-muted)" fontFamily="var(--font-mono)">generateContentStream()</text>

      <text x="650" y="404" fontSize="10" fill="var(--color-purple)" fontFamily="var(--font-mono)">↑ tokens, streamed one at a time</text>

      <text x="60" y="440" fontSize="10" fill="var(--color-text-faint)" fontFamily="var(--font-mono)">the browser renders every event above as it arrives — nothing is precomputed or replayed</text>
    </svg>
  );
}

/* ── Figure 2: the RLS boundary ──────────────────────────────────────────── */
function RlsDiagram() {
  return (
    <svg
      viewBox="0 0 880 270"
      className="block h-auto w-full min-w-[640px]"
      role="img"
      aria-label="Comparison: a typical setup checks permissions in a route handler before writing to the database, which is only as safe as every route remembering the check; NEXUS instead lets Postgres evaluate a row-level security policy on every query, so the check can never be silently skipped."
    >
      <defs>
        <marker id="ab-m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-amber)" />
        </marker>
        <marker id="ab-c" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-cyan)" />
        </marker>
      </defs>

      {/* lane 1 */}
      <text x="40" y="26" fontSize="10.5" letterSpacing="1.2" fill="var(--color-amber)" fontFamily="var(--font-mono)">A COMMON PATTERN — NOT WHAT NEXUS DOES</text>

      <rect x="40" y="40" width="150" height="46" rx="7" fill="var(--color-bg-panel)" stroke="var(--color-text-muted)" />
      <text x="115" y="67" textAnchor="middle" fontSize="11" fill="var(--color-text)">Admin UI</text>

      <line x1="190" y1="63" x2="230" y2="63" stroke="var(--color-amber)" strokeWidth="1.4" strokeDasharray="3 3" markerEnd="url(#ab-m)" />

      <rect x="230" y="40" width="270" height="46" rx="7" fill="var(--color-bg-panel)" stroke="var(--color-amber)" strokeOpacity="0.6" strokeDasharray="3 3" />
      <text x="365" y="60" textAnchor="middle" fontSize="10.5" fill="var(--color-text)" fontFamily="var(--font-mono)">route handler:</text>
      <text x="365" y="75" textAnchor="middle" fontSize="10.5" fill="var(--color-text)" fontFamily="var(--font-mono)">if (!isAdmin) reject</text>

      <line x1="500" y1="63" x2="540" y2="63" stroke="var(--color-amber)" strokeWidth="1.4" strokeDasharray="3 3" markerEnd="url(#ab-m)" />

      <rect x="540" y="40" width="180" height="46" rx="7" fill="var(--color-bg-panel)" stroke="var(--color-text-muted)" />
      <text x="630" y="60" textAnchor="middle" fontSize="10.5" fill="var(--color-text)">Database</text>
      <text x="630" y="75" textAnchor="middle" fontSize="9.5" fill="var(--color-text-muted)" fontFamily="var(--font-mono)">trusts the app</text>

      <text x="230" y="104" fontSize="10" fill="var(--color-amber)" fontFamily="var(--font-mono)">⚠ only as safe as every route remembering this check</text>

      <line x1="40" y1="132" x2="840" y2="132" stroke="var(--color-line)" />

      {/* lane 2 */}
      <text x="40" y="156" fontSize="10.5" letterSpacing="1.2" fill="var(--color-cyan)" fontFamily="var(--font-mono)">WHAT NEXUS ACTUALLY DOES</text>

      <rect x="40" y="170" width="150" height="46" rx="7" fill="var(--color-bg-panel)" stroke="var(--color-text)" strokeOpacity="0.55" />
      <text x="115" y="190" textAnchor="middle" fontSize="11" fill="var(--color-text)">Admin UI</text>
      <text x="115" y="204" textAnchor="middle" fontSize="9" fill="var(--color-text-muted)" fontFamily="var(--font-mono)">signed in</text>

      <line x1="190" y1="193" x2="230" y2="193" stroke="var(--color-cyan)" strokeWidth="1.6" markerEnd="url(#ab-c)" />
      <text x="192" y="184" fontSize="9.5" fill="var(--color-cyan)" fontFamily="var(--font-mono)">supabase-js + JWT</text>

      <rect x="230" y="164" width="440" height="58" rx="9" fill="rgba(34,211,238,.05)" stroke="var(--color-cyan)" strokeWidth="1.4" />
      <text x="248" y="180" fontSize="10" fill="var(--color-text-muted)" fontFamily="var(--font-mono)">Supabase Postgres</text>
      <rect x="246" y="187" width="408" height="26" rx="5" fill="var(--color-bg-elevated)" stroke="var(--color-cyan)" strokeOpacity="0.6" />
      <text x="450" y="204" textAnchor="middle" fontSize="10" fill="var(--color-text)" fontFamily="var(--font-mono)">RLS policy: is_admin() reads the JWT — on every query</text>

      <line x1="670" y1="185" x2="710" y2="185" stroke="var(--color-cyan)" strokeWidth="1.4" markerEnd="url(#ab-c)" />
      <text x="712" y="182" fontSize="10" fill="var(--color-cyan)" fontFamily="var(--font-mono)">✓ write allowed</text>
      <line x1="670" y1="205" x2="710" y2="205" stroke="var(--color-text-muted)" strokeWidth="1.2" markerEnd="url(#ab-c)" />
      <text x="712" y="209" fontSize="10" fill="var(--color-text-muted)" fontFamily="var(--font-mono)">✗ rejected, unconditionally</text>
    </svg>
  );
}
