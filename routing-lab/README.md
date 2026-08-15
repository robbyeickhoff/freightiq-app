# FreightIQ Routing Lab

Private, single-user web application for teaching FreightIQ from driver-reviewed
route corrections. It supports the frozen `GR-001` learning fixture and the
connected manifest-photo-to-Test-Route workflow.

Routing Lab is isolated from the production FreightIQ mobile application. It has
its own dependencies, environment configuration, backend project, build, and
deployment.

The deployed static build packages an exact snapshot of the canonical GR-001
fixture because Vercel intentionally receives only this isolated application
folder. The prebuild check compares that snapshot with the canonical repository
fixture whenever both are available and fails if they differ.

## Local Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run audit
```

Copy `.env.example` to `.env.local` and provide only the separate Routing Lab
Supabase project URL, publishable key, and approved email. Never use production
FreightIQ credentials.

The controlling implementation specifications are:

```text
../docs/build-specs/FreightIQRoutingLabBuildSpec.md
../docs/build-specs/FreightIQRoutingLabSlice2BuildSpec.md
../docs/build-specs/FreightIQRoutingLabSlice3BuildSpec.md
```
