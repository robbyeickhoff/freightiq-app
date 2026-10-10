-- READ ONLY. Execute only against confirmed project finjqunyuyfxiesumuxk.
-- This is evidence collection, not installation or a backup.
begin read only;
select jsonb_build_object(
  'server_version', current_setting('server_version'),
  'latest_migration', (select max(version) from supabase_migrations.schema_migrations),
  'guard_installed', to_regprocedure('public.read_freightiq_guarded_v1(text,jsonb)') is not null,
  'response_installed', to_regclass('private.security_response_config') is not null,
  'private_api_setting', current_setting('pgrst.db_schemas', true),
  'tables', (select jsonb_agg(jsonb_build_object(
      'name', c.relname, 'rls', c.relrowsecurity,
      'anonymous_table_select', has_table_privilege('anon', c.oid, 'SELECT'),
      'authenticated_table_select', has_table_privilege('authenticated', c.oid, 'SELECT'),
      'acl_fingerprint', md5(coalesce(c.relacl::text, ''))
    ) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('mfi_stops','mfi_reports','mfi_report_votes',
      'operations_updates','operations_update_confirmations')),
  'dz_triggers', (select jsonb_agg(jsonb_build_object('name',t.tgname,
      'definition_fingerprint',md5(pg_get_triggerdef(t.oid))) order by t.tgname)
    from pg_trigger t where t.tgrelid='public.mfi_stops'::regclass and t.tgname in
    ('capture_founding_driver_delivery_zone_completion','capture_referral_delivery_zone_completion')),
  'extensions', (select jsonb_agg(jsonb_build_object('name',extname,'version',extversion)
    order by extname) from pg_extension where extname in ('pgcrypto','pg_cron','pg_net','ltree','btree_gist'))
) as preflight;
rollback;
-- NULL private_api_setting is UNKNOWN, not proof of which schemas the hosted API exposes.
-- Table privilege does not establish row visibility or column-level privileges.
