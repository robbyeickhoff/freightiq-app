set local lock_timeout = '5s';

create table public.operations_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9-]+$'),
  display_name text not null unique check (btrim(display_name) <> ''),
  sort_order smallint not null unique,
  anchor_lat double precision not null check (anchor_lat between -90 and 90),
  anchor_lng double precision not null check (anchor_lng between -180 and 180),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.operations_areas (slug, display_name, sort_order, anchor_lat, anchor_lng) values
  ('grand-junction', 'Grand Junction', 10, 39.0639, -108.5506),
  ('delta', 'Delta', 20, 38.7422, -108.0689),
  ('montrose', 'Montrose', 30, 38.4783, -107.8762),
  ('ridgway', 'Ridgway', 40, 38.1528, -107.7576),
  ('ouray', 'Ouray', 50, 38.0228, -107.6714),
  ('telluride', 'Telluride', 60, 37.9375, -107.8123);

create table public.operations_updates (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid not null references public.operations_areas(id) on delete restrict,
  category text not null check (category in ('road_closure','weather_road_conditions','delivery_access','construction','temporary_hazard','customer_notice')),
  message text not null check (char_length(btrim(message)) between 1 and 280 and message !~ '[[:cntrl:]]'),
  stop_id text references public.mfi_stops(id) on delete set null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revision integer not null default 1 check (revision > 0),
  status text not null default 'active' check (status in ('active','possibly_cleared','resolved','removed')),
  edited boolean not null default false,
  resolution_source text check (resolution_source is null or resolution_source in ('author','community','moderator')),
  moderation_status text not null default 'visible' check (moderation_status in ('visible','removed')),
  constraint operations_updates_coordinate_pair check ((latitude is null) = (longitude is null)),
  constraint operations_updates_location_requirement check (
    (category in ('road_closure','construction','temporary_hazard') and latitude is not null)
    or category = 'weather_road_conditions'
    or (category in ('delivery_access','customer_notice') and (stop_id is not null or latitude is not null))
  ),
  constraint operations_updates_expiration check (expires_at > created_at and expires_at <= created_at + interval '7 days')
);

create index operations_updates_active_area_idx on public.operations_updates(area_id, created_at desc)
  where status in ('active','possibly_cleared') and moderation_status = 'visible';
create index operations_updates_author_idx on public.operations_updates(author_user_id, created_at desc);

create table public.operations_update_confirmations (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.operations_updates(id) on delete cascade,
  revision integer not null,
  responder_user_id uuid not null references auth.users(id) on delete cascade,
  response text not null check (response in ('yes','no')),
  created_at timestamptz not null default now()
);
create index operations_confirmations_recent_idx on public.operations_update_confirmations(update_id, revision, created_at desc);

alter table public.content_reports add column operations_update_id uuid references public.operations_updates(id) on delete cascade;
alter table public.content_reports drop constraint content_reports_subject_type_check;
alter table public.content_reports add constraint content_reports_subject_type_check check (subject_type in ('report','stop','operations_update'));
alter table public.content_reports drop constraint content_reports_subject_reference_check;
alter table public.content_reports add constraint content_reports_subject_reference_check check (
  (subject_type='report' and report_id is not null and stop_id is null and operations_update_id is null)
  or (subject_type='stop' and stop_id is not null and report_id is null and operations_update_id is null)
  or (subject_type='operations_update' and operations_update_id is not null and report_id is null and stop_id is null)
);
alter table public.content_reports drop constraint content_reports_reason_check;
alter table public.content_reports add constraint content_reports_reason_check check (reason in (
  'incorrect_or_unsafe','private_or_confidential','abusive_or_inappropriate','spam_or_unrelated','other',
  'outdated','inaccurate','duplicate','inappropriate'
));
create unique index content_reports_open_operations_subject_unique
  on public.content_reports(reporter_user_id, operations_update_id)
  where status in ('open','reviewing') and operations_update_id is not null;

