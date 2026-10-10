-- Experimental, transaction-only. Loaded by the local proof runner after BEGIN.
-- Not a migration and not an approved replacement API.
create function pg_temp.ops_chain_step(state bytea, token text) returns bytea
language sql immutable as $$
  select extensions.digest(coalesce(state,''::bytea)||convert_to(token,'UTF8'),'sha256');
$$;
create aggregate pg_temp.ops_chain(text) (sfunc=pg_temp.ops_chain_step,stype=bytea);

create function pg_temp.ops_source(p_area text,p_limit integer default null,p_offset integer default 0)
returns table(id uuid,created_at timestamptz,token text,body jsonb)
language sql stable as $$
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
    jsonb_build_object('id',u.id,'area_slug',a.slug,'area_name',a.display_name,
      'category',u.category,'message',u.message,'stop_id',u.stop_id,
      'stop_name',s.name,'stop_address',s.address,'latitude',u.latitude,'longitude',u.longitude,
      'created_at',u.created_at,'updated_at',u.updated_at,'expires_at',u.expires_at,
      'revision',u.revision,'status',u.status,'edited',u.edited,
      'resolution_source',u.resolution_source,'moderation_reason',u.moderation_reason,
      'author_user_id',u.author_user_id,'username',p.username,'profile_image_path',p.profile_image_path,
      'founding_driver',true,'is_author',u.author_user_id=auth.uid(),
      'last_confirmed_at',(select max(c.created_at) from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes'))
  from selected join public.operations_updates u on u.id=selected.id
  join public.operations_areas a on a.id=u.area_id
  join public.profiles p on p.id=u.author_user_id
  left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
  ;
$$;

create function pg_temp.ops_seal(payload jsonb,p_area text) returns text
language sql stable as $$
  select encode(extensions.hmac(convert_to(jsonb_build_array(
    'ops-chain-proof-v1',auth.uid(),p_area,payload)::text,'UTF8'),c.salt,'sha256'),'hex')
  from private.operations_read_guard_config c;
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
    then raise invalid_parameter_value;end if;
  if p_cursor is null then
    select encode(coalesce(pg_temp.ops_chain(token order by created_at desc,id desc),extensions.digest('','sha256')),'hex'),count(*)
      into expected,total from pg_temp.ops_source(p_area_slug);
  else
    if jsonb_typeof(p_cursor)<>'object' or octet_length(p_cursor::text)>512 then raise invalid_parameter_value;end if;
    -- Reject missing/null/wrong-type fields explicitly: JSON extraction returns
    -- SQL NULL for missing keys, which must never bypass a boolean check.
    if not (p_cursor ?& array['v','snapshot','total','offset','chain','expires','seal'])
      or (p_cursor-array['v','snapshot','total','offset','chain','expires','seal'])<>'{}'::jsonb
      or p_cursor->'v' is distinct from '1'::jsonb then raise invalid_parameter_value;end if;
    foreach key in array array['snapshot','chain','seal'] loop
      if jsonb_typeof(p_cursor->key) is distinct from 'string'
        or (p_cursor->>key) !~ '^[0-9a-f]{64}$' then raise invalid_parameter_value;end if;
    end loop;
    foreach key in array array['total','offset','expires'] loop
      if jsonb_typeof(p_cursor->key) is distinct from 'number'
        or (p_cursor->>key) !~ '^[0-9]{1,10}$' then raise invalid_parameter_value;end if;
    end loop;
    if (p_cursor->>'total')::bigint>2147483647 or (p_cursor->>'offset')::bigint>2147483647
      then raise invalid_parameter_value;end if;
    payload:=p_cursor-'seal';
    if p_cursor->>'seal' is distinct from pg_temp.ops_seal(payload,p_area_slug) then raise invalid_parameter_value;end if;
    expected:=payload->>'snapshot'; total:=(payload->>'total')::integer;
    off:=(payload->>'offset')::integer;expiry:=(payload->>'expires')::bigint;
    progress:=decode(payload->>'chain','hex');
    if expiry>floor(extract(epoch from statement_timestamp()))::bigint+300
      or off<1 or off>=total then raise invalid_parameter_value;end if;
    if expiry<=extract(epoch from statement_timestamp()) then
      raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';end if;
  end if;
  select coalesce(jsonb_agg(body order by created_at desc,id desc),'[]'),
    coalesce(array_agg(token order by created_at desc,id desc),array[]::text[])
    into page,tokens from (
      select * from pg_temp.ops_source(p_area_slug,p_limit,off)
    ) selected;
  foreach item in array tokens loop progress:=pg_temp.ops_chain_step(progress,item);end loop;
  done:=off+cardinality(tokens)>=total;
  if (total>0 and cardinality(tokens)=0) or off+cardinality(tokens)>total then
    raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';end if;
  if done then
    if total=0 then progress:=extensions.digest('','sha256');end if;
    if p_cursor is not null then
      select encode(coalesce(pg_temp.ops_chain(token order by created_at desc,id desc),extensions.digest('','sha256')),'hex'),count(*)
        into final_hash,final_total from pg_temp.ops_source(p_area_slug);
      if final_hash is distinct from expected or final_total<>total then
        raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';end if;
    end if;
    if encode(progress,'hex') is distinct from expected then
      raise sqlstate 'PT409' using message='Operations changed. Restart the refresh.';end if;
  else
    payload:=jsonb_build_object('v',1,'snapshot',expected,'total',total,'offset',off+cardinality(tokens),
      'chain',encode(progress,'hex'),'expires',expiry);
    next_cursor:=payload||jsonb_build_object('seal',pg_temp.ops_seal(payload,p_area_slug));
  end if;
  return jsonb_build_object('updates',page,'snapshot',expected,'offset',off,'total',total,
    'complete',done,'next_cursor',next_cursor);
end;
$proof$;
