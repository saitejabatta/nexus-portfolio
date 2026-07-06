-- ============================================================
-- NEXUS — Row Level Security
-- Public content is world-readable (enabled rows only). All writes
-- require an authenticated admin. The knowledge base + analytics are
-- server-only (service role bypasses RLS).
-- ============================================================

-- Helper: is the current user the admin?
-- Set the admin uid via: alter database ... ; or compare to a claim.
create or replace function is_admin()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() ->> 'role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ── enable RLS ──────────────────────────────────────────────
alter table profile        enable row level security;
alter table projects       enable row level security;
alter table skills         enable row level security;
alter table experience     enable row level security;
alter table achievements   enable row level security;
alter table certificates   enable row level security;
alter table repos          enable row level security;
alter table documents      enable row level security;
alter table chunks         enable row level security;
alter table conversations  enable row level security;
alter table messages       enable row level security;
alter table events         enable row level security;

-- ── public read (enabled rows) ──────────────────────────────
create policy "public read profile"      on profile      for select using (true);
create policy "public read projects"     on projects     for select using (enabled);
create policy "public read skills"       on skills       for select using (enabled);
create policy "public read experience"   on experience   for select using (true);
create policy "public read achievements" on achievements for select using (true);
create policy "public read certificates" on certificates for select using (true);
create policy "public read repos"        on repos        for select using (enabled);

-- ── admin write (all content tables) ────────────────────────
create policy "admin write profile"      on profile      for all using (is_admin()) with check (is_admin());
create policy "admin write projects"     on projects     for all using (is_admin()) with check (is_admin());
create policy "admin write skills"       on skills       for all using (is_admin()) with check (is_admin());
create policy "admin write experience"   on experience   for all using (is_admin()) with check (is_admin());
create policy "admin write achievements" on achievements for all using (is_admin()) with check (is_admin());
create policy "admin write certificates" on certificates for all using (is_admin()) with check (is_admin());
create policy "admin write repos"        on repos        for all using (is_admin()) with check (is_admin());

-- ── knowledge base & analytics: server-only ─────────────────
-- No public policies → only the service role (which bypasses RLS) can touch
-- documents, chunks, conversations, messages, events.
