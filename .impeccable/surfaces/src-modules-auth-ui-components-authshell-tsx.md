---
version: 1
slug: "src-modules-auth-ui-components-authshell-tsx"
primary_target: "src/modules/Auth/ui/components/AuthShell.tsx"
related_targets: ["src/modules/Auth/ui/components/Dish3D.tsx"]
---

# Sign-in surface (AuthShell), restaurant console

Scope: every signed-out screen (login, forgot/reset password, forced change-password). Mode: Operate (the visitor's job is to sign in).

Audience and task: a restaurant's owner and staff, phone and laptop, ar/en. Sign in fast with restaurant code (when the host has none), email, password; recover a password. Constraints: standard form controls, no invented claims, graceful no-WebGL and reduced-motion states; must never resemble the SuperAdmin sign-in (black/red, oak table, low-key light).

## Direction contract

THESIS: Opening the back office is sitting down at your own sufra. The 3D dish is served in daylight on a hand-glazed plate on a brass tray, small mezze bowls around it on a za'atar-green cloth, seen from a diner's height above the table. It refuses the dark low-key studio (SuperAdmin) and the stock split-screen photo.

OWN-WORLD: The Sufra. Za'atar green cloth (#1F3A2A to #2F5A3E) owns the stage; herb-white ground (#F3F5EF) and white panel carry the form; olive-oil gold (#D9A62B) marks the active and the brand; sumac (#B33A4B) only for errors. Readex Pro (Arabic and Latin) for everything, display weight 600. Glazed white-and-cobalt ceramic, hammered brass, linen weave.

STORY: The owner sees their kind of table with a real dish turning on it, knows this is their restaurant's 3D menu tool, finds the form at once, signs in.

FIRST VIEWPORT: Desktop: stage about 56% (start side, mirrored in RTL), form 44% on herb-white. Stage: camera high at a diner's 3/4 view; dish centred, five mezze bowls in an arc; brand lockup top-start in ivory; headline and one line bottom-start on a green scrim; demo note. Form: no card, centred column max 380px; h1, one-line description, restaurant code (when needed), email, password with reveal, full-width za'atar-green button, forgot link; language switch top-end. Phones: stage is a 260px band above the form.

FORM: The Sufra, position 4 of the grounded list, seed key f711f6ee. Signature move: the layers of the dish drop onto the glazed plate, then the mezze bowls are served one by one around it (each slides in and settles); drag turns the tray.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
