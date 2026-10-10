-- Contribution-only read. No shared stop, profile, reputation or other-driver data.
-- The public wrapper is invoker; the privileged implementation is not exposed.
create function private.read_owned_freightiq_report(p_stop_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_report jsonb;
begin
  if v_user_id is null or not exists (select 1 from auth.users where id = v_user_id) then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_stop_id, '')), '') is null
     or pg_catalog.octet_length(p_stop_id) > 1024 then
    raise exception using errcode = '22023', message = 'A valid stop ID is required.';
  end if;
  -- Match the existing contribution-write availability rule, including moderation.
  if not exists (
    select 1 from public.mfi_stops s where s.id = p_stop_id
      and (s.moderation_status = 'visible' or s.user_id = v_user_id
           or (select private.is_moderation_admin()))
  ) then
    raise exception using errcode = '42501', message = 'This stop is not available.';
  end if;

  select pg_catalog.jsonb_build_object(
    'id', r.id, 'stop_id', r.stop_id, 'user_id', r.user_id,
    'deliver_from_type', r.deliver_from_type, 'deliver_from_details', r.deliver_from_details,
    'approach_hint', r.approach_hint, 'back_in_required', r.back_in_required,
    'truck_fit', r.truck_fit, 'contact', r.contact, 'notes', r.notes,
    'delivery_type', r.delivery_type, 'contact_name', r.contact_name,
    'contact_phones', r.contact_phones, 'check_in_notes', r.check_in_notes,
    'contact_people', r.contact_people
  ) into v_report
  from public.mfi_reports r
  where r.stop_id = p_stop_id and r.user_id = v_user_id
  order by r.updated_at desc, r.id
  limit 1;
  return v_report;
end;
$function$;

create function public.get_owned_freightiq_report_v1(p_stop_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.read_owned_freightiq_report(p_stop_id);
$function$;

revoke all on function private.read_owned_freightiq_report(text) from public, anon, authenticated, service_role;
revoke all on function public.get_owned_freightiq_report_v1(text) from public, anon, authenticated, service_role;
grant execute on function private.read_owned_freightiq_report(text) to authenticated;
grant execute on function public.get_owned_freightiq_report_v1(text) to authenticated;
