create table public.routing_lab_fixture_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fixture_id text not null check (fixture_id = 'GR-001'),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.routing_lab_sandbox_lessons (
  user_id uuid not null references auth.users(id) on delete cascade,
  fixture_id text not null check (fixture_id = 'GR-001'),
  category text not null,
  scope text not null,
  strength text not null check (strength in ('Hard rule', 'Preferred', 'Situational')),
  lesson_text text not null check (char_length(lesson_text) between 1 and 500),
  approved_at timestamptz not null default now(),
  primary key (user_id, fixture_id)
);

alter table public.routing_lab_fixture_state enable row level security;
alter table public.routing_lab_sandbox_lessons enable row level security;

grant select, insert, update, delete on public.routing_lab_fixture_state to authenticated;
grant select, insert, update, delete on public.routing_lab_sandbox_lessons to authenticated;

create policy "Users manage their own Routing Lab fixture state"
on public.routing_lab_fixture_state for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own Routing Lab sandbox lessons"
on public.routing_lab_sandbox_lessons for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
