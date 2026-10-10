-- Internal prerequisite only: no public RPC or client execution grant.
-- The separately approved Operations guard must mediate every future call.
create or replace function private.read_operations_active_page(
  p_area_slug text default null, p_limit integer default 100, p_cursor jsonb default null
) returns jsonb
language plpgsql stable security definer set search_path = '' as $function$
declare
  v_user uuid := auth.uid();
  v_page jsonb;
  v_snapshot text;
  v_offset integer := 0;
  v_total integer;
  v_end integer;
begin
  if v_user is null or not exists(select 1 from auth.users where id=v_user) then
    raise insufficient_privilege using message='Authentication required.';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100
    or (p_area_slug is not null and (length(p_area_slug)>100 or not exists(
      select 1 from public.operations_areas where slug=p_area_slug and is_active))) then
    raise invalid_parameter_value using message='Invalid Operations page request.';
  end if;
  if p_cursor is not null then
    if jsonb_typeof(p_cursor) <> 'object' or octet_length(p_cursor::text)>512
      or coalesce(p_cursor->>'snapshot','') !~ '^[0-9a-f]{64}$'
      or coalesce(p_cursor->>'offset','') !~ '^[0-9]{1,9}$' then
      raise invalid_parameter_value using message='Invalid Operations cursor.';
    end if;
    v_offset := (p_cursor->>'offset')::integer;
  end if;

  -- One statement snapshot for membership, row versions, and page content. UUIDs remain
  -- the logical keys; xmin/ctid are only conservative change detectors, never row IDs.
  -- ctid also detects successive updates in one transaction (which share xmin).
  -- Physical rewrites may force a harmless restart. A UTC day boundary expires tokens
  -- conservatively instead of treating 32-bit transaction IDs as permanent versions.
  -- Only this page is serialized: the full eligible feed contributes compact versions.
  with candidates as materialized (
    select u.id,u.created_at,u.revision,u.area_id,u.author_user_id,u.stop_id,
      concat_ws('|',u.id::text,u.xmin::text,u.ctid::text) as version
    from public.operations_updates u
    where (u.area_id in(select a.id from public.operations_areas a
      where a.is_active and (p_area_slug is null or a.slug=p_area_slug))) is true
      -- blocked_user_id is NOT NULL; the account's block set can be evaluated once.
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=v_user)
      and u.status in ('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
  ), authors as materialized (
    -- Only candidate authors, not a copy of the whole profile table. Preserve the
    -- existing requirement that a post has a profile; check membership once below.
    select p.id,p.xmin as row_xmin,p.ctid as row_ctid from public.profiles p
    where p.id in(select author_user_id from candidates)
  ), relevant as materialized (
    select c.* from candidates c
    where (c.author_user_id in(select id from authors)) is true
  ), confirmations as materialized (
    -- The existing (update_id,revision,created_at DESC) index can stop at the
    -- latest matching yes rather than reading and grouping every confirmation.
    select r.id as update_id,
      (select max(c.created_at) from public.operations_update_confirmations c
        where c.update_id=r.id and c.revision=r.revision and c.response='yes') as last_confirmed_at
    from relevant r
  ), metadata as (
    select count(*)::integer as total,
      encode(extensions.digest(convert_to(concat_ws('|',
        'operations-page-v2',v_user::text,coalesce(p_area_slug,'*'),
        (statement_timestamp() at time zone 'UTC')::date::text,
        coalesce(string_agg(version,';' order by created_at desc,id desc),''),
        coalesce((select string_agg(concat_ws(':',c.update_id,
          extract(epoch from c.last_confirmed_at)),';' order by c.update_id) from confirmations c
          where c.last_confirmed_at is not null),''),
        -- Referenced dependencies contribute once, not once per condition. Their
        -- primary keys scope the versions; hidden stop labels remain excluded.
        coalesce((select string_agg(concat_ws(':',a.id,a.xmin,a.ctid),';' order by a.id)
          from public.operations_areas a where a.id in(select area_id from relevant)),''),
        coalesce((select string_agg(concat_ws(':',p.id,p.row_xmin,p.row_ctid),';' order by p.id)
          from authors p),''),
        coalesce((select string_agg(concat_ws(':',s.id,s.xmin,s.ctid),';' order by s.id)
          from public.mfi_stops s where s.moderation_status='visible'
            and s.id in(select stop_id from relevant)),'')),
        'UTF8'),'sha256'),'hex') as snapshot
    from relevant
  ), selected as (
    select id,created_at from relevant
    order by created_at desc,id desc limit p_limit offset v_offset
  ), page as (
    select u.id,a.slug as area_slug,a.display_name as area_name,u.category,u.message,
      u.stop_id,s.name as stop_name,s.address as stop_address,u.latitude,u.longitude,
      u.created_at,u.updated_at,u.expires_at,u.revision,u.status,u.edited,
      u.resolution_source,u.moderation_reason,u.author_user_id,p.username,p.profile_image_path,
      true as founding_driver,u.author_user_id=v_user as is_author,
      -- Use the existing per-update index for these <=100 selected records. Joining
      -- the materialized full-feed summary here can rescan it once per page row.
      -- This subquery and the fingerprint above share the same statement snapshot.
      (select max(c.created_at) from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes') as last_confirmed_at
    from selected
    join public.operations_updates u on u.id=selected.id
    join public.operations_areas a on a.id=u.area_id
    join public.profiles p on p.id=u.author_user_id
    left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
  )
  select metadata.total,metadata.snapshot,
    (select coalesce(jsonb_agg(to_jsonb(page) order by page.created_at desc,page.id desc),'[]'::jsonb) from page)
  into v_total,v_snapshot,v_page from metadata;
  if p_cursor is not null and p_cursor->>'snapshot' is distinct from v_snapshot then
    raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';
  end if;
  if v_offset>v_total then
    raise invalid_parameter_value using message='Invalid Operations cursor.';
  end if;
  v_end := least(v_offset+p_limit,v_total);
  return jsonb_build_object('updates',v_page,'snapshot',v_snapshot,'offset',v_offset,
    'total',v_total,'complete',v_end=v_total,'next_cursor',
    case when v_end<v_total then jsonb_build_object('snapshot',v_snapshot,'offset',v_end) else null end);
end;
$function$;
revoke all on function private.read_operations_active_page(text,integer,jsonb)
  from public,anon,authenticated,service_role;
