create or replace function public.is_founding_driver_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_founding_driver_admin();
$$;

comment on function public.is_founding_driver_admin() is
  'Safe caller-level API for checking the current user''s Founding Driver admin access.';

revoke all on function public.is_founding_driver_admin() from public, anon;
grant execute on function public.is_founding_driver_admin() to authenticated, service_role;
