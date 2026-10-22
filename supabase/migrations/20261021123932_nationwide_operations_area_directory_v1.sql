-- Nationwide Operations Area Directory V1.
-- Legacy rows and RPCs remain in place for already-released clients.

create table private.operations_area_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text not null unique,
  state_code text not null check (state_code ~ '^[A-Z]{2}$'),
  territory_slug text not null,
  territory_name text not null,
  sort_order integer not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.operations_areas
  add column if not exists state_code text,
  add column if not exists group_id uuid references private.operations_area_groups(id),
  add column if not exists is_directory_leaf boolean not null default false,
  add column if not exists service_geometry extensions.geometry(MultiPolygon,4326),
  add column if not exists directory_sort_order integer;

create index operations_areas_service_geometry_gist
  on public.operations_areas using gist(service_geometry)
  where service_geometry is not null;

create table private.operations_area_compatibility (
  legacy_area_id uuid primary key references public.operations_areas(id) on delete restrict,
  directory_area_id uuid not null references public.operations_areas(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (legacy_area_id <> directory_area_id)
);

create table private.operations_area_sources (
  area_id uuid not null references public.operations_areas(id) on delete cascade,
  source text not null check (source in ('cotrip','udot')),
  primary key(area_id,source)
);

revoke all on private.operations_area_groups from public, anon, authenticated, service_role;
revoke all on private.operations_area_compatibility from public, anon, authenticated, service_role;
revoke all on private.operations_area_sources from public, anon, authenticated, service_role;

insert into private.operations_area_groups
  (slug,display_name,state_code,territory_slug,territory_name,sort_order)
values
  ('western-colorado','Western Colorado','CO','grand-junction-territory','Grand Junction Territory',10),
  ('eastern-southeastern-utah','Eastern and Southeastern Utah','UT','grand-junction-territory','Grand Junction Territory',20),
  ('western-montana','Western Montana','MT','missoula-territory','Missoula Territory',30)
on conflict (slug) do update set
  display_name=excluded.display_name,state_code=excluded.state_code,
  territory_slug=excluded.territory_slug,territory_name=excluded.territory_name,
  sort_order=excluded.sort_order,is_active=true;

with definitions(slug,name,state_code,group_slug,sort_order,lat,lng,radius_m) as (values
  ('grand-valley-i-70','Grand Valley / I-70','CO','western-colorado',10,39.0639,-108.5506,72000.0),
  ('northwest-colorado','Northwest Colorado','CO','western-colorado',20,40.0875,-108.8048,100000.0),
  ('north-fork','North Fork','CO','western-colorado',30,38.8570,-107.9880,58000.0),
  ('montrose-area','Montrose Area','CO','western-colorado',40,38.4783,-107.8762,60000.0),
  ('gunnison-valley','Gunnison Valley','CO','western-colorado',50,38.5458,-106.9253,76000.0),
  ('san-juan-area','San Juan Area','CO','western-colorado',60,38.0228,-107.8123,72000.0),
  ('west-end','West End','CO','western-colorado',70,38.1500,-108.8500,105000.0),
  ('moab-area','Moab Area','UT','eastern-southeastern-utah',10,38.5733,-109.5498,85000.0),
  ('southeast-utah','Southeast Utah','UT','eastern-southeastern-utah',20,37.5000,-109.5500,120000.0),
  ('missoula-area','Missoula Area','MT','western-montana',10,46.9356982,-114.1106653,257495.0)
), inserted as (
  insert into public.operations_areas
    (slug,display_name,sort_order,anchor_lat,anchor_lng,is_active,state_code,group_id,
     is_directory_leaf,service_geometry,directory_sort_order)
  select d.slug,d.name,1000+d.sort_order+(g.sort_order*10),d.lat,d.lng,true,d.state_code,g.id,true,
    extensions.st_multi(extensions.st_buffer(
      extensions.st_setsrid(extensions.st_makepoint(d.lng,d.lat),4326)::extensions.geography,
      d.radius_m
    )::extensions.geometry),d.sort_order
  from definitions d join private.operations_area_groups g on g.slug=d.group_slug
  on conflict (slug) do update set
    display_name=excluded.display_name,anchor_lat=excluded.anchor_lat,anchor_lng=excluded.anchor_lng,
    is_active=true,state_code=excluded.state_code,group_id=excluded.group_id,is_directory_leaf=true,
    service_geometry=excluded.service_geometry,directory_sort_order=excluded.directory_sort_order
  returning id
)
select count(*) from inserted;

insert into private.operations_area_compatibility(legacy_area_id,directory_area_id)
select legacy.id,directory.id
from (values
  ('grand-junction','grand-valley-i-70'),('delta','north-fork'),('montrose','montrose-area'),
  ('ridgway','san-juan-area'),('ouray','san-juan-area'),('telluride','san-juan-area')
) mapping(legacy_slug,directory_slug)
join public.operations_areas legacy on legacy.slug=mapping.legacy_slug
join public.operations_areas directory on directory.slug=mapping.directory_slug
on conflict (legacy_area_id) do update set directory_area_id=excluded.directory_area_id;

insert into private.operations_area_sources(area_id,source)
select a.id,s.source from public.operations_areas a
cross join lateral (values(case a.state_code when 'CO' then 'cotrip' when 'UT' then 'udot' end)) s(source)
where a.is_directory_leaf and s.source is not null
on conflict do nothing;

create or replace function private.operations_scope_area_ids(p_scope_id text)
returns table(area_id uuid)
language sql stable security definer set search_path=''
as $$
  select distinct x.area_id from (
    select a.id area_id from public.operations_areas a
      where p_scope_id='area:'||a.slug and a.is_active and a.is_directory_leaf
    union all
    select a.id from public.operations_areas a join private.operations_area_groups g on g.id=a.group_id
      where p_scope_id='group:'||g.slug and g.is_active and a.is_active and a.is_directory_leaf
    union all
    select a.id from public.operations_areas a join private.operations_area_groups g on g.id=a.group_id
      where p_scope_id='territory:'||g.territory_slug and g.is_active and a.is_active and a.is_directory_leaf
    union all
    select c.legacy_area_id from private.operations_area_compatibility c
      where c.directory_area_id in (
        select d.id from public.operations_areas d left join private.operations_area_groups g on g.id=d.group_id
        where (p_scope_id='area:'||d.slug or p_scope_id='group:'||g.slug or
          p_scope_id='territory:'||g.territory_slug) and d.is_active and d.is_directory_leaf
      )
  ) x;
$$;

revoke all on function private.operations_scope_area_ids(text) from public,anon,authenticated,service_role;

create or replace function private.read_operations_area_directory_v1()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_groups jsonb; v_territories jsonb;
begin
  if current_setting('request.method',true) is distinct from 'POST' then raise sqlstate 'PT405' using message='POST required.'; end if;
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise insufficient_privilege; end if;
  select coalesce(jsonb_agg(group_row order by (group_row->>'sort_order')::integer),'[]') into v_groups
  from (
    select jsonb_build_object(
      'scope_id','group:'||g.slug,'slug',g.slug,'display_name',g.display_name,
      'state_code',g.state_code,'territory_scope_id','territory:'||g.territory_slug,
      'territory_name',g.territory_name,'sort_order',g.sort_order,
      'sources',coalesce((select jsonb_agg(distinct s.source order by s.source)
        from public.operations_areas sa join private.operations_area_sources s on s.area_id=sa.id
        where sa.group_id=g.id and sa.is_active),'[]'),
      'areas',coalesce((select jsonb_agg(jsonb_build_object(
        'scope_id','area:'||a.slug,'slug',a.slug,'display_name',a.display_name,
        'state_code',a.state_code,'sort_order',a.directory_sort_order,
        'latitude',a.anchor_lat,'longitude',a.anchor_lng,
        'sources',coalesce((select jsonb_agg(s.source order by s.source)
          from private.operations_area_sources s where s.area_id=a.id),'[]')
      ) order by a.directory_sort_order,a.display_name)
      from public.operations_areas a where a.group_id=g.id and a.is_active and a.is_directory_leaf),'[]')
    ) group_row from private.operations_area_groups g where g.is_active
  ) q;
  select coalesce(jsonb_agg(t order by t->>'display_name'),'[]') into v_territories from (
    select jsonb_build_object('scope_id','territory:'||g.territory_slug,
      'display_name',g.territory_name,'sources',coalesce(jsonb_agg(distinct s.source order by s.source)
      filter(where s.source is not null),'[]')) t
    from private.operations_area_groups g
    left join public.operations_areas a on a.group_id=g.id and a.is_active
    left join private.operations_area_sources s on s.area_id=a.id
    where g.is_active group by g.territory_slug,g.territory_name
  ) q;
  return jsonb_build_object('version',1,'territories',v_territories,'groups',v_groups);
end;
$$;

create or replace function public.read_operations_area_directory_guarded_v1()
returns jsonb language sql set search_path=''
as $$ select private.read_operations_area_directory_v1(); $$;
revoke all on function public.read_operations_area_directory_guarded_v1() from public,anon;
grant execute on function public.read_operations_area_directory_guarded_v1() to authenticated;

create or replace function private.read_operations_scope_v2(
  p_scope_id text,p_limit integer default 100,p_cursor jsonb default null)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='2s'
as $$
declare
  v_offset integer:=0; v_total integer; v_snapshot text; v_rows jsonb; v_next jsonb;
  v_payload jsonb; v_expiry bigint:=floor(extract(epoch from statement_timestamp()))::bigint+300;
  v_wait integer; v_delivered integer; v_user uuid:=auth.uid();
  v_config private.operations_read_guard_config%rowtype;
  v_bucket private.operations_read_guard_buckets%rowtype;
  v_actor bytea; v_now timestamptz; v_elapsed numeric;
begin
  if current_setting('request.method',true) is distinct from 'POST' then raise sqlstate 'PT405' using message='POST required.'; end if;
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise insufficient_privilege; end if;
  if p_scope_id is null or length(p_scope_id)>120 or p_limit is null or p_limit<1 or p_limit>100
    or not exists(select 1 from private.operations_scope_area_ids(p_scope_id))
    or octet_length(coalesce(p_cursor,'{}')::text)>768 then raise invalid_parameter_value; end if;
  v_wait:=private.security_pause_seconds();
  if v_wait>0 then
    perform set_config('response.status','429',true);
    return jsonb_build_object('code','OPERATIONS_READ_THROTTLED','data',null,
      'details',jsonb_build_object('retry_after_seconds',v_wait)::text);
  end if;
  select * into strict v_config from private.operations_read_guard_config;
  if not v_config.enabled then
    perform set_config('response.status','503',true);
    return jsonb_build_object('code','OPERATIONS_READ_NOT_CONFIGURED','data',null);
  end if;
  v_actor:=extensions.hmac(convert_to(v_user::text,'UTF8'),v_config.salt,'sha256');
  insert into private.operations_read_guard_buckets(actor_key,requests,remaining_rows,updated_at)
    values(v_actor,v_config.request_capacity,v_config.row_capacity,clock_timestamp()) on conflict do nothing;
  select * into strict v_bucket from private.operations_read_guard_buckets where actor_key=v_actor for update;
  v_now:=clock_timestamp();
  v_elapsed:=greatest(extract(epoch from v_now-v_bucket.updated_at),0);
  v_bucket.requests:=least(v_config.request_capacity,v_bucket.requests+v_elapsed*v_config.request_refill);
  v_bucket.remaining_rows:=least(v_config.row_capacity,v_bucket.remaining_rows+v_elapsed*v_config.row_refill);
  if v_bucket.requests<1 or v_bucket.remaining_rows<1 then
    v_wait:=greatest(1,ceil(greatest(
      (1-v_bucket.requests)/v_config.request_refill,
      (1-v_bucket.remaining_rows)/v_config.row_refill
    ))::integer);
    update private.operations_read_guard_buckets b set requests=v_bucket.requests,
      remaining_rows=v_bucket.remaining_rows,updated_at=v_now,denied=b.denied+1 where b.actor_key=v_actor;
    perform set_config('response.status','429',true);
    return jsonb_build_object('code','OPERATIONS_READ_THROTTLED','data',null,
      'details',jsonb_build_object('retry_after_seconds',v_wait)::text);
  end if;
  v_bucket.requests:=v_bucket.requests-1;
  select encode(extensions.digest(convert_to(coalesce(string_agg(
      u.id::text||':'||u.xmin::text||':'||extract(epoch from u.updated_at)::text,
      '|' order by u.created_at desc,u.id desc),''),'UTF8'),'sha256'),'hex'),count(*)
    into v_snapshot,v_total
  from public.operations_updates u
  where u.area_id in(select area_id from private.operations_scope_area_ids(p_scope_id))
    and u.status in('active','possibly_cleared') and u.moderation_status='visible'
    and u.expires_at>statement_timestamp()
    and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
      where b.blocking_user_id=auth.uid());
  if p_cursor is not null then
    if jsonb_typeof(p_cursor)<>'object' or not (p_cursor ?& array['v','snapshot','total','offset','chain','expires','seal'])
      or (p_cursor-array['v','snapshot','total','offset','chain','expires','seal'])<>'{}'::jsonb
      or p_cursor->'v' is distinct from '1'::jsonb
      or p_cursor->>'snapshot'<>v_snapshot
      or p_cursor->>'chain'<>v_snapshot or (p_cursor->>'total')::integer<>v_total
      or (p_cursor->>'offset') !~ '^[0-9]{1,10}$' or (p_cursor->>'expires') !~ '^[0-9]{1,10}$'
      or not private.operations_chain_seal_matches(p_cursor->>'seal',
        private.operations_chain_seal(p_cursor-'seal',p_scope_id)) then raise invalid_parameter_value; end if;
    v_offset:=(p_cursor->>'offset')::integer; v_expiry:=(p_cursor->>'expires')::bigint;
    if v_offset<1 or v_offset>=v_total or v_expiry<=extract(epoch from statement_timestamp()) then
      raise sqlstate 'PT409'; end if;
  end if;
  select coalesce(jsonb_agg(to_jsonb(details) order by details.created_at desc,details.id desc),'[]') into v_rows
  from (
    select u.id,a.slug area_slug,a.display_name area_name,u.category,u.message,u.stop_id,
      s.name stop_name,s.address stop_address,u.latitude,u.longitude,u.created_at,u.updated_at,
      u.expires_at,u.revision,u.status,u.edited,u.resolution_source,u.moderation_reason,
      u.author_user_id,p.username,p.profile_image_path,true founding_driver,
      u.author_user_id=auth.uid() is_author,
      (select max(c.created_at) from public.operations_update_confirmations c
       where c.update_id=u.id and c.revision=u.revision and c.response='yes') last_confirmed_at
    from public.operations_updates u join public.operations_areas a on a.id=u.area_id
    join public.profiles p on p.id=u.author_user_id
    left join public.mfi_stops s on s.id=u.stop_id and s.moderation_status='visible'
    where u.area_id in(select area_id from private.operations_scope_area_ids(p_scope_id))
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=auth.uid())
    order by u.created_at desc,u.id desc limit p_limit offset v_offset
  ) details;
  v_delivered:=jsonb_array_length(v_rows);
  if v_delivered>v_bucket.remaining_rows then
    v_wait:=greatest(1,ceil((v_delivered-v_bucket.remaining_rows)/v_config.row_refill)::integer);
    update private.operations_read_guard_buckets b set requests=v_bucket.requests,
      remaining_rows=v_bucket.remaining_rows,updated_at=v_now,denied=b.denied+1 where b.actor_key=v_actor;
    perform set_config('response.status','429',true);
    return jsonb_build_object('code','OPERATIONS_READ_THROTTLED','data',null,
      'details',jsonb_build_object('retry_after_seconds',v_wait)::text);
  end if;
  v_bucket.remaining_rows:=v_bucket.remaining_rows-v_delivered;
  if v_offset+v_delivered<v_total then
    v_payload:=jsonb_build_object('v',1,'snapshot',v_snapshot,'total',v_total,
      'offset',v_offset+v_delivered,'chain',v_snapshot,'expires',v_expiry);
    v_next:=v_payload||jsonb_build_object('seal',private.operations_chain_seal(v_payload,p_scope_id));
  end if;
  begin perform private.record_security_read(false,v_delivered); exception when others then null; end;
  update private.operations_read_guard_buckets b set requests=v_bucket.requests,
    remaining_rows=v_bucket.remaining_rows,updated_at=v_now,admitted=b.admitted+1,
    delivered_rows=b.delivered_rows+v_delivered where b.actor_key=v_actor;
  return jsonb_build_object('code',null,'data',jsonb_build_object('updates',v_rows,'snapshot',v_snapshot,
    'offset',v_offset,'total',v_total,'complete',v_next is null,'next_cursor',v_next));
