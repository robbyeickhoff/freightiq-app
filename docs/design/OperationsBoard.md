# Operations Board — Product Direction

Status: Approved for Local Implementation
Operating Mode: Product  
Artifact Type: Exploratory design note  
Build Status: Focused Build Specification approved 2026-09-03
Last Updated: 2026-09-03

## Purpose

Preserve the Operations Board concept so FreightIQ can later evaluate a lightweight, real-time
network for operational delivery updates without becoming a social media platform.

> FreightIQ is a professional operations network, not a social media platform.

## Core Experience

- Organize updates by geographic area, such as Grand Junction, Montrose, and Telluride.
- Keep posts short, actionable, and operationally relevant.
- Identify each contributor with their profile photo and username.
- Automatically expire posts so the board remains current.
- Exclude comments, likes, and off-topic discussion.

## Approved Pilot Direction

- The Operations Board lives inside the FreightIQ mobile app rather than redirecting drivers to a
  Discord server, standalone website, or separate account system.
- The board has a permanent **Operations** destination in the application tab bar alongside Map,
  Route, and Profile. This makes the feature's purpose and location explicit without presenting it
  as another Map-layer toggle.
- The Operations tab shows an orange count badge when active updates exist. Operations pins remain
  hidden during normal Map use so they do not compete with stops or route markers.
- The board provides **View on Map**, which opens a temporary Operations layer containing only
  pinned updates. Selecting a pin opens its update card; closing the layer restores the normal map.
- The pilot organizes updates into broad operational areas named after a town or city. These are
  practical delivery regions rather than strict municipal boundaries. Drivers select the
  applicable area when posting, and viewers filter the board using the same list.
- Town and city choices come from a FreightIQ-controlled locality list. Drivers cannot create
  free-form localities from the posting flow; FreightIQ administrators expand the list as supported
  operating areas grow.
- The initial pilot localities are **Grand Junction**, **Delta**, **Montrose**, **Ridgway**,
  **Ouray**, and **Telluride**.
- One named area may cover nearby communities and delivery territory without creating separate
  boards. For example, **Telluride** includes Placerville, Sawpit, Mountain Village, and the
  surrounding Telluride delivery area.
- When opened from the Map, the board defaults to the controlled locality represented by the
  current map view. When opened directly, it restores the driver's last selected locality. On first
  use, the driver chooses from the controlled list. The board does not require live-location
  tracking merely to choose this default.
- The Operations screen also offers **All Areas**, combining active updates from all six pilot
  regions. It is optional; the driver's last selected operational area remains the default when the
  screen is opened directly.
- **Road Closure**, **Construction**, and **Temporary Hazard** updates require an exact map pin.
- **Weather / Road Conditions** updates may include a map pin but do not require one.
- **Delivery Access** and **Customer Notice** updates attach to a FreightIQ stop when possible.
- Only updates with a map pin or stop location can trigger an approaching-driver confirmation.
- All signed-in FreightIQ drivers may view active updates.
- Only approved Founding Drivers may post during the pilot.
- Approved Founding Drivers see a prominent **Post Update** action on the board. The current board
  locality is preselected, and an Operations map context also preselects its location when
  available. Drivers without posting access receive a clean read-only board without a disabled
  posting control or application prompt.
- Each update shows the author's profile photo, FreightIQ username, Founding Driver badge, and
  posting time. It does not expose the author's legal name, email, employer, terminal, or current
  location. Contributor identity does not open messaging or additional personal information during
  the pilot.
- Every update requires a defined geographic area, category, short message, and expiration time.
- Each update contains one plain-text message limited to 280 characters. It has no separate title;
  the required category and town or city provide its structure.
- Expiration choices are **2 hours**, **4 hours**, **End of today**, or a custom date and time no
  more than seven days after posting. **End of today** is the default.
- Authors may edit or remove their own updates.
- Authors may edit the message, category, and expiration. Edited updates display **Edited**, and
  editing clears earlier **Yes/No** confirmations because they applied to the previous version.
- Authors cannot change the town or city, map pin, or attached FreightIQ stop. An incorrect
  location must be resolved and reposted correctly.
- Signed-in drivers may report an inaccurate or outdated update.
- Reporting requires one reason: **Outdated**, **Inaccurate**, **Duplicate**, or **Inappropriate**.
  No written explanation is required during the pilot, and each driver may report an update only
  once. Reports remain private and never become public comments.
- A reported update remains visible while awaiting review. Administrators receive the update,
  reason, reporter, and report time in a moderation queue; the author does not see the reporter's
  identity. An administrator may keep the update, mark it resolved, or remove it.
- When FreightIQ is open and an approaching driver nears a pinned update, the app may ask whether
  the reported condition is still present. The prompt offers **Yes** and **No**, appears only once
  per encounter, and must respect a safe, low-distraction presentation boundary.
- **Yes** refreshes the update's last-confirmed time. The first **No** marks the update **Possibly
  Cleared** while keeping it visible. A second **No** from a different driver within two hours
  removes it from the active feed when no **Yes** was received after the first **No**.
- A **Yes** received after the first **No** cancels the possibly-cleared state. The author or an
  administrator may mark an update resolved immediately. A driver may be asked again only during a
  later encounter.
- Every signed-in driver's **Yes** or **No** has equal weight during the pilot. Founding Driver
  status controls posting access but does not give a confirmation additional weight.
- The pilot triggers the prompt when the driver is within one-quarter mile of the pinned update or
  stop, is moving toward it, has not already been prompted during the current encounter, and
  FreightIQ is open in the foreground. The prompt remains available long enough for the driver to
  observe the condition and may be dismissed without answering.
