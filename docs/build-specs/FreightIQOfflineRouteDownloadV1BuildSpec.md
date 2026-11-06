# FreightIQ Offline Route Download V1

Status: Approved for isolated iPhone implementation. Physical acceptance is pending.

## Driver flow

- On iPhone, offer **Download for Offline Use** on Today’s Route once there is a saved stop.
- Calculate the road route from the driver’s current location through the saved stops in order. Automatically include nearby roads and each stop, using a corridor that also covers the Highway 145 and County Road 63L test case.
- Show download progress and allow cancellation. Show **Ready for Offline Use** only after the road data and navigation map have both finished downloading and are available on the phone.
- Keep the saved stops, current destination, and completion state after closing the app. Use the downloaded road data to start, resume, or recalculate guidance inside coverage. Keep Complete Stop and Skip available when a new route cannot be calculated.
- Let the driver remove the download. If a route edit moves a stop outside saved coverage, clearly offer to update the download while connected.

## First implementation slice

1. Use the existing FreightIQ route geometry and stop order to choose bounded coverage. Verify size on short city routes and long rural routes before setting a production buffer. The prototype uses a rectangle padded by 5 km for one route.
2. Download Mapbox routing data and the navigation map styles to the app’s tile store. Track progress, cancellation, failure, and readiness against the actual installed data. Recheck readiness after relaunch. Keep a previous usable download available if its replacement fails.
3. Verify start, resume, and rerouting using the app’s normal navigation flow. Keep live guidance available outside downloaded coverage when connected and show a clear message when a new route cannot be calculated.
4. Validate on iPhone before integrating with the pending arrival and Stop Intel changes. Offline business search, Android, and release distribution are separate scope.

## Acceptance

- Download Placerville to 650 Ames Road and show Ready only when both downloads complete.
- With connectivity disabled, start and resume guidance after a full app restart. Confirm the map and turn instructions are visible and the next stop is correct.
- Replay the southbound 63L detour from the Highway 145 route and confirm recalculation inside saved coverage.
- Complete a stop offline and navigate to the next saved stop inside coverage. Check that leaving coverage keeps the route and clearly reports when new directions are unavailable.
- Cancel and interrupt downloads, relaunch, retry, edit the route, and remove saved coverage. Check that readiness reflects the installed data and route.

[Mapbox iOS offline navigation](https://docs.mapbox.com/ios/navigation/guides/advanced/offline/)
