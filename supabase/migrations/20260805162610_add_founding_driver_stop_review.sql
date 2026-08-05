create table public.founding_driver_stop_contributions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.founding_driver_enrollments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stop_id text not null references public.mfi_stops(id) on delete cascade,
  source_report_id uuid references public.mfi_reports(id) on delete set null,
  contribution_type text not null
    check (contribution_type in ('new_stop', 'completed_existing_stop')),
  completed_fields text[] not null,
  core_snapshot jsonb not null,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'counts', 'needs_clarification', 'does_not_count')),
  review_note text
    check (review_note is null or char_length(review_note) <= 500),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founding_driver_stop_contributions_fields_check
    check (
      cardinality(completed_fields) > 0
      and completed_fields <@ array['truck_fit', 'delivery_type', 'back_in', 'delivery_zone']::text[]
    ),
  constraint founding_driver_stop_contributions_snapshot_check
    check (jsonb_typeof(core_snapshot) = 'object'),
  constraint founding_driver_stop_contributions_review_check
    check (
      (review_status = 'pending' and reviewed_at is null and reviewed_by is null)
      or (review_status <> 'pending' and reviewed_at is not null and reviewed_by is not null)
    ),
  unique (user_id, stop_id)
);

comment on table public.founding_driver_stop_contributions is
  'One reviewable Founding Driver qualifying-stop candidate per driver and stop.';

alter table public.founding_driver_stop_contributions enable row level security;

revoke all privileges
  on table public.founding_driver_stop_contributions
  from public, anon, authenticated;

grant select
  on table public.founding_driver_stop_contributions
  to authenticated;

grant update (review_status, review_note)
  on table public.founding_driver_stop_contributions
  to authenticated;

grant all privileges
  on table public.founding_driver_stop_contributions
  to service_role;

create index founding_driver_stop_contributions_enrollment_id_idx
  on public.founding_driver_stop_contributions (enrollment_id);

create index founding_driver_stop_contributions_stop_id_idx
  on public.founding_driver_stop_contributions (stop_id);

create index founding_driver_stop_contributions_source_report_id_idx
  on public.founding_driver_stop_contributions (source_report_id);

create index founding_driver_stop_contributions_reviewed_by_idx
  on public.founding_driver_stop_contributions (reviewed_by);

create index founding_driver_stop_contributions_pending_review_idx
  on public.founding_driver_stop_contributions (submitted_at)
  where review_status in ('pending', 'needs_clarification');

create policy founding_driver_stop_contributions_select_own_or_admin
  on public.founding_driver_stop_contributions
  for select
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and (select auth.uid()) = user_id
    )
    or (select private.is_founding_driver_admin())
  );

create policy founding_driver_stop_contributions_admin_update
  on public.founding_driver_stop_contributions
  for update
  to authenticated
  using ((select private.is_founding_driver_admin()))
  with check ((select private.is_founding_driver_admin()));

create or replace function private.founding_driver_core_snapshot(p_stop_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'truck_fit', (
      select r.truck_fit
      from public.mfi_reports r
      where r.stop_id = s.id and r.truck_fit is not null
      order by r.updated_at desc, r.id desc
      limit 1
    ),
    'delivery_type', (
      select r.delivery_type
      from public.mfi_reports r
      where r.stop_id = s.id and r.delivery_type is not null
      order by r.updated_at desc, r.id desc
      limit 1
    ),
    'back_in_required', (
      select r.back_in_required
      from public.mfi_reports r
      where r.stop_id = s.id and r.back_in_required is not null
      order by r.updated_at desc, r.id desc
      limit 1
    ),
    'delivery_zone', case
      when s.entrance_lat is not null and s.entrance_lng is not null
        then jsonb_build_object('lat', s.entrance_lat, 'lng', s.entrance_lng)
      else null
    end
  )
  from public.mfi_stops s
  where s.id = p_stop_id;
$$;

revoke all on function private.founding_driver_core_snapshot(text)
  from public, anon, authenticated;

