create schema if not exists private;

create table private.moderation_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table private.moderation_admins enable row level security;

revoke all privileges
  on table private.moderation_admins
  from public, anon, authenticated;

create policy moderation_admins_deny_direct_access
  on private.moderation_admins
  for all
  to public
  using (false)
  with check (false);

insert into private.moderation_admins (user_id)
select user_id
from private.founding_driver_admins
on conflict (user_id) do nothing;

create or replace function private.is_moderation_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.moderation_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_moderation_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_moderation_admin() to authenticated;

create table private.contributor_restrictions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'restricted'
    check (status in ('restricted', 'lifted')),
  reason text not null
    check (btrim(reason) <> '' and char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_at timestamptz not null default now()
);

alter table private.contributor_restrictions enable row level security;

revoke all privileges
  on table private.contributor_restrictions
  from public, anon, authenticated;

create policy contributor_restrictions_deny_direct_access
  on private.contributor_restrictions
  for all
  to public
  using (false)
  with check (false);

create or replace function private.is_contributor_restricted(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.contributor_restrictions
    where user_id = p_user_id
      and status = 'restricted'
  );
$$;

revoke all on function private.is_contributor_restricted(uuid) from public, anon, authenticated;
grant execute on function private.is_contributor_restricted(uuid) to authenticated;

create table public.blocked_contributors (
  blocking_user_id uuid not null references auth.users (id) on delete cascade,
  blocked_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocking_user_id, blocked_user_id),
  constraint blocked_contributors_no_self_block check (blocking_user_id <> blocked_user_id)
);

alter table public.blocked_contributors enable row level security;

revoke all privileges
  on table public.blocked_contributors
  from public, anon, authenticated;

grant select, insert, delete
  on table public.blocked_contributors
  to authenticated;

grant all privileges
  on table public.blocked_contributors
  to service_role;

create policy blocked_contributors_select_own
  on public.blocked_contributors
  for select
  to authenticated
  using ((select auth.uid()) = blocking_user_id);

create policy blocked_contributors_insert_own
  on public.blocked_contributors
  for insert
  to authenticated
  with check ((select auth.uid()) = blocking_user_id);

create policy blocked_contributors_delete_own
  on public.blocked_contributors
  for delete
  to authenticated
  using ((select auth.uid()) = blocking_user_id);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  subject_type text not null
    check (subject_type in ('report', 'stop')),
  report_id uuid references public.mfi_reports (id) on delete cascade,
  stop_id text references public.mfi_stops (id) on delete cascade,
  subject_owner_user_id uuid references auth.users (id) on delete set null,
  reason text not null
    check (
      reason in (
        'incorrect_or_unsafe',
        'private_or_confidential',
        'abusive_or_inappropriate',
        'spam_or_unrelated',
        'other'
      )
    ),
  details text
    check (details is null or char_length(details) <= 500),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  review_notes text
    check (review_notes is null or char_length(review_notes) <= 2000),
  outcome text
    check (
      outcome is null
      or outcome in (
        'dismissed',
        'content_corrected',
        'content_removed',
        'contributor_warned',
        'contributor_restricted'
      )
    ),
  constraint content_reports_subject_reference_check check (
    (subject_type = 'report' and report_id is not null and stop_id is null)
    or (subject_type = 'stop' and stop_id is not null and report_id is null)
  ),
  constraint content_reports_review_state_check check (
    (status <> 'resolved' and reviewed_at is null and reviewed_by is null and outcome is null)
    or (status = 'resolved' and reviewed_at is not null and reviewed_by is not null and outcome is not null)
  )
);

create unique index content_reports_open_report_subject_unique
  on public.content_reports (reporter_user_id, report_id)
  where status in ('open', 'reviewing') and report_id is not null;

create unique index content_reports_open_stop_subject_unique
  on public.content_reports (reporter_user_id, stop_id)
  where status in ('open', 'reviewing') and stop_id is not null;

create index content_reports_moderation_queue_idx
  on public.content_reports (status, created_at);

create index content_reports_subject_owner_idx
  on public.content_reports (subject_owner_user_id, created_at desc);

