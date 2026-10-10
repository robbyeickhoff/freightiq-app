-- Recoverable Stop Lifecycle V1.
-- Replaces owner hard-delete with a 30-day recovery window and records
-- limited, append-only lifecycle evidence in the unexposed private schema.

alter table public.mfi_stops
  add column created_at timestamptz,
  add column removed_at timestamptz,
  add column recovery_expires_at timestamptz,
  add column removal_kind text,
  add column removed_by uuid references auth.users(id) on delete set null,
  add column merged_into_stop_id text references public.mfi_stops(id) on delete set null;

update public.mfi_stops
set created_at = case
  when id ~ '^[0-9]{13}$'
    and to_timestamp(id::bigint / 1000.0) between timestamptz '2020-01-01' and updated_at
    then to_timestamp(id::bigint / 1000.0)
  else updated_at
end;

alter table public.mfi_stops
  alter column created_at set default now(),
  alter column created_at set not null,
  add constraint mfi_stops_removal_kind_check
    check (removal_kind is null or removal_kind in ('owner_deleted','merged')),
  add constraint mfi_stops_recovery_window_check
    check (
      (removal_kind is null and removed_at is null and recovery_expires_at is null
        and removed_by is null and merged_into_stop_id is null)
      or
      (removal_kind = 'owner_deleted' and removed_at is not null
        and recovery_expires_at is not null and recovery_expires_at > removed_at
        and merged_into_stop_id is null)
      or
      (removal_kind = 'merged' and removed_at is not null
        and recovery_expires_at is null and merged_into_stop_id is not null)
    );

create index mfi_stops_owner_removed_idx
  on public.mfi_stops(user_id, recovery_expires_at desc)
  where removal_kind = 'owner_deleted';

create table private.stop_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  stop_id text not null,
  action text not null check (action in ('created','owner_deleted','restored','merged','purged')),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_stop_id text,
  stop_snapshot jsonb not null,
  moved_report_ids uuid[] not null default '{}',
  occurred_at timestamptz not null default now(),
  constraint stop_lifecycle_snapshot_object_check check (jsonb_typeof(stop_snapshot) = 'object')
);

alter table private.stop_lifecycle_events enable row level security;
revoke all on table private.stop_lifecycle_events from public, anon, authenticated, service_role;

comment on table private.stop_lifecycle_events is
  'Append-only stop lifecycle evidence. Never stores report content, contacts, or Locked Personal Intel.';

create or replace function private.stop_lifecycle_snapshot(p_stop public.mfi_stops)
returns jsonb
language sql
immutable
set search_path = ''
as $function$
  select jsonb_build_object(
    'id', p_stop.id,
    'name', p_stop.name,
    'address', p_stop.address,
    'lat', p_stop.lat,
    'lng', p_stop.lng,
    'city', p_stop.city,
    'state_code', p_stop.state_code,
    'country_code', p_stop.country_code,
    'created_at', p_stop.created_at,
    'moderation_status', p_stop.moderation_status
  );
$function$;

revoke all on function private.stop_lifecycle_snapshot(public.mfi_stops)
  from public, anon, authenticated, service_role;

create or replace function private.record_stop_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into private.stop_lifecycle_events(stop_id, action, actor_user_id, stop_snapshot)
  values (new.id, 'created', (select auth.uid()), private.stop_lifecycle_snapshot(new));
  return new;
end;
$function$;

revoke all on function private.record_stop_created() from public, anon, authenticated, service_role;

create trigger record_stop_created_lifecycle
after insert on public.mfi_stops
for each row execute function private.record_stop_created();

drop policy if exists mfi_stops_read_visible_or_owned on public.mfi_stops;
create policy mfi_stops_read_visible_or_owned
  on public.mfi_stops
  for select
  to authenticated
  using (
    moderation_status = 'visible'
    or ((select auth.uid()) = user_id and removal_kind is null)
    or (select private.is_moderation_admin())
  );

