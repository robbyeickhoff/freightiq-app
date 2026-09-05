create or replace function public.confirm_operations_update(p_update_id uuid, p_response text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_update public.operations_updates%rowtype;
  v_no_count integer;
  v_latest_yes timestamptz;
begin
  if v_user is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;
  if private.is_contributor_restricted(v_user) then
    raise insufficient_privilege using message = 'Operations confirmation unavailable';
  end if;
  if p_response not in ('yes', 'no') then
    raise check_violation using message = 'Choose Yes or No';
  end if;

  select * into v_update
  from public.operations_updates
  where id = p_update_id
  for update;

  if not found
    or v_update.author_user_id = v_user
    or v_update.status not in ('active', 'possibly_cleared')
    or v_update.moderation_status <> 'visible'
    or v_update.expires_at <= now()
  then
    raise check_violation using message = 'This update cannot be confirmed';
  end if;

  if exists (
    select 1
    from public.operations_update_confirmations c
    where c.update_id = p_update_id
      and c.revision = v_update.revision
      and c.responder_user_id = v_user
      and c.created_at > now() - interval '10 minutes'
  ) then
    raise check_violation using message = 'You already confirmed this update recently';
  end if;

  insert into public.operations_update_confirmations(
    update_id,
    revision,
    responder_user_id,
    response
  ) values (
    p_update_id,
    v_update.revision,
    v_user,
    p_response
  );

  if p_response = 'yes' then
    update public.operations_updates
    set status = 'active', resolution_source = null, updated_at = now()
    where id = p_update_id;
  else
    select max(created_at) into v_latest_yes
    from public.operations_update_confirmations
    where update_id = p_update_id
      and revision = v_update.revision
      and response = 'yes';

    select count(distinct responder_user_id) into v_no_count
    from public.operations_update_confirmations c
    where c.update_id = p_update_id
      and c.revision = v_update.revision
      and c.response = 'no'
      and c.created_at > greatest(
        now() - interval '2 hours',
        coalesce(v_latest_yes, '-infinity'::timestamptz)
      );

    update public.operations_updates
    set
      status = case when v_no_count >= 2 then 'resolved' else 'possibly_cleared' end,
      resolution_source = case when v_no_count >= 2 then 'community' else null end,
      updated_at = now()
    where id = p_update_id;
  end if;

  return (select status from public.operations_updates where id = p_update_id);
end;
$$;

revoke all on function public.confirm_operations_update(uuid, text) from public, anon, authenticated;
grant execute on function public.confirm_operations_update(uuid, text) to authenticated;

comment on function public.confirm_operations_update(uuid, text) is
  'Records one Operations response per driver per update revision during a ten-minute encounter cooldown.';
