-- Give each free-text Intel field its own server-controlled freshness date.
-- Existing text uses the report's last update as the best available history.

alter table public.mfi_reports
  add column deliver_from_details_updated_at timestamptz,
  add column approach_hint_updated_at timestamptz,
  add column check_in_notes_updated_at timestamptz,
  add column notes_updated_at timestamptz;

update public.mfi_reports
set deliver_from_details_updated_at = case when deliver_from_details is null then null else updated_at end,
    approach_hint_updated_at = case when approach_hint is null then null else updated_at end,
    check_in_notes_updated_at = case when check_in_notes is null then null else updated_at end,
    notes_updated_at = case when notes is null then null else updated_at end;

create function private.stamp_freightiq_report_field_updates()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_changed_at timestamptz := coalesce(new.updated_at, pg_catalog.now());
begin
  if tg_op = 'INSERT' then
    new.deliver_from_details_updated_at := case when new.deliver_from_details is null then null else v_changed_at end;
    new.approach_hint_updated_at := case when new.approach_hint is null then null else v_changed_at end;
    new.check_in_notes_updated_at := case when new.check_in_notes is null then null else v_changed_at end;
    new.notes_updated_at := case when new.notes is null then null else v_changed_at end;
    return new;
  end if;

  new.deliver_from_details_updated_at := case
    when new.deliver_from_details is not distinct from old.deliver_from_details then old.deliver_from_details_updated_at
    when new.deliver_from_details is null then null
    else v_changed_at
  end;
  new.approach_hint_updated_at := case
    when new.approach_hint is not distinct from old.approach_hint then old.approach_hint_updated_at
    when new.approach_hint is null then null
    else v_changed_at
  end;
  new.check_in_notes_updated_at := case
    when new.check_in_notes is not distinct from old.check_in_notes then old.check_in_notes_updated_at
    when new.check_in_notes is null then null
    else v_changed_at
  end;
  new.notes_updated_at := case
    when new.notes is not distinct from old.notes then old.notes_updated_at
    when new.notes is null then null
    else v_changed_at
  end;
  return new;
end;
$function$;

revoke all on function private.stamp_freightiq_report_field_updates() from public, anon, authenticated, service_role;

create trigger stamp_freightiq_report_field_updates
before insert or update of deliver_from_details, approach_hint, check_in_notes, notes
on public.mfi_reports
for each row
execute function private.stamp_freightiq_report_field_updates();

-- PostgreSQL cannot change a RETURNS TABLE shape in place. This API is already
-- closed to mobile clients and is reached only through the guarded dispatcher.
drop function public.list_freightiq_stop_reports_v1(text, integer);