create or replace function private.can_contribute_operations(p_user_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user_id is not null
    and exists (select 1 from public.profiles p where p.id = p_user_id)
    and exists (
      select 1 from public.founding_driver_enrollments e where e.user_id = p_user_id
      and (e.status = 'active' or (e.status in ('qualified','completed') and e.permanent_founding_driver))
    )
    and not private.is_contributor_restricted(p_user_id);
$$;
revoke all on function private.can_contribute_operations(uuid) from public, anon, authenticated;
grant execute on function private.can_contribute_operations(uuid) to authenticated;

create or replace function public.get_operations_board(p_area_slug text default null, p_include_history boolean default false)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(feed) order by feed.created_at desc), '[]'::jsonb)
  from (
    select u.id, a.slug as area_slug, a.display_name as area_name, u.category, u.message, u.stop_id,
      u.latitude, u.longitude, u.created_at, u.updated_at, u.expires_at, u.revision, u.status, u.edited,
      u.author_user_id, p.username, p.profile_image_path,
      true as founding_driver,
      case when u.author_user_id = auth.uid() then true else false end as is_author
    from public.operations_updates u
    join public.operations_areas a on a.id = u.area_id
    join public.profiles p on p.id = u.author_user_id
    where auth.uid() is not null and a.is_active
      and (p_area_slug is null or a.slug = p_area_slug)
      and not exists (select 1 from public.blocked_contributors b where b.blocking_user_id=auth.uid() and b.blocked_user_id=u.author_user_id)
      and ((not p_include_history and u.status in ('active','possibly_cleared') and u.moderation_status='visible' and u.expires_at > now())
        or (p_include_history and u.author_user_id=auth.uid() and u.created_at > now()-interval '7 days'))
  ) feed;
$$;
revoke all on function public.get_operations_board(text, boolean) from public, anon, authenticated;
grant execute on function public.get_operations_board(text, boolean) to authenticated;

create or replace function public.can_post_operations_update() returns boolean
language sql stable security definer set search_path = '' as $$ select private.can_contribute_operations(auth.uid()); $$;
revoke all on function public.can_post_operations_update() from public, anon, authenticated;
grant execute on function public.can_post_operations_update() to authenticated;

