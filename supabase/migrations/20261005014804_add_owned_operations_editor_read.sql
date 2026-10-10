-- Author-scoped editor prerequisite, independent of shared feed/read budgets.
-- A post author does not necessarily own its attached stop. Never join stop metadata here.
create function private.read_owned_operations_editor(p_update_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_user is null or not exists (select 1 from auth.users where id = v_user) then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_update_id is null then
    raise exception using errcode = '22023', message = 'An update ID is required.';
  end if;
  -- Preserve current own-history visibility: active areas, caller's last seven days.
  -- Readability does not grant permission to edit removed posts or bypass posting eligibility.
  select pg_catalog.jsonb_build_object(
    'id', u.id, 'area_slug', a.slug, 'category', u.category, 'message', u.message,
    'expires_at', u.expires_at, 'stop_id', u.stop_id,
    'latitude', u.latitude, 'longitude', u.longitude
  ) into v_result
  from public.operations_updates u
  join public.operations_areas a on a.id = u.area_id
  where u.id = p_update_id and u.author_user_id = v_user
    and a.is_active and u.created_at > now() - interval '7 days';
  return v_result;
end;
$function$;

create function public.get_owned_operations_editor_v1(p_update_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.read_owned_operations_editor(p_update_id);
$function$;

revoke all on function private.read_owned_operations_editor(uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_owned_operations_editor_v1(uuid) from public, anon, authenticated, service_role;
grant execute on function private.read_owned_operations_editor(uuid) to authenticated;
grant execute on function public.get_owned_operations_editor_v1(uuid) to authenticated;