create or replace function private.prepare_content_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_owner_id uuid;
begin
  if new.reporter_user_id is distinct from (select auth.uid()) then
    raise exception 'A content report can only be submitted as the signed-in user';
  end if;

  new.details := nullif(btrim(new.details), '');
  new.status := 'open';
  new.created_at := now();
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.review_notes := null;
  new.outcome := null;

  if new.subject_type = 'report' then
    select user_id into resolved_owner_id
    from public.mfi_reports
    where id = new.report_id;
  else
    select user_id into resolved_owner_id
    from public.mfi_stops
    where id = new.stop_id;
  end if;

  if not found then
    raise exception 'The reported content could not be found';
  end if;

  if resolved_owner_id is null then
    raise exception 'This shared stop has no contributor to report';
  end if;

  if resolved_owner_id = new.reporter_user_id then
    raise exception 'You cannot report your own content';
  end if;

  new.subject_owner_user_id := resolved_owner_id;
  return new;
end;
$$;

revoke all on function private.prepare_content_report() from public, anon, authenticated;

create trigger prepare_content_report
before insert on public.content_reports
for each row execute function private.prepare_content_report();

alter table public.content_reports enable row level security;

revoke all privileges
  on table public.content_reports
  from public, anon, authenticated;

grant insert (subject_type, report_id, stop_id, reason, details)
  on table public.content_reports
  to authenticated;

grant select (id, subject_type, report_id, stop_id, reason, details, status, created_at)
  on table public.content_reports
  to authenticated;

grant all privileges
  on table public.content_reports
  to service_role;

create policy content_reports_insert_own
  on public.content_reports
  for insert
  to authenticated
  with check ((select auth.uid()) = reporter_user_id);

create policy content_reports_select_own
  on public.content_reports
  for select
  to authenticated
  using ((select auth.uid()) = reporter_user_id);

alter table public.mfi_reports
  add column moderation_status text not null default 'visible'
    check (moderation_status in ('visible', 'hidden', 'removed'));

alter table public.mfi_stops
  add column moderation_status text not null default 'visible'
    check (moderation_status in ('visible', 'hidden', 'removed'));

drop policy if exists mfi_reports_read_all on public.mfi_reports;

create policy mfi_reports_read_visible
  on public.mfi_reports
  for select
  to anon
  using (moderation_status = 'visible');

create policy mfi_reports_read_visible_or_owned
  on public.mfi_reports
  for select
  to authenticated
  using (
    moderation_status = 'visible'
    or (select auth.uid()) = user_id
    or (select private.is_moderation_admin())
  );

drop policy if exists mfi_stops_read_all on public.mfi_stops;

create policy mfi_stops_read_visible
  on public.mfi_stops
  for select
  to anon
  using (moderation_status = 'visible');

create policy mfi_stops_read_visible_or_owned
  on public.mfi_stops
  for select
  to authenticated
  using (
    moderation_status = 'visible'
    or (select auth.uid()) = user_id
    or (select private.is_moderation_admin())
  );

create or replace function private.enforce_contributor_write_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_contributor_restricted((select auth.uid())) then
    raise exception 'Your account is currently restricted from contributing';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_contributor_write_access() from public, anon, authenticated;

create trigger enforce_mfi_reports_contributor_access
before insert or update on public.mfi_reports
for each row execute function private.enforce_contributor_write_access();

create trigger enforce_mfi_report_votes_contributor_access
before insert or update on public.mfi_report_votes
for each row execute function private.enforce_contributor_write_access();

create trigger enforce_mfi_stops_contributor_access
before insert or update on public.mfi_stops
for each row execute function private.enforce_contributor_write_access();

comment on table public.content_reports is
  'User-submitted safety reports. Moderation-only review fields are not exposed to client roles.';

comment on table public.blocked_contributors is
  'Private, reversible contributor blocks visible only to the blocking user.';

comment on table private.moderation_admins is
  'Dedicated FreightIQ moderation authority, independent of program membership.';

comment on table private.contributor_restrictions is
  'Server-controlled contribution restrictions enforced by database triggers.';
