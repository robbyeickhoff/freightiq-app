set local lock_timeout = '5s';

drop policy if exists profile_images_select on storage.objects;
create policy profile_images_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-images'
  and (
    private.can_manage_own_founding_driver_profile_image(name, owner_id)
    or (
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
  )
);

do $$
begin
  comment on policy profile_images_select on storage.objects is
    'Allows Storage INSERT RETURNING and upsert metadata access for an enrolled driver''s own fixed image path, while retaining operation-scoped reads for authorized participants and admins.';
exception
  when insufficient_privilege then
    raise notice 'Skipping optional profile_images_select comment because the migration role does not own storage.objects';
end;
$$;
