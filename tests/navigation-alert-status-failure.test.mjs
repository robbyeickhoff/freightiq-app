import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Exercise the actual startup offer with a failing optional status service.
const source = readFileSync(new URL('../app/(tabs)/(map)/todays-route.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  async function offerDrivingAlerts(');
const end = source.indexOf('\n  async function launchStop(', start);
const body = source.slice(start, end).replace('continueRoute: () => void', 'continueRoute');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = new AsyncFunction('userId', 'drivingAlertStatus', 'Alert', 'startDrivingAlerts', 'recordDrivingFailure', 'continueRoute',
  `${body}; await offerDrivingAlerts(continueRoute);`);
test('unknown Driving Alerts status continues once without a popup or enabling alerts', async () => {
  let continued = 0, alerts = 0, starts = 0;
  await run('owner', async () => { throw Error('offline'); }, { alert: () => alerts++ }, () => starts++, () => {}, () => continued++);
  assert.deepEqual({ continued, alerts, starts }, { continued: 1, alerts: 0, starts: 0 });
});
test('known active alerts continue quietly; known inactive alerts retain the requested offer', async () => {
  for (const active of [true, false]) {
    let continued = 0, alerts = 0;
    await run('owner', async () => ({ active }), { alert: () => alerts++ }, () => {}, () => {}, () => continued++);
    assert.equal(continued, active ? 1 : 0);
    assert.equal(alerts, active ? 0 : 1);
  }
});
