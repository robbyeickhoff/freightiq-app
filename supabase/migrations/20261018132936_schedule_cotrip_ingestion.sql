begin;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Provision these values in Vault before enabling the scheduled worker. The
-- dedicated worker secret authorizes ingestion; the anonymous project key is
-- used only to satisfy the Edge Functions gateway JWT check.
do $$
begin
  if not exists (
    select 1 from vault.secrets where name = 'cotrip_ingest_secret'
  ) then
    raise exception 'Provision cotrip_ingest_secret in Vault first';
  end if;

  if not exists (
    select 1 from vault.secrets where name = 'cotrip_project_anon_key'
  ) then
    raise exception 'Provision cotrip_project_anon_key in Vault first';
  end if;
end
$$;

select cron.schedule(
  'ingest-cotrip-conditions-every-15-minutes',
  '*/15 * * * *',
  $job$
    select net.http_post(
      url := 'https://finjqunyuyfxiesumuxk.supabase.co/functions/v1/ingest-cotrip-conditions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'cotrip_project_anon_key'
        ),
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'cotrip_project_anon_key'
        ),
        'x-freightiq-worker-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'cotrip_ingest_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $job$
);

commit;
