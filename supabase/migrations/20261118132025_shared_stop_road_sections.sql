-- Stop-specific advisory markings. No direct client table access; ownership is
-- checked inside the write APIs, including when a caller supplies another ID.
create table private.stop_road_sections (
  id uuid primary key,
  stop_id text not null references public.mfi_stops(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  section jsonb not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  removed_at timestamptz
);
create index stop_road_sections_active_stop on private.stop_road_sections(stop_id, created_at, id)
  where removed_at is null;
alter table private.stop_road_sections enable row level security;
revoke all on private.stop_road_sections from public, anon, authenticated, service_role;

create function private.valid_stop_road_section(p_section jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare point jsonb;
begin
  if p_section is null or jsonb_typeof(p_section) <> 'object'
    or octet_length(p_section::text) > 262144
    or (p_section - array['road','coordinates','exclusionPoints']) <> '{}'::jsonb
    or jsonb_typeof(p_section->'road') <> 'string'
    or coalesce(length(btrim(p_section->>'road')),0) not between 1 and 200
    or jsonb_typeof(p_section->'coordinates') is distinct from 'array'
    or jsonb_typeof(p_section->'exclusionPoints') is distinct from 'array' then return false; end if;
  if jsonb_array_length(p_section->'coordinates') not between 2 and 2000
    or jsonb_array_length(p_section->'exclusionPoints') not between 1 and 50 then return false; end if;
  for point in select value from jsonb_array_elements((p_section->'coordinates') || (p_section->'exclusionPoints')) loop
    if jsonb_typeof(point) is distinct from 'object'
      or jsonb_typeof(point->'latitude') is distinct from 'number'
      or jsonb_typeof(point->'longitude') is distinct from 'number'
      or not ((point->>'latitude')::numeric between -90 and 90)
      or not ((point->>'longitude')::numeric between -180 and 180) then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function private.valid_stop_road_section(jsonb) from public, anon, authenticated, service_role;
alter table private.stop_road_sections add constraint stop_road_section_valid
  check (private.valid_stop_road_section(section));

create function private.list_stop_road_sections(p_stop_id text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'section',r.section,'version',r.version,
    'is_creator',r.creator_id=auth.uid(),'creator_name',coalesce(p.username,'Driver'),
    'created_at',r.created_at,'updated_at',r.updated_at) order by r.created_at,r.id),'[]')
  from private.stop_road_sections r left join public.profiles p on p.id=r.creator_id
  where auth.uid() is not null and r.stop_id=p_stop_id and r.removed_at is null
    and exists(select 1 from public.mfi_stops s where s.id=r.stop_id and s.removed_at is null
      and (s.moderation_status='visible' or s.user_id=auth.uid() or private.is_moderation_admin()))
    and (r.creator_id=auth.uid() or private.is_moderation_admin() or not private.is_contributor_restricted(r.creator_id))
    and not exists(select 1 from public.blocked_contributors b where b.blocking_user_id=auth.uid()
      and b.blocked_user_id=r.creator_id and r.creator_id<>auth.uid() and not private.is_moderation_admin());
$$;
revoke all on function private.list_stop_road_sections(text) from public, anon, authenticated, service_role;

create function public.save_stop_road_section_v1(p_stop_id text,p_id uuid,p_expected_version integer,p_section jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' set lock_timeout='2s' as $$
declare actor uuid:=auth.uid(); row private.stop_road_sections%rowtype;
begin
  if actor is null or private.is_contributor_restricted(actor) then
    raise insufficient_privilege using message='Sign in with an account allowed to contribute.'; end if;
  if p_id is null or p_expected_version is null or p_expected_version<0 or not private.valid_stop_road_section(p_section) then
    raise invalid_parameter_value using message='Choose a valid road section.'; end if;
  -- Serializes per-stop creates and respects the same stop visibility as Intel.
  perform 1 from public.mfi_stops s where s.id=p_stop_id and s.removed_at is null
    and (s.moderation_status='visible' or s.user_id=actor or private.is_moderation_admin()) for update;
  if not found then raise insufficient_privilege using message='This stop is unavailable.'; end if;
  select * into row from private.stop_road_sections where id=p_id for update;
  if found then
    if row.creator_id<>actor or row.stop_id<>p_stop_id or row.removed_at is not null then
      raise insufficient_privilege using message='Only the creator can change this road section.'; end if;
    -- Idempotent retry after an already-applied save; never overwrites newer geometry.
    if row.section<>p_section then
      if row.version<>p_expected_version then
        raise serialization_failure using message='This road section changed. Reopen it before saving.'; end if;
      update private.stop_road_sections set section=p_section,version=version+1,updated_at=clock_timestamp()
        where id=p_id returning * into row;
    end if;
  else
    if p_expected_version<>0 then raise serialization_failure using message='This road section changed. Reopen it before saving.'; end if;
    if (select count(*) from private.stop_road_sections where stop_id=p_stop_id and removed_at is null)>=100 then
      raise check_violation using message='This stop has too many active road sections. Review the existing sections first.'; end if;
    insert into private.stop_road_sections(id,stop_id,creator_id,section) values(p_id,p_stop_id,actor,p_section) returning * into row;
  end if;
  return jsonb_build_object('id',row.id,'section',row.section,'version',row.version,'is_creator',true,
    'creator_name',coalesce((select username from public.profiles where id=actor),'Driver'),
    'created_at',row.created_at,'updated_at',row.updated_at);
end;
$$;

create function public.remove_stop_road_section_v1(p_id uuid,p_expected_version integer)
returns boolean language plpgsql volatile security definer set search_path = '' set lock_timeout='2s' as $$
declare actor uuid:=auth.uid(); row private.stop_road_sections%rowtype;
begin
  if actor is null then raise insufficient_privilege using message='Authentication required.'; end if;
  select * into row from private.stop_road_sections where id=p_id for update;
  if not found or row.creator_id<>actor then
    raise insufficient_privilege using message='Only the creator can remove this road section.'; end if;
  if row.removed_at is not null then return true; end if;
  if row.version is distinct from p_expected_version then
    raise serialization_failure using message='This road section changed. Reopen it before removing it.'; end if;
  update private.stop_road_sections set removed_at=clock_timestamp(),updated_at=clock_timestamp(),version=version+1 where id=p_id;
  return true;
end;
$$;
revoke all on function public.save_stop_road_section_v1(text,uuid,integer,jsonb),
  public.remove_stop_road_section_v1(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.save_stop_road_section_v1(text,uuid,integer,jsonb),
  public.remove_stop_road_section_v1(uuid,integer) to authenticated;

-- Add fields to the already-guarded single-stop response. Do not add an unguarded
-- read endpoint or alter quota, visibility, telemetry, or any other operation.
do $patch$
declare definition text; needle text; replacement text;
begin
  definition:=pg_get_functiondef('private.dispatch_freightiq_guarded_read(text,jsonb)'::regprocedure);
  needle:='select coalesce(jsonb_agg(to_jsonb(r)),''[]'') into v_result from public.get_freightiq_stop_v1(p_args->>''p_stop_id'') r;';
  replacement:='select coalesce(jsonb_agg(to_jsonb(r) || jsonb_build_object(''road_sections'',private.list_stop_road_sections(r.id))),''[]'') into v_result from public.get_freightiq_stop_v1(p_args->>''p_stop_id'') r;';
  if (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 then
    raise exception 'Stop detail dispatcher drift: review shared road integration'; end if;
  execute replace(definition,needle,replacement);
end;
$patch$;
