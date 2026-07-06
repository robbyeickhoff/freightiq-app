# Shared Navigation Pattern

## Purpose

This document defines the long-term navigation pattern for shared application features within FreightIQ.

Its purpose is to establish a reusable architectural pattern for screens that should be accessible from multiple navigation contexts while maintaining a single source of truth for their implementation.

It is not a feature specification.

It is not a migration plan.

It defines the architectural pattern that future implementations should follow.

## Core Principle

Shared application features should have a single implementation and multiple route wrappers.

The implementation should exist in one location and serve as the single source of truth.

Each navigation context should provide its own route wrapper while rendering the same shared implementation.

This separation allows navigation behavior to remain context-specific while keeping feature implementation centralized.

## Architectural Roles

### Shared Implementation

A shared implementation contains the feature itself.

It owns the user interface, state, business logic, and reusable behavior.

A shared implementation should not exist in multiple copies.

### Route Wrapper

A route wrapper owns navigation.

It defines the route, screen options, and navigation context for a specific entry point.

A route wrapper should remain thin and should primarily render the shared implementation.

## Navigation Ownership

Navigation belongs to route wrappers, not shared implementations.

During incremental migrations, temporary exceptions may exist until the migration is complete. The long-term architecture should move navigation ownership into route wrappers.

Each route wrapper is responsible for determining how users enter a feature from its own navigation context.

Shared implementations should not depend on a specific navigation hierarchy or assume which route brought the user there.

This allows the same implementation to be reused from multiple navigation contexts without duplicating feature logic.

## Engineering Guidelines

When implementing a shared feature:

1. Create or identify the shared implementation.
2. Keep each route wrapper focused on navigation only.
3. Reuse the shared implementation from every navigation context.
4. Avoid duplicating feature implementations across routes.
5. Verify each navigation context independently after implementation.

This pattern should prioritize one source of truth, predictable navigation behavior, and incremental, low-risk migration.
