-- Own-stop editor read, separate from shared-library disclosure budgets.
-- No trusted-editor/moderator override: those roles must not gain an unmetered library read.
create function private.read_owned_freightiq_stop_editor(p_stop_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_stop jsonb;
begin
  if v_user_id is null or not exists (select 1 from auth.users where id = v_user_id) then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null
     or pg_catalog.octet_length(p_stop_id) > 1024 then
    raise exception using errcode = '22023', message = 'A valid stop ID is required.';
  end if;
  select pg_catalog.jsonb_build_object(
    'id', s.id, 'name', s.name, 'address', s.address,
    'lat', s.lat, 'lng', s.lng, 'entrance_lat', s.entrance_lat, 'entrance_lng', s.entrance_lng
  ) into v_stop
  from public.mfi_stops s
  where s.id = p_stop_id and s.user_id = v_user_id;
  return v_stop;
end;
$function$;

create function public.get_owned_freightiq_stop_editor_v1(p_stop_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.read_owned_freightiq_stop_editor(p_stop_id);
$function$;

revoke all on function private.read_owned_freightiq_stop_editor(text) from public, anon, authenticated, service_role;
revoke all on function public.get_owned_freightiq_stop_editor_v1(text) from public, anon, authenticated, service_role;
grant execute on function private.read_owned_freightiq_stop_editor(text) to authenticated;
grant execute on function public.get_owned_freightiq_stop_editor_v1(text) to authenticated;
