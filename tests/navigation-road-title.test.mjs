import test from 'node:test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('road title always prefers the provider road name and falls back only when missing', { skip: process.platform !== 'darwin' }, () => {
  const source = readFileSync(new URL('../native-navigation/FreightIQNavigation.swift', import.meta.url), 'utf8');
  const begin = source.indexOf('func navigationRoadKey(');
  const end = source.indexOf('// Distance milestones', begin);
  const folder = mkdtempSync(join(tmpdir(), 'fiq-road-title-'));
  try {
    writeFileSync(join(folder, 'Checks.swift'), 'import Foundation\n' + source.slice(begin, end) + `
precondition(navigationRoadTitle(names: ["29 3/4 Road"], codes: ["29¾"], destinationCodes: nil) == "29 3/4 Road")
precondition(navigationRoadTitle(names: ["North 1st Street"], codes: ["26"], destinationCodes: nil) == "North 1st Street")
precondition(navigationRoadTitle(names: ["Patterson Road"], codes: ["F"], destinationCodes: nil) == "Patterson Road")
precondition(navigationRoadTitle(names: ["F Road"], codes: ["F"], destinationCodes: nil) == "F Road")
precondition(navigationRoadTitle(names: ["Broadway"], codes: ["CO 141"], destinationCodes: nil) == "Broadway")
precondition(navigationRoadTitle(names: [" ", "Patterson Road"], codes: ["F"], destinationCodes: nil) == "Patterson Road")
precondition(navigationRoadTitle(names: nil, codes: ["F"], destinationCodes: nil) == "F")
precondition(navigationRoadTitle(names: ["Oak Street"], codes: ["12.5"], destinationCodes: nil) == "Oak Street")
precondition(navigationRoadTitle(names: ["Maple Avenue"], codes: ["12 West"], destinationCodes: nil) == "Maple Avenue")
precondition(navigationRoadTitle(names: ["Broadway"], codes: ["I 70"], destinationCodes: nil) == "Broadway")
precondition(navigationRoadTitle(names: nil, codes: ["26"], destinationCodes: nil) == "26")
precondition(navigationRoadTitle(names: ["Highway 50"], codes: ["US 50"], destinationCodes: nil) == "Highway 50")
precondition(navigationRoadTitle(names: ["North River Road"], codes: nil, destinationCodes: nil) == "North River Road")
precondition(navigationRoadTitle(names: [" "], codes: [], destinationCodes: ["I 70 West"]) == "I 70 West")
precondition(navigationRoadTitle(names: nil, codes: nil, destinationCodes: nil) == nil)
precondition(navigationConnectorTitle(road: nil, meters: 33.266, followingRoad: "CR 17", isConnectorTurn: true, followingIsArrival: false) == "To CR 17")
precondition(navigationConnectorTitle(road: nil, meters: 40, followingRoad: "Oak Street", isConnectorTurn: true, followingIsArrival: false) == "To Oak Street")
precondition(navigationConnectorTitle(road: "Main Street", meters: 33, followingRoad: "CR 17", isConnectorTurn: true, followingIsArrival: false) == "Main Street")
for meters in [0.0, -1, 75.01, Double.infinity, Double.nan] {
 precondition(navigationConnectorTitle(road: nil, meters: meters, followingRoad: "CR 17", isConnectorTurn: true, followingIsArrival: false) == nil)
}
precondition(navigationConnectorTitle(road: nil, meters: 33, followingRoad: nil, isConnectorTurn: true, followingIsArrival: false) == nil)
precondition(navigationConnectorTitle(road: nil, meters: 33, followingRoad: "CR 17", isConnectorTurn: false, followingIsArrival: false) == nil)
precondition(navigationConnectorTitle(road: nil, meters: 33, followingRoad: "Driveway", isConnectorTurn: true, followingIsArrival: true) == nil)

precondition(navigationRoadTitle(names: nil, codes: ["US 50", "US 6"], destinationCodes: nil) == "US 50 / US 6")
`);
    execFileSync('xcrun', ['swift', join(folder, 'Checks.swift')]);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

test('expanded directions map each row to its own maneuver across remaining and later legs', { skip: process.platform !== 'darwin' }, () => {
  const source = readFileSync(new URL('../native-navigation/FreightIQNavigation.swift', import.meta.url), 'utf8');
  const begin = source.indexOf('func navigationListSections<T>');
  const end = source.indexOf('// The SDK normally dismisses', begin);
  const folder = mkdtempSync(join(tmpdir(), 'fiq-list-roads-'));
  try {
    writeFileSync(join(folder, 'Checks.swift'), source.slice(begin, end) + `
// Each SDK source step's visual instruction describes the following maneuver.
struct Maneuver: Equatable { let road: String; let arrow: String }
let joalan = Maneuver(road: "Joalan Court", arrow: "depart")
let aberdeen = Maneuver(road: "Aberdeen Lane", arrow: "left")
let bismarck = Maneuver(road: "Bismarck Street", arrow: "right")
let dRoad = Maneuver(road: "D 1/2 Road", arrow: "left")
let arrival = Maneuver(road: "", arrow: "arrive")
let route = [[joalan, aberdeen, bismarck, dRoad, arrival]]
let expanded = navigationListSections(route, legIndex: 0, stepIndex: 0)
precondition(expanded == [[bismarck, dRoad, arrival]], "Expanded right arrow must say Bismarck, not Aberdeen")
precondition(expanded[0][0].arrow == "right" && expanded[0][0].road == "Bismarck Street")
precondition(navigationListSections(route, legIndex: 0, stepIndex: 1) == [[dRoad, arrival]])
precondition(navigationListSections([[joalan, arrival], [joalan, aberdeen, arrival]], legIndex: 0, stepIndex: 0) == [[aberdeen, arrival]])
precondition(navigationListSections([[joalan, arrival]], legIndex: 0, stepIndex: 0).isEmpty)
precondition(navigationListSections(route, legIndex: 9, stepIndex: 0).isEmpty)
`);
    execFileSync('xcrun', ['swift', join(folder, 'Checks.swift')]);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
