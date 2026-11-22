import test from 'node:test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// Execute the production callbacks with a controlled router: no device or network required.
test('iPhone failed-reroute recovery preserves stops and rejects stale work', { skip: process.platform !== 'darwin' }, () => {
  const source = readFileSync(new URL('../native-navigation/FreightIQNavigation.swift', import.meta.url), 'utf8');
  const begin = source.indexOf('  func navigationViewController(_ navigationViewController: NavigationViewController, didRerouteAlong route: Route)');
  const end = source.indexOf('  private var lastFeedbackRequest', begin);
  if (begin < 0 || end < 0) throw new Error('Production recovery callbacks not found');
  const folder = mkdtempSync(join(tmpdir(), 'freightiq-reroute-'));
  const swift = `
import Foundation
struct CLLocationCoordinate2D { var latitude: Double; var longitude: Double }
struct CLLocation {
  var coordinate = CLLocationCoordinate2D(latitude: 39, longitude: -108)
  var timestamp = Date(); var horizontalAccuracy: Double = 5
}
struct Stop { var latitude: Double; var longitude: Double }
struct Request { var id: String; var validRestriction = false; var stops: [Stop] }
class NavigationViewController {}
struct Route {}
struct NavigationRoutes {}
struct Content { var instruction: String; var arrow: String; var distance: String; var eta: Date? }
class Activity { var text = ""; func update(_ c: Content) { text = c.instruction } }
class NavigationRouteOptions {
  var coordinates: [CLLocationCoordinate2D]; var includesAlternativeRoutes = true
  init(coordinates: [CLLocationCoordinate2D], profileIdentifier: Profile) { self.coordinates = coordinates }
}
enum Profile { case automobileAvoidingTraffic }
enum Failure: Error { case network }
class Router {
  var calls: [NavigationRouteOptions] = []; var fail = false
  func routingProvider() -> Router { self }
  func calculateRoutes(options: NavigationRouteOptions) -> Result {
    calls.append(options); return Result(fail: fail)
  }
}
struct Result {
  var fail: Bool
  var value: NavigationRoutes { get async throws {
    try await Task.sleep(nanoseconds: 10_000_000)
    if fail { throw Failure.network }; return NavigationRoutes()
  } }
}
@MainActor class Harness {
  static var provider = Router()
  var controller: NavigationViewController? = NavigationViewController()
  var request: Request? = Request(id: "one", stops: [Stop(latitude: 1, longitude: 2), Stop(latitude: 3, longitude: 4)])
  var guidanceId: String? = "one"; var isRerouting = true; var rerouteFailed = false
  var lastProgressAt = Date(); var lastRawLocation: CLLocation? = CLLocation()
  var liveActivity = Activity(); var rerouteRecoveryID = UUID()
  var rerouteRecovery: Task<Void, Never>?; var window: Bool? = true; var started = 0
  func clearTurnNotification() {}
  func startGuidance(_ routes: NavigationRoutes, _ request: Request) { started += 1; rerouteFailed = false }
${source.slice(begin, end)}
}
@main struct Checks {
  @MainActor static func main() async {
    let h = Harness(); let c = h.controller!
    h.navigationViewController(c, didFailToRerouteWith: Failure.network)
    precondition(!h.isRerouting, "Failed reroute must clear busy state")
    h.navigationViewController(c, didFailToRerouteWith: Failure.network)
    await h.rerouteRecovery?.value
    precondition(Harness.provider.calls.count == 1, "Only one fallback may run")
    precondition(Harness.provider.calls[0].coordinates.count == 3, "Keep origin and both stops")
    precondition(Harness.provider.calls[0].coordinates[0].latitude == 39, "Use current GPS")
    precondition(h.started == 1 && h.rerouteRecovery == nil)
    Harness.provider.fail = true
    h.isRerouting = true
    h.navigationViewController(c, didFailToRerouteWith: Failure.network)
    await h.rerouteRecovery?.value
    precondition(!h.isRerouting && h.rerouteRecovery == nil, "Network failure must release recovery")
    precondition(h.started == 1 && h.rerouteFailed)
    Harness.provider.fail = false
    h.navigationViewController(c, didFailToRerouteWith: Failure.network)
    let pending = h.rerouteRecovery
    h.guidanceId = nil; h.window = nil
    await pending?.value
    precondition(h.started == 1, "Ending navigation must reject late results")
    h.window = true; h.guidanceId = "one"
    h.navigationViewController(c, didFailToRerouteWith: Failure.network)
    let superseded = h.rerouteRecovery
    h.navigationViewController(c, didRerouteAlong: Route())
    await superseded?.value
    precondition(h.started == 1, "SDK success must cancel older recovery")
    h.lastRawLocation?.timestamp = Date(timeIntervalSinceNow: -60)
    let count = Harness.provider.calls.count
    h.navigationViewController(c, didFailToRerouteWith: Failure.network)
    precondition(h.rerouteRecovery == nil && Harness.provider.calls.count == count, "Reject stale GPS")
    h.lastRawLocation = CLLocation(); h.request?.validRestriction = true
    h.navigationViewController(c, didFailToRerouteWith: Failure.network)
    await h.rerouteRecovery?.value
    precondition(Harness.provider.calls.last!.coordinates.count == 2, "Restricted leg remains advisory")
    print("Recovery checks passed")
  }
}
`;
  try {
    writeFileSync(join(folder, 'Checks.swift'), swift);
    execFileSync('xcrun', ['swiftc', '-parse-as-library', '-swift-version', '5', join(folder, 'Checks.swift'), '-o', join(folder, 'checks')], { stdio: 'pipe' });
    execFileSync(join(folder, 'checks'), { stdio: 'pipe' });
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
