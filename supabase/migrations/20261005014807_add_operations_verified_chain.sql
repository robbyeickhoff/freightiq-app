-- Local candidate: signed five-minute cursors; publish only after final verification.
-- No new retained content, contribution triggers, grants or enabled policy.
create or replace function private.operations_chain_step(state bytea, token text) returns bytea
language sql immutable set search_path='' as $$
  select extensions.digest(coalesce(state,''::bytea)||convert_to(token,'UTF8'),'sha256');
$$;
create or replace function private.operations_chain(tokens text[]) returns bytea
language plpgsql immutable set search_path='' as $$
declare result bytea:=''::bytea; token text;
begin
  if coalesce(cardinality(tokens),0)=0 then return extensions.digest('','sha256');end if;
  foreach token in array tokens loop
    result:=extensions.digest(result||convert_to(token,'UTF8'),'sha256');
  end loop;
  return result;
end;
$$;

create or replace function private.operations_chain_source(p_area text,p_limit integer default null,p_offset integer default 0,p_body boolean default true)
returns table(id uuid,created_at timestamptz,token text,body jsonb)
language sql stable set search_path='' as $$
  with candidates as materialized (
    select u.id,u.author_user_id,u.created_at from public.operations_updates u
    where (u.area_id in(select a.id from public.operations_areas a
      where a.is_active and (p_area is null or a.slug=p_area))) is true
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
  ), authors as materialized (
    select p.id from public.profiles p where p.id in(select author_user_id from candidates)
  ), selected as materialized (
    select c.id from candidates c where (c.author_user_id in(select id from authors)) is true
    order by c.created_at desc,c.id desc limit p_limit offset p_offset
  )
  select u.id,u.created_at,
    -- Fixed typed fields only (UUID, xid, tuple coordinates, epoch); no user text
    -- can inject separators. Epoch makes this internal token timezone-independent.
    concat_ws('|',u.id::text,u.xmin::text,u.ctid::text,a.xmin::text,a.ctid::text,
      p.xmin::text,p.ctid::text,coalesce(s.xmin::text,'-'),coalesce(s.ctid::text,'-'),
      coalesce((select extract(epoch from max(c.created_at))::text from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes'),'-')),
    case when p_body then jsonb_build_object('id',u.id,'area_slug',a.slug,'area_name',a.display_name,
      'category',u.category,'message',u.message,'stop_id',u.stop_id,
      'stop_name',s.name,'stop_address',s.address,'latitude',u.latitude,'longitude',u.longitude,
      'created_at',u.created_at,'updated_at',u.updated_at,'expires_at',u.expires_at,
      'revision',u.revision,'status',u.status,'edited',u.edited,
      'resolution_source',u.resolution_source,'moderation_reason',u.moderation_reason,
      'author_user_id',u.author_user_id,'username',p.username,'profile_image_path',p.profile_image_path,
      'founding_driver',true,'is_author',u.author_user_id=auth.uid(),
      'last_confirmed_at',(select max(c.created_at) from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes')) end
  from selected join public.operations_updates u on u.id=selected.id
  join public.operations_areas a on a.id=u.area_id
  join public.profiles p on p.id=u.author_user_id
  left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
  ;
$$;

create or replace function private.operations_chain_seal(payload jsonb,p_area text) returns text
language sql stable set search_path='' as $$
  select encode(extensions.hmac(convert_to(jsonb_build_array(
    'freightiq-operations-chain-v1',auth.uid(),p_area,payload)::text,'UTF8'),c.salt,'sha256'),'hex')
  from private.operations_read_guard_config c;
$$;

-- Compare all 32 bytes without returning at the first mismatch. SQL/runtime
-- execution is not claimed to provide a formally constant-time primitive.
create or replace function private.operations_chain_seal_matches(a text,b text) returns boolean
language plpgsql immutable set search_path='' as $$
declare x bytea; y bytea; difference integer:=0;
begin
  if a is null or b is null or a !~ '^[0-9a-f]{64}$' or b !~ '^[0-9a-f]{64}$' then return false;end if;
  x:=decode(a,'hex');y:=decode(b,'hex');
  for i in 0..31 loop difference:=difference | (get_byte(x,i) # get_byte(y,i));end loop;
  return difference=0;
end;
$$;

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
      into expected,total from (
  with candidates as materialized (
    select u.id,u.author_user_id,u.created_at from public.operations_updates u
    where (u.area_id in(select a.id from public.operations_areas a
      where a.is_active and (p_area_slug is null or a.slug=p_area_slug))) is true
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
  ), authors as materialized (
    select p.id from public.profiles p where p.id in(select author_user_id from candidates)
  ), selected as materialized (
    select c.id from candidates c where (c.author_user_id in(select id from authors)) is true
    order by c.created_at desc,c.id desc limit null offset 0
  )
  select u.id,u.created_at,
    -- Fixed typed fields only (UUID, xid, tuple coordinates, epoch); no user text
    -- can inject separators. Epoch makes this internal token timezone-independent.
    concat_ws('|',u.id::text,u.xmin::text,u.ctid::text,a.xmin::text,a.ctid::text,
      p.xmin::text,p.ctid::text,coalesce(s.xmin::text,'-'),coalesce(s.ctid::text,'-'),
      coalesce((select extract(epoch from max(c.created_at))::text from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes'),'-')) as token,
    case when false then jsonb_build_object('id',u.id,'area_slug',a.slug,'area_name',a.display_name,
      'category',u.category,'message',u.message,'stop_id',u.stop_id,
      'stop_name',s.name,'stop_address',s.address,'latitude',u.latitude,'longitude',u.longitude,
      'created_at',u.created_at,'updated_at',u.updated_at,'expires_at',u.expires_at,
      'revision',u.revision,'status',u.status,'edited',u.edited,
      'resolution_source',u.resolution_source,'moderation_reason',u.moderation_reason,
      'author_user_id',u.author_user_id,'username',p.username,'profile_image_path',p.profile_image_path,
      'founding_driver',true,'is_author',u.author_user_id=auth.uid(),
      'last_confirmed_at',(select max(c.created_at) from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes')) end as body
  from selected join public.operations_updates u on u.id=selected.id
  join public.operations_areas a on a.id=u.area_id
  join public.profiles p on p.id=u.author_user_id
  left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
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
        with candidates as materialized (
    select u.id,u.author_user_id,u.created_at from public.operations_updates u
    where (u.area_id in(select a.id from public.operations_areas a
      where a.is_active and (p_area_slug is null or a.slug=p_area_slug))) is true
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
  ), authors as materialized (
    select p.id from public.profiles p where p.id in(select author_user_id from candidates)
  ), selected as materialized (
    select c.id from candidates c where (c.author_user_id in(select id from authors)) is true
    order by c.created_at desc,c.id desc limit p_limit offset off
  )
  select u.id,u.created_at,
    -- Fixed typed fields only (UUID, xid, tuple coordinates, epoch); no user text
    -- can inject separators. Epoch makes this internal token timezone-independent.
    concat_ws('|',u.id::text,u.xmin::text,u.ctid::text,a.xmin::text,a.ctid::text,
      p.xmin::text,p.ctid::text,coalesce(s.xmin::text,'-'),coalesce(s.ctid::text,'-'),
      coalesce((select extract(epoch from max(c.created_at))::text from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes'),'-')) as token,
    case when true then jsonb_build_object('id',u.id,'area_slug',a.slug,'area_name',a.display_name,
      'category',u.category,'message',u.message,'stop_id',u.stop_id,
      'stop_name',s.name,'stop_address',s.address,'latitude',u.latitude,'longitude',u.longitude,
      'created_at',u.created_at,'updated_at',u.updated_at,'expires_at',u.expires_at,
      'revision',u.revision,'status',u.status,'edited',u.edited,
      'resolution_source',u.resolution_source,'moderation_reason',u.moderation_reason,
      'author_user_id',u.author_user_id,'username',p.username,'profile_image_path',p.profile_image_path,
      'founding_driver',true,'is_author',u.author_user_id=auth.uid(),
      'last_confirmed_at',(select max(c.created_at) from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes')) end as body
  from selected join public.operations_updates u on u.id=selected.id
  join public.operations_areas a on a.id=u.area_id
  join public.profiles p on p.id=u.author_user_id
  left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
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
        into final_hash,final_total from (
  with candidates as materialized (
    select u.id,u.author_user_id,u.created_at from public.operations_updates u
    where (u.area_id in(select a.id from public.operations_areas a
      where a.is_active and (p_area_slug is null or a.slug=p_area_slug))) is true
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
  ), authors as materialized (
    select p.id from public.profiles p where p.id in(select author_user_id from candidates)
  ), selected as materialized (
    select c.id from candidates c where (c.author_user_id in(select id from authors)) is true
    order by c.created_at desc,c.id desc limit null offset 0
  )
  select u.id,u.created_at,
    -- Fixed typed fields only (UUID, xid, tuple coordinates, epoch); no user text
    -- can inject separators. Epoch makes this internal token timezone-independent.
    concat_ws('|',u.id::text,u.xmin::text,u.ctid::text,a.xmin::text,a.ctid::text,
      p.xmin::text,p.ctid::text,coalesce(s.xmin::text,'-'),coalesce(s.ctid::text,'-'),
      coalesce((select extract(epoch from max(c.created_at))::text from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes'),'-')) as token,
    case when false then jsonb_build_object('id',u.id,'area_slug',a.slug,'area_name',a.display_name,
      'category',u.category,'message',u.message,'stop_id',u.stop_id,
      'stop_name',s.name,'stop_address',s.address,'latitude',u.latitude,'longitude',u.longitude,
      'created_at',u.created_at,'updated_at',u.updated_at,'expires_at',u.expires_at,
      'revision',u.revision,'status',u.status,'edited',u.edited,
      'resolution_source',u.resolution_source,'moderation_reason',u.moderation_reason,
      'author_user_id',u.author_user_id,'username',p.username,'profile_image_path',p.profile_image_path,
      'founding_driver',true,'is_author',u.author_user_id=auth.uid(),
      'last_confirmed_at',(select max(c.created_at) from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes')) end as body
  from selected join public.operations_updates u on u.id=selected.id
  join public.operations_areas a on a.id=u.area_id
  join public.profiles p on p.id=u.author_user_id
  left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
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

revoke all on function private.operations_chain_step(bytea,text),
 private.operations_chain(text[]),private.operations_chain_source(text,integer,integer,boolean),
 private.operations_chain_seal(jsonb,text),private.operations_chain_seal_matches(text,text),private.read_operations_active_page(text,integer,jsonb)
 from public,anon,authenticated,service_role;
