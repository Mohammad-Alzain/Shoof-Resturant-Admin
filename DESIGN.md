---
name: Shoof Restaurant Console
description: The restaurant's back office, set like a Levantine sufra seen from above.
colors:
  zaatar: "#24553a"
  zaatar-rail: "#1c3526"
  zaatar-cloth: "#1f3a2a"
  olive-oil-gold: "#d9a62b"
  gold-mark: "#b8861a"
  rail-gold: "#e0b23a"
  herb-white: "#f3f5ef"
  sage-page: "#e8eee3"
  card-white: "#ffffff"
  sage-hairline: "#dce3d5"
  sage-input: "#c6d0bf"
  pine-ink: "#17251b"
  moss-muted: "#536253"
  rail-text: "#c3d3c1"
  rail-strong: "#f4f7ee"
  spice-menu: "#2f6b47"
  spice-ai: "#a86a06"
  spice-restaurant: "#a92e43"
  spice-team: "#2f4e7a"
  rail-menu: "#8cc79a"
  rail-ai: "#e7a93a"
  rail-restaurant: "#ec8c98"
  rail-team: "#a9bce2"
  sumac: "#a92e43"
  success: "#2e7a49"
  warning: "#9a6205"
  info: "#2f4e7a"
  plate-glaze: "#f6f2e7"
  plate-cobalt: "#1e4a8c"
  plate-turquoise: "#2b8f9a"
  brass: "#c79a44"
  photo-ring: "#c9951f"
  dark-ground: "#111813"
  dark-card: "#18211a"
  dark-page: "#0b110d"
  dark-ink: "#e8efe3"
  dark-action-gold: "#e0b23a"
  brand-burgundy: "#541f2d"
  brand-ivory: "#fbf5e9"
typography:
  display:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 600
    lineHeight: 1.08
  headline:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.25
  numeral:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  title:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  card-title:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "18px"
  card: "16px"
  cloth: "24px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.zaatar}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.herb-white}"
    textColor: "{colors.zaatar}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "34px"
  input:
    backgroundColor: "{colors.herb-white}"
    textColor: "{colors.pine-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.pine-ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  nav-item:
    backgroundColor: "{colors.zaatar-rail}"
    textColor: "{colors.rail-text}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "40px"
  nav-item-active:
    textColor: "{colors.rail-strong}"
  sufra-cloth:
    backgroundColor: "{colors.zaatar-cloth}"
    textColor: "{colors.rail-strong}"
    rounded: "{rounded.cloth}"
    padding: "28px"
  plate:
    backgroundColor: "{colors.plate-glaze}"
    textColor: "{colors.pine-ink}"
    rounded: "{rounded.pill}"
    size: "104px"
---

> **Palette update (current).** The console now wears Shoof's own identity from `public/identity/shoof-tokens.json`, replacing the za'atar-green and olive-gold values named below: deep burgundy `#541F2D` is the rail, cloth and primary action; warm ivory `#FBF5E9` / paper `#FAF5EC` is the work surface; espresso `#261C1A` is the ink; roasted terracotta `#B95035` marks what is active. Section hues: terracotta (Menu), ochre (AI), rose (Restaurant), slate (Team). Dark mode is espresso ground with light terracotta `#E2876A` as the action. Type is IBM Plex Sans / IBM Plex Sans Arabic (self-hosted), per the brand book. Sign-in is "the dish and the eye": the mark made literal in front of a food wall (`FoodWall.tsx`): five tilted columns of real dish photos (17 tiles, `public/images/login/wall`, CC0) drifting at different speeds in opposite directions, washed in burgundy with an espresso vignette behind the gaze. The first plate holds a real dish, turning slowly and cross-fading through eight dishes (`public/images/login/dishes`, CC0); the second plate is the watching eye (`GazeStage.tsx`). The eye glances at each new dish, follows the pointer, reads along in the field being typed in, closes under an espresso lid for the password (looks away if it is shown), looks around while the server checks, shakes at an error and blinks. Dish name, the owner-facing headline «مطعمك، كما يراه ضيوفك.» and a one-line state hint sit below (hints: «خذ وقتك.» while typing, «أغمضنا أعيننا.» for the password, «لحظة، نجهّز طاولتك…» while checking, a plain recovery line on error) (`AuthShell.tsx`); the form column is ivory with the official logo. The dashboard opens on a readiness band (share of the menu with a 3D model as a filling burgundy ring, the counts, and one primary action: generate the missing models; three real dishes as plates at its end), then the linked figures row, then the menu map (a light card with one plate per category) beside a "Needs your attention" list built from the overview (failed jobs, dishes without a model, tables without QR, dishes without ingredients, inactive dishes, plan ending, monthly credits above 80%), then the AI queue, usage, subscription and tables cards. Burgundy stays on the rail and on actions; content surfaces are ivory. Shares are drawn with one meter (`Meter` in `modules/shared/ui/parts.tsx`): the fill anchors to the reading start and carries severity (calm, warning from 80%, danger at 100%) on a lighter track of the same colour; figures say what they are a share of ("20 of 51"), job counts stay in ink with an icon per state and only failures turn red, and the readiness percentage is the page's one hero figure. Forms with bilingual fields have one content-language switch at the top (`FormLangContext`) instead of one per field. The item editor shows a live guest-facing card of the dish beside its form, and each top-level category row carries its 3D coverage meter. Where the text below says green, za'atar or gold, read burgundy, ivory or terracotta.