exception
  when insufficient_privilege or sqlstate 'PT405' then raise;
  when sqlstate 'PT409' then perform set_config('response.status','409',true);
    return jsonb_build_object('code','OPERATIONS_READ_CHANGED','data',null);
  when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then
    perform set_config('response.status','400',true);
    return jsonb_build_object('code','OPERATIONS_READ_INVALID','data',null);
  when others then perform set_config('response.status','503',true);
    return jsonb_build_object('code','OPERATIONS_READ_UNAVAILABLE','data',null);
end;
$$;

create or replace function public.read_operations_scope_guarded_v2(
  p_scope_id text,p_limit integer default 100,p_cursor jsonb default null)
returns jsonb language sql set search_path=''
as $$ select private.read_operations_scope_v2(p_scope_id,p_limit,p_cursor); $$;
revoke all on function public.read_operations_scope_guarded_v2(text,integer,jsonb) from public,anon;
grant execute on function public.read_operations_scope_guarded_v2(text,integer,jsonb) to authenticated;

alter function public.ingest_official_snapshot_v2(text,text,uuid,jsonb,boolean,timestamptz,text)
  rename to ingest_official_snapshot_anchor_compat_v2;
revoke all on function public.ingest_official_snapshot_anchor_compat_v2(
  text,text,uuid,jsonb,boolean,timestamptz,text) from public,anon,authenticated,service_role;

