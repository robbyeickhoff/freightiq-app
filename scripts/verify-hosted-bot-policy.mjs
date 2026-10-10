// Bounded October 5 activation acceptance. Does NOT configure or close any access.
// Creates one confirmed @example.invalid login; no stop/report/profile/Operations writes.
// Reads at most 200 existing stop IDs transiently, never prints content or credentials.
// Always signs out/deletes only the newly created account. Normal pseudonymous observation
// records follow existing retention; deletion triggers remove its short counters/cases.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

assert.deepEqual(process.argv.slice(2), ['--approved-hosted', 'finjqunyuyfxiesumuxk']);
assert.equal(realpathSync('.'), '/Users/robbyeickhoff/mfi');
const ref = 'finjqunyuyfxiesumuxk';
const url = `https://${ref}.supabase.co`;
const keys = JSON.parse(execFileSync('npx', ['supabase', 'projects', 'api-keys',
  '--project-ref', ref, '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const anon = keys.find(k => k.name === 'anon')?.api_key;
const serviceKey = keys.find(k => k.name === 'service_role')?.api_key;
assert.ok(anon && serviceKey);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, serviceKey, options);
const client = createClient(url, anon, options);
let userId, token;
async function rpc(name, body = {}, bearer = token) {
  const start = performance.now();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { apikey: anon, Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data, ms: performance.now() - start };
}
function ok(result, label) {
  assert.equal(result.status, 200, `${label}: unexpected HTTP status`);
  assert.ok(result.data?.code == null, `${label}: guarded error`);
}
const p95 = values => [...values].sort((a,b) => a-b)[Math.ceil(values.length * .95)-1];
try {
  // No auth email is sent: admin creation confirms this disposable fictional address.
  const email = `bot-activation-${randomUUID()}@example.invalid`;
  const password = randomUUID() + 'aA!';
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null, 'Disposable login creation failed');
  userId = created.data.user.id;
  console.log(JSON.stringify({ fixtureUser: userId, scope: 'read-only app data; one disposable auth account' }));
  const login = await client.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null, 'Disposable login failed');
  token = login.data.session.access_token;
  const idsResult = await service.from('mfi_stops').select('id').order('id').limit(200);
  assert.equal(idsResult.error, null, 'Bounded ID selection failed');
  const ids = idsResult.data.map(row => row.id);
  assert.equal(ids.length, 200, 'Requires 200 existing stops; do not fabricate public fixtures');
  const unauth = await rpc('read_freightiq_guarded_v1', { p_operation: 'route_stops', p_args: { p_stop_ids: ids.slice(0,1) } }, anon);
  assert.ok([401,403].includes(unauth.status), 'Anonymous guard access must be denied');
  const started = performance.now();
  for (let batch=0; batch<3; batch++) {
    const result = await rpc('read_freightiq_guarded_v1', {
      p_operation: 'route_stops', p_args: { p_stop_ids: ids.slice(batch*50,batch*50+50) },
    });
    ok(result, 'allowed route batch');
    assert.equal(result.data.data.length, 50, 'Allowed batch incomplete');
  }
  assert.ok(performance.now()-started < 30000, 'Run too slow for bounded exhaustion check');
  const denied = await rpc('read_freightiq_guarded_v1', {
    p_operation: 'route_stops', p_args: { p_stop_ids: ids.slice(150,200) },
  });
  assert.equal(denied.status,429,'Next 50 new details must be refused');
  assert.equal(denied.data.code,'FREIGHTIQ_READ_THROTTLED');
  assert.equal(denied.data.data,null,'Refusal must not leak data');
  const repeated = await rpc('read_freightiq_guarded_v1', {
    p_operation:'route_stops',p_args:{p_stop_ids:ids.slice(0,50)},
  });
  ok(repeated,'repeat route batch');assert.equal(repeated.data.data.length,50);
  console.log('PASS: anonymous denied; 150 details allowed; next 50 new details HTTP429/data null; repeated 50 remain readable');
  const legacy=[], guarded=[], operations=[];let operationsCount;
  for(let i=0;i<12;i++) {
    const steps = i%2===0 ? ['legacy','guarded'] : ['guarded','legacy'];
    for(const step of steps) {
      const r=step==='legacy'
        ? await rpc('get_freightiq_route_stops_v1',{p_stop_ids:ids.slice(0,50)})
        : await rpc('read_freightiq_guarded_v1',{p_operation:'route_stops',p_args:{p_stop_ids:ids.slice(0,50)}});
      ok(r,step);assert.equal((step==='legacy'?r.data:r.data.data).length,50);
      (step==='legacy'?legacy:guarded).push(r.ms);
    }
    const op=await rpc('read_operations_guarded_v1',{p_area_slug:'grand-junction',p_limit:100,p_cursor:null});
    ok(op,'Operations');operations.push(op.ms);
    operationsCount = Array.isArray(op.data.data) ? op.data.data.length : op.data.data?.updates?.length ?? null;
  }
  console.log(JSON.stringify({samplesPerPath:12,routeRows:50,legacyP95ms:p95(legacy),guardedP95ms:p95(guarded),operationsP95ms:p95(operations),operationsCount,
    qualification:'Small sequential hosted smoke sample, not 1000-condition/concurrency/soak performance acceptance'}));
} finally {
  if (token) {
    const signedOut = await client.auth.signOut({scope:'global'});
    assert.equal(signedOut.error,null,'Disposable sign-out failed; investigate before deletion');
  }
  if (userId) {
    const deleted = await service.auth.admin.deleteUser(userId);
    assert.equal(deleted.error,null,'Disposable account cleanup failed');
    console.log(JSON.stringify({deletedFixtureUser:userId,appDataWrites:0}));
  }
}
