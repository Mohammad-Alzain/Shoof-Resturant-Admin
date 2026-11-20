---
version: 1
slug: "src-modules-dashboard-ui-pages-dashboardpage-tsx"
primary_target: "src/modules/Dashboard/ui/pages/DashboardPage.tsx"
related_targets: ["src/components/Layout/Sidbar/app-sidebar.tsx","src/components/Layout/Sidbar/nav-main.tsx"]
---

# Restaurant console shell and dashboard

Scope: the signed-in shell (sidebar, header) and the dashboard home. Mode: Operate.

Audience and task: restaurant owner and staff; phone during service (glance at the menu state, AI jobs, notifications), laptop for heavy editing. Data: dashboard overview (menu content counts, 3D job states, tables and QR, subscription, generation usage), categories and items with model and photo state. Constraints: permission-gated navigation; RTL first; must never resemble the SuperAdmin console (espresso rail, burgundy hero card, ivory/terracotta).

## Direction contract

THESIS: The back office is set like the restaurant's own sufra: the menu is a table of plates, and you read the state of your menu as you would read a spread from above. Refuses the generic white SaaS admin and the SuperAdmin's dark burgundy hero-card console.

OWN-WORLD: Za'atar-green rail (#1F3A2A) with ivory-green text, olive-oil gold (#D9A62B) active marker and unread marks; herb-white ground (#F3F5EF), white cards with sage hairlines (#DDE3D6), radius 16px. Section spice hues as wayfinding: za'atar (Menu), turmeric (AI generation), sumac (Restaurant), nigella blue-black (Team). Primary action za'atar green (#24553A). Readex Pro throughout; big numerals, small quiet labels. Dark: green-black ground, gold becomes the action.

STORY: The owner opens the dashboard, sees their categories as plates filling up with photos and 3D models, taps the emptiest plate and lands on the items that still need work.

FIRST VIEWPORT: Desktop: green rail at the start; header with restaurant switcher, search, bell, language, theme, user. Content: page title and date row; then the sufra map leading full width: a round table with one plate per category, each plate's ring filled by the share of items with a 3D model and its centre showing item count, a legend; beside it (stacked on phones) the AI queue tiles and generation usage; then tables/QR and subscription. Phones: the rail becomes the sheet; plates wrap into a two-column grid of plates.

FORM: The Sufra, position 4 of the grounded list, seed key f711f6ee. Signature move: the sufra map (categories as plates, fill = 3D coverage, tap to open those items). Raises: spice hue per nav section (acetate tab manual); the map owns the dashboard (Factory sleeve); destructive actions isolated (dev console); dense whole-cell dish thumbnails (doujin catalog); scale-contrast hierarchy (type specimen).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