create function public.ingest_official_snapshot_v2(
  p_source text,p_feed_type text,p_snapshot_id uuid,p_records jsonb,p_complete boolean,
  p_fetched_at timestamptz,p_error_code text default null
) returns jsonb language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare v_result jsonb;
begin
  if current_user not in ('service_role','postgres') then raise insufficient_privilege; end if;
  v_result:=public.ingest_official_snapshot_anchor_compat_v2(
    p_source,p_feed_type,p_snapshot_id,p_records,p_complete,p_fetched_at,p_error_code);
  if v_result->>'accepted'='true' then
    delete from private.operations_official_condition_areas ca
    using private.operations_official_conditions c,public.operations_areas a
    where ca.condition_id=c.id and ca.area_id=a.id and a.is_directory_leaf
      and c.source=p_source and c.feed_type=p_feed_type;
    insert into private.operations_official_condition_areas(condition_id,area_id)
    select c.id,a.id
    from private.operations_official_conditions c
    join private.operations_area_sources s on s.source=c.source
    join public.operations_areas a on a.id=s.area_id and a.is_active and a.is_directory_leaf
    where c.source=p_source and c.feed_type=p_feed_type and c.inactive_at is null
      and c.source_geometry is not null and a.service_geometry is not null
      and extensions.st_intersects(c.source_geometry,a.service_geometry)
    on conflict do nothing;
  end if;
  return v_result;
