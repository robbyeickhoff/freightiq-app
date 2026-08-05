create schema if not exists private;

create table private.founding_driver_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table private.founding_driver_admins enable row level security;

revoke all privileges
  on table private.founding_driver_admins
  from public, anon, authenticated;

create policy founding_driver_admins_deny_direct_access
  on private.founding_driver_admins
  for all
  to public
  using (false)
  with check (false);

create or replace function private.is_founding_driver_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.founding_driver_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_founding_driver_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_founding_driver_admin() to authenticated;

create table public.founding_driver_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'qualified', 'completed', 'withdrawn')),
  start_date date,
  end_date date,
  time_zone text not null default 'America/Denver'
    check (btrim(time_zone) <> ''),
  qualified_at timestamptz,
  permanent_founding_driver boolean not null default false,
  payment_preference text
    check (payment_preference is null or payment_preference in ('venmo', 'amazon_gift_card', 'other')),
  payment_preference_note text
    check (payment_preference_note is null or char_length(payment_preference_note) <= 200),
  payment_status text not null default 'not_earned'
    check (payment_status in ('not_earned', 'earned', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founding_driver_enrollment_dates_check
    check (
      (start_date is null and end_date is null)
      or (start_date is not null and end_date is not null and end_date >= start_date)
    ),
  constraint founding_driver_payment_check
    check (
      (payment_status = 'paid' and paid_at is not null)
      or (payment_status <> 'paid' and paid_at is null)
    )
);

comment on table public.founding_driver_enrollments is
  'Private program enrollment, qualification, and reward state for FreightIQ Founding Drivers.';

alter table public.founding_driver_enrollments enable row level security;

revoke all privileges
  on table public.founding_driver_enrollments
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.founding_driver_enrollments
  to authenticated;

grant all privileges
  on table public.founding_driver_enrollments
  to service_role;

create policy founding_driver_enrollments_select_own
  on public.founding_driver_enrollments
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
  );

create policy founding_driver_enrollments_admin_select
  on public.founding_driver_enrollments
  for select
  to authenticated
  using ((select private.is_founding_driver_admin()));

create policy founding_driver_enrollments_admin_insert
  on public.founding_driver_enrollments
  for insert
  to authenticated
  with check ((select private.is_founding_driver_admin()));

create policy founding_driver_enrollments_admin_update
  on public.founding_driver_enrollments
  for update
  to authenticated
  using ((select private.is_founding_driver_admin()))
  with check ((select private.is_founding_driver_admin()));

create policy founding_driver_enrollments_admin_delete
  on public.founding_driver_enrollments
  for delete
  to authenticated
  using ((select private.is_founding_driver_admin()));

do $$
declare
  admin_count integer;
  admin_user_id uuid;
begin
  select count(*)
    into admin_count
  from auth.users
  where lower(email) = lower('robbyeickhoff@gmail.com');

  if admin_count <> 1 then
    raise exception 'Expected exactly one FreightIQ admin account for robbyeickhoff@gmail.com; found %', admin_count;
  end if;

  select id
    into admin_user_id
  from auth.users
  where lower(email) = lower('robbyeickhoff@gmail.com');

  insert into private.founding_driver_admins (user_id)
  values (admin_user_id);
end;
$$;
