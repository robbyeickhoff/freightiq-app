-- Additive compatibility phase for Bot Scrape Protection V1.
--
-- These narrowly scoped authenticated mutation functions let a compatible
-- client stop depending on direct table SELECT/DML privileges. Existing table
-- grants remain unchanged here so already-installed app versions keep working.

create or replace function public.create_freightiq_stop_v1(
  p_stop_id text,
  p_name text,
  p_address text,
  p_lat double precision,
  p_lng double precision,
  p_city text default null,
  p_state_code text default null,
  p_country_code text default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_stop_id text := nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '');
  v_name text := nullif(pg_catalog.btrim(coalesce(p_name, '')), '');
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if v_stop_id is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;
  if v_name is null then
    raise exception using errcode = '22023', message = 'Stop name is required.';
  end if;

  insert into public.mfi_stops (
    id, name, address, lat, lng, user_id, city, state_code, country_code
  ) values (
    v_stop_id,
    v_name,
    nullif(pg_catalog.btrim(coalesce(p_address, '')), ''),
    p_lat,
    p_lng,
    v_user_id,
    nullif(pg_catalog.btrim(coalesce(p_city, '')), ''),
    nullif(pg_catalog.upper(pg_catalog.btrim(coalesce(p_state_code, ''))), ''),
    nullif(pg_catalog.upper(pg_catalog.btrim(coalesce(p_country_code, ''))), '')
  );

  return v_stop_id;
end;
$function$;

