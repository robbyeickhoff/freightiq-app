revoke all privileges
  on table public.mfi_reports
  from authenticated;

grant select
  on table public.mfi_reports
  to authenticated;

grant insert (
  id,
  stop_id,
  user_id,
  deliver_from_type,
  deliver_from_details,
  approach_hint,
  back_in_required,
  truck_fit,
  contact,
  notes,
  updated_at,
  tractor_type,
  delivery_type,
  contact_name,
  contact_phones,
  check_in_notes,
  contact_people
)
  on table public.mfi_reports
  to authenticated;

grant update (
  deliver_from_type,
  deliver_from_details,
  approach_hint,
  back_in_required,
  truck_fit,
  contact,
  notes,
  updated_at,
  tractor_type,
  delivery_type,
  contact_name,
  contact_phones,
  check_in_notes,
  contact_people
)
  on table public.mfi_reports
  to authenticated;

grant delete
  on table public.mfi_reports
  to authenticated;

grant all privileges
  on table private.moderation_admins, private.contributor_restrictions
  to service_role;

comment on column public.mfi_reports.moderation_status is
  'Server-controlled visibility state; client roles cannot write this column.';

comment on column public.mfi_stops.moderation_status is
  'Server-controlled visibility state; client roles cannot write this column.';
