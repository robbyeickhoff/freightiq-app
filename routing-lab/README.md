# FreightIQ Routing Lab

Private, single-user web application for proving the FreightIQ route-learning
loop with the frozen `GR-001` fixture.

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

The controlling implementation specification is:

```text
../docs/build-specs/FreightIQRoutingLabBuildSpec.md
```
