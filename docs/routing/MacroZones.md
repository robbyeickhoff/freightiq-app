# FreightIQ Macro Zones

## Purpose

This document defines how major operational zones connect across FreightIQ routes.

It explains:

- The preferred order of towns and zones.
- The direction of travel between zones.
- Valid alternate loops.
- The operational reasons that justify changing the default order.

This document does not define stop order inside an individual zone. Internal zone flow belongs in the relevant Zone document.

## Status

Draft based on repeated real-world route reviews with Robby Eickhoff.

The rules below represent proven defaults and known alternatives. Customer-specific restrictions, trailer loading, road closures, and other operational constraints may override them.

---

## Core Principle

Determine macro-zone order before sequencing individual stops.

The route should preserve one continuous operational flow from the first active zone to the final return corridor.

Do not:

- Build the route from city names alone.
- Treat mailing addresses as operational zones.
- Reverse through completed territory without a strong reason.
- Break a natural loop to service a distant stop first.

---

# Default Forward Flow

When all major areas are active and no operational constraint requires a different sequence, the preferred flow is:

```text
Grand Junction
→ Delta
→ Olathe
→ Montrose
→ Ridgway-address stops north of Highway 62
→ Ouray
→ Ridgway Proper
→ Log Hill
→ Placerville / Sawpit
→ South Park, including Nimbus
→ Lawson Hill / Society
→ Mountain Village
→ Downtown Telluride
→ Airport / Aldasoro
→ Norwood
→ Nucla / Naturita
→ Gateway
→ Grand Junction
```

Remove inactive delivery zones while preserving the same overall direction of travel.

---

# Delta, Olathe and Montrose

## Southbound

When Delta, Olathe and Montrose are active:

```text
Grand Junction
→ Delta
→ Olathe
→ Montrose
```

Delta and Olathe are pass-through zones on the southbound route. Do not drive through Delta and Olathe toward Montrose and return later unless an operational constraint requires it.

## Northbound Return

```text
Montrose
→ Olathe
→ Delta
→ Grand Junction
```

---

# Ridgway Stops North of Highway 62

Stops with a Ridgway mailing address that are physically located north of Highway 62 should normally be completed before Ouray.

Default flow:

```text
Montrose
→ Ridgway-address stops north of Highway 62
→ Ouray
→ Ridgway Proper
```

These stops are encountered on the southbound approach. Saving them until after Ouray would require traveling back north and create unnecessary backtracking.

Classify them by their actual road position, not by the Ridgway mailing address alone.

---

# Ouray Placement

## Normal Forward Route

When Ouray is active, complete it early unless the office has deliberately planned a different macro flow.

Default:

```text
Montrose
→ Ridgway-address stops north of Highway 62
→ Ouray
→ Ridgway Proper
```

The main reason is trailer management:

- Telluride-area pickups may later block Ouray freight.
- Completing Ouray early protects access to the freight.
- It preserves trailer capacity and flexibility for the remainder of the day.

Although Ouray can sometimes be completed after the Telluride portion with little mileage penalty, that is not the preferred forward sequence.

## West End-First Route

When the office deliberately loads the trailer for a West End-first route, Ouray belongs near the end:

```text
Log Hill
→ Ridgway Proper
→ Ouray
→ Montrose
→ Grand Junction
```

Do not force Ouray early when doing so would break the larger West End-first loop.

---

# Ridgway Proper and Log Hill

The default westbound sequence is:

```text
Ouray
→ Ridgway Proper
→ Log Hill
→ Placerville / Sawpit
```

Rules:

- Complete Ridgway Proper before entering Log Hill.
- Do not alternate between Ridgway town stops and Log Hill stops.
- Finish Log Hill positioned to continue west toward Placerville.
- Reversing Ridgway Proper and Log Hill often creates an unnecessary left turn onto Highway 62 or backtracking into Ridgway.

---

# Telluride Approach Flow

The default inbound sequence is:

```text
Log Hill
→ Placerville / Sawpit
→ South Park
→ Lawson Hill / Society
→ Mountain Village
→ Downtown Telluride
→ Airport / Aldasoro
```

## Placerville / Sawpit

Placerville and Sawpit form one operational approach zone.

Stops with Placerville-area routing behavior should remain in this zone even when the mailing address is inconsistent.

## South Park

South Park is an inbound operational zone, not Downtown Telluride.

South Park stops are normally completed before Lawson Hill, Mountain Village, or Downtown Telluride.

Nimbus is operationally part of the South Park zone.

Nimbus is a residential neighborhood with relatively few regular deliveries. Known large-truck deliveries may be serviced from a highway pullout rather than by entering the neighborhood. That customer-level procedure belongs in the South Park Zone document or customer intel.

## Lawson Hill / Society

Lawson Hill / Society should normally be completed on the inbound trip before Mountain Village.

This commonly allows:

- Right-turn entry from the highway.
- Right-turn exit back toward Mountain Village.
- No later re-entry into the Lawson Hill area.

## Mountain Village

Mountain Village normally follows Lawson Hill / Society and precedes Downtown Telluride.

Ophir belongs to the broader Mountain Village portion, not the West End.

The detailed order of Ophir, Prospect Creek, Mountain Village core, Adams Ranch, and other internal areas belongs in the Mountain Village Zone document.

## Downtown Telluride and Airport / Aldasoro

The default macro order is:

```text
Mountain Village
→ Downtown Telluride
→ Airport / Aldasoro
```

Internal Downtown Telluride flow belongs in the Downtown Telluride Zone document.

---

# Valid Telluride-Area Alternative

The preferred Telluride-area order is:

```text
Lawson Hill / Society
→ Mountain Village
→ Downtown Telluride
→ Airport / Aldasoro
```

