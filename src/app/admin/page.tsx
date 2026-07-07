"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Folder, Sparkles, User } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const CARDS = [
  { href: "/admin/projects", label: "Projects", icon: Folder, desc: "Add, edit, delete, and toggle visibility" },
  { href: "/admin/skills", label: "Skills", icon: Sparkles, desc: "Manage your skill graph and categories" },
  { href: "/admin/profile", label: "Profile & résumé", icon: User, desc: "Bio, socials, system prompt, résumé PDF" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, desc: "Visitor engagement and top questions" },
] as const;

export default function AdminDashboard() {
  const [counts, setCounts] = useState<{ projects: number; skills: number } | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("skills").select("id", { count: "exact", head: true }),
    ]).then(([p, s]) => {
      setCounts({ projects: p.count ?? 0, skills: s.count ?? 0 });
    });
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-text">Dashboard</h1>
      <p className="mt-1 font-mono text-[11px] text-text-faint">
        {counts
          ? `${counts.projects} projects · ${counts.skills} skills — live on battasaiteja.dev`
          : "loading…"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-line bg-bg-elevated/70 p-5 transition-colors hover:border-cyan/40"
          >
            <c.icon className="h-5 w-5 text-cyan" />
            <div className="mt-3 font-display text-sm font-semibold text-text group-hover:text-cyan">
              {c.label}
            </div>
            <p className="mt-1 text-xs text-text-muted">{c.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
