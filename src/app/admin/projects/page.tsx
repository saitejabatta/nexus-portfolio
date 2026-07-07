"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description_md: string | null;
  live_url: string | null;
  repo_url: string | null;
  tech_stack: string[] | null;
  category: string;
  status: string;
  complexity: number;
  challenges_md: string | null;
  learnings_md: string | null;
  enabled: boolean;
  sort_order: number;
};

const CATEGORIES = ["ai", "web", "data", "tooling"] as const;
const STATUSES = ["production", "wip", "hackathon", "archived"] as const;

const EMPTY: Omit<ProjectRow, "id"> = {
  slug: "",
  title: "",
  summary: "",
  description_md: "",
  live_url: "",
  repo_url: "",
  tech_stack: [],
  category: "ai",
  status: "wip",
  complexity: 3,
  challenges_md: "",
  learnings_md: "",
  enabled: true,
  sort_order: 0,
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Omit<ProjectRow, "id">>(EMPTY);
  const [techInput, setTechInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const refresh = async () => {
    if (!supabase) return;
    const { data } = await supabase.from("projects").select("*").order("sort_order");
    setProjects((data as ProjectRow[]) ?? []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Supabase on mount
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (p?: ProjectRow) => {
    setError(null);
    if (p) {
      setEditingId(p.id);
      setForm(p);
      setTechInput((p.tech_stack ?? []).join(", "));
    } else {
      setEditingId("new");
      setForm({ ...EMPTY, sort_order: (projects?.length ?? 0) + 1 });
      setTechInput("");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setTechInput("");
    setError(null);
  };

  const save = async () => {
    if (!supabase || !form.slug.trim() || !form.title.trim()) {
      setError("Slug and title are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      tech_stack: techInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const query =
      editingId === "new"
        ? supabase.from("projects").insert(payload)
        : supabase.from("projects").update(payload).eq("id", editingId);
    const { error: err } = await query;
    setSaving(false);
    if (err) return setError(err.message);
    cancelEdit();
    refresh();
  };

  const remove = async (id: string) => {
    if (!supabase || !confirm("Delete this project? This can't be undone.")) return;
    await supabase.from("projects").delete().eq("id", id);
    refresh();
  };

  const toggleEnabled = async (p: ProjectRow) => {
    if (!supabase) return;
    await supabase.from("projects").update({ enabled: !p.enabled }).eq("id", p.id);
    refresh();
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text">Projects</h1>
        {editingId === null && (
          <button
            onClick={() => startEdit()}
            className="flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs text-cyan hover:bg-cyan/20"
          >
            <Plus className="h-3.5 w-3.5" /> add project
          </button>
        )}
      </div>

      {editingId !== null && (
        <div className="mb-6 rounded-xl border border-cyan/20 bg-bg-elevated/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-cyan">
              {editingId === "new" ? "new project" : "edit project"}
            </span>
            <button onClick={cancelEdit} className="text-text-faint hover:text-text">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Slug">
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </Field>
          </div>

          <Field label="Summary" className="mt-2.5">
            <textarea rows={2} value={form.summary ?? ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={cn(inputCls, "resize-none")} />
          </Field>

          <Field label="Description (markdown)" className="mt-2.5">
            <textarea rows={3} value={form.description_md ?? ""} onChange={(e) => setForm({ ...form, description_md: e.target.value })} className={cn(inputCls, "resize-none")} />
          </Field>

          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            <Field label="Live URL">
              <input value={form.live_url ?? ""} onChange={(e) => setForm({ ...form, live_url: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Repo URL">
              <input value={form.repo_url ?? ""} onChange={(e) => setForm({ ...form, repo_url: e.target.value })} className={inputCls} />
            </Field>
          </div>

          <Field label="Tech stack (comma-separated)" className="mt-2.5">
            <input value={techInput} onChange={(e) => setTechInput(e.target.value)} className={inputCls} placeholder="Next.js, TypeScript, Supabase" />
          </Field>

          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Complexity (1-5)">
              <input type="number" min={1} max={5} value={form.complexity} onChange={(e) => setForm({ ...form, complexity: Number(e.target.value) })} className={inputCls} />
            </Field>
          </div>

          <Field label="Challenges (markdown)" className="mt-2.5">
            <textarea rows={2} value={form.challenges_md ?? ""} onChange={(e) => setForm({ ...form, challenges_md: e.target.value })} className={cn(inputCls, "resize-none")} />
          </Field>
          <Field label="What I learned (markdown)" className="mt-2.5">
            <textarea rows={2} value={form.learnings_md ?? ""} onChange={(e) => setForm({ ...form, learnings_md: e.target.value })} className={cn(inputCls, "resize-none")} />
          </Field>

          <label className="mt-3 flex items-center gap-2 font-mono text-xs text-text-muted">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            visible on the live site
          </label>

          {error && <p className="mt-2 font-mono text-[11px] text-danger">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="mt-4 flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs text-cyan hover:bg-cyan/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "saving…" : "save"}
          </button>
        </div>
      )}

      {projects === null ? (
        <p className="font-mono text-xs text-text-faint">loading…</p>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-bg-elevated/50 px-4 py-3"
            >
              <button
                onClick={() => toggleEnabled(p)}
                title={p.enabled ? "Visible — click to hide" : "Hidden — click to show"}
                className={cn("shrink-0", p.enabled ? "text-cyan" : "text-text-faint")}
              >
                {p.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-text">{p.title}</div>
                <div className="font-mono text-[10px] text-text-faint">
                  {p.slug} · {p.category} · {p.status}
                </div>
              </div>
              <button onClick={() => startEdit(p)} className="text-text-faint hover:text-cyan">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(p.id)} className="text-text-faint hover:text-danger">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="font-mono text-xs text-text-faint">No projects yet.</p>
          )}
        </div>
      )}
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
