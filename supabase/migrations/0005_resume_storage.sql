-- ============================================================
-- NEXUS — résumé storage
-- A public bucket for the résumé PDF + a column on profile to track it.
-- ============================================================

alter table profile add column if not exists resume_url text;

insert into storage.buckets (id, name, public)
values ('resume', 'resume', true)
on conflict (id) do nothing;

-- Public read of the résumé; only admins can upload/replace/delete.
create policy "public read resume"
  on storage.objects for select
  using (bucket_id = 'resume');

create policy "admin write resume"
  on storage.objects for all
  using (bucket_id = 'resume' and is_admin())
  with check (bucket_id = 'resume' and is_admin());
