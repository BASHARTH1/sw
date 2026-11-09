-- =====================================================================
-- Sustainability Week 2026 — remember when each ticket was emailed
--
-- Run once in Supabase → SQL Editor. Safe to run again.
-- The admin page shows "Emailed <date>" and the button turns into "Resend".
-- =====================================================================

alter table public.registrations
  add column if not exists ticket_emailed_at timestamptz;

create or replace function public.mark_ticket_emailed(p_code uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if auth.uid() is null
     or coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'door-staff' then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.registrations
     set ticket_emailed_at = v_now
   where ticket_code = p_code;

  return v_now;
end;
$$;

revoke all on function public.mark_ticket_emailed(uuid) from public, anon;
grant execute on function public.mark_ticket_emailed(uuid) to authenticated;
