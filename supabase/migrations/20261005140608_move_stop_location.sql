-- No table grants, report/history changes or shared-read bypass.
create function private.can_move_freightiq_stop(p_stop_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.mfi_stops s join auth.users u on u.id = (select auth.uid())
    where s.id = p_stop_id and (s.user_id = u.id or private.is_trusted_stop_editor())
      and not private.is_contributor_restricted(u.id)
  );
$$;
create function public.can_move_freightiq_stop_v1(p_stop_id text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.can_move_freightiq_stop(p_stop_id);
$$;

create function private.move_freightiq_stop(p_stop_id text, p_expected jsonb, p_location jsonb)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare
  s public.mfi_stops%rowtype;
  v_lat double precision;
  v_lng double precision;
  v_dz_lat double precision;
  v_dz_lng double precision;
  v_address text;
  v_city text;
  v_state text;
  v_current jsonb;
begin
  if not private.can_move_freightiq_stop(p_stop_id) then
    raise exception using errcode='42501', message='You do not have permission to move this stop.';
  end if;
  if p_expected is null or p_location is null or jsonb_typeof(p_expected)<>'object'
    or jsonb_typeof(p_location)<>'object' or octet_length(p_location::text)>4096
    or octet_length(p_expected::text)>4096
    or not (p_location ?& array['address','lat','lng','city','state_code','entrance_lat','entrance_lng'])
    or not (p_expected ?& array['address','lat','lng','entrance_lat','entrance_lng']) then
    raise exception using errcode='22023', message='Choose a complete new location and Delivery Zone option.';
  end if;
  v_address := btrim(p_location->>'address');
  v_city := btrim(p_location->>'city');
  v_state := upper(btrim(p_location->>'state_code'));
  v_lat := (p_location->>'lat')::double precision;
  v_lng := (p_location->>'lng')::double precision;
  v_dz_lat := (p_location->>'entrance_lat')::double precision;
  v_dz_lng := (p_location->>'entrance_lng')::double precision;
  if coalesce(length(v_address),0) not between 1 and 1000
    or coalesce(length(v_city),0) not between 1 and 150
    or v_state is null or v_state !~ '^[A-Z]{2}$'
    or v_lat is null or not (v_lat between -90 and 90)
    or v_lng is null or not (v_lng between -180 and 180)
    or (v_dz_lat is null) <> (v_dz_lng is null)
    or (v_dz_lat is not null and not (v_dz_lat between -90 and 90))
    or (v_dz_lng is not null and not (v_dz_lng between -180 and 180)) then
    raise exception using errcode='22023', message='Choose a valid address, city, state and map position.';
  end if;
  select * into s from public.mfi_stops where id=p_stop_id for update;
  -- Recheck ownership/restriction after waiting for the row lock.
  if not found or not private.can_move_freightiq_stop(p_stop_id) then
    raise exception using errcode='42501', message='You do not have permission to move this stop.';
  end if;
  -- A lost-response retry of an already applied destination is harmless, not another write.
  if s.address is not distinct from v_address and s.lat=v_lat and s.lng=v_lng
    and s.city is not distinct from v_city and s.state_code is not distinct from v_state
    and s.country_code='US' and s.entrance_lat is not distinct from v_dz_lat
    and s.entrance_lng is not distinct from v_dz_lng then return true; end if;
  v_current := jsonb_build_object('address',s.address,'lat',s.lat,'lng',s.lng,
    'entrance_lat',s.entrance_lat,'entrance_lng',s.entrance_lng);
  if v_current <> p_expected then
    raise exception using errcode='40001', message='This stop changed. Reopen Move Stop and try again.';
  end if;
  -- No identity/coordinates are disclosed by this duplicate refusal.
  if exists (select 1 from public.mfi_stops other where other.id<>s.id
    and other.moderation_status='visible'
    and lower(btrim(other.name))=lower(btrim(s.name))
    and extensions.st_dwithin(
      extensions.st_setsrid(extensions.st_makepoint(other.lng,other.lat),4326)::extensions.geography,
      extensions.st_setsrid(extensions.st_makepoint(v_lng,v_lat),4326)::extensions.geography,50)) then
    raise exception using errcode='23505', message='A matching stop may already exist here. Check the map before moving this stop.';
  end if;
  update public.mfi_stops set address=v_address,lat=v_lat,lng=v_lng,city=v_city,
    state_code=v_state,country_code='US',entrance_lat=v_dz_lat,entrance_lng=v_dz_lng,
    updated_at=clock_timestamp() where id=p_stop_id;
  return true;
end;
$$;
create function public.move_freightiq_stop_v1(p_stop_id text, p_expected jsonb, p_location jsonb)
returns boolean language sql volatile security invoker set search_path = '' as $$
  select private.move_freightiq_stop(p_stop_id,p_expected,p_location);
$$;

revoke all on function private.can_move_freightiq_stop(text), public.can_move_freightiq_stop_v1(text),
  private.move_freightiq_stop(text,jsonb,jsonb), public.move_freightiq_stop_v1(text,jsonb,jsonb)
  from public,anon,authenticated,service_role;
grant execute on function private.can_move_freightiq_stop(text), public.can_move_freightiq_stop_v1(text),
  private.move_freightiq_stop(text,jsonb,jsonb), public.move_freightiq_stop_v1(text,jsonb,jsonb)
  to authenticated;

-- A relocation must not manufacture new DZ-completion credit. Preserve normal DZ edits.
-- Trigger WHEN avoids client-controlled session flags and leaves the existing functions intact.
drop trigger capture_founding_driver_delivery_zone_completion on public.mfi_stops;
create trigger capture_founding_driver_delivery_zone_completion
after update of entrance_lat,entrance_lng on public.mfi_stops for each row
when (old.lat is not distinct from new.lat and old.lng is not distinct from new.lng)
execute function private.capture_founding_driver_delivery_zone_completion();
drop trigger capture_referral_delivery_zone_completion on public.mfi_stops;
create trigger capture_referral_delivery_zone_completion
after update of entrance_lat,entrance_lng on public.mfi_stops for each row
when (old.lat is not distinct from new.lat and old.lng is not distinct from new.lng)
execute function private.capture_referral_delivery_zone_completion();
