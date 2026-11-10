-- =====================================================================
-- Sustainability Week 2026 — record "I'm attending" posts
--
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Every time someone downloads or shares their post on /attending,
-- the site saves their name, organisation and the time. Photos are
-- never uploaded. Visitors can only add rows; only admins can read them.
-- =====================================================================

create table if not exists public.attending_posts (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name) between 1 and 80),
  organization text check (char_length(organization) <= 120),
  action       text not null check (action in ('download', 'share')),
  device_id    uuid
);

create index if not exists attending_posts_created_at_idx on public.attending_posts (created_at desc);

alter table public.attending_posts enable row level security;

drop policy if exists "Anyone can record a post" on public.attending_posts;
create policy "Anyone can record a post"
  on public.attending_posts for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read posts" on public.attending_posts;
create policy "Admins can read posts"
  on public.attending_posts for select
  to authenticated
  using (coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'door-staff');

grant insert on public.attending_posts to anon, authenticated;
grant select on public.attending_posts to authenticated;
