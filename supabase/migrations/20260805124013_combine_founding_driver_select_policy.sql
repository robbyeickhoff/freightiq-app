drop policy founding_driver_enrollments_select_own
  on public.founding_driver_enrollments;

drop policy founding_driver_enrollments_admin_select
  on public.founding_driver_enrollments;

create policy founding_driver_enrollments_select_own_or_admin
  on public.founding_driver_enrollments
  for select
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and (select auth.uid()) = user_id
    )
    or (select private.is_founding_driver_admin())
  );
