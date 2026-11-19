---
version: 1
slug: "src-modules-auth-components-authshell-tsx"
primary_target: "src/modules/Auth/components/AuthShell.tsx"
related_targets: []
---

# Sign-in surface (AuthShell)

Scope: every signed-out screen (login, forgot/reset password, forced change-password). Mode: Operate (the visitor's job is to sign in).

Audience and task: SuperAdmin staff, desktop first, en/ar. Sign in fast; recover a password. Constraints: standard form controls, no invented claims, graceful no-WebGL and reduced-motion states (still pose plus a "Play the animation" opt-in).

Unresolved: the owner's final logo and brand colours (login uses crimson; the dashboard primary is still orange); the 3D burger is authored demonstration material, not a customer dish.

## Direction contract

THESIS: The sign-in screen is a low-key food-photography table: a real-looking burger on a plate on dark oak, in the dark, lit warm from the front and red from behind. A red scan plane turns the raw mesh into the shaded dish, which is the product story (a photo becomes a 3D model). It refuses the split-screen of gradient plus stock photos and any bright "SaaS" stage.

OWN-WORLD: Black and red. Page ground near-black (#0c0708), form text warm white, one crimson (#d4162a) for the primary action and the brand mark, ring and links in lighter red. Stage: oak table (Poly Haven Black Oak Veneer), oxblood glazed plate, photoscanned buns (Poly Haven Hamburger Buns) plus built patty, cheese, tomato, lettuce, sesame; warm key spot, crimson back spot, red wireframe and scan ring. Faces: Bricolage Grotesque for Latin display, Cairo for Arabic.

STORY: The visitor sees a believable dish being built in 3D, understands this is a 3D food platform, finds the form without hunting, signs in.

FIRST VIEWPORT: Desktop two columns (stage about 58%, form 42%, mirrored in RTL; on phones the stage is a 300px band above the form). Stage: the plated burger centred at about 55-60% of stage height, headline bottom-start, a four-step pipeline (Photo, Mesh, Texture, AR-ready) that follows the scan, a one-line demo note. Form: card-less, centred column: h1 Sign in, email, password with reveal, full-width crimson button, forgot-password link; language switch top-end.

FORM: User-pinned direction (realistic dish on a plate, table-inspired, dark, black and red); no concept roll, no seed key. Signature move: wireframe layers drop onto the plate, a scan ring shades them, then the layers come apart with labels and re-stack; drag rotates the dish.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
