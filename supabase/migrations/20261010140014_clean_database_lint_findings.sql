-- Narrow cleanup of existing database-lint findings. No API, grant, policy,
-- threshold, collection ordering, or returned-data change.

create or replace function private.security_pause_seconds()
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_actor_key bytea;
  v_paused_until timestamptz;
begin
  if v_user_id is null or not exists(select 1 from auth.users where id=v_user_id) then
    raise insufficient_privilege using message='Authentication required.';
  end if;

  select extensions.hmac(
    pg_catalog.convert_to(v_user_id::text,'UTF8'),
    config.salt,
    'sha256'
  ) into v_actor_key
  from private.security_response_config config;

  select security_case.paused_until into v_paused_until
  from private.security_read_cases security_case
  where security_case.actor_key=v_actor_key
    and security_case.expires_at>pg_catalog.clock_timestamp();

  return greatest(
    0,
    pg_catalog.ceil(
      extract(epoch from v_paused_until-pg_catalog.clock_timestamp())
    )::integer
  );
end;
$function$;

do $migration$
declare
  v_oid regprocedure;
  v_definition text;
begin
  foreach v_oid in array array[
    'public.list_freightiq_city_stops_v2(text,text,text,integer,jsonb)'::regprocedure,
    'public.list_freightiq_driver_stops_v2(uuid,integer,jsonb)'::regprocedure
  ] loop
    select pg_catalog.pg_get_functiondef(v_oid::oid) into v_definition;
    if position('v_rows jsonb := ''[]'';' in v_definition)>0 then
      v_definition:=pg_catalog.replace(
        v_definition,
        'v_rows jsonb := ''[]'';',
        'v_rows jsonb := ''[]''::jsonb;'
      );
    elsif position('v_rows jsonb := ''[]''::jsonb;' in v_definition)=0 then
      raise exception 'Expected collection JSONB initializer was not found in %',v_oid;
    end if;
    if v_oid='public.list_freightiq_driver_stops_v2(uuid,integer,jsonb)'::regprocedure then
      if position('  v_city text := null;' in v_definition)>0
        or position('  v_state text := null;' in v_definition)>0
        or position('  v_country text := null;' in v_definition)>0 then
        v_definition:=pg_catalog.replace(v_definition,'  v_city text := null;'||E'\n','');
        v_definition:=pg_catalog.replace(v_definition,'  v_state text := null;'||E'\n','');
        v_definition:=pg_catalog.replace(v_definition,'  v_country text := null;'||E'\n','');
      end if;
    end if;
    execute v_definition;
  end loop;
end;
$migration$;