# Design System: Shoof Restaurant Console

## Overview

**Creative North Star: "The Sufra"**

The console is laid out like a Levantine mezze table seen from above. Za'atar green is the cloth and the rail; herb-white is the daylight surface the work happens on; olive-oil gold marks whatever is active; sumac is kept for alarms. The restaurant's menu is read the way you read a spread: categories are plates, and a plate fills as its dishes gain 3D models and photos.

The density is an operator's density: white cards on a sage page, hairline rows instead of boxes inside boxes, big tabular numerals with small quiet labels under them. Arabic is the first language and the layout mirrors in RTL; Readex Pro carries both scripts at one weight ramp. Material lives in the signature pieces (the glazed plates, the hammered brass tray, the daylight 3D table on sign-in), not in textures painted onto every surface.

This world is deliberately not the sibling SuperAdmin console: no espresso rail, no burgundy hero card, no ivory/terracotta ground. Burgundy and the brand ivory appear only on the Shoof logo and its lockup badge, which keep their own identity colours.

**Key Characteristics:**
- Za'atar-green rail and cloth, herb-white work surface, olive-oil gold for active marks.
- One spice hue per navigation section for wayfinding.
- Categories drawn as glazed plates whose rings show 3D and photo coverage.
- Readex Pro throughout; scale contrast between numerals and labels carries hierarchy.
- Flat surfaces with one soft card shadow; depth belongs to the plates and tray.
- Sign-in is always the daylight (light) set.

## Colors

A herb-garden palette: deep za'atar greens, sage neutrals, olive-oil gold, and four spice hues, with the logo's burgundy and ivory held apart as identity colours.

### Primary
- **Za'atar** (zaatar): the action colour in light mode: primary buttons, links ("view all", "retry"), progress bars, the 3D-coverage ring on every plate.
- **Za'atar Rail** (zaatar-rail): the sidebar ground, light and dark (dark deepens to #0e1a12).
- **Za'atar Cloth** (zaatar-cloth): the sufra map's cloth and the sign-in stage's ground and fog; scrims over the 3D scene are drawn in this green, never black.

### Secondary
- **Olive-Oil Gold** (olive-oil-gold): unlimited-quota bars, small marks; on the rail it brightens to **Rail Gold** (rail-gold) for the focus ring, the restaurant initial disc and the demo-note dot. In dark mode Rail Gold becomes the action colour (dark-action-gold).
- **Gold Mark** (gold-mark): exposed as `--terracotta` for historical class names. Card-header icons, caret, text selection, table-row hover marker and the hover-lift border. Indicators only, never body text.
- **Brass** (brass) and **Photo Ring** (photo-ring): the tray at the centre of the sufra and the inner photo-coverage ring.

