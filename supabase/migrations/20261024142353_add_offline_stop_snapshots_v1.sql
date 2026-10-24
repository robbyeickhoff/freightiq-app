-- One bounded, guarded read for deliberate offline stop snapshots.
-- The mobile client never receives service-role access or a direct-table bypass.
create function private.read_offline_stop_snapshots_v1(p_stop_ids text[])
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_requested_count integer;
  v_stop_count integer;
  v_report_count integer;
  v_result jsonb;
begin
  if v_user_id is null or not exists(select 1 from auth.users where id = v_user_id) then
    raise insufficient_privilege using message = 'Authentication required.';
  end if;

  if p_stop_ids is null or cardinality(p_stop_ids) < 1 or cardinality(p_stop_ids) > 50
    or exists(select 1 from unnest(p_stop_ids) value where nullif(btrim(value), '') is null) then
    raise invalid_parameter_value using message = 'Between 1 and 50 stop IDs are required.';
  end if;

  select count(distinct value) into v_requested_count from unnest(p_stop_ids) value;
  if v_requested_count <> cardinality(p_stop_ids) then
    raise invalid_parameter_value using message = 'Stop IDs must be unique.';
  end if;

  with visible_stops as (
    select s.*
    from unnest(p_stop_ids) with ordinality requested(stop_id, position)
    join public.mfi_stops s on s.id = requested.stop_id
    where s.moderation_status = 'visible'
      or s.user_id = v_user_id
      or private.is_moderation_admin()
  )
  select count(*) into v_stop_count from visible_stops;

  if v_stop_count <> v_requested_count then
    raise invalid_parameter_value using message = 'Every requested stop must be available.';
  end if;

  with visible_reports as (
    select r.id
    from public.mfi_reports r
    join public.mfi_stops s on s.id = r.stop_id
    where r.stop_id = any(p_stop_ids)
      and (s.moderation_status = 'visible' or s.user_id = v_user_id or private.is_moderation_admin())
      and (r.moderation_status = 'visible' or r.user_id = v_user_id or private.is_moderation_admin())
      and (r.user_id = v_user_id or private.is_moderation_admin() or not private.is_contributor_restricted(r.user_id))
      and not exists (
        select 1 from public.blocked_contributors b
        where b.blocking_user_id = v_user_id
          and b.blocked_user_id = r.user_id
          and r.user_id <> v_user_id
          and not private.is_moderation_admin()
      )
  )
  select count(*) into v_report_count from visible_reports;

  if v_report_count > 500 then
    raise invalid_parameter_value using message = 'The selected stops contain too many reports.';
  end if;

  select coalesce(jsonb_agg(snapshot order by position), '[]'::jsonb)
  into v_result
  from (
    select
      requested.position,
      jsonb_build_object(
        'id', s.id,
        'stop', jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'address', s.address,
          'lat', s.lat,
          'lng', s.lng,
          'city', s.city,
          'state_code', s.state_code,
          'country_code', s.country_code,
          'deliver_from_type', s.deliver_from_type,
          'deliver_from_details', s.deliver_from_details,
          'approach_hint', s.approach_hint,
          'back_in_required', s.back_in_required,
          'truck_fit', s.truck_fit,
          'contact', s.contact,
          'notes', s.notes,
          'entrance_lat', s.entrance_lat,
          'entrance_lng', s.entrance_lng
        ),
        'reports', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', r.id,
            'stop_id', r.stop_id,
            'user_id', r.user_id,
            'deliver_from_type', r.deliver_from_type,
            'deliver_from_details', r.deliver_from_details,
            'approach_hint', r.approach_hint,
            'back_in_required', r.back_in_required,
            'truck_fit', r.truck_fit,
            'contact', r.contact,
            'notes', r.notes,
            'created_at', r.created_at,
            'updated_at', r.updated_at,
            'tractor_type', r.tractor_type,
            'delivery_type', r.delivery_type,
            'contact_name', r.contact_name,
            'contact_phones', r.contact_phones,
            'check_in_notes', r.check_in_notes,
            'contact_people', r.contact_people,
            'deliver_from_details_updated_at', r.deliver_from_details_updated_at,
            'approach_hint_updated_at', r.approach_hint_updated_at,
            'check_in_notes_updated_at', r.check_in_notes_updated_at,
            'notes_updated_at', r.notes_updated_at,
            'username', p.username,
            'profile_tractor_type', p.tractor_type,
            'vote_up_count', (select count(*) from public.mfi_report_votes v where v.report_id = r.id and v.vote_value = 1),
            'vote_down_count', (select count(*) from public.mfi_report_votes v where v.report_id = r.id and v.vote_value = -1)
          ) order by r.updated_at desc, r.id)
          from public.mfi_reports r
          left join public.profiles p on p.id = r.user_id
          where r.stop_id = s.id
            and (r.moderation_status = 'visible' or r.user_id = v_user_id or private.is_moderation_admin())
            and (r.user_id = v_user_id or private.is_moderation_admin() or not private.is_contributor_restricted(r.user_id))
            and not exists (
              select 1 from public.blocked_contributors b
              where b.blocking_user_id = v_user_id
                and b.blocked_user_id = r.user_id
                and r.user_id <> v_user_id
                and not private.is_moderation_admin()
            )
        ), '[]'::jsonb)
      ) as snapshot
    from unnest(p_stop_ids) with ordinality requested(stop_id, position)
    join public.mfi_stops s on s.id = requested.stop_id
  ) snapshots;

  return v_result;
end;
$function$;

revoke all on function private.read_offline_stop_snapshots_v1(text[])
  from public, anon, authenticated, service_role;

-- Extend the existing static dispatcher and guard without replacing their current
-- quota, warning, response, or telemetry behavior.
do $patch$
declare
  definition text;
  needle text;
  replacement text;
begin
  definition := pg_get_functiondef('private.dispatch_freightiq_guarded_read(text,jsonb)'::regprocedure);
  needle := '    when ''stop_stats'' then';
  replacement := '    when ''offline_snapshots'' then
      v_result := private.read_offline_stop_snapshots_v1(
        array(select jsonb_array_elements_text(p_args->''p_stop_ids'')));
' || needle;
  if (length(definition) - length(replace(definition, needle, ''))) / length(needle) <> 1 then
    raise exception 'Library dispatcher drift: review offline snapshot integration';
  end if;
  execute replace(definition, needle, replacement);

  definition := pg_get_functiondef('private.read_freightiq_guarded_core(text,jsonb)'::regprocedure);
  needle := '''stop_reports'',''report_reputation'',''stop_stats'')';
  replacement := '''stop_reports'',''report_reputation'',''stop_stats'',''offline_snapshots'')';
  if (length(definition) - length(replace(definition, needle, ''))) / length(needle) <> 1 then
    raise exception 'Library allowlist drift: review offline snapshot integration';
  end if;
  definition := replace(definition, needle, replacement);

  needle := 'p_operation in (''stop_detail'',''route_stops'',''stop_reports'',''stop_stats'')';
  replacement := 'p_operation in (''stop_detail'',''route_stops'',''stop_reports'',''stop_stats'',''offline_snapshots'')';
  if (length(definition) - length(replace(definition, needle, ''))) / length(needle) <> 1 then
    raise exception 'Library class drift: review offline snapshot integration';
  end if;
  execute replace(definition, needle, replacement);
end;
$patch$;
