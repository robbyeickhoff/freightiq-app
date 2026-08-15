create table public.mfi_private_stop_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stop_id text not null references public.mfi_stops (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mfi_private_stop_notes_owner_stop_key unique (user_id, stop_id),
  constraint mfi_private_stop_notes_note_check
    check (btrim(note) <> '' and char_length(note) <= 2000)
);

alter table public.mfi_private_stop_notes enable row level security;

revoke all privileges on table public.mfi_private_stop_notes from public, anon, authenticated;

grant select (id, user_id, stop_id, note, created_at, updated_at)
  on table public.mfi_private_stop_notes to authenticated;
grant insert (stop_id, note)
  on table public.mfi_private_stop_notes to authenticated;
grant update (note, updated_at)
  on table public.mfi_private_stop_notes to authenticated;
grant delete
  on table public.mfi_private_stop_notes to authenticated;
grant all privileges
  on table public.mfi_private_stop_notes to service_role;

create policy mfi_private_stop_notes_select_own
  on public.mfi_private_stop_notes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy mfi_private_stop_notes_insert_own
  on public.mfi_private_stop_notes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy mfi_private_stop_notes_update_own
  on public.mfi_private_stop_notes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy mfi_private_stop_notes_delete_own
  on public.mfi_private_stop_notes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.mfi_private_stop_notes is
  'Owner-only stop notes. Never include this table in shared Intel, search, attribution, moderation, recognition, or analytics surfaces.';
comment on column public.mfi_private_stop_notes.note is
  'Private from other FreightIQ users through RLS; plaintext is not end-to-end encrypted.';

create or replace function public.merge_owned_freightiq_stop(
  p_source_stop_id text,
  p_target_stop_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_source_owner uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_source_stop_id is null or p_target_stop_id is null or p_source_stop_id = p_target_stop_id then
    raise exception using errcode = '22023', message = 'Choose two different stops.';
  end if;

  select s.user_id into v_source_owner
  from public.mfi_stops s
  where s.id = p_source_stop_id
  for update;

  if not found or v_source_owner is distinct from v_user_id then
    raise exception using errcode = '42501', message = 'Only the driver who created this stop can merge it.';
  end if;

  perform 1 from public.mfi_stops where id = p_target_stop_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'The destination stop no longer exists.';
  end if;

  if exists (
    select 1
    from public.mfi_private_stop_notes source_note
    join public.mfi_private_stop_notes target_note
      on target_note.user_id = source_note.user_id
     and target_note.stop_id = p_target_stop_id
    where source_note.stop_id = p_source_stop_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'A locked-note conflict must be resolved before these stops can be merged.';
  end if;

  update public.mfi_reports
  set stop_id = p_target_stop_id,
      updated_at = now()
  where stop_id = p_source_stop_id;

  update public.mfi_private_stop_notes
  set stop_id = p_target_stop_id,
      updated_at = now()
  where stop_id = p_source_stop_id;

  delete from public.mfi_stops where id = p_source_stop_id;
end;
$$;

revoke all on function public.merge_owned_freightiq_stop(text, text)
  from public, anon, authenticated;
grant execute on function public.merge_owned_freightiq_stop(text, text)
  to authenticated;

comment on function public.merge_owned_freightiq_stop(text, text) is
  'Atomically preserves shared reports and owner-only notes when a stop creator merges a duplicate. It returns no private-note data.';
