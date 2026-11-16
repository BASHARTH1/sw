-- =====================================================================
-- Sustainability Week 2026 — EcoBot file uploads
--
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Creates a PRIVATE storage bucket "ecobot-files" for the proposal /
-- slides that EcoBot teams attach in step 3 of their registration.
-- Visitors can only upload (PDF, PowerPoint, Word; max 20 MB) and can
-- never list or download files. Only admins (not door staff) can open them.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ecobot-files',
  'ecobot-files',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.apple.keynote',
    'application/vnd.apple.pages'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload EcoBot files" on storage.objects;
create policy "Anyone can upload EcoBot files"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'ecobot-files');

drop policy if exists "Admins can read EcoBot files" on storage.objects;
create policy "Admins can read EcoBot files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ecobot-files'
    and coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'door-staff'
  );
