import test from 'node:test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('iPhone production offline callbacks gate readiness, cancel safely, and preserve previous downloads', { skip: process.platform !== 'darwin' }, () => {
  const source = readFileSync(new URL('../native-navigation/FreightIQNavigation.swift', import.meta.url), 'utf8');
  const start = source.indexOf('  func download(_ bounds: [Double], geometryJSON:');
  const end = source.indexOf('  func remove(_ promise: Promise)', start);
  if (start < 0 || end < start) throw Error('Offline callbacks not found');
  const folder = mkdtempSync(join(tmpdir(), 'fiq-offline-'));
  const code = `
import Foundation
struct CLLocationCoordinate2D { let latitude: Double; let longitude: Double }
enum Turf { enum Geometry: Decodable { case polygon, multiPolygon, point } }
typealias Geometry = Turf.Geometry
struct Polygon { init(_ rings: [[CLLocationCoordinate2D]]) {}; var geometry: Geometry { .polygon } }
struct Style { let rawValue: String }
enum Glyphs { case ideographsRasterizedLocally }
struct StylePackLoadOptions { init?(glyphsRasterizationMode: Glyphs) {} }
struct TilesetDescriptorOptions { init(styleURI: Style, zoomRange: ClosedRange<Int>, tilesets: Int?, stylePackOptions: Int?) {} }
struct TileRegionLoadOptions { init?(geometry: Geometry, descriptors: [Int], metadata: Int?, acceptExpired: Bool, networkRestriction: Network) {} }
enum Network { case none }
struct Region { var requiredResourceCount = 10; var completedResourceCount = 10 }
enum MapboxMaps { enum TileRegionError: Error { case diskFull(String), tileCountExceeded(String), canceled(String), other(String) } }
class Cancelable { var action: () -> Void; init(_ action: @escaping () -> Void = {}) { self.action = action }; func cancel() { action() } }
class OfflineRouteException: Error { let reason: String; init(_ message: String) { reason = message } }
class Promise { var done = false; var message = ""; func resolve(_ value: Any?) { done = true }; func reject(_ e: OfflineRouteException) { done = true; message = e.reason } }
class Manager {
  var callbacks: [(Result<Int, Error>) -> Void] = []
  func createTilesetDescriptor(for options: TilesetDescriptorOptions) -> Int { 1 }
  func loadStylePack(for style: Style, loadOptions: StylePackLoadOptions, progress: (Int) -> Void, completion: @escaping (Result<Int, Error>) -> Void) -> Cancelable {
    var finished = false
    let once: (Result<Int, Error>) -> Void = { result in if !finished { finished = true; completion(result) } }
    callbacks.append(once); return Cancelable { once(.failure(MapboxMaps.TileRegionError.canceled("cancel"))) }
  }
  func complete(_ failed: Bool = false) { let work = callbacks; callbacks = []; for callback in work { callback(failed ? .failure(MapboxMaps.TileRegionError.other("map")) : .success(1)) } }
}
class Store {
  var count = 0; var removed: [String] = []; var callback: ((Result<Region, Error>) -> Void)?
  func loadTileRegion(forId: String, loadOptions: TileRegionLoadOptions, progress: (Region) -> Void, completion: @escaping (Result<Region, Error>) -> Void) -> Cancelable {
    count += 1; callback = completion; return Cancelable { completion(.failure(MapboxMaps.TileRegionError.canceled("cancel"))) }
  }
  func removeTileRegion(forId id: String) { removed.append(id) }
}
struct Provider { func getLatestNavigationTilesetDescriptor() -> Int { 2 } }
@MainActor class Harness {
  let manager = Manager(); let store = Store(); let provider = Provider()
  let styles = [Style(rawValue: "day"), Style(rawValue: "night")]
  let defaults = UserDefaults(suiteName: UUID().uuidString)!
  let pendingKey = "pending"; let readyKey = "ready"
  var cancelDownload: (() -> Void)?; var cancelled = false; var removing = false; var stylesReady = true
  var saved: (id: String, bounds: [Double])? { guard let record = defaults.dictionary(forKey: readyKey), let id = record["id"] as? String, let bounds = record["bounds"] as? [Double] else { return nil }; return (id,bounds) }
  func checkStyles(_ completion: @escaping (Bool) -> Void) { completion(stylesReady) }
${source.slice(start, end)}
}
@main struct Checks {
  @MainActor static func pause() async { try? await Task.sleep(nanoseconds: 15_000_000) }
  @MainActor static func main() async {
    let bounds = [-108.0, 38.0, -107.0, 39.0]
    let h = Harness(); h.defaults.set(["id": "previous", "bounds": bounds], forKey: h.readyKey)
    let first = Promise(); h.download(bounds, promise: first) { _ in }
    precondition(h.manager.callbacks.count == 2 && h.store.count == 0 && !first.done)
    h.manager.complete(); await pause(); precondition(h.store.count == 1 && !first.done)
    h.store.callback?(.failure(MapboxMaps.TileRegionError.diskFull("disk"))); await pause()
    precondition(first.message.contains("Not enough storage") && h.saved?.id == "previous" && h.cancelDownload == nil)
    let success = Promise(); h.download(bounds, promise: success) { _ in }; h.manager.complete(); await pause()
    h.store.callback?(.success(Region())); await pause()
    precondition(success.done && success.message.isEmpty && h.saved?.id != "previous" && h.store.removed.contains("previous"))
    let savedId = h.saved!.id
    let cancel = Promise(); h.download(bounds, promise: cancel) { _ in }; h.cancel(); await pause()
    precondition(cancel.done && cancel.message.contains("cancelled") && h.saved?.id == savedId)
    let styleFailure = Promise(); h.download(bounds, promise: styleFailure) { _ in }; h.manager.complete(true); await pause()
    precondition(styleFailure.done && styleFailure.message.contains("map resources") && h.saved?.id == savedId)
    let incomplete = Promise(); h.download(bounds, promise: incomplete) { _ in }; h.manager.complete(); await pause()
    h.store.callback?(.success(Region(requiredResourceCount: 10, completedResourceCount: 5))); await pause()
    precondition(incomplete.done && !incomplete.message.isEmpty && h.saved?.id == savedId)
    let busy = Promise(); let active = Promise(); h.download(bounds, promise: active) { _ in }
    h.download(bounds, promise: busy) { _ in }; precondition(busy.message.contains("Wait"))
    h.manager.complete(); await pause(); h.cancel(); await pause()
    precondition(active.done && h.saved?.id == savedId)
    h.stylesReady = false
    let unverified = Promise(); h.download(bounds, promise: unverified) { _ in }; h.manager.complete(); await pause()
    h.store.callback?(.success(Region())); await pause()
    precondition(unverified.done && !unverified.message.isEmpty && h.saved?.id == savedId)
    print("Offline callback checks passed")
  }
}
`;
  try {
    writeFileSync(join(folder, 'Checks.swift'), code);
    execFileSync('xcrun', ['swiftc', '-parse-as-library', '-swift-version', '5', join(folder, 'Checks.swift'), '-o', join(folder, 'checks')], { stdio: 'pipe' });
    execFileSync(join(folder, 'checks'), { stdio: 'pipe' });
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
