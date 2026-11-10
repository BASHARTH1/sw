-- =====================================================================
-- Sustainability Week 2026 — register someone from the admin page
--
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Lets a signed-in admin (not door staff) add a person with just a
-- name, organisation, registration type and an optional email.
-- They get a ticket at once.
-- =====================================================================

-- People added by an admin may have no email address.
alter table public.registrations alter column email drop not null;

-- (replaces the earlier 3-argument version, if it was installed)
drop function if exists public.admin_add_registration(text, text, text);

create or replace function public.admin_add_registration(p_name text, p_org text, p_type text, p_email text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code uuid := gen_random_uuid();
  v_name text := nullif(btrim(p_name), '');
  v_org  text := nullif(btrim(p_org), '');
  v_email text := nullif(lower(btrim(p_email)), '');
begin
  if auth.uid() is null
     or coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'door-staff' then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if v_name is null then
    raise exception 'Name is required' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Invalid email address' using errcode = '22023';
  end if;
  if p_type not in ('Keynote Speaker', 'Sponsor', 'Exhibitor', 'Participant', 'Guest', 'EcoBot Challenge') then
    raise exception 'Unknown registration type' using errcode = '22023';
  end if;

  insert into public.registrations (type, full_name, email, ticket_code, data)
  values (
    p_type,
    v_name,
    v_email,
    v_code,
    jsonb_strip_nulls(jsonb_build_object('fullName', v_name, 'organization', v_org, 'addedBy', 'Admin'))
  );

  return v_code;
end;
$$;

revoke all on function public.admin_add_registration(text, text, text, text) from public, anon;
grant execute on function public.admin_add_registration(text, text, text, text) to authenticated;