- The prompt uses a compact, nonblocking banner over the FreightIQ map. It shows the category, a
  short location description, large **Yes** and **No** actions, and a dismiss control without
  opening a modal, keyboard, or separate screen. It dismisses after the driver leaves the area,
  keeps map and route controls usable, and must support screen readers and large text while
  preserving safe touch targets.
- FreightIQ administrators may remove any update.
- Comments, likes, attachments, direct messages, and push notifications are excluded from the
  pilot.
- Active updates are ordered newest first. Confirmations do not move an older update upward, and a
  **Possibly Cleared** update keeps its normal position with a visible status. Drivers may filter by
  category, but contributors cannot assign a priority level. Expired and resolved updates leave the
  active feed.
- The public board contains active updates only. Authors have a **My Updates** view containing their
  active posts and their own expired or resolved posts from the previous seven days. Other drivers
  cannot browse a public archive. Administrative retention for moderation and auditing is defined
  separately in the Build Specification.
- **My Updates** identifies whether a post expired, was resolved by its author, was cleared by
  driver confirmations, or was removed by FreightIQ. A short in-app notice appears the next time
  the author opens Operations, and an administrator removal includes a brief reason. The pilot does
  not send push, email, or SMS notices, and other drivers cannot see moderation details.
- **Post Update** uses one short flow in this order: town or city, category, required map pin or
  FreightIQ stop, message, expiration, and review. The review step previews the published card with
  its location and expiration and allows correction before posting.
- Operations updates prohibit gate codes, passwords, PINs, alarm instructions, credentials,
  personal phone numbers or email addresses, unnecessary personal names, shipment contents or
  quantities, tracking numbers, customer-specific delivery details, driver live locations or
  schedules, and vehicle-identifying information. Photos and attachments are excluded from the
  pilot.
- A **Customer Notice** describes an operational condition without exposing private delivery
  information. If FreightIQ detects an access code or similar secret, posting is blocked until it
  is removed, with an offer to use the existing Locked Personal Intel path when the update is tied
  to a stop.
- Each contributor may create no more than one update per minute, maintain no more than 10 active
  updates, and create no more than 20 new updates in 24 hours. Editing, resolving, confirming, and
  reporting do not count as new posts. FreightIQ administrators may adjust these limits without an
  app release.
- After category and location are selected, FreightIQ checks for possible duplicates. A pinned
  update is compared with related active updates within one-quarter mile; a town-wide update is
  compared with recent updates in the same category and locality. The driver may confirm an
  existing update as **Still Active** or continue posting when the new report describes a different
  condition.
- With weak or lost service, the board may show its most recently loaded updates with a visible
  **Last updated** time and an offline state. A failed post is saved locally as a draft and is not
  published automatically after reconnection; the driver must review and submit it because the
  condition may have changed. **Yes/No** confirmations require a connection and must fail visibly
  rather than appearing recorded when they are not.

## Hosting Direction

- The mobile app owns the driver-facing experience.
- The existing production FreightIQ Supabase project is the intended shared-data host, using the
  existing FreightIQ authentication and driver-profile foundation.
- No separate web host or community platform is required for the driver experience.
- The pilot includes a restricted administrator moderation surface on the existing private website;
  it is not part of the driver experience.
- Reported updates are reviewed in FreightIQ's existing private web administrator dashboard. The
  queue shows the update, author, report reason and time, report count, update age, and expiration.
  An administrator may keep or remove the update; removal requires a reason, and the decision is
  retained in an administrative audit record.
- The pilot should prioritize current information over chat-like behavior: refresh on screen open,
  manual pull-to-refresh, and timely post visibility are sufficient unless field use establishes a
  need for immediate live subscriptions.
- Background proximity monitoring while Apple Maps, Google Maps, or Waze is foregrounded is not
  part of the pilot. Evaluate it only after foreground field testing establishes enough value to
  justify the additional notification, battery, privacy, permission, and platform requirements.

## Pilot Categories

- Road Closure
- Weather / Road Conditions
- Delivery Access
- Construction
- Temporary Hazard
- Customer Notice

## Example Post

**Robby · Road Closure**

US 550 near Ouray reduced to one lane. Flaggers causing approximately 20-minute delays.

Posted 18 minutes ago. Expires at end of day.

## Design Principles

Every post should be:

- Short
- Timely
- Operationally relevant
- Self-expiring

The goal is to improve delivery planning and situational awareness, not create another social
platform.

## Future Connections

- Show active Operations alerts on the map, such as **3 Active Alerts**.
- Surface alerts relevant to the driver's current route or viewed area.
- Build contributor recognition and trust through consistent, high-quality updates.
- Connect naturally with user profiles, reputation, and the Founding Driver Program.

## Later Build Specification Questions

Before implementation is approved, a focused Build Specification must resolve:

- How each broad operational area is mapped to the viewed map while keeping the Product Owner as
  the authority for its practical delivery coverage
- How approved Founding Driver posting eligibility and administrator authority are securely
  enforced
- Detailed map-marker presentation and accessibility behavior
- Notification boundaries and driver-distraction safeguards
- Privacy, security, accessibility, and physical-device acceptance criteria

The proposed focused contract is
`docs/build-specs/FreightIQOperationsBoardV1BuildSpec.md`. It remains subject to Product Owner
approval before implementation.

## Roadmap Position

The Operations Board remains in **Feature Backlog → Driver Experience**.

It is approved as a product direction, not scheduled as current work. Moving it into Active Work
requires Product Owner approval of a focused Build Specification.
