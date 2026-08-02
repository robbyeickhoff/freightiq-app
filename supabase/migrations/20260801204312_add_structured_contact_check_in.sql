alter table public.mfi_reports
  add column contact_name text,
  add column contact_phones jsonb,
  add column check_in_notes text;

alter table public.mfi_reports
  add constraint mfi_reports_contact_name_length_check
    check (contact_name is null or char_length(contact_name) <= 100),
  add constraint mfi_reports_contact_phones_array_check
    check (contact_phones is null or jsonb_typeof(contact_phones) = 'array'),
  add constraint mfi_reports_contact_phones_count_check
    check (contact_phones is null or jsonb_array_length(contact_phones) <= 5),
  add constraint mfi_reports_contact_phones_size_check
    check (contact_phones is null or octet_length(contact_phones::text) <= 2000),
  add constraint mfi_reports_check_in_notes_length_check
    check (check_in_notes is null or char_length(check_in_notes) <= 500);

comment on column public.mfi_reports.contact_name is
  'Optional business delivery contact name.';

comment on column public.mfi_reports.contact_phones is
  'Ordered business delivery phone rows. Approved types: mobile, work_mobile, receiving, office.';

comment on column public.mfi_reports.check_in_notes is
  'Optional business check-in guidance without credentials or private access information.';
