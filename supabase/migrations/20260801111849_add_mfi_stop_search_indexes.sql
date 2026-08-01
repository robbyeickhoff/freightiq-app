create extension if not exists postgis
  with schema extensions;

create extension if not exists pg_trgm
  with schema extensions;

alter table public.mfi_stops
  add column search_location extensions.geography(point, 4326)
  generated always as (
    extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
  ) stored;

create index mfi_stops_search_location_gix
  on public.mfi_stops
  using gist (search_location);

create index mfi_stops_name_trgm_idx
  on public.mfi_stops
  using gin (lower(name) extensions.gin_trgm_ops);

create index mfi_stops_address_trgm_idx
  on public.mfi_stops
  using gin (lower(coalesce(address, '')) extensions.gin_trgm_ops);
