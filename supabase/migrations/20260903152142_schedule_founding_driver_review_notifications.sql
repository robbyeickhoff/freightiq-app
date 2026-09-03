begin;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Provision the dedicated worker secret in Vault before enabling this job.
-- No service-role credential is included in the scheduler request.
do $$ begin
  if not exists(select 1 from vault.secrets where name='founding_driver_review_notification_secret') then
    raise exception 'Provision founding_driver_review_notification_secret in Vault first';
  end if;
end $$;
select cron.schedule(
  'founding-driver-review-email-hourly',
  '0 * * * *',
  $job$
    select net.http_post(
      url := 'https://finjqunyuyfxiesumuxk.supabase.co/functions/v1/notify-founding-driver-reviews',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-review-notification-secret', (select decrypted_secret from vault.decrypted_secrets where name='founding_driver_review_notification_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $job$
);
commit;
