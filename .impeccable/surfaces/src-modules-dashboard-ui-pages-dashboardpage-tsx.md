---
version: 1
slug: "src-modules-dashboard-ui-pages-dashboardpage-tsx"
primary_target: "src/modules/Dashboard/ui/pages/DashboardPage.tsx"
related_targets: ["src/components/Layout/Sidbar/app-sidebar.tsx","src/components/Layout/Sidbar/nav-main.tsx","src/modules/Dashboard/ui/components/SufraMap.tsx"]
---

# Restaurant console shell and dashboard

Scope: the signed-in shell (sidebar, header) and the dashboard home. Mode: Operate.

Audience and task: restaurant owner and staff; phone during service (glance at the menu state, AI jobs, what needs doing), laptop for heavy editing. Data: dashboard overview (menu content counts, 3D job states, tables and QR, subscription, generation usage), categories and items with model and photo state. Constraints: permission-gated navigation; RTL first; logo colours, the Shoof mark and IBM Plex Sans Arabic are fixed.

## Direction contract

THESIS: The home is a spice-souk display: the menu laid out as open bins you read from across the stall, each filled with its own dishes' photos to the level of its 3D readiness, and the day's work hung as paper tickets on a kitchen rail. Refuses the card-grid SaaS home of equal tiles and the old sufra-of-ring-plates.

OWN-WORLD: Burgundy rail (#541F2D, slight vertical depth) with an ivory pill for the active page; ivory ground, one hairline-ruled ledger slab (sand rules, no inner cards); real dish photography as the colour; terracotta only for usage and urgency; tickets are warm paper with a perforated foot hung from a steel rail. IBM Plex Sans Arabic, one 76px readiness figure, tabular digits.

STORY: The owner sees how ready the menu is for guests, which category bin is emptiest, and which ticket to clear first; one tap from a bin or ticket lands on the fix.

FIRST VIEWPORT: Greeting row with period filter and export; then the ledger slab: readiness figure + meter + the next-threshold line + actions at the start, an 8-cell hairline ledger beside it (today's and the month's generation, tables, plan, jobs, categories, active, ingredients; no figure repeats the readiness line); then the row of category bins (photo fill = 3D share, % chip); then the ticket rail full width (5-7 ticket kinds must read without scrolling at laptop width, beside the shelf only two showed); then the dish shelf full width. No band of equal cards below. Phones: ledger 2 columns, bins 3 square columns, tickets scroll on the rail, shelf scrolls.

FORM: Spice souk display, position 4 of the grounded list, seed key 494d73f8, with the kitchen ticket rail (position 1) for the attention list, chosen by the user from rendered examples. Signature moves: bins filling with photos, rolling readiness digits, tickets swinging onto the rail and stamped منجز when clear.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
