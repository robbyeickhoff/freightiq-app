import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

assert.deepEqual(process.argv.slice(2), ['--local'], 'Explicit --local required');
const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(realpathSync(root), '/Users/robbyeickhoff/mfi');
const context = JSON.parse(execFileSync('docker', ['context', 'inspect', 'desktop-linux'], { encoding: 'utf8' }));
assert.ok(context[0]?.Endpoints?.docker?.Host?.startsWith('unix://'), 'Local Docker socket required');
function sql(input) {
  return execFileSync('docker', ['--context', 'desktop-linux', 'exec', '-i', 'supabase_db_mfi',
    'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'],
  { input, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
}
assert.equal(sql("select count(*) from pg_namespace where nspname='freightiq_response_proof'").trim(), '0', 'Existing proof schema must not be overwritten');
// Compare hashes only; never print real records, salts or configuration secrets.
const relations = ['public.mfi_stops', 'public.mfi_reports', 'public.mfi_report_votes',
  'public.mfi_private_stop_notes', 'public.operations_updates', 'auth.users',
  'private.moderation_admins', 'private.founding_driver_admins', 'private.contributor_restrictions',
  'private.freightiq_read_guard_config', 'private.operations_read_guard_config',
  'private.freightiq_read_guard_buckets', 'private.freightiq_read_guard_seen', 'private.operations_read_guard_buckets'];
const fingerprintSql = relations.map(table =>
  `select '${table}',md5(coalesce(string_agg(j,'' order by j),'')) from (select row_to_json(t)::text j from ${table} t) x;`
).join('\n') + `
select md5(coalesce(string_agg(pg_get_functiondef(p.oid)||coalesce(p.proacl::text,''),'' order by p.oid),''))
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and p.prokind='f';
select md5(coalesce(string_agg(c.oid::text||coalesce(c.relacl::text,'')||c.relrowsecurity::text,'' order by c.oid),''))
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private');
`;
const before = sql(fingerprintSql);
let output;
try {
  output = sql('begin;\n' + readFileSync(new URL('./fixtures/security-response-proof.sql', import.meta.url), 'utf8') +
    '\n' + readFileSync(new URL('./fixtures/security-response-proof-tests.sql', import.meta.url), 'utf8') + '\nrollback;');
} finally {
  assert.equal(sql("select count(*) from pg_namespace where nspname='freightiq_response_proof'").trim(), '0', 'Proof schema survived rollback');
  assert.equal(sql(fingerprintSql), before, 'Original data, guard configuration/counters or definitions/grants changed');
  console.log('Rollback verified: proof schema absent; original data, guard configuration/counters and definition/grant fingerprints match.');
}
assert.ok(!/^not ok/m.test(output), 'Database assertion failed:\n' + output);
const count = output.match(/^1\.\.(\d+)$/m)?.[1];
assert.ok(count, 'Missing completed pgTAP plan');
assert.equal((output.match(/^ok \d+/gm) ?? []).length, Number(count));
console.log(`${count} rollback-only security response assertions passed. No live controls installed.`);
