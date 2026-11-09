-- Keep the automatic RLS event trigger active while removing its unnecessary
-- direct Data API execution surface.

revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated, service_role;
