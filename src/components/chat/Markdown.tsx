"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Check, Copy } from "lucide-react";

/** Custom TRON-flavored Prism theme (dark, cyan/purple accents). */
const tronTheme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': { color: "#e5f2ff", background: "none" },
  'pre[class*="language-"]': { color: "#e5f2ff", background: "none", margin: 0 },
  comment: { color: "#46566e", fontStyle: "italic" },
  punctuation: { color: "#7e93ae" },
  keyword: { color: "#a855f7" },
  string: { color: "#22d3ee" },
  function: { color: "#3b82f6" },
  number: { color: "#f59e0b" },
  operator: { color: "#7e93ae" },
  "class-name": { color: "#22d3ee" },
  builtin: { color: "#3b82f6" },
  boolean: { color: "#f59e0b" },
};

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-line bg-black/40">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 font-mono text-[10px] text-text-muted transition-colors hover:text-cyan"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={tronTheme}
        customStyle={{
          background: "transparent",
          padding: "12px 14px",
          fontSize: "12.5px",
          lineHeight: 1.6,
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-text/90 [&_a]:text-cyan [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-cyan/50 [&_blockquote]:pl-3 [&_blockquote]:text-text-muted [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-text [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <CodeBlock
                  language={match?.[1] ?? ""}
                  value={String(children).replace(/\n$/, "")}
                />
              );
            }
            return (
              <code
                className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
