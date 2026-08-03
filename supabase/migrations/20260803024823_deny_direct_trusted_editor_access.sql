create policy trusted_stop_editors_deny_direct_access
  on private.trusted_stop_editors
  for all
  to public
  using (false)
  with check (false);
