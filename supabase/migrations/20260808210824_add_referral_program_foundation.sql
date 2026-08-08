alter table public.profiles add column referral_code text;

create or replace function private.new_referral_code() returns text
language plpgsql volatile security definer set search_path = '' as $$
declare v text;
begin
  loop
    v := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = v);
  end loop;
  return v;
end $$;
revoke all on function private.new_referral_code() from public, anon, authenticated;

update public.profiles set referral_code = private.new_referral_code() where referral_code is null;
alter table public.profiles alter column referral_code set not null;
alter table public.profiles add constraint profiles_referral_code_shape
  check (referral_code ~ '^[A-F0-9]{6}$');
create unique index profiles_referral_code_key on public.profiles (referral_code);

create or replace function private.assign_profile_referral_code() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.referral_code is null then new.referral_code := private.new_referral_code(); end if;
  return new;
end $$;
revoke all on function private.assign_profile_referral_code() from public, anon, authenticated;
create trigger assign_profile_referral_code before insert on public.profiles
for each row execute function private.assign_profile_referral_code();

create table public.driver_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','active','qualified','expired')),
  time_zone text not null default 'America/Denver',
  start_date date,
  end_date date,
  qualified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (referrer_user_id <> referred_user_id),
  check ((start_date is null and end_date is null) or
         (start_date is not null and end_date = start_date + 29))
);
create index driver_referrals_referrer_idx on public.driver_referrals(referrer_user_id);
create index driver_referrals_status_idx on public.driver_referrals(status);
alter table public.driver_referrals enable row level security;
revoke all on public.driver_referrals from public, anon, authenticated;
grant select on public.driver_referrals to authenticated;
grant all on public.driver_referrals to service_role;
create policy driver_referrals_read_participant_or_admin on public.driver_referrals
for select to authenticated using (
  (select auth.uid()) in (referrer_user_id, referred_user_id)
  or (select private.is_founding_driver_admin())
);

create or replace function private.capture_new_user_referral() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_referrer uuid;
        v_start date;
begin
  select id into v_referrer from public.profiles
  where referral_code = upper(btrim(new.raw_user_meta_data ->> 'referral_code'));
  if v_referrer is not null and v_referrer <> new.id then
    v_start := case when new.email_confirmed_at is not null
      then (new.email_confirmed_at at time zone 'America/Denver')::date else null end;
    insert into public.driver_referrals(
      referrer_user_id,referred_user_id,status,start_date,end_date
    ) values(
      v_referrer,new.id,case when v_start is null then 'pending' else 'active' end,
      v_start,case when v_start is null then null else v_start+29 end
    ) on conflict(referred_user_id) do nothing;
  end if;
  return new;
exception when others then return new;
end $$;
revoke all on function private.capture_new_user_referral() from public, anon, authenticated;
create trigger capture_new_user_referral after insert on auth.users
for each row execute function private.capture_new_user_referral();

create or replace function private.activate_verified_referral() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_today date;
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    v_today := (new.email_confirmed_at at time zone 'America/Denver')::date;
    update public.driver_referrals set status='active', start_date=v_today,
      end_date=v_today+29, updated_at=clock_timestamp()
    where referred_user_id=new.id and status='pending';
  end if;
  return new;
exception when others then return new;
end $$;
revoke all on function private.activate_verified_referral() from public, anon, authenticated;
create trigger activate_verified_referral after update of email_confirmed_at on auth.users
for each row execute function private.activate_verified_referral();