end;
$$;
revoke all on function public.ingest_official_snapshot_v2(
  text,text,uuid,jsonb,boolean,timestamptz,text) from public,anon,authenticated;
grant execute on function public.ingest_official_snapshot_v2(
  text,text,uuid,jsonb,boolean,timestamptz,text) to service_role;

delete from private.operations_official_condition_areas ca
using public.operations_areas a
where ca.area_id=a.id and a.is_directory_leaf;
insert into private.operations_official_condition_areas(condition_id,area_id)
select c.id,a.id
from private.operations_official_conditions c
join private.operations_area_sources s on s.source=c.source
join public.operations_areas a on a.id=s.area_id and a.is_active and a.is_directory_leaf
where c.inactive_at is null and c.source_geometry is not null and a.service_geometry is not null
  and extensions.st_intersects(c.source_geometry,a.service_geometry)
on conflict do nothing;

create or replace function private.read_official_conditions_v3(p_scope_id text,p_source_filter text)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='2s'
as $$
declare result jsonb; health jsonb;
begin
  if current_setting('request.method',true) is distinct from 'POST' then raise sqlstate 'PT405' using message='POST required.'; end if;
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise insufficient_privilege; end if;
  if p_scope_id is null or length(p_scope_id)>120 or p_source_filter not in ('all','drivers','cotrip','udot')
    or not exists(select 1 from private.operations_scope_area_ids(p_scope_id)) then raise invalid_parameter_value; end if;
  if p_source_filter in ('cotrip','udot') and not exists(
    select 1 from private.operations_scope_area_ids(p_scope_id) ids
    join private.operations_area_sources s on s.area_id=ids.area_id and s.source=p_source_filter
  ) then raise invalid_parameter_value; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_at desc,x.id desc),'[]') into result from (
    select c.source||':'||c.feed_type||':'||c.source_id id,c.source,c.feed_type,c.source_type,
      c.category,c.route_name,c.message,c.direction,c.schedule,c.lane_impacts,c.restrictions,
      c.jurisdictions,c.severity,c.starts_at,c.clears_at,c.source_updated_at,c.geometry_json geometry,
      c.first_seen_at,c.last_seen_at,c.last_seen_at sort_at,
      coalesce(jsonb_agg(distinct jsonb_build_object('slug',a.slug,'name',a.display_name))
        filter(where a.id is not null),'[]') areas
    from private.operations_official_conditions c
    join private.operations_official_condition_areas ca on ca.condition_id=c.id
    join public.operations_areas a on a.id=ca.area_id and a.is_active
    where p_source_filter<>'drivers' and c.inactive_at is null
      and c.last_seen_at>clock_timestamp()-interval '2 hours'
      and (p_source_filter='all' or c.source=p_source_filter)
      and ca.area_id in(select area_id from private.operations_scope_area_ids(p_scope_id))
    group by c.id order by c.last_seen_at desc,c.id desc limit 500
  ) x;
  select jsonb_object_agg(f.source||':'||f.feed_type,jsonb_build_object(
    'source',f.source,'feed_type',f.feed_type,
    'status',case when h.last_success_at is null or h.last_success_at<=clock_timestamp()-interval '2 hours' then 'unavailable'
      when h.last_success_at<=clock_timestamp()-interval '30 minutes' then 'delayed' else h.status end,
    'last_success_at',h.last_success_at,'last_attempt_at',h.last_attempt_at,'record_count',coalesce(h.record_count,0)
  )) into health from (values ('cotrip','incidents'),('cotrip','planned_events'),
    ('udot','events'),('udot','road_conditions')) f(source,feed_type)
  left join private.operations_official_feed_health h on h.source=f.source and h.feed_type=f.feed_type
  where exists(select 1 from private.operations_scope_area_ids(p_scope_id) ids
    join private.operations_area_sources s on s.area_id=ids.area_id and s.source=f.source);
  return jsonb_build_object('code',null,'data',jsonb_build_object('conditions',result,'feed_health',coalesce(health,'{}')));
