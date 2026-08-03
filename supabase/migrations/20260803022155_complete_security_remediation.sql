create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists private.trusted_stop_editors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  reason text not null default 'Approved FreightIQ trusted stop editor'
);

alter table private.trusted_stop_editors enable row level security;

revoke all privileges
  on table private.trusted_stop_editors
  from public, anon, authenticated;

create or replace function private.is_trusted_stop_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.trusted_stop_editors
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_trusted_stop_editor() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_trusted_stop_editor() to authenticated;

drop policy if exists mfi_stops_update_shared_fields on public.mfi_stops;

create policy mfi_stops_update_owner_or_trusted_editor
  on public.mfi_stops
  for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select private.is_trusted_stop_editor())
  )
  with check (
    (select auth.uid()) = user_id
    or (select private.is_trusted_stop_editor())
  );

revoke all privileges
  on table public.mfi_reports
  from anon;

grant select (
  id,
  stop_id,
  user_id,
  deliver_from_type,
  deliver_from_details,
  approach_hint,
  back_in_required,
  truck_fit,
  notes,
  votes_up,
  votes_down,
  created_at,
  updated_at,
  tractor_type,
  delivery_type
)
  on table public.mfi_reports
  to anon;

revoke all privileges
  on table public.early_access_requests
  from anon, authenticated;

grant insert (name, email, platform, city_state, driver_type, notes)
  on table public.early_access_requests
  to anon;

alter table public.early_access_requests
  add constraint early_access_requests_name_length_check
    check (char_length(name) between 1 and 120),
  add constraint early_access_requests_email_length_check
    check (char_length(email) between 3 and 254),
  add constraint early_access_requests_city_state_length_check
    check (city_state is null or char_length(city_state) <= 120),
  add constraint early_access_requests_driver_type_length_check
    check (driver_type is null or char_length(driver_type) <= 120),
  add constraint early_access_requests_notes_length_check
    check (notes is null or char_length(notes) <= 2000);

drop policy if exists "Allow public early access request inserts"
  on public.early_access_requests;

create policy early_access_requests_insert_applicant_fields
  on public.early_access_requests
  for insert
  to anon
  with check (
    btrim(name) <> ''
    and char_length(name) <= 120
    and btrim(email) <> ''
    and char_length(email) <= 254
    and platform in ('Android', 'iPhone')
    and (city_state is null or char_length(city_state) <= 120)
    and (driver_type is null or char_length(driver_type) <= 120)
    and (notes is null or char_length(notes) <= 2000)
  );

update storage.buckets
set public = false
where id = 'entrance-photos';

drop policy if exists entrance_photos_select on storage.objects;
drop policy if exists entrance_photos_insert on storage.objects;
drop policy if exists entrance_photos_update on storage.objects;
drop policy if exists entrance_photos_delete on storage.objects;