create or replace function public.create_operations_update(p_area_slug text, p_category text, p_message text, p_expires_at timestamptz, p_stop_id text default null, p_latitude double precision default null, p_longitude double precision default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_area uuid; v_id uuid; v_now timestamptz:=now();
begin
  if not private.can_contribute_operations(v_user) then raise insufficient_privilege using message='Operations posting access required'; end if;
  if exists(select 1 from public.operations_updates where author_user_id=v_user and created_at>v_now-interval '1 minute') then raise check_violation using message='Please wait before posting another update'; end if;
  if (select count(*) from public.operations_updates where author_user_id=v_user and status in ('active','possibly_cleared') and moderation_status='visible' and expires_at>v_now)>=10 then raise check_violation using message='Active update limit reached'; end if;
  if (select count(*) from public.operations_updates where author_user_id=v_user and created_at>v_now-interval '24 hours')>=20 then raise check_violation using message='Daily update limit reached'; end if;
  select id into v_area from public.operations_areas where slug=p_area_slug and is_active;
  if v_area is null then raise check_violation using message='Choose a supported Operations area'; end if;
  insert into public.operations_updates(author_user_id,area_id,category,message,expires_at,stop_id,latitude,longitude)
  values(v_user,v_area,p_category,btrim(p_message),p_expires_at,p_stop_id,p_latitude,p_longitude) returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.create_operations_update(text,text,text,timestamptz,text,double precision,double precision) from public, anon, authenticated;
grant execute on function public.create_operations_update(text,text,text,timestamptz,text,double precision,double precision) to authenticated;

create or replace function public.edit_operations_update(p_update_id uuid,p_category text,p_message text,p_expires_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.can_contribute_operations(auth.uid()) then raise insufficient_privilege using message='Operations posting access required'; end if;
  update public.operations_updates set category=p_category,message=btrim(p_message),expires_at=p_expires_at,
    revision=revision+1,edited=true,updated_at=now(),status='active',resolution_source=null
  where id=p_update_id and author_user_id=auth.uid() and moderation_status='visible';
  if not found then raise no_data_found using message='Operations update not found'; end if;
end; $$;
revoke all on function public.edit_operations_update(uuid,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.edit_operations_update(uuid,text,text,timestamptz) to authenticated;

create or replace function public.resolve_operations_update(p_update_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 update public.operations_updates set status='resolved',resolution_source='author',updated_at=now()
 where id=p_update_id and author_user_id=auth.uid() and status in ('active','possibly_cleared');
 if not found then raise no_data_found using message='Operations update not found'; end if;
end; $$;
revoke all on function public.resolve_operations_update(uuid) from public, anon, authenticated;
grant execute on function public.resolve_operations_update(uuid) to authenticated;

create or replace function public.confirm_operations_update(p_update_id uuid,p_response text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_update public.operations_updates%rowtype; v_no_count integer; v_latest_yes timestamptz;
begin
 if v_user is null then raise insufficient_privilege using message='Authentication required'; end if;
 if private.is_contributor_restricted(v_user) then raise insufficient_privilege using message='Operations confirmation unavailable'; end if;
 if p_response not in ('yes','no') then raise check_violation using message='Choose Yes or No'; end if;
 select * into v_update from public.operations_updates where id=p_update_id for update;
 if not found or v_update.author_user_id=v_user or v_update.status not in ('active','possibly_cleared') or v_update.moderation_status<>'visible' or v_update.expires_at<=now() then raise check_violation using message='This update cannot be confirmed'; end if;
 insert into public.operations_update_confirmations(update_id,revision,responder_user_id,response)
 values(p_update_id,v_update.revision,v_user,p_response);
 if p_response='yes' then
   update public.operations_updates set status='active',resolution_source=null,updated_at=now() where id=p_update_id;
 else
   select max(created_at) into v_latest_yes from public.operations_update_confirmations
   where update_id=p_update_id and revision=v_update.revision and response='yes';
   select count(distinct responder_user_id) into v_no_count from public.operations_update_confirmations c
   where c.update_id=p_update_id and c.revision=v_update.revision and c.response='no'
     and c.created_at>greatest(now()-interval '2 hours',coalesce(v_latest_yes,'-infinity'::timestamptz));
   update public.operations_updates set status=case when v_no_count>=2 then 'resolved' else 'possibly_cleared' end,
     resolution_source=case when v_no_count>=2 then 'community' else null end,updated_at=now() where id=p_update_id;
 end if;
 return (select status from public.operations_updates where id=p_update_id);
end; $$;
revoke all on function public.confirm_operations_update(uuid,text) from public, anon, authenticated;
grant execute on function public.confirm_operations_update(uuid,text) to authenticated;

create or replace function private.prepare_content_report() returns trigger language plpgsql security definer set search_path='' as $$
declare resolved_owner_id uuid;
begin
 if new.reporter_user_id is distinct from auth.uid() then raise exception 'A content report can only be submitted as the signed-in user'; end if;
 new.details:=nullif(btrim(new.details),''); new.status:='open'; new.created_at:=now(); new.reviewed_at:=null; new.reviewed_by:=null; new.review_notes:=null; new.outcome:=null;
 if new.subject_type='report' then select user_id into resolved_owner_id from public.mfi_reports where id=new.report_id;
 elsif new.subject_type='stop' then select user_id into resolved_owner_id from public.mfi_stops where id=new.stop_id;
 else select author_user_id into resolved_owner_id from public.operations_updates where id=new.operations_update_id and moderation_status='visible'; end if;
 if not found then raise exception 'The reported content could not be found'; end if;
 if resolved_owner_id is null then raise exception 'This shared content has no contributor to report'; end if;
 if resolved_owner_id=new.reporter_user_id then raise exception 'You cannot report your own content'; end if;
 new.subject_owner_user_id:=resolved_owner_id; return new;
end; $$;

alter table public.operations_areas enable row level security;
alter table public.operations_updates enable row level security;
alter table public.operations_update_confirmations enable row level security;
revoke all on public.operations_areas,public.operations_updates,public.operations_update_confirmations from public,anon,authenticated;
grant select on public.operations_areas to authenticated;
grant all on public.operations_areas,public.operations_updates,public.operations_update_confirmations to service_role;
create policy operations_areas_authenticated_read on public.operations_areas for select to authenticated using(is_active);
create policy operations_updates_no_direct_access on public.operations_updates for all to public using(false) with check(false);
create policy operations_confirmations_no_direct_access on public.operations_update_confirmations for all to public using(false) with check(false);
grant insert(subject_type,operations_update_id,reason,details) on public.content_reports to authenticated;

create or replace function public.get_moderation_queue() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare queue jsonb;
begin
 if auth.uid() is null or not private.is_moderation_admin() then raise insufficient_privilege using message='Moderation access required'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.status_order,q.created_at),'[]'::jsonb) into queue from (
  select cr.id,cr.subject_type,cr.report_id,cr.stop_id,cr.operations_update_id,cr.reporter_user_id,
   reporter.username reporter_username,cr.subject_owner_user_id,contributor.username contributor_username,
   cr.reason,cr.details,cr.status,cr.created_at,cr.reviewed_at,cr.reviewed_by,cr.review_notes,cr.outcome,
   case cr.subject_type when 'report' then to_jsonb(r)-'contact'-'contact_phones' when 'stop' then to_jsonb(s)-'entrance_photo_path'-'entrance_photo_url'
    else to_jsonb(ou) end subject,
   (select count(*) from public.content_reports prior where prior.id<>cr.id and
    ((cr.report_id is not null and prior.report_id=cr.report_id) or (cr.stop_id is not null and prior.stop_id=cr.stop_id) or (cr.operations_update_id is not null and prior.operations_update_id=cr.operations_update_id))) prior_subject_report_count,
   (select count(*) from public.content_reports prior where prior.id<>cr.id and prior.subject_owner_user_id=cr.subject_owner_user_id) prior_contributor_report_count,
   case cr.status when 'open' then 0 when 'reviewing' then 1 else 2 end status_order
  from public.content_reports cr left join public.mfi_reports r on r.id=cr.report_id left join public.mfi_stops s on s.id=cr.stop_id
  left join public.operations_updates ou on ou.id=cr.operations_update_id left join public.profiles reporter on reporter.id=cr.reporter_user_id
  left join public.profiles contributor on contributor.id=cr.subject_owner_user_id
 ) q; return queue;
end; $$;
revoke all on function public.get_moderation_queue() from public,anon,authenticated;
grant execute on function public.get_moderation_queue() to authenticated;

create or replace function public.resolve_content_report(p_content_report_id uuid,p_outcome text,p_review_notes text default null) returns void
language plpgsql security definer set search_path='' as $$
declare target public.content_reports%rowtype; moderator_id uuid:=auth.uid(); normalized_notes text:=nullif(btrim(p_review_notes),'');
begin
 if moderator_id is null or not private.is_moderation_admin() then raise insufficient_privilege using message='Moderation access required'; end if;
 if p_outcome not in ('dismissed','content_corrected','content_removed','contributor_warned','contributor_restricted') then raise check_violation using message='Invalid moderation outcome'; end if;
 if normalized_notes is not null and char_length(normalized_notes)>2000 then raise check_violation using message='Review notes must be 2000 characters or fewer'; end if;
 select * into target from public.content_reports where id=p_content_report_id for update;
 if not found then raise no_data_found using message='Content report not found'; end if;
 if p_outcome='content_removed' then
  if target.subject_type='report' then update public.mfi_reports set moderation_status='removed',updated_at=now() where id=target.report_id;
  elsif target.subject_type='stop' then update public.mfi_stops set moderation_status='removed',updated_at=now() where id=target.stop_id;
  else update public.operations_updates set moderation_status='removed',status='removed',resolution_source='moderator',updated_at=now() where id=target.operations_update_id; end if;
 end if;
 if p_outcome='contributor_restricted' then
  if target.subject_owner_user_id is null then raise check_violation using message='The reported content has no contributor to restrict'; end if;
  insert into private.contributor_restrictions(user_id,status,reason,created_by,updated_at) values(target.subject_owner_user_id,'restricted',coalesce(normalized_notes,'Restricted after content moderation review'),moderator_id,now())
  on conflict(user_id) do update set status='restricted',reason=excluded.reason,updated_at=now();
 end if;
 update public.content_reports set status='resolved',reviewed_at=now(),reviewed_by=moderator_id,review_notes=normalized_notes,outcome=p_outcome where id=target.id;
end; $$;
revoke all on function public.resolve_content_report(uuid,text,text) from public,anon,authenticated;
grant execute on function public.resolve_content_report(uuid,text,text) to authenticated;

comment on table public.operations_updates is 'Short-lived, broad-region operational delivery updates.';
