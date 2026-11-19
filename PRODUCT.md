# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Lambdor/Shoof platform staff ("SuperAdmins") who run the operator console from a desk, on desktop, mostly in Arabic or English (RTL and LTR). They onboard tenants and restaurants, sell and track subscriptions and AI credits, manage partner API keys, review AI-generated 3D dishes before they enter the shared library, broadcast announcements, and read reports and logs. The sign-in page is their daily door into that work.

## Product Purpose

Shoof (EMenu) is a multi-tenant digital menu SaaS: a restaurant publishes its menu with AI-generated photos and AI-generated 3D models of its dishes that guests open in 3D/AR from a QR code. This console is the operator side. Success for the sign-in screen: staff recognise the product immediately, sign in quickly and without errors, and the page already says "this is a 3D food platform".

## Positioning

The distinctive mechanism is AI-generated 3D dishes viewable in 3D/AR from a menu. A generic admin template, or a page that only shows stock food photography, could be anyone's; a real, turning 3D dish is only truthful for this product.

## Operating Context

Operator console, bilingual (English / Arabic, full RTL), light and dark themes. Sign-in is email + password with forgot/reset and a forced change-password step for temporary passwords; sessions use rotating refresh tokens. Rate-limited (429) after repeated attempts.

## Capabilities and Constraints

- Stack: Vite, React 19, TypeScript, Tailwind 4, shadcn/Radix components, react-hook-form + zod, i18next (en/ar).
- Sign-in contract: POST auth/login; field and business errors shown inline (docs/00-common-spec.md section 2).
- No customers, testimonials, metrics or claims may be invented on the page.
- 3D must degrade gracefully (no WebGL, reduced motion) and must not block sign-in.

## Brand Commitments

Name: Shoof (Arabic: شوف, "look / see"). The existing logo (blue square with the letter ش) is a README-declared placeholder; the owner has no final logo or brand colours, so a new identity (mark and palette) is part of this work. The product story to preserve: 3D dishes.

## Evidence on Hand

No real customer data, screenshots or 3D asset files from the owner. CC0 food photographs exist in public/images/login/ (see CREDITS.md). No GLB models supplied; any 3D dish shown must be authored here and is demonstration material, not a customer's dish.

## Product Principles

1. The 3D dish is the product's proof; show it turning, not described.
2. Signing in comes first: the form is always standard, fast, and unobstructed.
3. Arabic and English are equals; layout mirrors, nothing is truncated or misaligned.
4. Demonstration content is labelled as such and never presented as customer data.

## Accessibility & Inclusion

Reduced-motion users get a still pose; all inputs labelled, errors announced; contrast at least 4.5:1 for text in both themes.
