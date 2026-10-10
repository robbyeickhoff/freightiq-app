// LOCAL validation only. Never substitute a hosted connection in this runner.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';

assert.deepEqual(process.argv.slice(2), ['--local']);
assert.equal(realpathSync('.'), '/Users/robbyeickhoff/mfi');
const context = JSON.parse(execFileSync('docker', ['context', 'inspect', 'desktop-linux'], { encoding: 'utf8' }));
assert.ok(context[0].Endpoints.docker.Host.startsWith('unix://'));
const sql = input => execFileSync('docker', ['--context', 'desktop-linux', 'exec', '-i',
  'supabase_db_mfi', 'psql', '-X', '-U', 'postgres', '-Atq', '-v', 'ON_ERROR_STOP=1'],
{ input, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }).trim();
const fingerprint = `select jsonb_build_object(
 'library',(select md5(to_jsonb(c)::text) from private.freightiq_read_guard_config c),
 'operations',(select md5(to_jsonb(c)::text) from private.operations_read_guard_config c),
 'response',(select md5((to_jsonb(c)-'last_worker_at')::text) from private.security_response_config c),
 'users',(select count(*) from auth.users), 'stops',(select count(*) from public.mfi_stops),
 'cases',(select count(*) from private.security_read_cases),
 'outbox',(select count(*) from private.security_alert_outbox),
 'minutes',(select count(*) from private.security_read_minutes),
 'buckets',(select count(*) from private.freightiq_read_guard_buckets),
 'seen',(select count(*) from private.freightiq_read_guard_seen),
 'functions',(select md5(string_agg(pg_get_functiondef(p.oid)||coalesce(p.proacl::text,''),'' order by p.oid))
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname in ('public','private') and p.prokind='f'));`;
const before = sql(fingerprint);
const candidate = readFileSync('scripts/fixtures/bot-hosted-rollback-rehearsal.sql', 'utf8');
assert.match(candidate, /rollback;\s*$/i);
assert.ok(!/^\s*(commit|truncate|delete|grant|revoke)\b/im.test(candidate));
const output = sql(candidate);
assert.match(output, /PASS: 150 synthetic details allowed/);
assert.equal(sql(fingerprint), before, 'Rollback did not preserve local state');
console.log('PASS: rollback-only candidate assertions; before/after configuration and function fingerprints plus fixture counts match. Local only; hosted execution and HTTP acceptance not performed.');
