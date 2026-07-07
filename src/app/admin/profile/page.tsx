"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileUp, Loader2, Save } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProfileRow = {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  socials: { github?: string; linkedin?: string; email?: string; website?: string; cal?: string } | null;
  system_prompt: string | null;
  resume_url: string | null;
};

const inputCls =
  "w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("profile")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setProfile(data as ProfileRow));
  }, [supabase]);

  const save = async () => {
    if (!supabase || !profile) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("profile")
      .update({
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        socials: profile.socials,
        system_prompt: profile.system_prompt,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (err) return setError(err.message);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadResume = async (file: File) => {
    if (!supabase || !profile) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setUploading(true);
    setError(null);
    const path = `resume-${Date.now()}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("resume")
      .upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (uploadErr) {
      setUploading(false);
      return setError(uploadErr.message);
    }
    const { data: pub } = supabase.storage.from("resume").getPublicUrl(path);
    const { error: updateErr } = await supabase
      .from("profile")
      .update({ resume_url: pub.publicUrl })
      .eq("id", profile.id);
    setUploading(false);
    if (updateErr) return setError(updateErr.message);
    setProfile({ ...profile, resume_url: pub.publicUrl });
  };

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="font-mono text-xs text-text-faint">loading…</p>
      </main>
    );
  }

  const socials = profile.socials ?? {};

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">
        Profile &amp; résumé
      </h1>

      <section className="mb-6 rounded-xl border border-cyan/20 bg-bg-elevated/70 p-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-cyan">
          résumé
        </p>
        {profile.resume_url && (
          <a
            href={profile.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-2 font-mono text-xs text-cyan hover:underline"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> current résumé (view)
          </a>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20 w-fit">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
          {uploading ? "uploading…" : profile.resume_url ? "replace PDF" : "upload PDF"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadResume(file);
            }}
          />
        </label>
      </section>

      <div className="space-y-2.5">
        <Field label="Name">
          <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Headline">
          <input value={profile.headline ?? ""} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Bio">
          <textarea rows={3} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className={cn(inputCls, "resize-none")} />
        </Field>
        <Field label="Location">
          <input value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className={inputCls} />
        </Field>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Field label="GitHub">
            <input value={socials.github ?? ""} onChange={(e) => setProfile({ ...profile, socials: { ...socials, github: e.target.value } })} className={inputCls} />
          </Field>
          <Field label="LinkedIn">
            <input value={socials.linkedin ?? ""} onChange={(e) => setProfile({ ...profile, socials: { ...socials, linkedin: e.target.value } })} className={inputCls} />
          </Field>
          <Field label="Email">
            <input value={socials.email ?? ""} onChange={(e) => setProfile({ ...profile, socials: { ...socials, email: e.target.value } })} className={inputCls} />
          </Field>
          <Field label="Cal.com booking link">
            <input value={socials.cal ?? ""} onChange={(e) => setProfile({ ...profile, socials: { ...socials, cal: e.target.value } })} className={inputCls} placeholder="https://cal.com/yourname" />
          </Field>
        </div>

        <Field label="AI system prompt">
          <textarea rows={4} value={profile.system_prompt ?? ""} onChange={(e) => setProfile({ ...profile, system_prompt: e.target.value })} className={cn(inputCls, "resize-none")} />
        </Field>
      </div>

      {error && <p className="mt-3 font-mono text-[11px] text-danger">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs text-cyan hover:bg-cyan/20 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
        {saving ? "saving…" : saved ? "saved" : "save changes"}
      </button>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
