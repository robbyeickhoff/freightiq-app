-- Rollback-only experiment: reuse mandatory joined rows across the bounded page.
create or replace function private.read_operations_active_page(
  p_area_slug text default null,p_limit integer default 100,p_cursor jsonb default null
) returns jsonb language plpgsql stable security definer set search_path='' as $proof$
declare
  expected text; progress bytea:=''::bytea; total integer; off integer:=0;
  expiry bigint:=floor(extract(epoch from statement_timestamp()))::bigint+300;
  page jsonb; tokens text[]; item text; payload jsonb; final_hash text; final_total integer;
  done boolean; next_cursor jsonb;
  key text;
begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then
    raise insufficient_privilege using message='Authentication required.';end if;
  if p_limit is null or p_limit<1 or p_limit>100 or length(p_area_slug)>100
    or (p_area_slug is not null and not exists(select 1 from public.operations_areas where slug=p_area_slug and is_active))
    then raise invalid_parameter_value using message='Invalid Operations page request.';end if;
  if p_cursor is null then
    select encode(private.operations_chain(array_agg(token order by created_at desc,id desc)),'hex'),count(*)
      into expected,total from (  select u.id,u.created_at,
    -- Fixed typed fields only (UUID, xid, tuple coordinates, epoch); no user text
    -- can inject separators. Epoch makes this internal token timezone-independent.
    concat_ws('|',u.id::text,u.xmin::text,u.ctid::text,a.xmin::text,a.ctid::text,
      p.xmin::text,p.ctid::text,coalesce(s.xmin::text,'-'),coalesce(s.ctid::text,'-'),
      coalesce((select extract(epoch from max(c.created_at))::text from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes'),'-')) as token
  from public.operations_updates u
  join public.operations_areas a on a.id=u.area_id
  join public.profiles p on p.id=u.author_user_id
  left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
 where a.is_active and (p_area_slug is null or a.slug=p_area_slug)
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
    ) source;
  else
    if jsonb_typeof(p_cursor)<>'object' or octet_length(p_cursor::text)>512 then raise invalid_parameter_value using message='Invalid Operations cursor.';end if;
    -- Reject missing/null/wrong-type fields explicitly: JSON extraction returns
    -- SQL NULL for missing keys, which must never bypass a boolean check.
    if not (p_cursor ?& array['v','snapshot','total','offset','chain','expires','seal'])
      or (p_cursor-array['v','snapshot','total','offset','chain','expires','seal'])<>'{}'::jsonb
      or p_cursor->'v' is distinct from '1'::jsonb then raise invalid_parameter_value using message='Invalid Operations cursor.';end if;
    foreach key in array array['snapshot','chain','seal'] loop
      if jsonb_typeof(p_cursor->key) is distinct from 'string'
        or (p_cursor->>key) !~ '^[0-9a-f]{64}$' then raise invalid_parameter_value using message='Invalid Operations cursor.';end if;
    end loop;
    foreach key in array array['total','offset','expires'] loop
      if jsonb_typeof(p_cursor->key) is distinct from 'number'
        or (p_cursor->>key) !~ '^[0-9]{1,10}$' then raise invalid_parameter_value using message='Invalid Operations cursor.';end if;
    end loop;
    if (p_cursor->>'total')::bigint>2147483647 or (p_cursor->>'offset')::bigint>2147483647
      then raise invalid_parameter_value using message='Invalid Operations cursor.';end if;
    payload:=p_cursor-'seal';
    if not private.operations_chain_seal_matches(p_cursor->>'seal',private.operations_chain_seal(payload,p_area_slug)) then raise invalid_parameter_value using message='Invalid Operations cursor.';end if;
    expected:=payload->>'snapshot'; total:=(payload->>'total')::integer;
    off:=(payload->>'offset')::integer;expiry:=(payload->>'expires')::bigint;
    progress:=decode(payload->>'chain','hex');
    if expiry>floor(extract(epoch from statement_timestamp()))::bigint+300
      or off<1 or off>=total then raise invalid_parameter_value using message='Invalid Operations cursor.';end if;
    if expiry<=extract(epoch from statement_timestamp()) then
      raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';end if;
  end if;
  select coalesce(jsonb_agg(body order by created_at desc,id desc),'[]'),
    coalesce(array_agg(token order by created_at desc,id desc),array[]::text[])
    into page,tokens from (
  with selected as materialized (
    select u.id,u.created_at,u as update_row,a as area_row,p as profile_row,
      u.xmin as update_xmin,u.ctid as update_ctid,a.xmin as area_xmin,a.ctid as area_ctid,
      p.xmin as profile_xmin,p.ctid as profile_ctid from public.operations_updates u
    join public.operations_areas a on a.id=u.area_id and a.is_active
    join public.profiles p on p.id=u.author_user_id
    where (p_area_slug is null or a.slug=p_area_slug)
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
    order by u.created_at desc,u.id desc limit p_limit offset off
  )
  select u.id,u.created_at,
    -- Fixed typed fields only (UUID, xid, tuple coordinates, epoch); no user text
    -- can inject separators. Epoch makes this internal token timezone-independent.
    concat_ws('|',u.id::text,selected.update_xmin::text,selected.update_ctid::text,selected.area_xmin::text,selected.area_ctid::text,
      selected.profile_xmin::text,selected.profile_ctid::text,coalesce(s.xmin::text,'-'),coalesce(s.ctid::text,'-'),
      coalesce(extract(epoch from confirmation.confirmed)::text,'-')) as token,
    to_jsonb(details) as body
  from selected
  cross join lateral (select (selected.update_row).*) u
  cross join lateral (select (selected.area_row).*) a
  cross join lateral (select (selected.profile_row).*) p
  left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'

  left join lateral (select max(c.created_at) as confirmed from public.operations_update_confirmations c
    where c.update_id=u.id and c.revision=u.revision and c.response='yes' offset 0) confirmation on true
  cross join lateral (select u.id,a.slug as area_slug,a.display_name as area_name,u.category,u.message,
    u.stop_id,s.name as stop_name,s.address as stop_address,u.latitude,u.longitude,u.created_at,u.updated_at,
    u.expires_at,u.revision,u.status,u.edited,u.resolution_source,u.moderation_reason,u.author_user_id,
    p.username,p.profile_image_path,true as founding_driver,u.author_user_id=(select auth.uid()) as is_author,
    confirmation.confirmed as last_confirmed_at) details
  ) selected;
  foreach item in array tokens loop
    progress:=extensions.digest(progress||convert_to(item,'UTF8'),'sha256');
  end loop;
  done:=off+cardinality(tokens)>=total;
  if (total>0 and cardinality(tokens)=0) or off+cardinality(tokens)>total
    or (cardinality(tokens)<p_limit and off+cardinality(tokens)<total) then
    raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';end if;
  if done then
    if total=0 then progress:=extensions.digest('','sha256');end if;
    if p_cursor is not null then
      select encode(private.operations_chain(array_agg(token order by created_at desc,id desc)),'hex'),count(*)
        into final_hash,final_total from (  select u.id,u.created_at,
    -- Fixed typed fields only (UUID, xid, tuple coordinates, epoch); no user text
    -- can inject separators. Epoch makes this internal token timezone-independent.
    concat_ws('|',u.id::text,u.xmin::text,u.ctid::text,a.xmin::text,a.ctid::text,
      p.xmin::text,p.ctid::text,coalesce(s.xmin::text,'-'),coalesce(s.ctid::text,'-'),
      coalesce((select extract(epoch from max(c.created_at))::text from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes'),'-')) as token
  from public.operations_updates u
  join public.operations_areas a on a.id=u.area_id
  join public.profiles p on p.id=u.author_user_id
  left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
 where a.is_active and (p_area_slug is null or a.slug=p_area_slug)
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
    ) source;
      if final_hash is distinct from expected or final_total<>total then
        raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';end if;
    end if;
    if encode(progress,'hex') is distinct from expected then
      raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';end if;
  else
    payload:=jsonb_build_object('v',1,'snapshot',expected,'total',total,'offset',off+cardinality(tokens),
      'chain',encode(progress,'hex'),'expires',expiry);
    next_cursor:=payload||jsonb_build_object('seal',private.operations_chain_seal(payload,p_area_slug));
  end if;
  return jsonb_build_object('updates',page,'snapshot',expected,'offset',off,'total',total,
    'complete',done,'next_cursor',next_cursor);
end;
$proof$;

revoke all on function private.read_operations_active_page(text,integer,jsonb)
 from public,anon,authenticated,service_role;