exception
  when insufficient_privilege or sqlstate 'PT405' then raise;
  when invalid_parameter_value then perform set_config('response.status','400',true);
    return jsonb_build_object('code','OPERATIONS_READ_INVALID','data',null);
  when others then perform set_config('response.status','503',true);
    return jsonb_build_object('code','OPERATIONS_READ_UNAVAILABLE','data',null);
end;
$$;

create or replace function public.read_official_conditions_guarded_v3(
  p_scope_id text,p_source_filter text default 'all') returns jsonb language sql set search_path=''
as $$ select private.read_official_conditions_v3(p_scope_id,p_source_filter); $$;
revoke all on function public.read_official_conditions_guarded_v3(text,text) from public,anon;
grant execute on function public.read_official_conditions_guarded_v3(text,text) to authenticated;

create or replace function public.create_operations_update(
  p_area_slug text,p_category text,p_message text,p_expires_at timestamptz,
  p_stop_id text default null,p_latitude double precision default null,
  p_longitude double precision default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_user uuid:=auth.uid(); v_area public.operations_areas%rowtype; v_id uuid;
  v_now timestamptz:=now(); v_lat double precision:=p_latitude; v_lng double precision:=p_longitude;
begin
  if not private.can_contribute_operations(v_user) then raise insufficient_privilege using message='Operations posting access required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,0));
  if exists(select 1 from public.operations_updates where author_user_id=v_user and created_at>v_now-interval '1 minute')
    then raise check_violation using message='Please wait before posting another update'; end if;
  if (select count(*) from public.operations_updates where author_user_id=v_user
      and status in('active','possibly_cleared') and moderation_status='visible' and expires_at>v_now)>=10
    then raise check_violation using message='Active update limit reached'; end if;
  if (select count(*) from public.operations_updates where author_user_id=v_user
      and created_at>v_now-interval '24 hours')>=20
    then raise check_violation using message='Daily update limit reached'; end if;
  select * into v_area from public.operations_areas where slug=p_area_slug and is_active;
  if not found then raise check_violation using message='Choose a supported Operations area'; end if;
  if p_stop_id is not null then
    select lat,lng into v_lat,v_lng from public.mfi_stops where id=p_stop_id and moderation_status='visible';
    if not found then raise check_violation using message='Choose a visible FreightIQ stop'; end if;
  end if;
  if v_lat is not null and (
    (v_area.is_directory_leaf and v_area.service_geometry is not null and not extensions.st_covers(
      v_area.service_geometry,extensions.st_setsrid(extensions.st_makepoint(v_lng,v_lat),4326)))
    or (not v_area.is_directory_leaf and extensions.st_distance(
      extensions.st_setsrid(extensions.st_makepoint(v_lng,v_lat),4326)::extensions.geography,
      extensions.st_setsrid(extensions.st_makepoint(v_area.anchor_lng,v_area.anchor_lat),4326)::extensions.geography
    )>80467.2)
  ) then raise check_violation using message='The selected location is outside this Operations area'; end if;
  insert into public.operations_updates(author_user_id,area_id,category,message,expires_at,stop_id,latitude,longitude)
  values(v_user,v_area.id,p_category,btrim(p_message),p_expires_at,p_stop_id,v_lat,v_lng) returning id into v_id;
  return v_id;
end;
$$;

-- Keep configuration server-owned. The old table grant is no longer needed by current clients.
drop policy if exists operations_areas_authenticated_read on public.operations_areas;
revoke select on public.operations_areas from authenticated;
