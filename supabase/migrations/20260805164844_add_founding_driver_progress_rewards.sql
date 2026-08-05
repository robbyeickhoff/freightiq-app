create view public.founding_driver_progress
with (security_invoker = true)
as
with activity_totals as (
  select
    e.id as enrollment_id,
    count(distinct a.activity_date) filter (
      where e.start_date is not null
        and e.end_date is not null
        and a.activity_date between e.start_date and e.end_date
    )::integer as active_days
  from public.founding_driver_enrollments e
  left join public.founding_driver_activity_events a
    on a.enrollment_id = e.id
   and a.user_id = e.user_id
  group by e.id
),
qualifying_stop_totals as (
  select
    e.id as enrollment_id,
    count(c.id) filter (
      where c.review_status = 'counts'
        and e.start_date is not null
        and e.end_date is not null
        and (c.submitted_at at time zone e.time_zone)::date
              between e.start_date and e.end_date
    )::integer as qualifying_stops
  from public.founding_driver_enrollments e
  left join public.founding_driver_stop_contributions c
    on c.enrollment_id = e.id
   and c.user_id = e.user_id
  group by e.id
),
totals as (
  select
    e.*,
    coalesce(a.active_days, 0)::integer as active_days,
    coalesce(q.qualifying_stops, 0)::integer as qualifying_stops
  from public.founding_driver_enrollments e
  left join activity_totals a on a.enrollment_id = e.id
  left join qualifying_stop_totals q on q.enrollment_id = e.id
)
select
  id as enrollment_id,
  user_id,
  status,
  start_date,
  end_date,
  time_zone,
  active_days,
  10::integer as active_days_target,
  greatest(10 - active_days, 0)::integer as active_days_remaining,
  qualifying_stops,
  10::integer as base_stop_target,
  greatest(10 - qualifying_stops, 0)::integer as base_stops_remaining,
  20::integer as bonus_stop_target,
  greatest(20 - qualifying_stops, 0)::integer as bonus_stops_remaining,
  (active_days >= 10 and qualifying_stops >= 10) as base_reward_eligible,
  (active_days >= 10 and qualifying_stops >= 20) as bonus_reward_eligible,
  case
    when active_days >= 10 and qualifying_stops >= 20 then 4000
    when active_days >= 10 and qualifying_stops >= 10 then 2500
    else 0
  end::integer as earned_reward_cents,
  case
    when not (active_days >= 10 and qualifying_stops >= 10) then 'base_reward'
    when not (active_days >= 10 and qualifying_stops >= 20) then 'bonus_reward'
    else 'maximum_reward'
  end::text as next_milestone,
  qualified_at,
  permanent_founding_driver,
  payment_status,
  paid_at
from totals;

comment on view public.founding_driver_progress is
  'Live Founding Driver progress and reward eligibility; qualification confirmation and payment remain admin-controlled.';

revoke all on table public.founding_driver_progress from public, anon, authenticated;
grant select on table public.founding_driver_progress to authenticated, service_role;