create or replace function public.save_freightiq_report_v1(
  p_stop_id text,
  p_report_id uuid default null,
  p_deliver_from_type text default null,
  p_deliver_from_details text default null,
  p_approach_hint text default null,
  p_back_in_required boolean default null,
  p_truck_fit text default null,
  p_contact text default null,
  p_notes text default null,
  p_tractor_type text default null,
  p_delivery_type text default null,
  p_contact_name text default null,
  p_contact_phones jsonb default null,
  p_check_in_notes text default null,
  p_contact_people jsonb default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_report_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;
  if not exists (
    select 1
    from public.mfi_stops s
    where s.id = p_stop_id
      and (
        s.moderation_status = 'visible'
        or s.user_id = v_user_id
        or (select private.is_moderation_admin())
      )
  ) then
    raise exception using errcode = '42501', message = 'This stop is not available.';
  end if;

  if p_report_id is null then
    insert into public.mfi_reports (
      stop_id, user_id, deliver_from_type, deliver_from_details, approach_hint,
      back_in_required, truck_fit, contact, notes, tractor_type, delivery_type,
      contact_name, contact_phones, check_in_notes, contact_people, updated_at
    ) values (
      p_stop_id, v_user_id, p_deliver_from_type, p_deliver_from_details, p_approach_hint,
      p_back_in_required, p_truck_fit, p_contact, p_notes, p_tractor_type, p_delivery_type,
      p_contact_name, p_contact_phones, p_check_in_notes, p_contact_people, pg_catalog.now()
    ) returning id into v_report_id;
  else
    update public.mfi_reports r
    set deliver_from_type = p_deliver_from_type,
        deliver_from_details = p_deliver_from_details,
        approach_hint = p_approach_hint,
        back_in_required = p_back_in_required,
        truck_fit = p_truck_fit,
        contact = p_contact,
        notes = p_notes,
        tractor_type = p_tractor_type,
        delivery_type = p_delivery_type,
        contact_name = p_contact_name,
        contact_phones = p_contact_phones,
        check_in_notes = p_check_in_notes,
        contact_people = p_contact_people,
        updated_at = pg_catalog.now()
    where r.id = p_report_id
      and r.stop_id = p_stop_id
      and r.user_id = v_user_id
    returning r.id into v_report_id;

    if v_report_id is null then
      raise exception using errcode = '42501', message = 'You can only update your own report.';
    end if;
  end if;

  return v_report_id;
end;
$function$;

create or replace function public.delete_owned_freightiq_report_v1(p_report_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_deleted integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_report_id is null then
    raise exception using errcode = '22023', message = 'Report ID is required.';
  end if;

  delete from public.mfi_reports r
  where r.id = p_report_id and r.user_id = v_user_id;
  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$function$;

create or replace function public.set_freightiq_report_vote_v1(
  p_report_id uuid,
  p_vote_value integer default null
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_report_id is null then
    raise exception using errcode = '22023', message = 'Report ID is required.';
  end if;
  if p_vote_value is not null and p_vote_value not in (-1, 1) then
    raise exception using errcode = '22023', message = 'Vote must be up, down, or cleared.';
  end if;

  if p_vote_value is null then
    delete from public.mfi_report_votes v
    where v.report_id = p_report_id and v.user_id = v_user_id;
    return 0;
  end if;

  if not exists (
    select 1
    from public.mfi_reports r
    join public.mfi_stops s on s.id = r.stop_id
    where r.id = p_report_id
      and r.moderation_status = 'visible'
      and s.moderation_status = 'visible'
      and not private.is_contributor_restricted(r.user_id)
      and not exists (
        select 1 from public.blocked_contributors b
        where b.blocking_user_id = v_user_id and b.blocked_user_id = r.user_id
      )
  ) then
    raise exception using errcode = '42501', message = 'This report is not available for voting.';
  end if;

  insert into public.mfi_report_votes (report_id, user_id, vote_value, updated_at)
  values (p_report_id, v_user_id, p_vote_value, pg_catalog.now())
  on conflict (report_id, user_id)
  do update set vote_value = excluded.vote_value, updated_at = excluded.updated_at;
  return p_vote_value;
end;
$function$;

create or replace function public.edit_freightiq_stop_v1(
  p_stop_id text,
  p_name text default null,
  p_address text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_updated integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;
  if p_name is null and p_address is null then
    raise exception using errcode = '22023', message = 'A stop name or address change is required.';
  end if;
  if p_name is not null and nullif(pg_catalog.btrim(p_name), '') is null then
    raise exception using errcode = '22023', message = 'Stop name cannot be blank.';
  end if;
  if p_address is not null and nullif(pg_catalog.btrim(p_address), '') is null then
    raise exception using errcode = '22023', message = 'Stop address cannot be blank.';
  end if;

  update public.mfi_stops s
  set name = case when p_name is null then s.name else pg_catalog.btrim(p_name) end,
      address = case when p_address is null then s.address else pg_catalog.btrim(p_address) end,
      updated_at = pg_catalog.now()
  where s.id = p_stop_id
    and (s.user_id = v_user_id or (select private.is_trusted_stop_editor()));
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$function$;

create or replace function public.set_owned_freightiq_delivery_zone_v1(
  p_stop_id text,
  p_lat double precision,
  p_lng double precision
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_updated integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;
  if (p_lat is null) <> (p_lng is null) then
    raise exception using errcode = '22023', message = 'Delivery Zone coordinates must both be set or both be cleared.';
  end if;
  if p_lat is not null and (
    not (p_lat between -90::double precision and 90::double precision)
    or not (p_lng between -180::double precision and 180::double precision)
  ) then
    raise exception using errcode = '22023', message = 'Delivery Zone coordinates are invalid.';
  end if;

  update public.mfi_stops s
  set entrance_lat = p_lat, entrance_lng = p_lng, updated_at = pg_catalog.now()
  where s.id = p_stop_id
    and (s.user_id = v_user_id or (select private.is_trusted_stop_editor()));
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$function$;

create or replace function public.delete_owned_freightiq_stop_v1(p_stop_id text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_deleted integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;

  delete from public.mfi_stops s
  where s.id = p_stop_id and s.user_id = v_user_id;
  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$function$;

revoke all on function public.create_freightiq_stop_v1(text, text, text, double precision, double precision, text, text, text) from public, anon;
revoke all on function public.save_freightiq_report_v1(text, uuid, text, text, text, boolean, text, text, text, text, text, text, jsonb, text, jsonb) from public, anon;
revoke all on function public.delete_owned_freightiq_report_v1(uuid) from public, anon;
revoke all on function public.set_freightiq_report_vote_v1(uuid, integer) from public, anon;
revoke all on function public.edit_freightiq_stop_v1(text, text, text) from public, anon;
revoke all on function public.set_owned_freightiq_delivery_zone_v1(text, double precision, double precision) from public, anon;
revoke all on function public.delete_owned_freightiq_stop_v1(text) from public, anon;

grant execute on function public.create_freightiq_stop_v1(text, text, text, double precision, double precision, text, text, text) to authenticated, service_role;
grant execute on function public.save_freightiq_report_v1(text, uuid, text, text, text, boolean, text, text, text, text, text, text, jsonb, text, jsonb) to authenticated, service_role;
grant execute on function public.delete_owned_freightiq_report_v1(uuid) to authenticated, service_role;
grant execute on function public.set_freightiq_report_vote_v1(uuid, integer) to authenticated, service_role;
grant execute on function public.edit_freightiq_stop_v1(text, text, text) to authenticated, service_role;
grant execute on function public.set_owned_freightiq_delivery_zone_v1(text, double precision, double precision) to authenticated, service_role;
grant execute on function public.delete_owned_freightiq_stop_v1(text) to authenticated, service_role;
