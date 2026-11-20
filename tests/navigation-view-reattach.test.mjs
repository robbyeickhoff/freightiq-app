import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const source = readFileSync(new URL('../native-navigation/FreightIQNavigation.swift', import.meta.url), 'utf8');
const section = (begin, end) => {
  const start = source.indexOf(begin), finish = source.indexOf(end, start);
  assert.ok(start >= 0 && finish > start);
  return source.slice(start, finish);
};

test('selected iPhone guidance survives native detach/reattach without reopening preview', { skip: process.platform !== 'darwin' }, () => {
  const lifecycle = section('  override func didMoveToWindow()', '  private func emit(');
  const configure = section('  func configure(_ next:', '  func setAppearance(');
  const select = section('  func selectRoute(_ choice:', '  private func startGuidance(');
  const started = section('  private func startGuidance(', '    let provider = Self.provider');
  const folder = mkdtempSync(join(tmpdir(), 'fiq-return-'));
  const code = `
import Foundation
@MainActor class ExpoView { var window: Bool? = true; func didMoveToWindow() {} }
struct FreightIQNavigationRequest { var id: String; var stopId = "stop"; var preview = true }
struct NavigationRoutes { func selectingAlternativeRoute(at index: Int) async -> NavigationRoutes? { self } }
@MainActor class Harness: ExpoView {
  var request: FreightIQNavigationRequest?; var controller: Bool?
  var reportedArrivalStopId: String?; var pendingRoutes: NavigationRoutes?
  var task: Task<Void, Never>?; var isRerouting = false; var rerouteFailed = false
  var calculatedPreviews: [Bool] = []; var started = 0
  func emit(_ state: String, _ request: FreightIQNavigationRequest, message: String) {}
  func calculate(_ request: FreightIQNavigationRequest) { calculatedPreviews.append(request.preview) }
  func stop() { task?.cancel(); task = nil; pendingRoutes = nil; controller = nil }
${configure}
${lifecycle}
${select}
${started}
    controller = true; started += 1
  }
}
@main struct Checks {
  @MainActor static func main() async {
    let h = Harness(); h.configure(.init(id: "one"))
    precondition(h.calculatedPreviews.last == true)
    h.window = nil; h.didMoveToWindow(); h.window = true; h.didMoveToWindow()
    precondition(h.calculatedPreviews.last == true, "An unselected preview must remain preview")
    h.pendingRoutes = NavigationRoutes(); h.selectRoute("stale|0")
    precondition(h.request?.preview == true, "Ignore selections for another request")
    h.selectRoute("one|0"); await h.task?.value
    precondition(h.started == 1 && h.request?.preview == false)
    h.window = nil; h.didMoveToWindow(); h.window = true; h.didMoveToWindow()
    precondition(h.calculatedPreviews.last == false, "Returning guidance must not reopen preview")
    h.configure(.init(id: "one"))
    precondition(h.request?.preview == false, "Repeated old props cannot reset selected state")
    h.configure(.init(id: "two"))
    precondition(h.calculatedPreviews.last == true, "A genuinely new trip still shows preview")
    h.pendingRoutes = NavigationRoutes(); h.selectRoute("two|0")
    h.window = nil; h.didMoveToWindow(); h.window = true; h.didMoveToWindow()
    precondition(h.calculatedPreviews.last == false, "Selection survives detachment before async start finishes")
    await h.task?.value
    print("Guidance return checks passed")
  }
}
`;
  try {
    writeFileSync(join(folder, 'Checks.swift'), code);
    execFileSync('xcrun', ['swiftc', '-parse-as-library', '-swift-version', '5', join(folder, 'Checks.swift'), '-o', join(folder, 'checks')], { stdio: 'pipe' });
    execFileSync(join(folder, 'checks'), { stdio: 'pipe' });
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

test('restoring guidance displays status instead of silently leaving a blank screen', () => {
  const source = readFileSync(new URL('../app/active-navigation.tsx', import.meta.url), 'utf8');
  const begin = source.indexOf('  const onState ='), end = source.indexOf('  if (openedByStaleActivity', begin);
  const handler = ts.transpileModule(source.slice(begin, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  let message = '', failed = true;
  const onState = new Function('request', 'active', 'guidanceStarted', 'setMessage', 'setFailed', handler + ';return onState;')(
    { id: 'trip' }, { id: 'stop' }, true, (value) => message = value, (value) => failed = value,
  );
  onState({ nativeEvent: { requestId: 'trip', stopId: 'stop', state: 'loading' } });
  assert.equal(message, 'Restoring navigation…');
  assert.equal(failed, false);
});