create or replace function public.delete_owned_freightiq_stop_v1(p_stop_id text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_stop public.mfi_stops;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;

  select s.* into v_stop
  from public.mfi_stops s
  where s.id = p_stop_id and s.user_id = v_user_id and s.removal_kind is null
  for update;
  if not found then return false; end if;

  insert into private.stop_lifecycle_events(stop_id, action, actor_user_id, stop_snapshot)
  values (v_stop.id, 'owner_deleted', v_user_id, private.stop_lifecycle_snapshot(v_stop));

  update public.mfi_stops
  set user_id = null, moderation_status = 'removed', removal_kind = 'owner_deleted', removed_at = now(),
      recovery_expires_at = now() + interval '30 days', removed_by = v_user_id,
      merged_into_stop_id = null, updated_at = now()
  where id = v_stop.id;
  return true;
end;
$function$;

create or replace function public.list_owned_removed_freightiq_stops_v1()
returns table(id text, name text, address text, removed_at timestamptz, recovery_expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $function$
  select s.id, s.name, s.address, s.removed_at, s.recovery_expires_at
  from public.mfi_stops s
  where s.removed_by = (select auth.uid())
    and s.removal_kind = 'owner_deleted'
    and s.recovery_expires_at > now()
  order by s.removed_at desc, s.id;
$function$;

create or replace function public.restore_owned_freightiq_stop_v1(p_stop_id text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_stop public.mfi_stops;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select s.* into v_stop
  from public.mfi_stops s
  where s.id = p_stop_id and s.removed_by = v_user_id
    and s.removal_kind = 'owner_deleted' and s.recovery_expires_at > now()
  for update;
  if not found then return false; end if;

  if exists (
    select 1 from public.mfi_stops other
    where other.id <> v_stop.id and other.moderation_status = 'visible'
      and extensions.st_dwithin(other.search_location, v_stop.search_location, 10)
      and lower(pg_catalog.btrim(other.name)) = lower(pg_catalog.btrim(v_stop.name))
  ) then
    raise exception using errcode = '23505',
      message = 'A matching active stop now exists here. Open it and merge instead.';
  end if;

  update public.mfi_stops
  set user_id = v_user_id, moderation_status = 'visible', removal_kind = null, removed_at = null,
      recovery_expires_at = null, removed_by = null, merged_into_stop_id = null,
      updated_at = now()
  where id = v_stop.id;

  insert into private.stop_lifecycle_events(stop_id, action, actor_user_id, stop_snapshot)
  values (v_stop.id, 'restored', v_user_id, private.stop_lifecycle_snapshot(v_stop));
  return true;
end;
$function$;

create or replace function public.merge_owned_freightiq_stop(
  p_source_stop_id text,
  p_target_stop_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_source public.mfi_stops;
  v_moved_report_ids uuid[];
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_source_stop_id is null or p_target_stop_id is null or p_source_stop_id = p_target_stop_id then
    raise exception using errcode = '22023', message = 'Choose two different stops.';
  end if;

  select s.* into v_source from public.mfi_stops s
  where s.id = p_source_stop_id and s.removal_kind is null for update;
  if not found or v_source.user_id is distinct from v_user_id then
    raise exception using errcode = '42501', message = 'Only the driver who created this stop can merge it.';
  end if;
  perform 1 from public.mfi_stops
  where id = p_target_stop_id and moderation_status = 'visible' for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'The destination stop is not available.';
  end if;
  if exists (
    select 1 from public.mfi_private_stop_notes source_note
    join public.mfi_private_stop_notes target_note
      on target_note.user_id = source_note.user_id and target_note.stop_id = p_target_stop_id
    where source_note.stop_id = p_source_stop_id
  ) then
    raise exception using errcode = '23505',
      message = 'A locked-note conflict must be resolved before these stops can be merged.';
  end if;

  select coalesce(array_agg(id order by id), '{}') into v_moved_report_ids
  from public.mfi_reports where stop_id = p_source_stop_id;
  update public.mfi_reports set stop_id = p_target_stop_id, updated_at = now()
  where stop_id = p_source_stop_id;
  update public.mfi_private_stop_notes set stop_id = p_target_stop_id, updated_at = now()
  where stop_id = p_source_stop_id;

  insert into private.stop_lifecycle_events(
    stop_id, action, actor_user_id, target_stop_id, stop_snapshot, moved_report_ids
  ) values (
    v_source.id, 'merged', v_user_id, p_target_stop_id,
    private.stop_lifecycle_snapshot(v_source), v_moved_report_ids
  );

  update public.mfi_stops
  set user_id = null, moderation_status = 'removed', removal_kind = 'merged', removed_at = now(),
      recovery_expires_at = null, removed_by = v_user_id,
      merged_into_stop_id = p_target_stop_id, updated_at = now()
  where id = v_source.id;
end;
$function$;

revoke all on function public.delete_owned_freightiq_stop_v1(text) from public, anon;
revoke all on function public.list_owned_removed_freightiq_stops_v1() from public, anon, service_role;
revoke all on function public.restore_owned_freightiq_stop_v1(text) from public, anon, service_role;
revoke all on function public.merge_owned_freightiq_stop(text,text) from public, anon, service_role;
grant execute on function public.delete_owned_freightiq_stop_v1(text) to authenticated, service_role;
grant execute on function public.list_owned_removed_freightiq_stops_v1() to authenticated;
grant execute on function public.restore_owned_freightiq_stop_v1(text) to authenticated;
grant execute on function public.merge_owned_freightiq_stop(text,text) to authenticated;
