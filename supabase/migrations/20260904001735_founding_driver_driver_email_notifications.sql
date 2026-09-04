begin;

create table private.founding_driver_email_preferences (
  enrollment_id uuid primary key references public.founding_driver_enrollments(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  contribution_review_emails boolean not null default false,
  updated_at timestamptz not null default now()
);
create table private.founding_driver_email_events (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.founding_driver_enrollments(id) on delete cascade,
  kind text not null check (kind in ('welcome','review')),
  contribution_id uuid references public.founding_driver_stop_contributions(id) on delete cascade,
  review_status text check (review_status is null or review_status in ('counts','needs_clarification','does_not_count')),
  created_at timestamptz not null default now(),
  delivery_id uuid
);
create table private.founding_driver_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.founding_driver_enrollments(id) on delete cascade,
  kind text not null check (kind in ('welcome','review')),
  recipient text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_id text
);
alter table private.founding_driver_email_events add constraint founding_driver_email_events_delivery_fkey
  foreign key(delivery_id) references private.founding_driver_email_deliveries(id);
create index founding_driver_email_events_unclaimed on private.founding_driver_email_events(created_at) where delivery_id is null;

alter table private.founding_driver_email_preferences enable row level security;
alter table private.founding_driver_email_events enable row level security;
alter table private.founding_driver_email_deliveries enable row level security;
revoke all on private.founding_driver_email_preferences, private.founding_driver_email_events, private.founding_driver_email_deliveries from public,anon,authenticated;
grant all on private.founding_driver_email_preferences, private.founding_driver_email_events, private.founding_driver_email_deliveries to service_role;
create policy founding_driver_email_preferences_service on private.founding_driver_email_preferences for all to service_role using(true) with check(true);
create policy founding_driver_email_events_service on private.founding_driver_email_events for all to service_role using(true) with check(true);
create policy founding_driver_email_deliveries_service on private.founding_driver_email_deliveries for all to service_role using(true) with check(true);

create function private.initialize_founding_driver_email()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into private.founding_driver_email_preferences(enrollment_id,user_id) values(new.id,new.user_id);
  insert into private.founding_driver_email_events(enrollment_id,kind) values(new.id,'welcome');
  return new;
end; $$;
revoke all on function private.initialize_founding_driver_email() from public,anon,authenticated;
create trigger initialize_founding_driver_email after insert on public.founding_driver_enrollments
  for each row execute function private.initialize_founding_driver_email();

-- Existing enrollments get preferences but no surprise welcome email.
insert into private.founding_driver_email_preferences(enrollment_id,user_id)
select id,user_id from public.founding_driver_enrollments on conflict do nothing;

create function private.queue_founding_driver_review_result()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.review_status in ('counts','needs_clarification','does_not_count')
    and new.review_status is distinct from old.review_status
    and exists(select 1 from private.founding_driver_email_preferences p where p.enrollment_id=new.enrollment_id and p.contribution_review_emails)
  then
    insert into private.founding_driver_email_events(enrollment_id,kind,contribution_id,review_status)
      values(new.enrollment_id,'review',new.id,new.review_status);
  end if;
  return new;
end; $$;
revoke all on function private.queue_founding_driver_review_result() from public,anon,authenticated;
create trigger queue_founding_driver_review_result after update of review_status on public.founding_driver_stop_contributions
  for each row execute function private.queue_founding_driver_review_result();

create function private.get_own_founding_driver_email_preference()
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select p.contribution_review_emails from private.founding_driver_email_preferences p
    join public.founding_driver_enrollments e on e.id=p.enrollment_id
    where p.user_id=auth.uid() and e.status in ('active','qualified','completed')),false);