The following alternate can also work without creating major operational problems:

```text
Downtown Telluride
→ Airport / Aldasoro
→ Lawson Hill / Society
→ Mountain Village
```

Reversing the larger route does not require blindly reversing every Telluride-area zone.

---

# West End Forward Loop

The default West End flow is:

```text
Downtown Telluride
→ Airport / Aldasoro
→ Norwood
→ Nucla / Naturita
→ Gateway
→ Grand Junction
```

## Gateway as the Only West End Delivery

When Gateway is the only West End delivery on a Telluride route, the normal flow is still:

```text
Telluride area
→ travel through the West End corridor
→ Gateway
→ Grand Junction
```

Gateway is almost never completed first unless the office deliberately loads the trailer for a different macro sequence.

---

# West End Commitment Point

Norwood is the decision point for whether to return east or continue through the West End loop.

## Norwood Only

When Norwood is the furthest active delivery zone, two return paths are possible:

```text
Norwood
→ return east over Dallas Divide
→ Ridgway
→ Montrose
→ Grand Junction
```

or:

```text
Norwood
→ continue west through the West End corridor
→ Gateway
→ Grand Junction
```

The eastbound return may be shorter in some cases, but the West End return is often operationally preferable because traffic is much lighter and the route is smoother.

## Beyond Norwood

Once the route continues beyond Norwood toward Nucla or Naturita, complete the West End loop:

```text
Norwood
→ Nucla / Naturita
→ Gateway
→ Grand Junction
```

Do not turn back east through Telluride and Ridgway after continuing beyond Norwood. That creates major backtracking.

An empty West End delivery zone may still remain part of the required travel corridor. This is an exception to the general rule that empty zones are simply removed.

---

# Valid West End-First Loop

A West End-first route is geographically and operationally valid when the office deliberately loads the trailer to support it.

Default West End-first macro flow:

```text
Grand Junction
→ Gateway
→ Nucla / Naturita
→ Norwood
→ Placerville / Sawpit
→ South Park
→ Telluride-area zones
→ Log Hill
→ Ridgway Proper
→ Ouray, when active
→ Montrose
→ Olathe, when active
→ Grand Junction
```

Within the Telluride-area portion, the normal internal direction should usually remain intact.

Preferred:

```text
Placerville / Sawpit
→ South Park
→ Lawson Hill / Society
→ Mountain Village
→ Downtown Telluride
→ Airport / Aldasoro
```

Acceptable alternate:

```text
Placerville / Sawpit
→ South Park
→ Downtown Telluride
→ Airport / Aldasoro
→ Lawson Hill / Society
→ Mountain Village
```

Do not reverse every Telluride zone merely because the larger West End loop is reversed.

---

# Grand Junction Stops on a Mountain Route

Grand Junction deliveries are uncommon on Telluride days.

Include a Grand Junction stop only when:

- It lies naturally along the southeast outbound corridor.
- The trailer has enough room.
- The freight is accessible.
- Servicing it does not disrupt the mountain-route loop.

Otherwise, local Grand Junction work should not interfere with the Telluride route.

---

# Empty Zones

Delivery zones with no stops are removed from the working route.

Connect the nearest active zones while preserving the same overall direction and avoiding unnecessary backtracking.

Exception:

An empty travel corridor may still be required to complete a loop, especially through the West End.

---

# Macro-Order Overrides

The normal macro-zone sequence should remain intact unless the office deliberately plans a different route before departure.

A major sequence change usually requires the trailer to be loaded in reverse or otherwise arranged around the alternate flow.

Typical reasons include:

- Appointment or hard receiving window.
- Early customer closing time.
- Expected pickups and trailer-capacity concerns.
- Road closure, weather, or construction.
- Customer availability.
- Truck-access restrictions.
- A pickup that must be completed because the route will not return through that zone.

These decisions are normally made by the route builder or dock before the driver receives the route.

Once dispatched, the driver may adapt locally, but should not reverse the entire macro flow unless the freight is accessible and the operational benefit clearly outweighs the disruption.

---

# Driver Adaptation After Departure

The trailer load generally supports the planned macro-zone sequence.

After departure, the driver usually has meaningful flexibility within zones and micro areas, provided the necessary freight remains accessible.

The driver may adjust:

- Stop order within a micro area.
- Order between closely related micro areas.
- Right-turn and side-of-road sequencing.
- Customer-hour priorities.
- Pass-through stops.
- Pickup timing.

Freight size and trailer position may reduce that flexibility.

Large, long, or otherwise difficult freight can force the driver to service a stop earlier than the geographically ideal sequence.

The driver should preserve the planned macro loop whenever practical. Trailer constraints generally justify local adjustments rather than reversing the entire route.

---

# Pickups and Zone Re-entry

When a pickup is available inside the current zone, complete it while already in that zone whenever practical.

The preferred approach is to avoid leaving a zone and returning later.

A pickup may be delayed or sequenced differently when:

- Its size would block access to remaining delivery freight.
- A large delivery still needs to be unloaded first.
- The new freight would make it difficult or impossible to continue working the trailer safely.

Unexpected pickups should normally cause a local sequencing adjustment, not a change to the entire macro route.

Default principle:

> Complete the zone once, including pickups, and avoid zone re-entry whenever possible.

---

# Open Questions

1. Confirm exact zone boundaries and included roads in the individual Zone documents.
2. Document the full internal order of the Mountain Village zone.
3. Document Downtown Telluride directional flow.
4. Define West End internal areas such as WE1, WE2, and later divisions.
5. Document the specific Grand Junction southeast outbound corridor.
6. Confirm any customer or road exceptions that justify breaking the default macro flow.
