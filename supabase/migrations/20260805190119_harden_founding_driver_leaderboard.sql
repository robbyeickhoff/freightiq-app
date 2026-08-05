alter function private.get_founding_driver_leaderboard()
  security definer;

alter function private.get_founding_driver_leaderboard()
  set search_path = '';

revoke all on function private.get_founding_driver_leaderboard()
  from public, anon;
grant execute on function private.get_founding_driver_leaderboard()
  to authenticated, service_role;

alter function public.get_founding_driver_leaderboard()
  security invoker;

alter function public.get_founding_driver_leaderboard()
  set search_path = '';

revoke all on function public.get_founding_driver_leaderboard()
  from public, anon;
grant execute on function public.get_founding_driver_leaderboard()
  to authenticated, service_role;