create or replace function private.refresh_founding_driver_stop_candidate(
  p_stop_id text,
  p_actor_user_id uuid,
  p_source_report_id uuid,
  p_completed_fields text[],
  p_is_correction boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enrollment public.founding_driver_enrollments%rowtype;
  v_snapshot jsonb;
  v_existing public.founding_driver_stop_contributions%rowtype;
  v_now timestamptz := clock_timestamp();
  v_activity_date date;
  v_contribution_type text;
begin
  if p_actor_user_id is null or p_stop_id is null or btrim(p_stop_id) = '' then
    return;
  end if;

  select *
  into v_enrollment
  from public.founding_driver_enrollments
  where user_id = p_actor_user_id
    and status = 'active'
    and start_date is not null
    and end_date is not null
  limit 1;

  if not found then
    return;
  end if;

  v_activity_date := (v_now at time zone v_enrollment.time_zone)::date;
  if v_activity_date < v_enrollment.start_date
     or v_activity_date > v_enrollment.end_date then
    return;
  end if;

  v_snapshot := private.founding_driver_core_snapshot(p_stop_id);
  if v_snapshot is null
     or v_snapshot ->> 'truck_fit' is null
     or v_snapshot ->> 'delivery_type' is null
     or v_snapshot ->> 'back_in_required' is null
     or v_snapshot -> 'delivery_zone' = 'null'::jsonb then
    return;
  end if;

  select *
  into v_existing
  from public.founding_driver_stop_contributions
  where user_id = p_actor_user_id
    and stop_id = p_stop_id;

  if found then
    if v_existing.review_status = 'needs_clarification' and coalesce(p_is_correction, false) then
      update public.founding_driver_stop_contributions
      set review_status = 'pending',
          reviewed_at = null,
          reviewed_by = null,
          source_report_id = coalesce(p_source_report_id, source_report_id),
          core_snapshot = v_snapshot,
          updated_at = v_now
      where id = v_existing.id;
    end if;
    return;
  end if;

  if p_completed_fields is null or cardinality(p_completed_fields) = 0 then
    return;
  end if;

  select case
    when s.user_id = p_actor_user_id then 'new_stop'
    else 'completed_existing_stop'
  end
  into v_contribution_type
  from public.mfi_stops s
  where s.id = p_stop_id;

  insert into public.founding_driver_stop_contributions (
    enrollment_id,
    user_id,
    stop_id,
    source_report_id,
    contribution_type,
    completed_fields,
    core_snapshot,
    submitted_at,
    created_at,
    updated_at
  )
  values (
    v_enrollment.id,
    p_actor_user_id,
    p_stop_id,
    p_source_report_id,
    v_contribution_type,
    p_completed_fields,
    v_snapshot,
    v_now,
    v_now,
    v_now
  )
  on conflict (user_id, stop_id) do nothing;
end;
$$;

revoke all on function private.refresh_founding_driver_stop_candidate(text,uuid,uuid,text[],boolean)
  from public, anon, authenticated;

create or replace function private.capture_founding_driver_report_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_completed_fields text[] := array[]::text[];
  v_is_correction boolean;
begin
  if v_actor is null or v_actor <> new.user_id then
    return new;
  end if;

  if new.truck_fit is not null
     and (tg_op = 'INSERT' or old.truck_fit is null)
     and not exists (
       select 1 from public.mfi_reports r
       where r.stop_id = new.stop_id
         and r.id <> new.id
         and r.truck_fit is not null
     ) then
    v_completed_fields := array_append(v_completed_fields, 'truck_fit');
  end if;

  if new.delivery_type is not null
     and (tg_op = 'INSERT' or old.delivery_type is null)
     and not exists (
       select 1 from public.mfi_reports r
       where r.stop_id = new.stop_id
         and r.id <> new.id
         and r.delivery_type is not null
     ) then
    v_completed_fields := array_append(v_completed_fields, 'delivery_type');
  end if;

  if new.back_in_required is not null
     and (tg_op = 'INSERT' or old.back_in_required is null)
     and not exists (
       select 1 from public.mfi_reports r
       where r.stop_id = new.stop_id
         and r.id <> new.id
         and r.back_in_required is not null
     ) then
    v_completed_fields := array_append(v_completed_fields, 'back_in');
  end if;

  v_is_correction := tg_op = 'UPDATE' and (
    new.truck_fit is distinct from old.truck_fit
    or new.delivery_type is distinct from old.delivery_type
    or new.back_in_required is distinct from old.back_in_required
  );

  perform private.refresh_founding_driver_stop_candidate(
    new.stop_id,
    v_actor,
    new.id,
    v_completed_fields,
    v_is_correction
  );

  return new;
end;
$$;

revoke all on function private.capture_founding_driver_report_completion()
  from public, anon, authenticated;

create trigger capture_founding_driver_report_completion
after insert or update of truck_fit, delivery_type, back_in_required
on public.mfi_reports
for each row execute function private.capture_founding_driver_report_completion();

create or replace function private.capture_founding_driver_delivery_zone_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_completed_fields text[] := array[]::text[];
  v_is_correction boolean;
begin
  if v_actor is null then
    return new;
  end if;

  if old.entrance_lat is null
     and old.entrance_lng is null
     and new.entrance_lat is not null
     and new.entrance_lng is not null then
    v_completed_fields := array_append(v_completed_fields, 'delivery_zone');
  end if;

  v_is_correction :=
    new.entrance_lat is distinct from old.entrance_lat
    or new.entrance_lng is distinct from old.entrance_lng;

  perform private.refresh_founding_driver_stop_candidate(
    new.id,
    v_actor,
    null,
    v_completed_fields,
    v_is_correction
  );

  return new;
end;
$$;

revoke all on function private.capture_founding_driver_delivery_zone_completion()
  from public, anon, authenticated;

create trigger capture_founding_driver_delivery_zone_completion
after update of entrance_lat, entrance_lng
on public.mfi_stops
for each row execute function private.capture_founding_driver_delivery_zone_completion();

create or replace function private.set_founding_driver_delivery_zone(
  p_stop_id text,
  p_lat double precision,
  p_lng double precision
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_enrollment public.founding_driver_enrollments%rowtype;
  v_now timestamptz := clock_timestamp();
  v_activity_date date;
  v_updated integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_stop_id is null or btrim(p_stop_id) = '' then
    raise exception 'Stop ID is required';
  end if;

  if (p_lat is null) <> (p_lng is null) then
    raise exception 'Delivery Zone coordinates must both be set or both be cleared';
  end if;

  if p_lat is not null and not (p_lat between -90 and 90) then
    raise exception 'Delivery Zone latitude must be between -90 and 90';
  end if;

  if p_lng is not null and not (p_lng between -180 and 180) then
    raise exception 'Delivery Zone longitude must be between -180 and 180';
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

  update public.mfi_stops
  set entrance_lat = p_lat,
      entrance_lng = p_lng,
      updated_at = v_now
  where id = p_stop_id
    and (
      user_id = v_user_id
      or (
        entrance_lat is null
        and entrance_lng is null
        and p_lat is not null
        and p_lng is not null
      )
    );

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function private.set_founding_driver_delivery_zone(text,double precision,double precision)
  from public, anon;
grant execute on function private.set_founding_driver_delivery_zone(text,double precision,double precision)
  to authenticated;

create or replace function public.set_founding_driver_delivery_zone(
  p_stop_id text,
  p_lat double precision,
  p_lng double precision
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.set_founding_driver_delivery_zone(p_stop_id, p_lat, p_lng);
$$;

revoke all on function public.set_founding_driver_delivery_zone(text,double precision,double precision)
  from public, anon;
grant execute on function public.set_founding_driver_delivery_zone(text,double precision,double precision)
  to authenticated, service_role;

create or replace function private.prepare_founding_driver_stop_contribution_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if new.review_status = 'pending'
     and old.review_status = 'needs_clarification'
     and v_actor = old.user_id then
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.updated_at := clock_timestamp();
    return new;
  end if;

  if not private.is_founding_driver_admin() then
    raise exception 'Founding Driver admin access required';
  end if;

  if new.review_status = 'pending' then
    new.reviewed_at := null;
    new.reviewed_by := null;
  else
    new.reviewed_at := clock_timestamp();
    new.reviewed_by := v_actor;
  end if;

  new.updated_at := clock_timestamp();
  return new;
end;
$$;

revoke all on function private.prepare_founding_driver_stop_contribution_review()
  from public, anon, authenticated;

create trigger prepare_founding_driver_stop_contribution_review
before update of review_status, review_note
on public.founding_driver_stop_contributions
for each row execute function private.prepare_founding_driver_stop_contribution_review();

create view public.founding_driver_qualifying_stop_totals
with (security_invoker = true)
as
select user_id, count(*)::integer as qualifying_stops
from public.founding_driver_stop_contributions
where review_status = 'counts'
group by user_id;

revoke all on table public.founding_driver_qualifying_stop_totals
  from public, anon;
grant select on table public.founding_driver_qualifying_stop_totals
  to authenticated, service_role;
