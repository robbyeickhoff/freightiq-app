# FreightIQ Offline Route Download V1

Status: iPhone implementation approved; November 19 approval extends the same offline download flow
to Android and fixes iPhone failure handling. Physical acceptance remains pending.

## Driver flow

- On iPhone and Android, offer **Download for Offline Use** on Today’s Route once there is a saved stop.
- Calculate the road route from the driver’s current location through the saved stops in order. Automatically include nearby roads and each stop, using a corridor that also covers the Highway 145 and County Road 63L test case.
- Show download progress and allow cancellation. Show **Ready for Offline Use** only after the road data and navigation map have both finished downloading and are available on the phone.
- Keep the saved stops, current destination, and completion state after closing the app. Use the downloaded road data to start, resume, or recalculate guidance inside coverage. Keep Complete Stop and Skip available when a new route cannot be calculated.
- Let the driver remove the download. If a route edit moves a stop outside saved coverage, clearly offer to update the download while connected.

## First implementation slice

1. Use the existing FreightIQ route geometry and stop order to choose bounded coverage. November 20 approval replaces the prototype enclosing rectangle with a polygon buffered 5 km around the full ordered road geometry, using Turf buffer on the shared client. Retain the existing margin for the first comparative test. Both native downloaders receive the same GeoJSON polygon or multipolygon; persist that shape with the ready region and check stop coverage against it, including holes. Legacy rectangular downloads remain readable. Verify real download time, provider limits and rerouting on both phones before production acceptance. Pixel diagnostic retry reported 780 map packs against the 750 limit. Limit broad offline map descriptors to zoom 6–14 on both platforms, excluding the building-detail pack tier; keep the navigation-routing descriptor unchanged. Verify offline road readability at guidance zoom on both phones. November 20 lightweight-map approval uses Mapbox Light v11/Dark v11 on both platforms, with the displayed navigation map matching its offline descriptors. iOS already uses these through DayStyle/NightStyle; Android replaces Standard and honors the existing theme prop. Both light/dark style packs must be present before Ready. No terrain DEM or satellite source is requested. Stop selection is deferred.
2. Download Mapbox routing data and the navigation map styles to the app’s tile store. Track progress, cancellation, failure, and readiness against the actual installed data. Recheck readiness after relaunch. Keep a previous usable download available if its replacement fails.
3. Verify start, resume, and rerouting using the app’s normal navigation flow. Keep live guidance available outside downloaded coverage when connected and show a clear message when a new route cannot be calculated.
4. Validate on iPhone before integrating with the pending arrival and Stop Intel changes. Offline business search and release distribution remain separate scope. November 19 explicitly
   approves Android parity, including shared routing/map tile storage, progress/cancel/remove and
   installed-data verification after relaunch.

## Acceptance

- Download Placerville to 650 Ames Road and show Ready only when both downloads complete.
- With connectivity disabled, start and resume guidance after a full app restart. Confirm the map and turn instructions are visible and the next stop is correct.
- Replay the southbound 63L detour from the Highway 145 route and confirm recalculation inside saved coverage.
- Complete a stop offline and navigate to the next saved stop inside coverage. Check that leaving coverage keeps the route and clearly reports when new directions are unavailable.
- Cancel and interrupt downloads, relaunch, retry, edit the route, and remove saved coverage. Check that readiness reflects the installed data and route.

[Mapbox iOS offline navigation](https://docs.mapbox.com/ios/navigation/guides/advanced/offline/)
