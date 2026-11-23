import test from 'node:test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('stationary course filtering preserves real fix data and leaves moving fixes unchanged', { skip: process.platform !== 'darwin' }, () => {
  const source = readFileSync(new URL('../native-navigation/FreightIQNavigation.swift', import.meta.url), 'utf8');
  const start = source.indexOf('func navigationLocationWithoutStationaryCourse(');
  const end = source.indexOf('private final class FreightIQNavigationLocationInput', start);
  const folder = mkdtempSync(join(tmpdir(), 'fiq-course-'));
  try {
    writeFileSync(join(folder, 'Checks.swift'), `import Foundation
import CoreLocation
${source.slice(start, end)}
func check(_ speed: Double, _ course: Double, source: CLLocationSourceInformation? = nil) {
 let coordinate = CLLocationCoordinate2D(latitude: 39, longitude: -108)
 let date = Date(timeIntervalSince1970: 1000)
 let raw: CLLocation
 if let source {
  raw = CLLocation(coordinate: coordinate, altitude: 123, horizontalAccuracy: 7, verticalAccuracy: 9,
   course: course, courseAccuracy: 15, speed: speed, speedAccuracy: 0.3, timestamp: date, sourceInfo: source)
 } else {
  raw = CLLocation(coordinate: coordinate, altitude: 123, horizontalAccuracy: 7, verticalAccuracy: 9,
   course: course, courseAccuracy: 15, speed: speed, speedAccuracy: 0.3, timestamp: date)
 }
 let result = navigationLocationWithoutStationaryCourse(raw)
 precondition(result.coordinate.latitude == raw.coordinate.latitude && result.coordinate.longitude == raw.coordinate.longitude)
 precondition(result.altitude == raw.altitude && result.timestamp == raw.timestamp)
 precondition(result.horizontalAccuracy == raw.horizontalAccuracy && result.verticalAccuracy == raw.verticalAccuracy)
 precondition(result.speed == raw.speed && result.speedAccuracy == raw.speedAccuracy)
 precondition(result.sourceInformation?.isSimulatedBySoftware == raw.sourceInformation?.isSimulatedBySoftware)
 precondition(result.sourceInformation?.isProducedByAccessory == raw.sourceInformation?.isProducedByAccessory)
 if speed >= 1.5 || course < 0 { precondition(result === raw) }
 else { precondition(result.course == -1 && result.courseAccuracy == -1) }
}
for speed in [-1.0, 0, 0.055, 0.999, 1.499, 1.5, 2, 20] { check(speed, 269) }
check(0, -1)
check(0, 90, source: CLLocationSourceInformation(softwareSimulationState: true, andExternalAccessoryState: false))
print("Stationary, boundary, moving, unknown speed/course and source metadata checks passed")
`);
    execFileSync('xcrun', ['swiftc', join(folder, 'Checks.swift'), '-o', join(folder, 'checks')]);
    execFileSync(join(folder, 'checks'));
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
