"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SkillRow = {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  enabled: boolean;
  sort_order: number;
};

const EMPTY: Omit<SkillRow, "id"> = {
  name: "",
  category: "",
  proficiency: 3,
  enabled: true,
  sort_order: 0,
};

const inputCls =
  "w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none";

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<SkillRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Omit<SkillRow, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const refresh = async () => {
    if (!supabase) return;
    const { data } = await supabase.from("skills").select("*").order("sort_order");
    setSkills((data as SkillRow[]) ?? []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Supabase on mount
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (s?: SkillRow) => {
    setError(null);
    if (s) {
      setEditingId(s.id);
      setForm(s);
    } else {
      setEditingId("new");
      setForm({ ...EMPTY, sort_order: (skills?.length ?? 0) + 1 });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  };

  const save = async () => {
    if (!supabase || !form.name.trim() || !form.category.trim()) {
      setError("Name and category are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const query =
      editingId === "new"
        ? supabase.from("skills").insert(form)
        : supabase.from("skills").update(form).eq("id", editingId);
    const { error: err } = await query;
    setSaving(false);
    if (err) return setError(err.message);
    cancelEdit();
    refresh();
  };

  const remove = async (id: string) => {
    if (!supabase || !confirm("Delete this skill?")) return;
    await supabase.from("skills").delete().eq("id", id);
    refresh();
  };

  const toggleEnabled = async (s: SkillRow) => {
    if (!supabase) return;
    await supabase.from("skills").update({ enabled: !s.enabled }).eq("id", s.id);
    refresh();
  };

  const grouped = (skills ?? []).reduce<Record<string, SkillRow[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text">Skills</h1>
        {editingId === null && (
          <button
            onClick={() => startEdit()}
            className="flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs text-cyan hover:bg-cyan/20"
          >
            <Plus className="h-3.5 w-3.5" /> add skill
          </button>
        )}
      </div>

      {editingId !== null && (
        <div className="mb-6 rounded-xl border border-cyan/20 bg-bg-elevated/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-cyan">
              {editingId === "new" ? "new skill" : "edit skill"}
            </span>
            <button onClick={cancelEdit} className="text-text-faint hover:text-text">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-faint">Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-faint">Category</span>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="AI / RAG, Backend, Frontend, Infra…" />
            </label>
          </div>

          <label className="mt-2.5 block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-faint">Proficiency (1-5)</span>
            <input type="number" min={1} max={5} value={form.proficiency} onChange={(e) => setForm({ ...form, proficiency: Number(e.target.value) })} className={cn(inputCls, "w-24")} />
          </label>

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

      {skills === null ? (
        <p className="font-mono text-xs text-text-faint">loading…</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-faint">
                {category}
              </p>
              <div className="space-y-1.5">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-bg-elevated/50 px-3 py-2"
                  >
                    <button
                      onClick={() => toggleEnabled(s)}
                      className={cn("shrink-0", s.enabled ? "text-cyan" : "text-text-faint")}
                    >
                      {s.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <span className="min-w-0 flex-1 truncate text-sm text-text">{s.name}</span>
                    <span className="font-mono text-[10px] text-text-faint">{s.proficiency}/5</span>
                    <button onClick={() => startEdit(s)} className="text-text-faint hover:text-cyan">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(s.id)} className="text-text-faint hover:text-danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(skills?.length ?? 0) === 0 && (
            <p className="font-mono text-xs text-text-faint">No skills yet.</p>
          )}
        </div>
      )}
    </main>
  );
}