create table public.referral_activity_events (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.driver_referrals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stop_id text not null references public.mfi_stops(id) on delete cascade,
  event_type text not null check (event_type in ('stop_intel_viewed','navigation_started','intel_contributed')),
  occurred_at timestamptz not null default now(),
  activity_date date not null,
  unique(user_id, stop_id, event_type, activity_date)
);
create index referral_activity_referral_idx on public.referral_activity_events(referral_id);
create index referral_activity_stop_idx on public.referral_activity_events(stop_id);
alter table public.referral_activity_events enable row level security;
revoke all on public.referral_activity_events from public, anon, authenticated;
grant select on public.referral_activity_events to authenticated;
grant all on public.referral_activity_events to service_role;
create policy referral_activity_read_self_or_admin on public.referral_activity_events
for select to authenticated using (
  (select auth.uid()) = user_id or (select private.is_founding_driver_admin())
);
create policy referral_activity_insert_own_active on public.referral_activity_events
for insert to authenticated with check (
  (select auth.uid()) is not null and (select auth.uid())=user_id
  and exists(
    select 1 from public.driver_referrals r where r.id=referral_id
      and r.referred_user_id=(select auth.uid()) and r.status='active'
      and activity_date between r.start_date and r.end_date
  )
);
grant insert(stop_id,event_type) on public.referral_activity_events to authenticated;

create or replace function private.prepare_referral_activity_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid:=auth.uid(); v_ref public.driver_referrals%rowtype;
  v_now timestamptz:=clock_timestamp(); v_date date;
begin
  if v_uid is null then return null; end if;
  select * into v_ref from public.driver_referrals
  where referred_user_id=v_uid and status='active' and start_date is not null and end_date is not null limit 1;
  if not found then return null; end if;
  v_date := (v_now at time zone v_ref.time_zone)::date;
  if v_date not between v_ref.start_date and v_ref.end_date then return null; end if;
  new.id:=gen_random_uuid(); new.referral_id:=v_ref.id; new.user_id:=v_uid;
  new.occurred_at:=v_now; new.activity_date:=v_date;
  return new;
end $$;
revoke all on function private.prepare_referral_activity_event() from public,anon,authenticated;
create trigger prepare_referral_activity_event before insert on public.referral_activity_events
for each row execute function private.prepare_referral_activity_event();

create table public.referral_stop_contributions (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.driver_referrals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stop_id text not null references public.mfi_stops(id) on delete cascade,
  source_report_id uuid references public.mfi_reports(id) on delete set null,
  contribution_type text not null
    check (contribution_type in ('new_stop','completed_existing_stop')),
  completed_fields text[] not null,
  core_snapshot jsonb not null,
  review_status text not null default 'pending'
    check (review_status in ('pending','counts','needs_clarification','does_not_count')),
  review_note text check (review_note is null or char_length(review_note) <= 500),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, stop_id),
  check (cardinality(completed_fields) > 0),
  check (
    core_snapshot ? 'truck_fit'
    and core_snapshot ? 'delivery_type'
    and core_snapshot ? 'back_in_required'
    and core_snapshot ? 'delivery_zone'
  ),
  check (
    (review_status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (review_status <> 'pending' and reviewed_at is not null and reviewed_by is not null)
  )
);
create index referral_stop_contributions_referral_idx
  on public.referral_stop_contributions(referral_id);
create index referral_stop_contributions_stop_idx
  on public.referral_stop_contributions(stop_id);
create index referral_stop_contributions_source_report_idx
  on public.referral_stop_contributions(source_report_id);
create index referral_stop_contributions_reviewed_by_idx
  on public.referral_stop_contributions(reviewed_by);
create index referral_stop_contributions_pending_idx
  on public.referral_stop_contributions(submitted_at) where review_status = 'pending';
alter table public.referral_stop_contributions enable row level security;
revoke all on public.referral_stop_contributions from public, anon, authenticated;
grant select, update on public.referral_stop_contributions to authenticated;
grant all on public.referral_stop_contributions to service_role;
create policy referral_stop_contributions_read_self_or_admin
on public.referral_stop_contributions for select to authenticated using (
  (select auth.uid()) = user_id or (select private.is_founding_driver_admin())
);
create policy referral_stop_contributions_admin_update
on public.referral_stop_contributions for update to authenticated
using ((select private.is_founding_driver_admin()))
with check ((select private.is_founding_driver_admin()));

