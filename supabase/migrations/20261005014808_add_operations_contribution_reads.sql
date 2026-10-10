-- Contribution-only reads. No shared stop labels, coordinates or messages are
-- disclosed by duplicate discovery; history contains only the caller's posts.
create function private.read_owned_operations_history(p_area_slug text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
  if actor is null or not exists(select 1 from auth.users where id=actor) then
    raise insufficient_privilege using message='Authentication required.';end if;
  if length(p_area_slug)>100 then raise invalid_parameter_value;end if;
  select coalesce(jsonb_agg(to_jsonb(feed) order by feed.created_at desc,feed.id desc),'[]'::jsonb)
    into result from (
    select u.id,a.slug as area_slug,a.display_name as area_name,u.category,u.message,
      u.stop_id,null::text as stop_name,null::text as stop_address,u.latitude,u.longitude,
      u.created_at,u.updated_at,u.expires_at,u.revision,u.status,u.edited,u.resolution_source,
      u.moderation_reason,u.author_user_id,p.username,p.profile_image_path,true as founding_driver,
      true as is_author,(select max(c.created_at) from public.operations_update_confirmations c
        where c.update_id=u.id and c.revision=u.revision and c.response='yes') as last_confirmed_at
    from public.operations_updates u join public.operations_areas a on a.id=u.area_id
    join public.profiles p on p.id=u.author_user_id
    where u.author_user_id=actor and a.is_active and (p_area_slug is null or a.slug=p_area_slug)
      and u.created_at>statement_timestamp()-interval '7 days'
      and not exists(select 1 from public.blocked_contributors b where b.blocking_user_id=actor and b.blocked_user_id=u.author_user_id)
  ) feed;
  return result;
end;
$$;
create function public.get_owned_operations_history_v1(p_area_slug text default null)
returns jsonb language sql stable security invoker set search_path='' as $$
  select private.read_owned_operations_history(p_area_slug);
$$;

create function private.operations_has_similar(
  p_area_slug text,p_category text,p_stop_id text default null,
  p_latitude double precision default null,p_longitude double precision default null
) returns boolean language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); area uuid;
begin
  if actor is null or not exists(select 1 from auth.users where id=actor)
    or not private.can_contribute_operations(actor) then
    raise insufficient_privilege using message='Operations posting access required.';end if;
  if p_area_slug is null or length(p_area_slug)>100 or p_category is null
    or p_category not in ('road_closure','weather_road_conditions','delivery_access','construction','temporary_hazard','customer_notice')
    or length(p_stop_id)>200 or p_stop_id=''
    or (p_latitude is null)<>(p_longitude is null)
    or (p_latitude is not null and not(p_latitude between -90 and 90 and p_longitude between -180 and 180))
    or (p_category in ('road_closure','construction','temporary_hazard') and p_latitude is null)
    or (p_category in ('delivery_access','customer_notice') and p_stop_id is null and p_latitude is null)
    then raise invalid_parameter_value using message='Invalid condition location.';end if;
  select id into area from public.operations_areas where slug=p_area_slug and is_active;
  if area is null then raise invalid_parameter_value using message='Choose an active Operations area.';end if;
  -- Same matching branches as the existing client: matching attached stop first,
  -- otherwise within a quarter-mile; area-wide conditions match other area-wide posts.
  return exists(select 1 from public.operations_updates u
    join public.profiles p on p.id=u.author_user_id
    where u.area_id=area and u.category=p_category and u.status in ('active','possibly_cleared')
      and u.moderation_status='visible' and u.expires_at>statement_timestamp()
      and not exists(select 1 from public.blocked_contributors b where b.blocking_user_id=actor and b.blocked_user_id=u.author_user_id)
      and case when p_stop_id is not null and u.stop_id is not null then p_stop_id=u.stop_id
        when p_latitude is not null and u.latitude is not null then
          12742000*asin(sqrt(least(1::double precision,greatest(0::double precision,
            power(sin(radians(u.latitude-p_latitude)/2),2)+cos(radians(p_latitude))*cos(radians(u.latitude))*
            power(sin(radians(u.longitude-p_longitude)/2),2)))))<=402.336
        else p_latitude is null and u.latitude is null end);
end;
$$;
create function public.has_similar_operations_update_v1(
  p_area_slug text,p_category text,p_stop_id text default null,
  p_latitude double precision default null,p_longitude double precision default null
) returns boolean language sql stable security invoker set search_path='' as $$
  select private.operations_has_similar(p_area_slug,p_category,p_stop_id,p_latitude,p_longitude);
$$;
revoke all on function private.read_owned_operations_history(text),public.get_owned_operations_history_v1(text),
 private.operations_has_similar(text,text,text,double precision,double precision),
 public.has_similar_operations_update_v1(text,text,text,double precision,double precision)
 from public,anon,authenticated,service_role;
grant execute on function private.read_owned_operations_history(text),public.get_owned_operations_history_v1(text),
 private.operations_has_similar(text,text,text,double precision,double precision),
 public.has_similar_operations_update_v1(text,text,text,double precision,double precision) to authenticated;
