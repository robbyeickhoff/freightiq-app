create or replace function private.get_founding_driver_leaderboard()
returns table (
  leaderboard_rank bigint,
  username text,
  qualifying_stops integer,
  active_days integer,
  founding_driver boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with access_check as (
    select (
      (select auth.uid()) is not null
      and (
        private.is_founding_driver_admin()
        or exists (
          select 1
          from public.founding_driver_enrollments viewer
          where viewer.user_id = (select auth.uid())
            and viewer.status in ('active', 'qualified', 'completed')
        )
      )
    ) as can_view
  ),
  ranked as (
    select
      dense_rank() over (
        order by progress.qualifying_stops desc
      ) as leaderboard_rank,
      profile.username,
      progress.qualifying_stops,
      progress.active_days,
      progress.permanent_founding_driver as founding_driver
    from public.founding_driver_progress progress
    join public.profiles profile
      on profile.id = progress.user_id
    where progress.status in ('active', 'qualified', 'completed')
  )
  select
    ranked.leaderboard_rank,
    ranked.username,
    ranked.qualifying_stops,
    ranked.active_days,
    ranked.founding_driver
  from ranked
  cross join access_check
  where access_check.can_view
  order by
    ranked.leaderboard_rank,
    lower(ranked.username),
    ranked.username;
$$;

comment on function private.get_founding_driver_leaderboard() is
  'Privileged implementation for the safe Founding Driver leaderboard; access is checked against the caller identity.';

revoke all on function private.get_founding_driver_leaderboard()
  from public, anon;
grant execute on function private.get_founding_driver_leaderboard()
  to authenticated, service_role;

create or replace function public.get_founding_driver_leaderboard()
returns table (
  leaderboard_rank bigint,
  username text,
  qualifying_stops integer,
  active_days integer,
  founding_driver boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_founding_driver_leaderboard();
$$;

comment on function public.get_founding_driver_leaderboard() is
  'Safe caller-level API for the live Founding Driver leaderboard.';

revoke all on function public.get_founding_driver_leaderboard() from public, anon;
grant execute on function public.get_founding_driver_leaderboard() to authenticated, service_role;
