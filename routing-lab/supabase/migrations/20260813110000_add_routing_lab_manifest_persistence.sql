create table public.routing_lab_manifest_imports (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'review' check (status in ('review', 'confirmed')),
  photo_manifest jsonb not null default '[]'::jsonb,
  extraction jsonb not null,
  working_state jsonb not null,
  confirmed_stops jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routing_lab_manifest_imports_user_updated_idx
on public.routing_lab_manifest_imports (user_id, updated_at desc);

alter table public.routing_lab_manifest_imports enable row level security;

grant select, insert, update, delete on public.routing_lab_manifest_imports to authenticated;

create policy "Users manage their own Routing Lab manifest imports"
on public.routing_lab_manifest_imports for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'routing-lab-manifests',
  'routing-lab-manifests',
  false,
  8388608,
  array['image/jpeg']
);

create policy "Users read their own Routing Lab manifest photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'routing-lab-manifests'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users upload their own Routing Lab manifest photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'routing-lab-manifests'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users update their own Routing Lab manifest photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'routing-lab-manifests'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'routing-lab-manifests'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users delete their own Routing Lab manifest photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'routing-lab-manifests'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
