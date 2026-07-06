# Application Navigation

## Purpose

This document defines the long-term navigation architecture for FreightIQ.

Its purpose is to guide future navigation decisions before code is written.

It is not an implementation guide.

It is not tied to Expo Router.

It describes how the product should be organized from the user's perspective.

## Navigation Philosophy

FreightIQ navigation should feel simple, predictable, and consistent.

Users should always know where they are in the application.

Global destinations should remain independent.

The Map always represents the Map.

The Profile always represents the Profile.

The Help Center is a shared application feature and should not become the identity of another destination.

## Application Shell

Once a user has completed onboarding and entered the application, they are inside the FreightIQ Application Shell.

The Application Shell provides a consistent navigation experience throughout the app.

Global navigation should remain available as users move between application features.

The Map tab always navigates to the Map.

The Profile tab always navigates to the Profile.

Shared application features, such as the Help Center, should exist within the Application Shell without becoming part of another feature's identity.

## Shared Content

Help content should have a single source of truth.

Regardless of where a user enters the Help Center, they should always see the same articles, wording, and guidance.

The Help Center should present a consistent in-app experience regardless of its entry point.

## Future Guidance

When adding new features, first determine whether the feature belongs to a specific area of the application or to the Application Shell.

If a feature is global to the user experience, it should be designed as a shared application feature rather than becoming part of another destination.

Navigation architecture decisions should be made before implementation begins.
