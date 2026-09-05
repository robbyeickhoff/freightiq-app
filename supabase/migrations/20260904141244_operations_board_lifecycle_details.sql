alter table public.operations_updates
  add column moderation_reason text
  check (moderation_reason is null or char_length(moderation_reason) <= 500);

create or replace function public.get_operations_board(
  p_area_slug text default null,
  p_include_history boolean default false
)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(feed) order by feed.created_at desc), '[]'::jsonb)
  from (
    select u.id, a.slug as area_slug, a.display_name as area_name, u.category, u.message,
      u.stop_id, s.name as stop_name, s.address as stop_address, u.latitude, u.longitude,
      u.created_at, u.updated_at, u.expires_at, u.revision, u.status, u.edited,
      u.resolution_source, u.moderation_reason, u.author_user_id, p.username,
      p.profile_image_path, true as founding_driver,
      u.author_user_id = auth.uid() as is_author,
      (select max(c.created_at) from public.operations_update_confirmations c
       where c.update_id=u.id and c.revision=u.revision and c.response='yes') as last_confirmed_at
    from public.operations_updates u
    join public.operations_areas a on a.id=u.area_id
    join public.profiles p on p.id=u.author_user_id
    left join public.mfi_stops s on s.id=u.stop_id
    where auth.uid() is not null and a.is_active
      and (p_area_slug is null or a.slug=p_area_slug)
      and not exists (select 1 from public.blocked_contributors b
        where b.blocking_user_id=auth.uid() and b.blocked_user_id=u.author_user_id)
      and ((not p_include_history and u.status in ('active','possibly_cleared')
        and u.moderation_status='visible' and u.expires_at>now())
        or (p_include_history and u.author_user_id=auth.uid()
          and u.created_at>now()-interval '7 days'))
  ) feed;
$$;

revoke all on function public.get_operations_board(text, boolean) from public, anon, authenticated;
grant execute on function public.get_operations_board(text, boolean) to authenticated;

create or replace function public.create_operations_update(
  p_area_slug text,
  p_category text,
  p_message text,
  p_expires_at timestamptz,
  p_stop_id text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid:=auth.uid();
  v_area public.operations_areas%rowtype;
  v_id uuid;
  v_now timestamptz:=now();
  v_lat double precision:=p_latitude;
  v_lng double precision:=p_longitude;
begin
  if not private.can_contribute_operations(v_user) then
    raise insufficient_privilege using message='Operations posting access required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  if exists(select 1 from public.operations_updates where author_user_id=v_user and created_at>v_now-interval '1 minute') then
    raise check_violation using message='Please wait before posting another update';
  end if;
  if (select count(*) from public.operations_updates where author_user_id=v_user
      and status in ('active','possibly_cleared') and moderation_status='visible' and expires_at>v_now)>=10 then
    raise check_violation using message='Active update limit reached';
  end if;
  if (select count(*) from public.operations_updates where author_user_id=v_user
      and created_at>v_now-interval '24 hours')>=20 then
    raise check_violation using message='Daily update limit reached';
  end if;
  select * into v_area from public.operations_areas where slug=p_area_slug and is_active;
  if not found then raise check_violation using message='Choose a supported Operations area'; end if;
  if p_stop_id is not null then
    select lat,lng into v_lat,v_lng from public.mfi_stops
    where id=p_stop_id and moderation_status='visible';
    if not found then raise check_violation using message='Choose a visible FreightIQ stop'; end if;
  end if;
  if v_lat is not null and extensions.st_distance(
    extensions.st_setsrid(extensions.st_makepoint(v_lng,v_lat),4326)::extensions.geography,
    extensions.st_setsrid(extensions.st_makepoint(v_area.anchor_lng,v_area.anchor_lat),4326)::extensions.geography
  ) > 80467.2 then
    raise check_violation using message='The selected location is outside this Operations area';
  end if;
  insert into public.operations_updates(author_user_id,area_id,category,message,expires_at,stop_id,latitude,longitude)
  values(v_user,v_area.id,p_category,btrim(p_message),p_expires_at,p_stop_id,v_lat,v_lng)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_operations_update(text,text,text,timestamptz,text,double precision,double precision)
  from public,anon,authenticated;
grant execute on function public.create_operations_update(text,text,text,timestamptz,text,double precision,double precision)
  to authenticated;

create or replace function public.resolve_content_report(
  p_content_report_id uuid,
  p_outcome text,
  p_review_notes text default null
) returns void language plpgsql security definer set search_path='' as $$
declare
  target public.content_reports%rowtype;
  moderator_id uuid:=auth.uid();
  normalized_notes text:=nullif(btrim(p_review_notes),'');
begin
  if moderator_id is null or not private.is_moderation_admin() then
    raise insufficient_privilege using message='Moderation access required';
  end if;
  if p_outcome not in ('dismissed','content_corrected','content_removed','contributor_warned','contributor_restricted') then
    raise check_violation using message='Invalid moderation outcome';
  end if;
  if normalized_notes is not null and char_length(normalized_notes)>2000 then
    raise check_violation using message='Review notes must be 2000 characters or fewer';
  end if;
  select * into target from public.content_reports where id=p_content_report_id for update;
  if not found then raise no_data_found using message='Content report not found'; end if;
  if p_outcome='content_removed' then
    if target.subject_type='report' then
      update public.mfi_reports set moderation_status='removed',updated_at=now() where id=target.report_id;
    elsif target.subject_type='stop' then
      update public.mfi_stops set moderation_status='removed',updated_at=now() where id=target.stop_id;
    else
      update public.operations_updates set moderation_status='removed',status='removed',
        resolution_source='moderator',moderation_reason=left(coalesce(normalized_notes,
        'This update did not meet the Community Guidelines.'),500),updated_at=now()
      where id=target.operations_update_id;
    end if;
  end if;
  if p_outcome='contributor_restricted' then
    if target.subject_owner_user_id is null then
      raise check_violation using message='The reported content has no contributor to restrict';
    end if;
    insert into private.contributor_restrictions(user_id,status,reason,created_by,updated_at)
    values(target.subject_owner_user_id,'restricted',coalesce(normalized_notes,
      'Restricted after content moderation review'),moderator_id,now())
    on conflict(user_id) do update set status='restricted',reason=excluded.reason,updated_at=now();
  end if;
  update public.content_reports set status='resolved',reviewed_at=now(),reviewed_by=moderator_id,
    review_notes=normalized_notes,outcome=p_outcome where id=target.id;
end;
$$;

revoke all on function public.resolve_content_report(uuid,text,text) from public,anon,authenticated;
grant execute on function public.resolve_content_report(uuid,text,text) to authenticated;

comment on column public.operations_updates.moderation_reason is
  'Brief author-visible explanation when an Operations update is removed by moderation.';
