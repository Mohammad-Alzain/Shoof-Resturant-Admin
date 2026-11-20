# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A restaurant's owner and staff (managers, menu editors), in Arabic first and English, full RTL and LTR. Use is mixed: the owner checks the dashboard, notifications and generation status from a phone during or between services, and does the heavier work (building the menu tree, editing items, photos, ingredients, 3D models, themes, tables and QR codes, team and roles) on a laptop. Both are first-class. The sign-in page is their daily door into their own restaurant's back office.

This is not the platform operators' console: the sibling app `shoof-superadmin-dashboard` serves Lambdor staff. The two must never look like the same product skin.

## Product Purpose

Shoof (EMenu) is a multi-tenant digital menu SaaS: a restaurant publishes its menu with AI-generated photos and AI-generated 3D models of its dishes that guests open in 3D/AR from a QR code. This dashboard is the restaurant's side: build and maintain the menu, its look, tables/QR codes, AI photos and 3D models, and the team's access. Success: the owner recognises their restaurant's tool, signs in fast, sees the state of their menu at a glance and gets a dish from photo to 3D without friction.

## Positioning

The distinctive mechanism is AI-generated 3D dishes viewable in 3D/AR from a menu the guest opens at the table. A generic admin template, or stock food photography, could be anyone's; a real, turning 3D dish is only truthful for this product.

## Operating Context

Restaurant back office, bilingual (Arabic / English, full RTL), light and dark themes. Each restaurant signs in on its own subdomain (`{slug}.…/admin/`), or types its restaurant code on hosts without one. Sign-in is email + password with forgot/reset and a forced change-password step; sessions use rotating refresh tokens; rate-limited (429). A tenant may own several restaurants (header switcher). Pages and actions are gated by role permissions.

## Capabilities and Constraints

- Stack: Vite, React 19, TypeScript, Tailwind 4, shadcn/Radix components, react-hook-form + zod, i18next (ar/en), TanStack Router/Query.
- API contract: docs/README.md and docs/01-restaurant-admin-portal.md.
- No customers, testimonials, metrics or claims may be invented.
- Sign-in is static and light: no 3D scene, no heavy libraries.

## Brand Commitments

Name: Shoof (Arabic: شوف, "look / see"). Brand assets in public/identity/ (Brand Book Study 01, `shoof-tokens.json`, "the tasting gaze" mark). The product story to preserve: 3D dishes. The restaurant dashboard wears the Shoof identity colours (burgundy, ivory, espresso, terracotta) and its sign-in shows a real dish photo with the logo's gaze (static, no 3D), distinct from the SuperAdmin console.

## Evidence on Hand

No real customer data, screenshots or 3D asset files from the owner. CC0 food photographs in public/images/login/ (see CREDITS.md); models and textures in public/models and public/textures. Any 3D dish shown is authored demonstration material, not a customer's dish.

## Product Principles

1. The 3D dish is the product's proof; show it turning, not described.
2. Signing in and daily tasks come first: forms are standard, fast and unobstructed.
3. Arabic and English are equals; layout mirrors, nothing is truncated or misaligned.
4. Phone and laptop are both real workplaces: nothing important hides behind hover or a wide screen.
5. Demonstration content is labelled as such and never presented as customer data.

## Accessibility & Inclusion

Reduced-motion users get a still pose; all inputs labelled, errors announced; contrast at least 4.5:1 for text in both themes; touch targets at least 44px on phones.
