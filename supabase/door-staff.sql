-- =====================================================================
-- Door staff accounts: scanner only
--
-- Accounts whose app_metadata.role is 'door-staff' can sign in to /scan
-- and check tickets in, but cannot read the registrations table (so the
-- admin page shows them nothing). app_metadata can only be changed by
-- the project owner, never by the user themselves.
--
-- Run in Supabase → SQL Editor. Safe to run again.
-- =====================================================================

-- Mark the door accounts.
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"door-staff"}'::jsonb
 where email like 'door%@sw.gulfuniversity.edu.bh';

-- A RESTRICTIVE policy is ANDed with every existing SELECT policy,
-- so door staff are blocked whatever else allows staff to read.
drop policy if exists "Door staff cannot read registrations" on public.registrations;
create policy "Door staff cannot read registrations"
  on public.registrations
  as restrictive
  for select
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'door-staff');
