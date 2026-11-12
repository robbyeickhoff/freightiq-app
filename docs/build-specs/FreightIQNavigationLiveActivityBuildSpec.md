# FreightIQ Navigation Live Activity

Status: Dev checks passed, internal TestFlight verification pending

Operating mode: Engineering
Delivery: Direct Codex Edit, private iPhone verification first

## Driver experience

While embedded turn-by-turn guidance is active, show one FreightIQ Live Activity. Its Lock Screen card shows the maneuver arrow, street or instruction, distance to the maneuver, and ETA to the current stop. The compact Dynamic Island shows the arrow and distance as space allows. Both surfaces open the current navigation screen in the same app variant that started guidance, after unlocking if required.

## Implementation

Use ActivityKit and a WidgetKit extension with distinct Dev and production bundle identities. Configure extension embedding and signing in the native build workflow. Use the active Mapbox session's native maneuver and leg progress as the source, including when JavaScript is suspended. Publish meaningful changes at a bounded cadence and mark guidance stale if updates stop. Replace the displayed instruction when the route changes or a reroute starts. Clear the activity on arrival at the current destination, End Navigation, or session teardown, and start it again when guidance for the next stop begins. Respect disabled or dismissed Live Activities. Keep existing turn notifications available.

Use the initiating app variant's URL scheme and verify the navigation session on return. If guidance has ended, open Today's Route. Keep updates on device and omit customer names and delivery addresses from the Lock Screen card. The full interactive map remains inside the unlocked app. iOS controls Dynamic Island placement alongside media and may limit update frequency.

## Acceptance

- Install the private Dev build alongside regular FreightIQ. Verify the Lock Screen card and compact and expanded Dynamic Island views during real guidance.
- Check that turns and ETA update while locked, reroutes replace the old turn, and stale instructions clear or become visibly stale.
- Tap both surfaces and verify the initiating build and correct guidance session open. Repeat with a podcast playing.
- Verify arrival, advancing to the next stop, ending navigation, disabled Live Activities, and reopening after interruption. Confirm existing turn alerts still work.
- Review the native diff and build results before physical acceptance. Production build and distribution require their separate release steps.
