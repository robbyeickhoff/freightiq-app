# FreightIQ — FAQ Page

**Status:** Implementation complete and visually accepted (2026-08-15)  
**Type:** Public website content page  
**Location:** `docs/build-specs/`

---

## Purpose

Create a focused public FAQ page that answers the practical questions drivers commonly ask about FreightIQ. The page should build trust, reduce uncertainty, and help drivers understand how FreightIQ works before requesting access.

## URL

`/faq`

## Page Title

FreightIQ FAQ: Common Questions from Drivers

## Meta Description

Straight answers to common driver questions about FreightIQ, including how it works, contributing stop information, privacy, availability, and early access.

## Approved Content

The page answers these questions:

1. Is FreightIQ just another navigation app?
2. What kind of information does FreightIQ provide?
3. Do I have to write a long report?
4. What if the information is wrong or incomplete?
5. Who can see what I contribute?
6. Should I share gate codes, passwords, or personal information?
7. Does FreightIQ work for different companies and delivery types?
8. Is FreightIQ available on iPhone and Android?
9. Do I need an account?
10. Is FreightIQ free for drivers?

The approved answers are implemented in `freightiq-site/app/faq/page.tsx` and preserve the distinction between shared Driver Intel and private Locked Personal Intel.

## Design Contract

- Follow the FreightIQ Sunrise System defined in `FreightIQWebsiteRedesignBuildSpec.md`.
- Use a compact, collapsible layout that is easy to scan on a phone.
- Keep the tone practical, calm, and driver-first.
- Use the existing site header, footer, button styles, spacing, and colors.
- Do not introduce a new visual pattern beyond the collapsible FAQ rows.

## Implementation Contract

- Add the public route at `/faq`.
- Link the FAQ from the public website footer.
- Include `/faq` in the public sitemap.
- Add page metadata and a canonical URL.
- Use accessible native controls for every collapsible question.
- This is a content-only page. It introduces no new forms, authentication, database, analytics, infrastructure, or mobile-app changes.
- Commit, push, deployment, and Google indexing remain separate approval gates.