$$;
create function private.set_own_founding_driver_email_preference(p_enabled boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  update private.founding_driver_email_preferences p set contribution_review_emails=coalesce(p_enabled,false),updated_at=now()
    from public.founding_driver_enrollments e where e.id=p.enrollment_id and p.user_id=auth.uid() and e.status in ('active','qualified','completed');
  if not found then raise exception 'Founding Driver access required' using errcode='42501'; end if;
  if not coalesce(p_enabled,false) then
    delete from private.founding_driver_email_events where enrollment_id in
      (select enrollment_id from private.founding_driver_email_preferences where user_id=auth.uid()) and kind='review' and delivery_id is null;
  end if;
end; $$;
create function public.get_founding_driver_email_preference()
returns boolean language sql stable security invoker set search_path='' as $$ select private.get_own_founding_driver_email_preference(); $$;
create function public.set_founding_driver_email_preference(p_enabled boolean)
returns void language sql security invoker set search_path='' as $$ select private.set_own_founding_driver_email_preference(p_enabled); $$;
revoke all on function private.get_own_founding_driver_email_preference(),private.set_own_founding_driver_email_preference(boolean),public.get_founding_driver_email_preference(),public.set_founding_driver_email_preference(boolean) from public,anon,authenticated;
grant execute on function private.get_own_founding_driver_email_preference(),private.set_own_founding_driver_email_preference(boolean),public.get_founding_driver_email_preference(),public.set_founding_driver_email_preference(boolean) to authenticated;

create function private.queue_founding_driver_welcome(p_enrollment_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not private.is_founding_driver_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if not exists(select 1 from public.founding_driver_enrollments where id=p_enrollment_id) then raise exception 'Enrollment not found'; end if;
  if exists(select 1 from private.founding_driver_email_events where enrollment_id=p_enrollment_id and kind='welcome' and delivery_id is null) then
    return;
  end if;
  insert into private.founding_driver_email_events(enrollment_id,kind) values(p_enrollment_id,'welcome');
end; $$;
create function public.queue_founding_driver_welcome(p_enrollment_id uuid)
returns void language sql security invoker set search_path='' as $$ select private.queue_founding_driver_welcome(p_enrollment_id); $$;
revoke all on function private.queue_founding_driver_welcome(uuid),public.queue_founding_driver_welcome(uuid) from public,anon,authenticated;
grant execute on function private.queue_founding_driver_welcome(uuid),public.queue_founding_driver_welcome(uuid) to authenticated;

create function private.get_founding_driver_email_admin_status()
returns table(enrollment_id uuid,welcome_state text,welcome_updated_at timestamptz) language sql stable security definer set search_path='' as $$
  select e.id,case when d.sent_at is not null then 'sent' when ev.id is not null then 'queued' else 'not_sent' end,
    coalesce(d.sent_at,ev.created_at)
  from public.founding_driver_enrollments e
  left join lateral(select * from private.founding_driver_email_events x where x.enrollment_id=e.id and x.kind='welcome' order by x.created_at desc limit 1) ev on true
  left join private.founding_driver_email_deliveries d on d.id=ev.delivery_id
  where private.is_founding_driver_admin();
$$;
create function public.get_founding_driver_email_admin_status()
returns table(enrollment_id uuid,welcome_state text,welcome_updated_at timestamptz) language sql stable security invoker set search_path='' as $$ select * from private.get_founding_driver_email_admin_status(); $$;
revoke all on function private.get_founding_driver_email_admin_status(),public.get_founding_driver_email_admin_status() from public,anon,authenticated;
grant execute on function private.get_founding_driver_email_admin_status(),public.get_founding_driver_email_admin_status() to authenticated;

create function private.claim_founding_driver_email()
returns jsonb language plpgsql security definer set search_path='' as $$
declare d private.founding_driver_email_deliveries; ev private.founding_driver_email_events; ids uuid[]; uname text; mail text; program_start date; program_end date; payload jsonb;
begin
  perform pg_advisory_xact_lock(740193302);
  select * into d from private.founding_driver_email_deliveries where sent_at is null order by created_at limit 1;
  if found then
    if d.created_at < now()-interval '23 hours' then raise exception 'Driver email delivery needs operator reconciliation'; end if;
    return to_jsonb(d);
  end if;
  select * into ev from private.founding_driver_email_events where delivery_id is null order by (kind='welcome') desc,created_at limit 1;
  if not found then return null; end if;
  select u.email,p.username,e.start_date,e.end_date into mail,uname,program_start,program_end
    from public.founding_driver_enrollments e join auth.users u on u.id=e.user_id join public.profiles p on p.id=e.user_id where e.id=ev.enrollment_id;
  if mail is null then raise exception 'Enrolled driver account email missing'; end if;
  if ev.kind='welcome' then
    ids:=array[ev.id]; payload:=jsonb_build_object('username',uname,'start_date',program_start,'end_date',program_end);
  else
    select array_agg(id),jsonb_build_object('username',uname,'counts',count(*) filter(where review_status='counts'),'clarification',count(*) filter(where review_status='needs_clarification'),'does_not_count',count(*) filter(where review_status='does_not_count'))
      into ids,payload from private.founding_driver_email_events where delivery_id is null and enrollment_id=ev.enrollment_id and kind='review';
  end if;
  insert into private.founding_driver_email_deliveries(enrollment_id,kind,recipient,payload) values(ev.enrollment_id,ev.kind,mail,payload) returning * into d;
  update private.founding_driver_email_events set delivery_id=d.id where id=any(ids);
  return to_jsonb(d);
end; $$;
create function private.complete_founding_driver_email(p_delivery_id uuid,p_provider_id text)
returns void language sql security definer set search_path='' as $$ update private.founding_driver_email_deliveries set sent_at=now(),provider_id=p_provider_id where id=p_delivery_id and sent_at is null; $$;
create function public.claim_founding_driver_email() returns jsonb language sql security invoker set search_path='' as $$ select private.claim_founding_driver_email(); $$;
create function public.complete_founding_driver_email(p_delivery_id uuid,p_provider_id text) returns void language sql security invoker set search_path='' as $$ select private.complete_founding_driver_email(p_delivery_id,p_provider_id); $$;
revoke all on function private.claim_founding_driver_email(),private.complete_founding_driver_email(uuid,text),public.claim_founding_driver_email(),public.complete_founding_driver_email(uuid,text) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.claim_founding_driver_email(),private.complete_founding_driver_email(uuid,text),public.claim_founding_driver_email(),public.complete_founding_driver_email(uuid,text) to service_role;

do $$ begin
  if not exists(select 1 from vault.secrets where name='founding_driver_review_notification_secret') then
    raise exception 'Provision founding_driver_review_notification_secret in Vault first';
  end if;
end $$;
select cron.schedule(
  'founding-driver-driver-email-hourly',
  '5 * * * *',
  $job$
    select net.http_post(
      url := 'https://finjqunyuyfxiesumuxk.supabase.co/functions/v1/notify-founding-driver-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-review-notification-secret', (select decrypted_secret from vault.decrypted_secrets where name='founding_driver_review_notification_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $job$
);
commit;
