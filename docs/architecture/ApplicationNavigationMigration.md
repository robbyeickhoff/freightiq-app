# Application Navigation Migration

## Purpose

This document defines the migration plan for transitioning FreightIQ from its current navigation structure to the long-term Application Navigation architecture.

Its purpose is to guide the migration one safe step at a time.

It is not an implementation guide.

It is not tied to Expo Router implementation details.

Its purpose is to ensure every migration task has a known destination before code is changed.

## Current Navigation

Today, the application navigation has grown organically.

Some shared application features currently live under the Profile navigation hierarchy.

This implementation works, but it does not accurately reflect the long-term application architecture.

The goal of this migration is to reorganize navigation without changing the user experience or introducing unnecessary risk.

## Target Navigation

The completed navigation architecture should separate feature ownership from navigation ownership.

Shared application features should no longer live under the Profile navigation hierarchy.

Instead, they should become shared application destinations while preserving a consistent application experience.

Throughout the migration, users should continue to experience the application as a single, cohesive product.

The migration should prioritize stability over speed.

## Migration Order

The migration should be completed in small, independently testable steps.

Each step should preserve a working application before the next step begins.

Recommended migration order:

1. Prepare the new application navigation structure.
2. Migrate one Help article and verify the pattern.
3. Migrate the remaining Help articles one at a time.
4. Migrate the Help Center after all Help articles have been migrated.
5. Remove obsolete routing wrappers only after all navigation has been verified.
6. Perform a complete navigation regression test before considering the migration complete.

## Engineering Principles

This migration should follow the FreightIQ Engineering Playbook.

- One architectural decision before implementation.
- One small migration at a time.
- One review at a time.
- One verification at a time.

If uncertainty increases during the migration, reduce scope instead of increasing complexity.

No migration step should depend on assumptions about navigation behavior. Every routing change should be verified before proceeding to the next step.
