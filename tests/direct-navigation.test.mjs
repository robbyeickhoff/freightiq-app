import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { readDirectNavigation } from '../utils/direct-navigation.ts';

const source = readFileSync(new URL('../app/(tabs)/(map)/index.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  async function navToStop()');
const end = source.indexOf('\n  async function addSelectedStopToRoute', start);
const handler = ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

test('map Navigate previews one destination without adding to or activating the daily route', async () => {
  for (const id of ['temp-search-result', 'saved-freightiq-stop']) {
    let writes = 0;
    const pushes = [];
    const destination = { id, name: '101 Campbell Lane', address: 'Ridgway, CO', lat: 38.151186, lng: -107.753118 };
    const run = new Function('selectedStop', 'navigationLaunching', 'hasEmbeddedNavigation', 'setNavigationLaunching', 'router', 'navigateToStop', 'Alert', `${handler}; return navToStop;`)(
      destination, false, true, () => {}, { push: (value) => pushes.push(value) }, () => { writes++; }, { alert: () => assert.fail('Navigation failed') },
    );
    await run();
    assert.equal(writes, 0);
    assert.equal(pushes.length, 1);
    assert.equal(pushes[0].pathname, '/active-navigation');
    const direct = readDirectNavigation(pushes[0].params.direct);
    assert.equal(direct.name, destination.name);
    assert.equal(direct.lat, destination.lat);
    assert.equal(direct.freightIqStop, id !== 'temp-search-result');
  }
});
test('invalid direct destinations cannot become navigation requests', () => {
  const valid = { id: 'direct:1', name: 'Address', address: 'Ridgway', lat: 38, lng: -107, freightIqStop: false };
  assert.deepEqual(readDirectNavigation(JSON.stringify(valid)), valid);
  for (const value of [undefined, '{', 'null', '{}', JSON.stringify({ ...valid, lat: 91 }), JSON.stringify({ ...valid, lng: null })]) {
    assert.equal(readDirectNavigation(value), null);
  }
});

const guidance = readFileSync(new URL('../app/active-navigation.tsx', import.meta.url), 'utf8');
test('starting and ending a map trip never starts or ends Today’s Route', async () => {
  const begin = guidance.indexOf('onStart={(index) => void save(async () => {');
  const end = guidance.indexOf('})}', begin);
  const callback = guidance.slice(begin, end + 2).replace('onStart={', '');
  const stopBegin = guidance.indexOf('onPress={() => void save(async () => {');
  const stopEnd = guidance.indexOf('})}', stopBegin);
  const stopCallback = guidance.slice(stopBegin, stopEnd + 2).replace('onPress={', '');
  for (const direct of [true, false]) {
    let started = 0, ended = 0, backed = 0, choice = '', pending;
    const save = (fn) => { pending = fn(); };
    const start = new Function('directDestination','previewStart','route','startExecution','setChoices','setMessage','setRouteChoice','request','save',
      `return (${callback});`)(direct, '1', { execution: { status: 'draft' } }, async () => started++, () => {}, () => {}, (v) => choice = v, { id: 'request' }, save);
    start(2); await pending;
    assert.equal(started, direct ? 0 : 1);
    assert.equal(choice, 'request|2');
    const stop = new Function('directDestination','endExecution','router','save', `return (${stopCallback});`)(
      direct, async () => ended++, { back: () => backed++ }, save);
    stop(); await pending;
    assert.equal(ended, direct ? 0 : 1);
    assert.equal(backed, 1);
  }
});


test('Add to Route keeps searched addresses private and uses a stable destination id', async () => {
  const begin = source.indexOf('  async function addSelectedStopToRoute');
  const finish = source.indexOf('\n  function onPressCluster', begin);
  const body = ts.transpileModule(source.slice(begin, finish), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const id of ['temp-search-result', 'saved-stop']) {
    const selected = { id, name: 'Residence', address: 'Ridgway', lat: 38, lng: -107 };
    const writes = [];
    const run = new Function('selectedStop', 'addStop', 'routeAddMode', 'Alert', `${body}; return addSelectedStopToRoute;`)(
      selected, async (stop) => { writes.push(stop); return 'added'; }, false, { alert() {} });
    await run(); await run();
    assert.equal(writes.length, 2);
    assert.equal(writes[0].id, writes[1].id);
    assert.equal(writes[0].id, id === 'temp-search-result' ? 'address:38,-107' : id);
    assert.equal(writes[0].freightIqStop, id === 'temp-search-result' ? false : undefined);
  }
});
