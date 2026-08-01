alter table public.mfi_stops
  add constraint mfi_stops_name_not_blank
  check (btrim(name) <> '');

alter table public.mfi_stops
  add constraint mfi_stops_coordinates_valid
  check (
    lat between -90::double precision and 90::double precision
    and lng between -180::double precision and 180::double precision
  );

alter table public.mfi_stops
  add constraint mfi_stops_entrance_coordinates_valid
  check (
    (entrance_lat is null and entrance_lng is null)
    or (
      entrance_lat is not null
      and entrance_lng is not null
      and entrance_lat between -90::double precision and 90::double precision
      and entrance_lng between -180::double precision and 180::double precision
    )
  );

create index mfi_stops_user_id_idx
  on public.mfi_stops (user_id);

revoke all privileges
  on table public.mfi_stops
  from anon;

revoke all privileges
  on table public.mfi_stops
  from authenticated;

grant select
  on table public.mfi_stops
  to anon, authenticated;

grant insert (id, name, address, lat, lng, user_id)
  on table public.mfi_stops
  to authenticated;

grant update (name, address, entrance_lat, entrance_lng, updated_at)
  on table public.mfi_stops
  to authenticated;

grant delete
  on table public.mfi_stops
  to authenticated;

drop policy if exists mfi_stops_delete_own on public.mfi_stops;
drop policy if exists mfi_stops_update_all on public.mfi_stops;
drop policy if exists mfi_stops_write_all on public.mfi_stops;

create policy mfi_stops_insert_own
  on public.mfi_stops
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy mfi_stops_update_shared_fields
  on public.mfi_stops
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy mfi_stops_delete_own
  on public.mfi_stops
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