create or replace function private.refresh_referral_stop_candidate(
  p_stop_id text,
  p_actor_user_id uuid,
  p_source_report_id uuid,
  p_completed_fields text[],
  p_is_correction boolean
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_referral public.driver_referrals%rowtype;
  v_snapshot jsonb;
  v_existing public.referral_stop_contributions%rowtype;
  v_now timestamptz := clock_timestamp();
  v_activity_date date;
  v_contribution_type text;
begin
  if p_actor_user_id is null or p_stop_id is null or btrim(p_stop_id) = '' then return; end if;

  select * into v_referral
  from public.driver_referrals
  where referred_user_id = p_actor_user_id
    and status = 'active'
    and start_date is not null
    and end_date is not null
  limit 1;
  if not found then return; end if;

  v_activity_date := (v_now at time zone v_referral.time_zone)::date;
  if v_activity_date not between v_referral.start_date and v_referral.end_date then return; end if;

  v_snapshot := private.founding_driver_core_snapshot(p_stop_id);
  if v_snapshot is null
    or v_snapshot ->> 'truck_fit' is null
    or v_snapshot ->> 'delivery_type' is null
    or v_snapshot ->> 'back_in_required' is null
    or v_snapshot -> 'delivery_zone' = 'null'::jsonb then return;
  end if;

  select * into v_existing from public.referral_stop_contributions
  where user_id = p_actor_user_id and stop_id = p_stop_id;
  if found then
    if v_existing.review_status = 'needs_clarification' and coalesce(p_is_correction, false) then
      update public.referral_stop_contributions
      set review_status = 'pending', review_note = null, reviewed_at = null, reviewed_by = null,
          source_report_id = coalesce(p_source_report_id, source_report_id),
          core_snapshot = v_snapshot, updated_at = v_now
      where id = v_existing.id;
    end if;
    return;
  end if;

  if p_completed_fields is null or cardinality(p_completed_fields) = 0 then return; end if;
  select case when s.user_id = p_actor_user_id then 'new_stop' else 'completed_existing_stop' end
    into v_contribution_type from public.mfi_stops s where s.id = p_stop_id;
  if v_contribution_type is null then return; end if;

  insert into public.referral_stop_contributions(
    referral_id,user_id,stop_id,source_report_id,contribution_type,completed_fields,
    core_snapshot,submitted_at,created_at,updated_at
  ) values (
    v_referral.id,p_actor_user_id,p_stop_id,p_source_report_id,v_contribution_type,
    p_completed_fields,v_snapshot,v_now,v_now,v_now
  ) on conflict(user_id,stop_id) do nothing;
end $$;
revoke all on function private.refresh_referral_stop_candidate(text,uuid,uuid,text[],boolean)
from public, anon, authenticated;

create or replace function private.capture_referral_report_completion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_completed_fields text[] := array[]::text[];
  v_is_correction boolean;
begin
  if v_actor is null or v_actor <> new.user_id then return new; end if;
  if new.truck_fit is not null and (tg_op='INSERT' or old.truck_fit is null)
    and not exists(select 1 from public.mfi_reports r where r.stop_id=new.stop_id and r.id<>new.id and r.truck_fit is not null)
    then v_completed_fields := array_append(v_completed_fields,'truck_fit'); end if;
  if new.delivery_type is not null and (tg_op='INSERT' or old.delivery_type is null)
    and not exists(select 1 from public.mfi_reports r where r.stop_id=new.stop_id and r.id<>new.id and r.delivery_type is not null)
    then v_completed_fields := array_append(v_completed_fields,'delivery_type'); end if;
  if new.back_in_required is not null and (tg_op='INSERT' or old.back_in_required is null)
    and not exists(select 1 from public.mfi_reports r where r.stop_id=new.stop_id and r.id<>new.id and r.back_in_required is not null)
    then v_completed_fields := array_append(v_completed_fields,'back_in'); end if;
  v_is_correction := tg_op='UPDATE' and (
    new.truck_fit is distinct from old.truck_fit
    or new.delivery_type is distinct from old.delivery_type
    or new.back_in_required is distinct from old.back_in_required
  );
  perform private.refresh_referral_stop_candidate(
    new.stop_id,v_actor,new.id,v_completed_fields,v_is_correction
  );
  return new;
end $$;
revoke all on function private.capture_referral_report_completion() from public, anon, authenticated;
create trigger capture_referral_report_completion
after insert or update of truck_fit,delivery_type,back_in_required on public.mfi_reports
for each row execute function private.capture_referral_report_completion();

create or replace function private.capture_referral_delivery_zone_completion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_completed_fields text[] := array[]::text[];
  v_is_correction boolean;
begin
  if v_actor is null then return new; end if;
  if old.entrance_lat is null and old.entrance_lng is null
    and new.entrance_lat is not null and new.entrance_lng is not null
    then v_completed_fields := array_append(v_completed_fields,'delivery_zone'); end if;
  v_is_correction := new.entrance_lat is distinct from old.entrance_lat
    or new.entrance_lng is distinct from old.entrance_lng;
  perform private.refresh_referral_stop_candidate(
    new.id,v_actor,null,v_completed_fields,v_is_correction
  );
  return new;
end $$;
revoke all on function private.capture_referral_delivery_zone_completion() from public, anon, authenticated;
create trigger capture_referral_delivery_zone_completion
after update of entrance_lat,entrance_lng on public.mfi_stops
for each row execute function private.capture_referral_delivery_zone_completion();

create or replace function private.prepare_referral_contribution_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_founding_driver_admin() then raise exception 'Referral admin access required'; end if;
  if new.user_id <> old.user_id or new.referral_id <> old.referral_id or new.stop_id <> old.stop_id
    or new.source_report_id is distinct from old.source_report_id
    or new.contribution_type <> old.contribution_type
    or new.completed_fields <> old.completed_fields
    or new.core_snapshot <> old.core_snapshot
    or new.submitted_at <> old.submitted_at then
    raise exception 'Only referral review fields may be changed';
  end if;
  if new.review_status = 'pending' then
    new.reviewed_at := null; new.reviewed_by := null;
  elsif new.review_status is distinct from old.review_status or new.review_note is distinct from old.review_note then
    new.reviewed_at := clock_timestamp(); new.reviewed_by := auth.uid();
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
revoke all on function private.prepare_referral_contribution_review() from public, anon, authenticated;
create trigger prepare_referral_contribution_review before update on public.referral_stop_contributions
for each row execute function private.prepare_referral_contribution_review();

create or replace function public.record_referral_activity(p_event_type text, p_stop_id text)
returns boolean language plpgsql set search_path = '' as $$
declare v_inserted integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_event_type not in ('stop_intel_viewed','navigation_started','intel_contributed')
    or p_stop_id is null or btrim(p_stop_id) = '' then raise exception 'Invalid activity'; end if;
  insert into public.referral_activity_events(stop_id,event_type)
  values(p_stop_id,p_event_type)
  on conflict(user_id,stop_id,event_type,activity_date) do nothing;
  get diagnostics v_inserted=row_count;
  return v_inserted>0;
end $$;
revoke all on function public.record_referral_activity(text,text) from public, anon;
grant execute on function public.record_referral_activity(text,text) to authenticated, service_role;

create or replace function private.set_referral_delivery_zone(
  p_stop_id text,p_lat double precision,p_lng double precision
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid:=auth.uid(); v_ref public.driver_referrals%rowtype;
  v_now timestamptz:=clock_timestamp(); v_date date; v_updated integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_stop_id is null or btrim(p_stop_id)='' then raise exception 'Stop ID is required'; end if;
  if (p_lat is null)<>(p_lng is null) then raise exception 'Delivery Zone coordinates must both be set or both be cleared'; end if;
  if p_lat is not null and not (p_lat between -90 and 90) then raise exception 'Invalid latitude'; end if;
  if p_lng is not null and not (p_lng between -180 and 180) then raise exception 'Invalid longitude'; end if;
  select * into v_ref from public.driver_referrals
  where referred_user_id=v_uid and status='active' and start_date is not null and end_date is not null limit 1;
  if not found then return false; end if;
  v_date := (v_now at time zone v_ref.time_zone)::date;
  if v_date not between v_ref.start_date and v_ref.end_date then return false; end if;
  update public.mfi_stops set entrance_lat=p_lat,entrance_lng=p_lng,updated_at=v_now
  where id=p_stop_id and (
    user_id=v_uid or (entrance_lat is null and entrance_lng is null and p_lat is not null and p_lng is not null)
  );
  get diagnostics v_updated=row_count;
  return v_updated>0;
end $$;
revoke all on function private.set_referral_delivery_zone(text,double precision,double precision) from public, anon;
grant execute on function private.set_referral_delivery_zone(text,double precision,double precision) to authenticated;
create or replace function public.set_referral_delivery_zone(
  p_stop_id text,p_lat double precision,p_lng double precision
) returns boolean language sql set search_path = '' as $$
  select private.set_referral_delivery_zone(p_stop_id,p_lat,p_lng);
$$;
revoke all on function public.set_referral_delivery_zone(text,double precision,double precision) from public, anon;
grant execute on function public.set_referral_delivery_zone(text,double precision,double precision) to authenticated, service_role;

create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.driver_referrals(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  reward_role text not null check (reward_role in ('referrer','referred')),
  amount_cents integer not null default 500 check (amount_cents = 500),
  payment_status text not null default 'earned' check (payment_status in ('earned','paid')),
  earned_at timestamptz not null default now(), paid_at timestamptz,
  unique(referral_id,reward_role),
  check ((payment_status='paid' and paid_at is not null) or
         (payment_status='earned' and paid_at is null))
);
create index referral_rewards_recipient_idx on public.referral_rewards(recipient_user_id);
alter table public.referral_rewards enable row level security;
revoke all on public.referral_rewards from public, anon, authenticated;
grant select on public.referral_rewards to authenticated;
grant all on public.referral_rewards to service_role;
create policy referral_rewards_read_own_or_admin on public.referral_rewards
for select to authenticated using (
  (select auth.uid()) = recipient_user_id or (select private.is_founding_driver_admin())
);

create view public.referral_progress with (security_invoker=true) as
with activity as (
  select r.id referral_id, count(distinct a.activity_date)::integer active_days
  from public.driver_referrals r
  left join public.referral_activity_events a on a.referral_id=r.id
    and a.activity_date between r.start_date and r.end_date
  group by r.id
), stops as (
  select r.id referral_id,
    count(c.id) filter (
      where c.review_status='counts'
        and (c.submitted_at at time zone r.time_zone)::date between r.start_date and r.end_date
    )::integer qualifying_stops
  from public.driver_referrals r
  left join public.referral_stop_contributions c on c.referral_id=r.id
  group by r.id
)
select r.id referral_id,r.referrer_user_id,r.referred_user_id,
  case when r.status='active'
    and (clock_timestamp() at time zone r.time_zone)::date > r.end_date then 'expired'
    else r.status end status,
  r.start_date,r.end_date,coalesce(a.active_days,0)::integer active_days,
  5::integer active_days_target,greatest(5-coalesce(a.active_days,0),0)::integer active_days_remaining,
  coalesce(s.qualifying_stops,0)::integer qualifying_stops,5::integer qualifying_stops_target,
  greatest(5-coalesce(s.qualifying_stops,0),0)::integer qualifying_stops_remaining,
  (coalesce(a.active_days,0)>=5 and coalesce(s.qualifying_stops,0)>=5) qualification_ready,
  r.qualified_at
from public.driver_referrals r
left join activity a on a.referral_id=r.id
left join stops s on s.referral_id=r.id;
revoke all on public.referral_progress from public, anon;
grant select on public.referral_progress to authenticated, service_role;

create or replace function private.get_referral_progress()
returns table(
  referral_id uuid,referrer_user_id uuid,referred_user_id uuid,
  referrer_username text,referred_username text,status text,start_date date,end_date date,
  active_days integer,active_days_target integer,qualifying_stops integer,
  qualifying_stops_target integer,qualification_ready boolean,
  referrer_reward_status text,referred_reward_status text
) language sql stable security definer set search_path = '' as $$
  select p.referral_id,p.referrer_user_id,p.referred_user_id,
    rp.username,dp.username,p.status,p.start_date,p.end_date,p.active_days,p.active_days_target,
    p.qualifying_stops,p.qualifying_stops_target,p.qualification_ready,
    rr.payment_status,dr.payment_status
  from public.referral_progress p
  join public.profiles rp on rp.id=p.referrer_user_id
  left join public.profiles dp on dp.id=p.referred_user_id
  left join public.referral_rewards rr on rr.referral_id=p.referral_id and rr.reward_role='referrer'
  left join public.referral_rewards dr on dr.referral_id=p.referral_id and dr.reward_role='referred'
  where (select auth.uid()) in (p.referrer_user_id,p.referred_user_id)
    or private.is_founding_driver_admin()
  order by p.start_date desc nulls first;
$$;
revoke all on function private.get_referral_progress() from public, anon;
grant execute on function private.get_referral_progress() to authenticated, service_role;
create or replace function public.get_referral_progress()
returns table(
  referral_id uuid,referrer_user_id uuid,referred_user_id uuid,
  referrer_username text,referred_username text,status text,start_date date,end_date date,
  active_days integer,active_days_target integer,qualifying_stops integer,
  qualifying_stops_target integer,qualification_ready boolean,
  referrer_reward_status text,referred_reward_status text
) language sql stable set search_path = '' as $$
  select * from private.get_referral_progress();
$$;
revoke all on function public.get_referral_progress() from public, anon;
grant execute on function public.get_referral_progress() to authenticated, service_role;

create or replace function public.resolve_referral_code(p_code text)
returns table(referral_code text,referrer_username text)
language sql stable set search_path = '' as $$
  select p.referral_code,p.username from public.profiles p
  where p.referral_code=upper(btrim(p_code)) limit 1;
$$;
revoke all on function public.resolve_referral_code(text) from public;
grant execute on function public.resolve_referral_code(text) to anon, authenticated, service_role;

create or replace function private.qualify_referral(p_referral_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_ref public.driver_referrals%rowtype; v_progress record; v_now timestamptz:=clock_timestamp();
begin
  if not private.is_founding_driver_admin() then raise exception 'Referral admin access required'; end if;
  select * into v_ref from public.driver_referrals where id=p_referral_id for update;
  if not found or v_ref.status <> 'active' then raise exception 'Active referral required'; end if;
  select * into v_progress from public.referral_progress where referral_id=p_referral_id;
  if not coalesce(v_progress.qualification_ready,false) then raise exception 'Referral is not ready'; end if;
  update public.driver_referrals set status='qualified',qualified_at=v_now,updated_at=v_now where id=p_referral_id;
  insert into public.referral_rewards(referral_id,recipient_user_id,reward_role,earned_at)
  values(p_referral_id,v_ref.referrer_user_id,'referrer',v_now),
        (p_referral_id,v_ref.referred_user_id,'referred',v_now)
  on conflict(referral_id,reward_role) do nothing;
end $$;
revoke all on function private.qualify_referral(uuid) from public, anon, authenticated;
grant execute on function private.qualify_referral(uuid) to authenticated;
create or replace function public.qualify_referral(p_referral_id uuid) returns void
language sql set search_path = '' as $$ select private.qualify_referral(p_referral_id); $$;
revoke all on function public.qualify_referral(uuid) from public, anon;
grant execute on function public.qualify_referral(uuid) to authenticated;

create or replace function private.mark_referral_reward_paid(p_reward_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_founding_driver_admin() then raise exception 'Referral admin access required'; end if;
  update public.referral_rewards set payment_status='paid',paid_at=clock_timestamp()
  where id=p_reward_id and payment_status='earned';
  if not found then raise exception 'Earned referral reward required'; end if;
end $$;
revoke all on function private.mark_referral_reward_paid(uuid) from public, anon, authenticated;
grant execute on function private.mark_referral_reward_paid(uuid) to authenticated;
create or replace function public.mark_referral_reward_paid(p_reward_id uuid) returns void
language sql set search_path = '' as $$ select private.mark_referral_reward_paid(p_reward_id); $$;
revoke all on function public.mark_referral_reward_paid(uuid) from public, anon;
grant execute on function public.mark_referral_reward_paid(uuid) to authenticated;
