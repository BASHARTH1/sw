-- =====================================================================
-- Undo a check-in (e.g. someone was checked in by mistake)
--
-- undo_check_in(code, day): removes that ticket's check-in for that day
-- (default: today in Bahrain). Signed-in staff only; door staff may only
-- undo today's check-ins. Returns the ticket's remaining check-in days.
--
-- Run in Supabase → SQL Editor. Safe to run again.
-- =====================================================================

create or replace function public.undo_check_in(p_code uuid, p_day date default null)
returns date[]
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_today date := (now() at time zone 'Asia/Bahrain')::date;
  v_day   date := coalesce(p_day, v_today);
begin
  if auth.uid() is null then
    raise exception 'Staff sign-in required' using errcode = '42501';
  end if;

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'door-staff' and v_day <> v_today then
    raise exception 'Door staff can only undo today''s check-ins' using errcode = '42501';
  end if;

  delete from public.checkins c
   where c.ticket_code = p_code
     and c.event_day = v_day;

  return coalesce(
    (select array_agg(c.event_day order by c.event_day)
       from public.checkins c
      where c.ticket_code = p_code),
    '{}'
  );
end;
$$;

revoke all on function public.undo_check_in(uuid, date) from public;
grant execute on function public.undo_check_in(uuid, date) to authenticated;
