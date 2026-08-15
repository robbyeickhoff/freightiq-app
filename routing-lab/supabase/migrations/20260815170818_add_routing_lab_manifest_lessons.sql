create table public.routing_lab_manifest_lessons (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_route_id uuid not null references public.routing_lab_routes(id) on delete cascade,
  status text not null default 'approved' check (status in ('approved', 'rejected')),
  lesson_text text not null check (char_length(lesson_text) between 1 and 500),
  strength text not null check (strength in ('Hard rule', 'Preferred', 'Situational')),
  scope_type text not null check (scope_type in ('Stop', 'Road', 'Micro Zone', 'Zone', 'Macro Zone')),
  scope_value text not null,
  category text not null,
  operational_reason text not null,
  impact text not null check (impact in ('Critical', 'Moderate', 'Minor', 'Equivalent')),
  known_exceptions text not null default '',
  evidence jsonb not null,
  approved_at timestamptz not null default now()
);

create index routing_lab_manifest_lessons_user_approved_idx
on public.routing_lab_manifest_lessons (user_id, approved_at desc);

alter table public.routing_lab_manifest_lessons enable row level security;
grant select, insert, update, delete on public.routing_lab_manifest_lessons to authenticated;

create policy "Users manage their own Routing Lab manifest lessons"
on public.routing_lab_manifest_lessons for all to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.routing_lab_routes
    where routing_lab_routes.id = source_route_id
      and routing_lab_routes.user_id = (select auth.uid())
  )
);