### Tertiary
- **Spice hues** (spice-menu za'atar, spice-ai turmeric, spice-restaurant sumac, spice-team nigella): one per nav section on light surfaces. On the green rail they shift to their light partners (rail-menu, rail-ai, rail-restaurant, rail-team).
- **Plate Glaze, Cobalt and Turquoise** (plate-glaze, plate-cobalt, plate-turquoise): the glazed plate: ivory body, cobalt band on the rim, a thin turquoise line inside it. Shared by the SVG plates and the 3D sign-in plate.

### Neutral
- **Herb White** (herb-white): content canvas and light background.
- **Sage Page** (sage-page): the page step behind the inset content, so white cards lift off it.
- **Card White** (card-white): cards, popovers.
- **Sage Hairline** (sage-hairline) and **Sage Input** (sage-input): borders, row dividers, input strokes, scrollbar thumb.
- **Pine Ink** (pine-ink) and **Moss Muted** (moss-muted): body and secondary text.
- **Rail Text** (rail-text) and **Rail Strong** (rail-strong): resting and active text on the rail and the cloth.
- **Dark set**: green-black ground (dark-ground), cards (dark-card), page (dark-page), ink (dark-ink); spice and chart hues use their light partners.

### Status
- **Sumac** (sumac) for destructive and failed states; **success**, **warning** (also "needs attention" numerals and rows), **info** for processing. Dark mode lightens each (#e27286, #7cc892, #e7a93a, #93aedb).

### Identity
- **Brand Burgundy** and **Brand Ivory** (brand-burgundy, brand-ivory): the Shoof logo tile and plates, from `public/identity/assets/shoof-tokens.json`. Also the "restaurant console" badge beside the lockup on sign-in.

### Named Rules
**The Logo Keeps Its Colours Rule.** The Shoof mark is always a burgundy tile with ivory plates, in every theme and on every surface. The tile-less mark and wordmark use burgundy on light and ivory on dark. The console palette never re-themes the logo, and burgundy is never used for console UI beyond the lockup's own badge.

**The Spice Wayfinding Rule.** Each navigation section owns one spice hue: za'atar for Menu, turmeric for AI generation, sumac for Restaurant, nigella for Team. The hue marks the section icon and the active row's marker and icon. It is not used as a fill anywhere else.

**The Gold Marks Rule.** Olive-oil gold marks what is active or selected (indicators, carets, row hover, focus on the rail). It is never body text and never a large fill, except as the dark-mode action colour.

## Typography

**Display Font:** Readex Pro (with ui-sans-serif, system-ui), weights 300 to 700 from Google Fonts
**Body Font:** Readex Pro
**Label Font:** Readex Pro

**Character:** One family for Arabic and Latin, rounded and open, so the RTL and LTR builds read as the same voice. Hierarchy comes from size and weight contrast, not from a second face.

### Hierarchy
- **Display** (600, 3.25rem, 1.08): the sign-in stage headline only (desktop).
- **Headline** (600, 2rem rising to 2.5rem at sm, leading-tight): page greeting on the dashboard; sign-in form title at 2rem.
- **Numeral** (600, 1.75rem, line-height 1, tabular): figures in the menu-numbers strip and the AI queue. The tray total is 1.875rem; plate counts are 24 SVG units.
- **Title** (600, 1.25rem to 1.5rem): the sufra map heading, subscription plan name.
- **Card title** (600, 0.875rem): card headers, paired with a 16px gold-mark icon.
- **Body** (400, 0.9375rem, relaxed): subtitles and descriptions; 0.875rem for row text.
- **Label** (400 to 500, 0.75rem): the quiet label under a numeral, legends, meta lines. No uppercase, no tracking.

### Named Rules
**The Big Number, Small Label Rule.** A figure is set large in display weight with tabular numerals; its label sits under it at 0.75rem in the muted colour. Labels never compete with the figure.

**The Lining Numerals Rule.** All numerals are lining; tables and figure rows are tabular. Numbers in mixed-direction strings are isolated LTR.

## Layout

The signed-in shell is an inset sidebar on the sage page: the za'atar rail (272px, collapsing to an icon rail) at the start edge, which is the right in Arabic, and the content canvas inset beside it with a 64px header. Content is capped at 1600px with 16px / 24px / 32px padding at mobile / md / lg.

The dashboard uses a two-column grid at xl (about 1.65fr to 1fr): the sufra map leads the main column with the menu-numbers strip under it; the side column stacks the AI queue, generation usage, subscription, and tables/QR cards. Below xl everything stacks. Column gaps are 20px, page sections 24px, card padding 20px.

The sufra map sets 3 to 8 categories round a central tray at md and up; on phones, or with more than 8 categories, the plates wrap into centred rows on the cloth. Sign-in splits 1.25fr stage to 1fr form at lg; on phones the stage becomes a 260px to 320px band above the form, which is capped at 380px wide.

**The Hairline Row Rule.** Inside a card, related values are separated by hairline rows (top border, 10px vertical padding), never by nested boxes or tile grids.

## Elevation & Depth

Surfaces are flat with one soft, green-tinted card shadow. Real depth is reserved for the objects on the table: plates and the tray carry a drop shadow, and the 3D sign-in scene carries its own lighting.

### Shadow Vocabulary
- **Card** (`0 1px 2px 0 rgb(23 37 27 / 6%), 0 12px 28px -16px rgb(23 37 27 / 22%)`): every card and the sufra cloth.
- **Hover lift** (`0 10px 26px -12px` of 38% primary, with a 2px rise): hoverable resource cards.
- **Plate** (`drop-shadow 0 8px 14px rgb(8 20 12 / 0.35)`) and **Tray** (`drop-shadow 0 10px 18px rgb(8 20 12 / 0.45)`): objects resting on the cloth.

### Named Rules
**The Objects Carry Depth Rule.** The cloth is flat colour. Only things set on it (plates, tray, the 3D dish) are lifted. No faked fabric weave, no gradients standing in for material.

## Shapes

Gently rounded throughout from a 14px base radius: controls at 12px, cards at 16px, the sufra cloth at 24px. Plates and the tray are true circles, progress bars and badges are full pills. The active nav marker is a 3px rounded bar on the start edge. Borders are 1px sage hairlines.

## Components

### Buttons
- **Shape:** gently curved (12px).
- **Primary:** za'atar fill, white text, 40px tall at lg, 34px at md; in dark mode the fill turns gold with near-black text.
- **Outline:** herb-white ground, sage-input stroke, za'atar text; accent-green wash on hover.
- **Hover / Focus / Press:** 90% fill on hover; 2px ring in the ring colour on focus; every button presses to 0.97 scale (disabled under reduced motion).

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** white on the herb-white canvas (dark: #18211a).
- **Shadow Strategy:** the single card shadow.
- **Border:** 1px sage hairline.
- **Internal Padding:** 20px; header is a 0.875rem semibold title with a gold-mark icon at the start and an optional text link at the end.

### Inputs / Fields
- **Style:** herb-white ground, 1px sage-input stroke, 12px radius, 40px tall at lg.
- **Focus:** border turns to the ring colour with a 3px ring at 30%; caret is gold.
- **Error:** sumac border at 60% with a faint sumac ring.

### Navigation
- **Rail:** za'atar ground. Section heads are 0.8125rem semibold with the section's spice-hue icon and a collapse chevron; sections are separated by a hairline.
- **Items:** 40px rows, 19px icon plus 0.875rem label in rail text. Hover washes the row; active turns the text strong, semibold, tints the icon with the section hue, and shows a 3px hue bar at the start edge. One shared pill slides between rows.
- **Collapsed:** a centred 40px square per item; the active one fills with rail strong and its icon takes the rail ground colour.
- **Header of the rail:** the restaurant's logo or initial disc (gold, inset ivory ring) with its name and a small ivory Shoof wordmark.

### Sufra Map (signature)
The dashboard's owning graphic. A za'atar cloth card (24px radius) titled with a short description and a legend whose swatches match the rings. Each top-level category is a glazed plate: ivory glaze, cobalt rim band, outer za'atar ring = share of items with a 3D model, inner gold ring = share with a photo, centre shows the item count and the 3D percentage. Under the plate, the category name and either "N without 3D" in pale gold or "done" in pale sage. A plate opens that category's items, filtered to those without a model when any are missing. The brass tray in the centre carries the menu-wide 3D percentage and item count. Rings draw in over 1.1s on the shared ease-out; plates scale in staggered.

### Menu Numbers Strip
One hairline-divided row of linked figures (2 columns on phones, 3 at sm, 6 at xl) under the map; figures needing attention turn warning-coloured.

### Sign-in Stage
Always the light set. A daylight 3D table: za'atar linen, hammered brass tray, a cobalt-rimmed glazed plate holding a mixed grill (flatbread, then kofta, shish tawook and vegetable skewers laid on it one by one, then parsley and sumac onions), built entirely in code, and five mezze bowls served in a loop with ivory name pills. Without WebGL it shows the rendered still (`public/images/login/sufra-still.png`). The lockup sits top-start on a green scrim; the headline and subline sit on a bottom scrim in cloth green.

### Brand Mark and Loader
The logo is drawn only in `components/common/Brand`. On hover the pupils glance toward the dish (220ms). Loading uses the gaze loader (the pupils look around the table), not a spinner.

## Do's and Don'ts

### Do:
- **Do** use the single motion curve `cubic-bezier(0.16, 1, 0.3, 1)` for entrances, rings and the sliding nav pill; interface feedback always animates, and only decorative infinite loops stop under reduced motion.
- **Do** give each navigation section its spice hue, and only on its icon and active marker.
- **Do** separate values inside a card with hairline rows.
- **Do** set figures large and tabular with a small muted label under them.
- **Do** draw scrims and overlays on the cloth in za'atar green, not black.
- **Do** mirror layouts with logical properties (start/end) so Arabic and English share one layout.

### Don't:
- **Don't** re-theme the Shoof logo, and don't use its burgundy, or the SuperAdmin console's espresso and terracotta, for console UI. The plates' ivory glaze is the table's own and stays.
- **Don't** nest boxed tiles inside cards.
- **Don't** fake material with CSS textures or gradients on the cloth; material lives in the plates, tray and 3D scene.
- **Don't** use gold for body text or large fills in light mode.
- **Don't** put small uppercase labels above headings; the date and restaurant name follow the greeting.