create function public.list_freightiq_stop_reports_v1(
  p_stop_id text,
  p_result_limit integer default 100
)
returns table(
  id uuid,
  stop_id text,
  user_id uuid,
  deliver_from_type text,
  deliver_from_details text,
  approach_hint text,
  back_in_required boolean,
  truck_fit text,
  contact text,
  notes text,
  votes_up integer,
  votes_down integer,
  created_at timestamptz,
  updated_at timestamptz,
  tractor_type text,
  delivery_type text,
  contact_name text,
  contact_phones jsonb,
  check_in_notes text,
  contact_people jsonb,
  moderation_status text,
  username text,
  profile_tractor_type text,
  vote_up_count bigint,
  vote_down_count bigint,
  caller_vote integer,
  deliver_from_details_updated_at timestamptz,
  approach_hint_updated_at timestamptz,
  check_in_notes_updated_at timestamptz,
  notes_updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_started_at timestamptz := pg_catalog.clock_timestamp();
  v_response_count integer;
  v_user_id uuid := (select auth.uid());
  v_limit integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;
  v_limit := least(greatest(coalesce(p_result_limit, 100), 1), 100);

  return query
  select
    r.id, r.stop_id, r.user_id, r.deliver_from_type, r.deliver_from_details,
    r.approach_hint, r.back_in_required, r.truck_fit, r.contact, r.notes,
    r.votes_up, r.votes_down, r.created_at, r.updated_at, r.tractor_type,
    r.delivery_type, r.contact_name, r.contact_phones, r.check_in_notes,
    r.contact_people, r.moderation_status, p.username, p.tractor_type,
    pg_catalog.count(v.id) filter (where v.vote_value = 1),
    pg_catalog.count(v.id) filter (where v.vote_value = -1),
    coalesce(pg_catalog.max(v.vote_value) filter (where v.user_id = v_user_id), 0),
    r.deliver_from_details_updated_at, r.approach_hint_updated_at,
    r.check_in_notes_updated_at, r.notes_updated_at
  from public.mfi_reports r
  join public.mfi_stops s on s.id = r.stop_id
  left join public.profiles p on p.id = r.user_id
  left join public.mfi_report_votes v on v.report_id = r.id
  where r.stop_id = p_stop_id
    and (
      s.moderation_status = 'visible'
      or s.user_id = v_user_id
      or (select private.is_moderation_admin())
    )
    and (
      r.moderation_status = 'visible'
      or r.user_id = v_user_id
      or (select private.is_moderation_admin())
    )
    and (
      r.user_id = v_user_id
      or (select private.is_moderation_admin())
      or not private.is_contributor_restricted(r.user_id)
    )
    and not exists (
      select 1
      from public.blocked_contributors b
      where b.blocking_user_id = v_user_id
        and b.blocked_user_id = r.user_id
        and r.user_id <> v_user_id
        and not (select private.is_moderation_admin())
    )
  group by r.id, p.id
  order by r.updated_at desc, r.id
  limit v_limit;

  get diagnostics v_response_count = row_count;
  perform private.record_freightiq_read_shadow_event(
    'stop_reports', v_response_count, v_started_at, p_stop_id,
    null, null, null, null, null, null, v_limit
  );
end;
$function$;

revoke all on function public.list_freightiq_stop_reports_v1(text, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.list_freightiq_stop_reports_v1(text, integer) to service_role;

create or replace function private.read_owned_freightiq_report(p_stop_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_report jsonb;
begin
  if v_user_id is null or not exists (select 1 from auth.users where id = v_user_id) then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null
     or pg_catalog.octet_length(p_stop_id) > 1024 then
    raise exception using errcode = '22023', message = 'A valid stop ID is required.';
  end if;
  if not exists (
    select 1 from public.mfi_stops s where s.id = p_stop_id
      and (s.moderation_status = 'visible' or s.user_id = v_user_id
           or (select private.is_moderation_admin()))
  ) then
    raise exception using errcode = '42501', message = 'This stop is not available.';
  end if;

  select pg_catalog.jsonb_build_object(
    'id', r.id, 'stop_id', r.stop_id, 'user_id', r.user_id,
    'deliver_from_type', r.deliver_from_type, 'deliver_from_details', r.deliver_from_details,
    'approach_hint', r.approach_hint, 'back_in_required', r.back_in_required,
    'truck_fit', r.truck_fit, 'contact', r.contact, 'notes', r.notes,
    'delivery_type', r.delivery_type, 'contact_name', r.contact_name,
    'contact_phones', r.contact_phones, 'check_in_notes', r.check_in_notes,
    'contact_people', r.contact_people,
    'deliver_from_details_updated_at', r.deliver_from_details_updated_at,
    'approach_hint_updated_at', r.approach_hint_updated_at,
    'check_in_notes_updated_at', r.check_in_notes_updated_at,
    'notes_updated_at', r.notes_updated_at
  ) into v_report
  from public.mfi_reports r
  where r.stop_id = p_stop_id and r.user_id = v_user_id
  order by r.updated_at desc, r.id
  limit 1;
  return v_report;
end;
$function$;

revoke all on function private.read_owned_freightiq_report(text)
  from public, anon, authenticated, service_role;
grant execute on function private.read_owned_freightiq_report(text) to authenticated;
