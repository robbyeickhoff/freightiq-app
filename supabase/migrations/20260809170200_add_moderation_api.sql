create or replace function public.is_moderation_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and private.is_moderation_admin();
$$;

revoke all on function public.is_moderation_admin() from public, anon, authenticated;
grant execute on function public.is_moderation_admin() to authenticated;

create or replace function public.get_moderation_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  queue jsonb;
begin
  if (select auth.uid()) is null or not private.is_moderation_admin() then
    raise insufficient_privilege using message = 'Moderation access required';
  end if;

  select coalesce(jsonb_agg(to_jsonb(queue_row) order by queue_row.created_at), '[]'::jsonb)
    into queue
  from (
    select
      cr.id,
      cr.subject_type,
      cr.report_id,
      cr.stop_id,
      cr.reporter_user_id,
      reporter.username as reporter_username,
      cr.subject_owner_user_id,
      contributor.username as contributor_username,
      cr.reason,
      cr.details,
      cr.status,
      cr.created_at,
      cr.reviewed_at,
      cr.reviewed_by,
      cr.review_notes,
      cr.outcome,
      case
        when cr.subject_type = 'report' then to_jsonb(r) - 'contact' - 'contact_phones'
        else to_jsonb(s) - 'entrance_photo_path' - 'entrance_photo_url'
      end as subject,
      (
        select count(*)
        from public.content_reports prior
        where prior.id <> cr.id
          and (
            (cr.report_id is not null and prior.report_id = cr.report_id)
            or (cr.stop_id is not null and prior.stop_id = cr.stop_id)
          )
      ) as prior_subject_report_count,
      (
        select count(*)
        from public.content_reports prior
        where prior.id <> cr.id
          and prior.subject_owner_user_id = cr.subject_owner_user_id
      ) as prior_contributor_report_count
    from public.content_reports cr
    left join public.mfi_reports r on r.id = cr.report_id
    left join public.mfi_stops s on s.id = cr.stop_id
    left join public.profiles reporter on reporter.id = cr.reporter_user_id
    left join public.profiles contributor on contributor.id = cr.subject_owner_user_id
    order by
      case cr.status when 'open' then 0 when 'reviewing' then 1 else 2 end,
      cr.created_at
  ) queue_row;

  return queue;
end;
$$;

revoke all on function public.get_moderation_queue() from public, anon, authenticated;
grant execute on function public.get_moderation_queue() to authenticated;

create or replace function public.resolve_content_report(
  p_content_report_id uuid,
  p_outcome text,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.content_reports%rowtype;
  moderator_id uuid := (select auth.uid());
  normalized_notes text := nullif(btrim(p_review_notes), '');
begin
  if moderator_id is null or not private.is_moderation_admin() then
    raise insufficient_privilege using message = 'Moderation access required';
  end if;

  if p_outcome not in (
    'dismissed',
    'content_corrected',
    'content_removed',
    'contributor_warned',
    'contributor_restricted'
  ) then
    raise check_violation using message = 'Invalid moderation outcome';
  end if;

  if normalized_notes is not null and char_length(normalized_notes) > 2000 then
    raise check_violation using message = 'Review notes must be 2000 characters or fewer';
  end if;

  select * into target
  from public.content_reports
  where id = p_content_report_id
  for update;

  if not found then
    raise no_data_found using message = 'Content report not found';
  end if;

  if p_outcome = 'content_removed' then
    if target.subject_type = 'report' then
      update public.mfi_reports
      set moderation_status = 'removed', updated_at = now()
      where id = target.report_id;
    else
      update public.mfi_stops
      set moderation_status = 'removed', updated_at = now()
      where id = target.stop_id;
    end if;
  end if;

  if p_outcome = 'contributor_restricted' then
    if target.subject_owner_user_id is null then
      raise check_violation using message = 'The reported content has no contributor to restrict';
    end if;

    insert into private.contributor_restrictions (
      user_id,
      status,
      reason,
      created_by,
      updated_at
    )
    values (
      target.subject_owner_user_id,
      'restricted',
      coalesce(normalized_notes, 'Restricted after content moderation review'),
      moderator_id,
      now()
    )
    on conflict (user_id) do update
      set status = 'restricted',
          reason = excluded.reason,
          updated_at = now();
  end if;

  update public.content_reports
  set status = 'resolved',
      reviewed_at = now(),
      reviewed_by = moderator_id,
      review_notes = normalized_notes,
      outcome = p_outcome
  where id = target.id;
end;
$$;

revoke all on function public.resolve_content_report(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.resolve_content_report(uuid, text, text)
  to authenticated;

comment on function public.get_moderation_queue() is
  'Returns moderation data only after validating dedicated FreightIQ moderator authority.';

comment on function public.resolve_content_report(uuid, text, text) is
  'Records an attributable moderation outcome and applies removal or contributor restriction when selected.';

create table private.account_deletion_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table private.account_deletion_attempts enable row level security;

revoke all privileges
  on table private.account_deletion_attempts
  from public, anon, authenticated;

create index account_deletion_attempts_user_created_idx
  on private.account_deletion_attempts (user_id, created_at desc);

create or replace function public.begin_account_deletion()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  recent_attempts integer;
begin
  if caller_id is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  select count(*) into recent_attempts
  from private.account_deletion_attempts
  where user_id = caller_id
    and created_at > now() - interval '1 hour';

  if recent_attempts >= 3 then return false; end if;

  insert into private.account_deletion_attempts (user_id)
  values (caller_id);

  return true;
end;
$$;

revoke all on function public.begin_account_deletion() from public, anon, authenticated;
grant execute on function public.begin_account_deletion() to authenticated;

comment on function public.begin_account_deletion() is
  'Allows at most three authenticated account-deletion attempts per user per hour.';
