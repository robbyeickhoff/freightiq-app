# FreightIQ Recording Demo Environment — Build Specification

## Purpose

Create a clean, repeatable iPhone Simulator environment for recording FreightIQ product demos
without creating fictional records in production or exposing real driver information.

## Approved Scope

- Run the actual FreightIQ development app in Apple's iPhone Simulator.
- Allow an explicitly enabled development build to connect to the existing local Supabase stack.
- Fail closed unless the app is a development build and the configured database URL is loopback-only.
- Add one reusable synthetic stop named **Canyon Peak Industrial Supply** to the local seed data.
- Create one fictional, password-capable account through the local Supabase Auth admin API so the
  simulator can enter FreightIQ's authenticated map flow.
- Give the synthetic stop complete, realistic demo Intel:
  - fictional Grand Junction address;
  - 28-foot truck fit;
  - dock delivery;
  - back-in required;
  - saved Delivery Zone;
  - concise approach and delivery guidance;
  - two fictional, visible Driver Reports.
- Keep all demo names, addresses, reports, and users clearly synthetic.

## Safety Contract

- The recording environment must never connect to the production database.
- Recording mode is permitted only when `__DEV__` is true.
- Recording mode requires an explicit `EXPO_PUBLIC_RECORDING_MODE=true` setting.
- The recording database URL must use HTTP and a loopback hostname (`127.0.0.1` or `localhost`).
- Missing or unsafe recording settings stop app startup instead of falling back to production.
- Normal development, preview, and production builds retain the existing production configuration
  when recording mode is not explicitly enabled.
- No production data, users, credentials, builds, distribution settings, or infrastructure change.

## Fixture Contract

The local seed remains safe to reset and replay. The Canyon Peak fixture contains no phone numbers,
gate codes, passwords, personal information, or production identifiers. Placeholder Auth users exist
only to supply ownership and public attribution for the synthetic reports and do not have passwords.

## Local Login Contract

The password-capable demo account is created through the supported local Auth admin API after a
reset rather than by storing a password hash in seed SQL. Its email uses a reserved local-only
domain, its password is synthetic, and its matching profile is created only in the local database.
The local URL must pass the same loopback and port guard before account creation. This account is
not linked, pushed, copied, or created in production.

## Verification

- Replay the complete local migration and seed chain with an explicit local reset.
- Confirm the Canyon Peak stop, Delivery Zone, profiles, and two reports exist locally.
- Confirm the fictional local account can sign in and reach the map without profile setup.
- Confirm the development app selects the local URL only with the approved recording settings.
- Confirm unsafe, missing, or non-development recording configuration fails closed.
- Confirm normal app configuration remains unchanged when recording mode is absent.
- Run TypeScript, lint, and focused local configuration checks.
- Verify the development-identity app can search for and open the synthetic stop in iPhone Simulator.

## Excluded

- Production database or Auth changes.
- Production or tester data creation.
- Candidate builds, TestFlight, Google Play, distribution, or release.
- Analytics, website, referral, or marketing changes.
- General-purpose environment configuration refactors.
