-- Keep private authorization helpers callable only through reviewed public
-- SECURITY DEFINER APIs. Authenticated clients still retain the private-schema
-- access required by active RLS policies, including moderation and trusted
-- stop-editor checks.

revoke execute on function private.can_contribute_operations(uuid)
  from authenticated;

revoke execute on function private.is_contributor_restricted(uuid)
  from authenticated;
