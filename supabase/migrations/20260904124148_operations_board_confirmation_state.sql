create or replace function public.get_operations_board(
  p_area_slug text default null,
  p_include_history boolean default false
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(feed) order by feed.created_at desc), '[]'::jsonb)
  from (
    select
      u.id,
      a.slug as area_slug,
      a.display_name as area_name,
      u.category,
      u.message,
      u.stop_id,
      u.latitude,
      u.longitude,
      u.created_at,
      u.updated_at,
      u.expires_at,
      u.revision,
      u.status,
      u.edited,
      u.author_user_id,
      p.username,
      p.profile_image_path,
      true as founding_driver,
      u.author_user_id = auth.uid() as is_author,
      (
        select max(c.created_at)
        from public.operations_update_confirmations c
        where c.update_id = u.id
          and c.revision = u.revision
          and c.response = 'yes'
      ) as last_confirmed_at
    from public.operations_updates u
    join public.operations_areas a on a.id = u.area_id
    join public.profiles p on p.id = u.author_user_id
    where auth.uid() is not null
      and a.is_active
      and (p_area_slug is null or a.slug = p_area_slug)
      and not exists (
        select 1
        from public.blocked_contributors b
        where b.blocking_user_id = auth.uid()
          and b.blocked_user_id = u.author_user_id
      )
      and (
        (
          not p_include_history
          and u.status in ('active', 'possibly_cleared')
          and u.moderation_status = 'visible'
          and u.expires_at > now()
        )
        or (
          p_include_history
          and u.author_user_id = auth.uid()
          and u.created_at > now() - interval '7 days'
        )
      )
  ) feed;
$$;

revoke all on function public.get_operations_board(text, boolean) from public, anon, authenticated;
grant execute on function public.get_operations_board(text, boolean) to authenticated;

comment on function public.get_operations_board(text, boolean) is
  'Returns the caller-scoped Operations feed with current-revision last-confirmed state.';
