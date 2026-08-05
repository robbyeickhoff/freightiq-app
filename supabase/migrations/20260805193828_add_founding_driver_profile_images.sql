set local lock_timeout = '5s';

alter table public.profiles
  add column if not exists profile_image_path text;

alter table public.profiles
  drop constraint if exists profiles_profile_image_path_shape;

alter table public.profiles
  add constraint profiles_profile_image_path_shape
  check (
    profile_image_path is null
    or profile_image_path = id::text || '/profile'
  );

comment on column public.profiles.profile_image_path is
  'Optional path for the driver-managed private Founding Driver profile image. Null uses the FreightIQ logo default.';

create or replace function private.guard_founding_driver_profile_image_path()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if tg_op = 'UPDATE'
     and new.profile_image_path is not distinct from old.profile_image_path then
    return new;
  end if;

  if new.profile_image_path is null then
    return new;
  end if;

  if v_actor is null or v_actor <> new.id then
    raise exception 'Only the profile owner may set a profile image';
  end if;

  if new.profile_image_path <> new.id::text || '/profile' then
    raise exception 'Invalid profile image path';
  end if;

  if not exists (
    select 1
    from public.founding_driver_enrollments enrollment
    where enrollment.user_id = v_actor
  ) then
    raise exception 'Founding Driver enrollment required';
  end if;

  return new;
end;
$$;

comment on function private.guard_founding_driver_profile_image_path() is
  'Restricts the optional profile image path to an enrolled driver''s own fixed object path.';

revoke all on function private.guard_founding_driver_profile_image_path()
  from public, anon, authenticated;

drop trigger if exists profiles_guard_founding_driver_profile_image_path
  on public.profiles;

create trigger profiles_guard_founding_driver_profile_image_path
before insert or update of profile_image_path
on public.profiles
for each row
execute function private.guard_founding_driver_profile_image_path();

create or replace function private.can_manage_own_founding_driver_profile_image(
  p_object_name text,
  p_owner_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and p_owner_id = (select auth.uid())::text
    and p_object_name = (select auth.uid())::text || '/profile'
    and exists (
      select 1
      from public.founding_driver_enrollments enrollment
      where enrollment.user_id = (select auth.uid())
    );
$$;

comment on function private.can_manage_own_founding_driver_profile_image(text, text) is
  'Checks whether the caller owns the fixed profile-image object path and has a Founding Driver enrollment.';

revoke all on function private.can_manage_own_founding_driver_profile_image(text, text)
  from public, anon;
grant execute on function private.can_manage_own_founding_driver_profile_image(text, text)
  to authenticated, service_role;

create or replace function private.can_read_founding_driver_profile_image(
  p_object_name text,
  p_owner_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and p_owner_id is not null
    and p_object_name = p_owner_id || '/profile'
    and (
      private.is_founding_driver_admin()
      or (
        p_owner_id = (select auth.uid())::text
        and exists (
          select 1
          from public.founding_driver_enrollments viewer
          where viewer.user_id = (select auth.uid())
        )
      )
      or (
        exists (
          select 1
          from public.founding_driver_enrollments viewer
          where viewer.user_id = (select auth.uid())
            and viewer.status in ('active', 'qualified', 'completed')
        )
        and exists (
          select 1
          from public.founding_driver_enrollments subject
          where subject.user_id::text = p_owner_id
            and subject.status in ('active', 'qualified', 'completed')
        )
      )
    );
$$;

comment on function private.can_read_founding_driver_profile_image(text, text) is
  'Allows an enrolled owner, active program participant, or Founding Driver admin to retrieve one fixed profile image without exposing bucket listing.';

revoke all on function private.can_read_founding_driver_profile_image(text, text)
  from public, anon;
grant execute on function private.can_read_founding_driver_profile_image(text, text)
  to authenticated, service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-images',
  'profile-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_images_select on storage.objects;
create policy profile_images_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-images'
  and (
    (
      storage.allow_any_operation(array[
        'object.get_authenticated',
        'object.get_authenticated_info',
        'object.head_authenticated_info',
        'object.sign',
        'object.sign_many',
        'render.image_authenticated'
      ])
      and private.can_read_founding_driver_profile_image(name, owner_id)
    )
    or (
      storage.allow_only_operation('object.upload_update')
      and private.can_manage_own_founding_driver_profile_image(name, owner_id)
    )
  )
);

drop policy if exists profile_images_insert_own on storage.objects;
create policy profile_images_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and private.can_manage_own_founding_driver_profile_image(name, owner_id)
);

drop policy if exists profile_images_update_own on storage.objects;
create policy profile_images_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and private.can_manage_own_founding_driver_profile_image(name, owner_id)
)
with check (
  bucket_id = 'profile-images'
  and private.can_manage_own_founding_driver_profile_image(name, owner_id)
);

drop policy if exists profile_images_delete_own_or_admin on storage.objects;
create policy profile_images_delete_own_or_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and (
    private.can_manage_own_founding_driver_profile_image(name, owner_id)
    or private.is_founding_driver_admin()
  )
);
