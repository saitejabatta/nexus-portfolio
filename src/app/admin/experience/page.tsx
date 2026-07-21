"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ExperienceRow = {
  id: string;
  org: string;
  role: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  summary_md: string | null;
  highlights: string[] | null;
  sort_order: number;
};

const TYPES = ["job", "internship", "research"] as const;

const EMPTY: Omit<ExperienceRow, "id"> = {
  org: "",
  role: "",
  type: "job",
  start_date: null,
  end_date: null,
  summary_md: "",
  highlights: [],
  sort_order: 0,
};

const inputCls =
  "w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none";

export default function AdminExperiencePage() {
  const [rows, setRows] = useState<ExperienceRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Omit<ExperienceRow, "id">>(EMPTY);
  const [highlightsInput, setHighlightsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const refresh = async () => {
    if (!supabase) return;
    const { data } = await supabase.from("experience").select("*").order("sort_order");
    setRows((data as ExperienceRow[]) ?? []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Supabase on mount
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (r?: ExperienceRow) => {
    setError(null);
    if (r) {
      setEditingId(r.id);
      setForm(r);
      setHighlightsInput((r.highlights ?? []).join("\n"));
    } else {
      setEditingId("new");
      setForm({ ...EMPTY, sort_order: (rows?.length ?? 0) + 1 });
      setHighlightsInput("");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setHighlightsInput("");
    setError(null);
  };

  const save = async () => {
    if (!supabase || !form.org.trim() || !form.role.trim()) {
      setError("Organization and role are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      highlights: highlightsInput
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
    };
    const query =
      editingId === "new"
        ? supabase.from("experience").insert(payload)
        : supabase.from("experience").update(payload).eq("id", editingId);
    const { error: err } = await query;
    setSaving(false);
    if (err) return setError(err.message);
    cancelEdit();
    refresh();
  };

  const remove = async (id: string) => {
    if (!supabase || !confirm("Delete this experience entry?")) return;
    await supabase.from("experience").delete().eq("id", id);
    refresh();
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text">Experience</h1>
        {editingId === null && (
          <button
            onClick={() => startEdit()}
            className="flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs text-cyan hover:bg-cyan/20"
          >
            <Plus className="h-3.5 w-3.5" /> add entry
          </button>
        )}
      </div>

      {editingId !== null && (
        <div className="mb-6 rounded-xl border border-cyan/20 bg-bg-elevated/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-cyan">
              {editingId === "new" ? "new entry" : "edit entry"}
            </span>
            <button onClick={cancelEdit} className="text-text-faint hover:text-text">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Organization">
              <input value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Role">
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} />
            </Field>
          </div>

          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Start date">
              <input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value || null })} className={inputCls} />
            </Field>
            <Field label="End date (blank = ongoing)">
              <input type="date" value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value || null })} className={inputCls} />
            </Field>
          </div>

          <Field label="Summary (markdown)" className="mt-2.5">
            <textarea rows={3} value={form.summary_md ?? ""} onChange={(e) => setForm({ ...form, summary_md: e.target.value })} className={cn(inputCls, "resize-none")} />
          </Field>

          <Field label="Highlights (one per line)" className="mt-2.5">
            <textarea rows={3} value={highlightsInput} onChange={(e) => setHighlightsInput(e.target.value)} className={cn(inputCls, "resize-none")} />
          </Field>

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

      {rows === null ? (
        <p className="font-mono text-xs text-text-faint">loading…</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-bg-elevated/50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-text">
                  {r.role} · {r.org}
                </div>
                <div className="font-mono text-[10px] text-text-faint">
                  {r.type} · {[r.start_date, r.end_date].filter(Boolean).join(" → ") || "ongoing"}
                </div>
              </div>
              <button onClick={() => startEdit(r)} className="text-text-faint hover:text-cyan">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(r.id)} className="text-text-faint hover:text-danger">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="font-mono text-xs text-text-faint">No experience entries yet.</p>
          )}
        </div>
      )}
    </main>
  );
}

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
