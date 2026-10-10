-- Read-only health signal for an independently hosted monitor. No scheduler enabled.
create function private.security_delivery_health() returns jsonb
language sql stable security definer set search_path='' as $$
 with checks as (
 select detection_enabled and mail_enabled as enabled,
  coalesce(last_worker_at>now()-interval '5 minutes',false) as worker_fresh,
  last_record_failure_at is null as recording_ok,
  exists(select 1 from private.security_alert_recipients ar
   join private.moderation_admins ma on ma.user_id=ar.user_id
   join auth.users u on u.id=coalesce(ar.delivery_user_id,ar.user_id)
   where u.email_confirmed_at is not null and u.email is not null) as recipient_ready,
  not exists(select 1 from private.security_alert_outbox
   where state='held' or (state='pending' and created_at<now()-interval '5 minutes')) as backlog_clear,
  not exists(select 1 from private.security_read_minutes where minute<now()-interval '2 hours')
   and not exists(select 1 from private.security_read_cases where expires_at<now()-interval '5 minutes') as retention_ok
 from private.security_response_config
 ) select to_jsonb(checks)||jsonb_build_object('healthy',
  enabled and worker_fresh and recording_ok and recipient_ready and backlog_clear and retention_ok) from checks;
$$;
create function public.get_security_delivery_health_v1() returns jsonb
language sql stable security invoker set search_path='' as $$select private.security_delivery_health();$$;
revoke all on function private.security_delivery_health(),public.get_security_delivery_health_v1()
 from public,anon,authenticated,service_role;
grant execute on function private.security_delivery_health(),public.get_security_delivery_health_v1() to service_role;
