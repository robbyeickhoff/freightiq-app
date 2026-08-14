create table public.routing_lab_routes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  manifest_import_id uuid not null references public.routing_lab_manifest_imports(id) on delete cascade,
  route_kind text not null default 'manifest' check (route_kind = 'manifest'),
  status text not null default 'draft_setup' check (status = 'draft_setup'),
  source_stops jsonb not null,
  setup jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, manifest_import_id)
);

create index routing_lab_routes_user_updated_idx
on public.routing_lab_routes (user_id, updated_at desc);

alter table public.routing_lab_routes enable row level security;

grant select, insert, update, delete on public.routing_lab_routes to authenticated;

create policy "Users manage their own Routing Lab routes"
on public.routing_lab_routes for all to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.routing_lab_manifest_imports
    where routing_lab_manifest_imports.id = manifest_import_id
      and routing_lab_manifest_imports.user_id = (select auth.uid())
  )
);
