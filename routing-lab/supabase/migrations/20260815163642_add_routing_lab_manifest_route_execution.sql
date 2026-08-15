alter table public.routing_lab_routes
add column run_state jsonb not null default '{}'::jsonb;

alter table public.routing_lab_routes
drop constraint routing_lab_routes_status_check;

alter table public.routing_lab_routes
add constraint routing_lab_routes_status_check
check (
  status in (
    'draft_setup',
    'zone_review',
    'zone_approved',
    'proposal_review',
    'proposal_reviewed',
    'route_active',
    'route_completed'
  )
);
