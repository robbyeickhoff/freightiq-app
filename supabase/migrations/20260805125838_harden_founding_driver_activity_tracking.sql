create index founding_driver_activity_events_enrollment_id_idx
  on public.founding_driver_activity_events (enrollment_id);

create index founding_driver_activity_events_stop_id_idx
  on public.founding_driver_activity_events (stop_id);

create or replace function private.prepare_founding_driver_activity_event()
returns trigger
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
    return new;
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
    return null;
  end if;

  v_activity_date := (v_now at time zone v_enrollment.time_zone)::date;

  if v_activity_date < v_enrollment.start_date
     or v_activity_date > v_enrollment.end_date then
    return null;
  end if;

  new.id := gen_random_uuid();
  new.enrollment_id := v_enrollment.id;
  new.user_id := v_user_id;
  new.occurred_at := v_now;
  new.activity_date := v_activity_date;
  new.created_at := v_now;
  return new;
end;
$$;

revoke all on function private.prepare_founding_driver_activity_event() from public, anon, authenticated;

create trigger prepare_founding_driver_activity_event
before insert on public.founding_driver_activity_events
for each row execute function private.prepare_founding_driver_activity_event();

create policy founding_driver_activity_events_insert_own_active
on public.founding_driver_activity_events for insert to authenticated
with check (
  ((select auth.uid()) is not null)
  and ((select auth.uid()) = user_id)
  and exists (
    select 1
    from public.founding_driver_enrollments e
    where e.id = enrollment_id
      and e.user_id = (select auth.uid())
      and e.status = 'active'
      and activity_date between e.start_date and e.end_date
  )
);

grant insert (stop_id, event_type)
on public.founding_driver_activity_events to authenticated;

create or replace function public.record_founding_driver_activity(
  p_event_type text,
  p_stop_id text
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_event_type not in ('stop_intel_viewed','navigation_started','intel_contributed') then
    raise exception 'Unsupported activity event';
  end if;

  if p_stop_id is null or btrim(p_stop_id) = '' then
    raise exception 'Stop ID is required';
  end if;

  insert into public.founding_driver_activity_events (stop_id, event_type)
  values (p_stop_id, p_event_type)
  on conflict (user_id, stop_id, event_type, activity_date) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted > 0;
end;
$$;

revoke all on function public.record_founding_driver_activity(text,text) from public, anon;
grant execute on function public.record_founding_driver_activity(text,text) to authenticated, service_role;
