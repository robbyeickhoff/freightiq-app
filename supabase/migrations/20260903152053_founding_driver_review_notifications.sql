begin;
create table private.founding_driver_review_email_batches (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  new_count integer not null,
  pending_count integer not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_id text
);
create table private.founding_driver_review_email_events (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.founding_driver_stop_contributions(id) on delete cascade,
  created_at timestamptz not null default now(),
  batch_id uuid references private.founding_driver_review_email_batches(id),
  dismissed boolean not null default false
);
create index founding_driver_review_email_unbatched on private.founding_driver_review_email_events(created_at)
  where batch_id is null and not dismissed;
alter table private.founding_driver_review_email_batches enable row level security;
alter table private.founding_driver_review_email_events enable row level security;
revoke all on private.founding_driver_review_email_batches, private.founding_driver_review_email_events from public, anon, authenticated;
grant all on private.founding_driver_review_email_batches, private.founding_driver_review_email_events to service_role;
create policy review_email_batches_service on private.founding_driver_review_email_batches for all to service_role using (true) with check (true);
create policy review_email_events_service on private.founding_driver_review_email_events for all to service_role using (true) with check (true);

create function private.queue_founding_driver_review_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.review_status = 'pending' and (tg_op = 'INSERT' or old.review_status is distinct from 'pending') then
    insert into private.founding_driver_review_email_events(contribution_id) values (new.id);
  end if;
  return new;
end;
$$;
revoke all on function private.queue_founding_driver_review_email() from public, anon, authenticated;
create trigger queue_founding_driver_review_email after insert or update of review_status
  on public.founding_driver_stop_contributions for each row execute function private.queue_founding_driver_review_email();

-- Include the existing pending queue in the first digest, but never completed reviews.
insert into private.founding_driver_review_email_events(contribution_id)
select id from public.founding_driver_stop_contributions where review_status = 'pending';

create function private.claim_founding_driver_review_email(p_recipient text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  batch private.founding_driver_review_email_batches;
  event_ids uuid[];
  pending_count integer;
begin
  perform pg_advisory_xact_lock(740193301);
  select * into batch from private.founding_driver_review_email_batches where sent_at is null order by created_at limit 1;
  if found then
    -- Resend keeps idempotency keys for 24h. Never risk repeating an uncertain send after expiry.
    if batch.created_at < now() - interval '23 hours' then
      raise exception 'Review notification delivery needs operator reconciliation';
    end if;
    return to_jsonb(batch);
  end if;
  if exists(select 1 from private.founding_driver_review_email_batches where sent_at > now() - interval '1 hour') then
    return null;
  end if;
  if p_recipient is null or length(p_recipient) > 254 or p_recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid notification recipient';
  end if;
  update private.founding_driver_review_email_events e set dismissed = true
    where batch_id is null and not dismissed and not exists (
      select 1 from public.founding_driver_stop_contributions c where c.id=e.contribution_id and c.review_status='pending');
  select array_agg(e.id) into event_ids from private.founding_driver_review_email_events e
    where e.batch_id is null and not e.dismissed;
  if event_ids is null then return null; end if;
  select count(*) into pending_count from public.founding_driver_stop_contributions where review_status='pending';
  insert into private.founding_driver_review_email_batches(recipient,new_count,pending_count)
    select p_recipient,count(distinct contribution_id),pending_count
      from private.founding_driver_review_email_events where id=any(event_ids)
    returning * into batch;
  update private.founding_driver_review_email_events set batch_id=batch.id where id=any(event_ids);
  return to_jsonb(batch);
end;
$$;
create function private.complete_founding_driver_review_email(p_batch_id uuid, p_provider_id text)
returns void language sql security definer set search_path = '' as $$
  update private.founding_driver_review_email_batches set sent_at=now(),provider_id=p_provider_id
    where id=p_batch_id and sent_at is null;
$$;
create function public.claim_founding_driver_review_email(p_recipient text)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.claim_founding_driver_review_email(p_recipient);
$$;
create function public.complete_founding_driver_review_email(p_batch_id uuid,p_provider_id text)
returns void language sql security invoker set search_path = '' as $$
  select private.complete_founding_driver_review_email(p_batch_id,p_provider_id);
$$;
revoke all on function private.claim_founding_driver_review_email(text), private.complete_founding_driver_review_email(uuid,text), public.claim_founding_driver_review_email(text), public.complete_founding_driver_review_email(uuid,text) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.claim_founding_driver_review_email(text), private.complete_founding_driver_review_email(uuid,text), public.claim_founding_driver_review_email(text), public.complete_founding_driver_review_email(uuid,text) to service_role;
commit;
