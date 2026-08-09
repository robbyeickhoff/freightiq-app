alter table public.mfi_reports
  add column contact_people jsonb;

alter table public.mfi_reports
  add constraint mfi_reports_contact_people_array_check
    check (contact_people is null or jsonb_typeof(contact_people) = 'array'),
  add constraint mfi_reports_contact_people_phone_count_check
    check (
      contact_people is null
      or jsonb_array_length(jsonb_path_query_array(contact_people, '$[*].phones[*]')) <= 5
    ),
  add constraint mfi_reports_contact_people_size_check
    check (contact_people is null or octet_length(contact_people::text) <= 5000);

comment on column public.mfi_reports.contact_people is
  'Ordered business delivery contacts with ordered phone rows; no more than five phones total.';
