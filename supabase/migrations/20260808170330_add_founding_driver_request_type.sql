alter table public.early_access_requests
  add column request_type text not null default 'early_access';

alter table public.early_access_requests
  add constraint early_access_requests_request_type_check
    check (request_type in ('early_access', 'founding_driver'));

grant insert (request_type)
  on table public.early_access_requests
  to anon;

drop policy if exists early_access_requests_insert_applicant_fields
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
    and request_type in ('early_access', 'founding_driver')
  );
