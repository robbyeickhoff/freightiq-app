create table public.founding_driver_activity_events (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.founding_driver_enrollments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stop_id text not null references public.mfi_stops(id) on delete cascade,
  event_type text not null check (event_type in ('stop_intel_viewed','navigation_started','intel_contributed')),
  occurred_at timestamptz not null default now(),
  activity_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, stop_id, event_type, activity_date)
);

alter table public.founding_driver_activity_events enable row level security;
revoke all on table public.founding_driver_activity_events from public, anon, authenticated;
grant select on table public.founding_driver_activity_events to authenticated;
grant all on table public.founding_driver_activity_events to service_role;

create policy founding_driver_activity_events_select_own_or_admin
on public.founding_driver_activity_events for select to authenticated
using (
  (((select auth.uid()) is not null) and ((select auth.uid()) = user_id))
  or (select private.is_founding_driver_admin())
);

create or replace function public.record_founding_driver_activity(
  p_event_type text,
  p_stop_id text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_enrollment public.founding_driver_enrollments%rowtype;
  v_now timestamptz := clock_timestamp();
  v_activity_date date;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_event_type not in ('stop_intel_viewed','navigation_started','intel_contributed') then
    raise exception 'Unsupported activity event';
  end if;

  if p_stop_id is null or btrim(p_stop_id) = '' then
    raise exception 'Stop ID is required';
  end if;

  select *
  into v_enrollment
  from public.founding_driver_enrollments
  where user_id = v_user_id
    and status = 'active'
    and start_date is not null
    and end_date is not null
  limit 1;

  if not found then
    return false;
  end if;

  v_activity_date := (v_now at time zone v_enrollment.time_zone)::date;

  if v_activity_date < v_enrollment.start_date
     or v_activity_date > v_enrollment.end_date then
    return false;
  end if;

  insert into public.founding_driver_activity_events (
    enrollment_id, user_id, stop_id, event_type, occurred_at, activity_date
  )
  values (
    v_enrollment.id, v_user_id, p_stop_id, p_event_type, v_now, v_activity_date
  )
  on conflict (user_id, stop_id, event_type, activity_date) do nothing;

  return true;
end;
$$;

revoke all on function public.record_founding_driver_activity(text,text) from public, anon;
grant execute on function public.record_founding_driver_activity(text,text) to authenticated, service_role;

create view public.founding_driver_active_day_totals
with (security_invoker = true)
as
select user_id, count(distinct activity_date)::integer as active_days
from public.founding_driver_activity_events
group by user_id;

revoke all on table public.founding_driver_active_day_totals from public, anon;
grant select on table public.founding_driver_active_day_totals to authenticated, service_role;
