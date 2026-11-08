-- =====================================================================
-- Sustainability Week 2026 — digital QR tickets
--
-- Run this once in the Supabase dashboard → SQL Editor → New query.
-- It is safe to run again (every statement is idempotent).
--
-- What it does
--   1. Gives every registration (existing and new) a secret ticket_code.
--   2. Adds a check-ins table: one row per ticket per event day.
--   3. Adds three functions the website calls:
--        get_ticket(code)          public  — show a ticket by its code
--        find_tickets(email, name) public  — "Find my ticket"
--        check_in(code)            staff   — scan at the door
--
-- The ticket_code is a random UUID, so knowing it is what proves you
-- hold the ticket. Anonymous visitors still cannot read the
-- registrations table directly.
-- =====================================================================

-- 1. Ticket code on every registration --------------------------------
alter table public.registrations
  add column if not exists ticket_code uuid not null default gen_random_uuid();

create unique index if not exists registrations_ticket_code_key
  on public.registrations (ticket_code);

-- 2. Check-ins ---------------------------------------------------------
create table if not exists public.checkins (
  id            bigint generated always as identity primary key,
  ticket_code   uuid not null references public.registrations (ticket_code) on delete cascade,
  event_day     date not null,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid default auth.uid(),
  unique (ticket_code, event_day)
);

alter table public.checkins enable row level security;

drop policy if exists "Staff can read check-ins" on public.checkins;
create policy "Staff can read check-ins"
  on public.checkins for select
  to authenticated
  using (true);

-- 3a. Show one ticket --------------------------------------------------
create or replace function public.get_ticket(p_code uuid)
returns table (
  ticket_code uuid,
  full_name   text,
  type        text,
  created_at  timestamptz,
  checked_in_days date[]
)
language sql
stable
security definer
set search_path = public
as $$
  select r.ticket_code,
         r.full_name,
         r.type,
         r.created_at,
         coalesce(
           (select array_agg(c.event_day order by c.event_day)
              from public.checkins c
             where c.ticket_code = r.ticket_code),
           '{}'
         )
    from public.registrations r
   where r.ticket_code = p_code;
$$;

-- 3b. Find my ticket (email + the name used on the form) --------------
create or replace function public.find_tickets(p_email text, p_name text)
returns table (ticket_code uuid, full_name text, type text)
language sql
stable
security definer
set search_path = public
as $$
  select r.ticket_code, r.full_name, r.type
    from public.registrations r
   where lower(trim(r.email)) = lower(trim(p_email))
     and lower(regexp_replace(trim(r.full_name), '\s+', ' ', 'g'))
       = lower(regexp_replace(trim(p_name), '\s+', ' ', 'g'))
   order by r.created_at;
$$;

-- 3c. Check in at the door (signed-in staff only) ---------------------
-- Returns status: 'ok' (checked in now), 'already' (already in today),
-- or 'invalid' (no such ticket). The day is the current date in Bahrain.
create or replace function public.check_in(p_code uuid)
returns table (
  status          text,
  full_name       text,
  type            text,
  event_day       date,
  checked_in_at   timestamptz,
  checked_in_days date[]
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_reg  public.registrations%rowtype;
  v_day   date := (now() at time zone 'Asia/Bahrain')::date;
  v_at    timestamptz;
  v_state text;
begin
  if auth.uid() is null then
    raise exception 'Staff sign-in required' using errcode = '42501';
  end if;

  select * into v_reg from public.registrations r where r.ticket_code = p_code;
  if not found then
    return query select 'invalid'::text, null::text, null::text, v_day, null::timestamptz, '{}'::date[];
    return;
  end if;

  insert into public.checkins (ticket_code, event_day)
  values (p_code, v_day)
  on conflict on constraint checkins_ticket_code_event_day_key do nothing
  returning checkins.checked_in_at into v_at;

  if v_at is null then
    v_state := 'already';
    select c.checked_in_at into v_at
      from public.checkins c
     where c.ticket_code = p_code and c.event_day = v_day;
  else
    v_state := 'ok';
  end if;

  return query
  select v_state, v_reg.full_name, v_reg.type, v_day, v_at,
         coalesce(
           (select array_agg(c.event_day order by c.event_day)
              from public.checkins c
             where c.ticket_code = p_code),
           '{}'
         );
end;
$$;

-- Permissions ----------------------------------------------------------
revoke all on function public.get_ticket(uuid)         from public;
revoke all on function public.find_tickets(text, text) from public;
revoke all on function public.check_in(uuid)           from public;

grant execute on function public.get_ticket(uuid)         to anon, authenticated;
grant execute on function public.find_tickets(text, text) to anon, authenticated;
grant execute on function public.check_in(uuid)           to authenticated;
