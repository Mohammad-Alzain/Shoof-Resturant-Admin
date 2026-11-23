---
name: Shoof Restaurant Console
description: The restaurant's back office, set as a spice-souk display in Shoof's own burgundy and ivory.
colors:
  burgundy: "#541f2d"
  terracotta: "#b95035"
  brand-ivory: "#fbf5e9"
  brand-sand: "#e9ddcf"
  espresso: "#261c1a"
  paper: "#faf5ec"
  card-paper: "#fffdf8"
  page-sand: "#f1e8da"
  souk-bin: "#ece1d3"
  wash: "#f3e8dc"
  muted-fill: "#f1e9dd"
  hairline: "#e3d6c6"
  input-stroke: "#d6c5b2"
  muted-ink: "#6e5d58"
  rail-text: "#e6d3c9"
  rail-steel: "#9a8e85"
  rail-clip: "#8e827a"
  spice-menu: "#b95035"
  spice-ai: "#96600b"
  spice-restaurant: "#8f2f4a"
  spice-team: "#35567a"
  rail-menu: "#f0a98a"
  rail-ai: "#e9c46a"
  rail-restaurant: "#f2a3b5"
  rail-team: "#a9c0e2"
  destructive: "#b42318"
  success: "#3b7a50"
  warning: "#96600b"
  info: "#35567a"
  dark-ground: "#1a1311"
  dark-card: "#251b19"
  dark-page: "#130d0c"
  dark-rail: "#140d0c"
  dark-ink: "#f3e9dc"
  dark-action: "#e2876a"
  dark-bin: "#2a201e"
typography:
  readiness:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans Arabic, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans Arabic, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.25
  numeral:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans Arabic, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  section-title:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans Arabic, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans Arabic, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  row:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans Arabic, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans Arabic, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  ticket: "3px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  card: "16px"
  slab: "24px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.burgundy}"
    textColor: "{colors.brand-ivory}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.burgundy}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "34px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.card-paper}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.card}"
    padding: "16px"
  ledger-slab:
    backgroundColor: "{colors.card-paper}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.slab}"
    padding: "28px"
  nav-item:
    backgroundColor: "{colors.burgundy}"
    textColor: "{colors.rail-text}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "40px"
  nav-item-active:
    backgroundColor: "{colors.brand-ivory}"
    textColor: "{colors.burgundy}"
    rounded: "{rounded.lg}"
  souk-bin:
    backgroundColor: "{colors.souk-bin}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.card}"
    padding: "12px"
  bin-chip:
    backgroundColor: "{colors.brand-ivory}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  ticket:
    backgroundColor: "{colors.card-paper}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.ticket}"
    padding: "22px 14px 14px"
    width: "216px"
---

# Design System: Shoof Restaurant Console

## Overview

**Creative North Star: "The Spice Souk Display"**

The console wears Shoof's own identity: a deep burgundy rail, warm ivory paper for the work, espresso ink, and roasted terracotta for what is being spent. The home reads like a souk stall seen from across the lane: the menu laid out as open bins, each filled with its own dishes' photos to the level of its 3D readiness; the day's work hung as paper order tickets on a steel kitchen rail; a shelf of real dishes below. The colour on these surfaces comes from the food photography; the chrome stays ivory and sand.

The density is an operator's density: one hairline-ruled ledger slab instead of a band of equal cards, big tabular numerals with quiet labels, sand hairlines instead of boxes inside boxes. Arabic is the first language and the layout mirrors in RTL; IBM Plex Sans Arabic with IBM Plex Sans (self-hosted) carries both scripts. Material lives in the signature objects (bins, tickets, the rail's clip and bar, the dish photos), not in textures painted onto every surface.

Sign-in is "the dish and the eye": always the light set, an espresso stage with a drifting wall of real dish photos washed in burgundy, a plate holding a turning dish beside the watching eye of the Shoof mark, and an ivory form column carrying the official logo.

**Key Characteristics:**
- Burgundy rail with a slight top-light depth; the active page is an ivory pill with burgundy text.
- Ivory ground and paper cards; real dish photography is the colour.
- Terracotta means spent (quota and usage); plain progress is burgundy (sand in dark); red is only for failure.
- One 76px readiness figure per home; every other figure is a 28px tabular numeral.
- Category bins, kitchen tickets and a dish shelf are the home's signature objects.
- Sign-in is always the daylight (light) set.

## Colors

A warm, roasted palette from Shoof's identity: burgundy and espresso for weight, ivory and sand for paper, terracotta for spending, and four section hues for wayfinding.

### Primary
- **Shoof Burgundy** (burgundy): the rail ground, the primary button fill, links and text actions, the "3D" badge text on dish photos, and the fill of every plain progress meter in light mode (`--meter`).
- **Roasted Terracotta** (terracotta): consumption and marks. The fill of quota meters while there is room (generation today and this month, the `usage` meter tone), the focus ring, the caret, the table-row hover marker (3px inset on the start edge), and the Menu section's hue. In dark mode it lightens to **Light Terracotta** (dark-action), which is also the dark-mode action colour.

### Secondary
- **Brand Sand** (brand-sand): the meter fill in dark mode, so terracotta keeps meaning "spent" and the action colour stays the button's; also the sign-in stage's secondary text.
- **Souk Bin** (souk-bin): the empty interior of a category bin, a dish slot without a photo, and the photo frame of stalls and dish cards (dark: dark-bin).

### Tertiary
- **Section hues** (spice-menu terracotta, spice-ai ochre, spice-restaurant rose, spice-team slate): one per navigation section on light surfaces. On the burgundy rail they take their light partners (rail-menu, rail-ai, rail-restaurant, rail-team).
- **Rail Steel** (rail-steel) and **Rail Clip** (rail-clip): the kitchen ticket rail's bar and the clip at the top of each ticket.

### Neutral
- **Paper** (paper): content canvas, input and outline-button ground.
- **Card Paper** (card-paper): cards, the ledger slab, popovers and the ticket paper.
- **Page Sand** (page-sand): the page step behind the inset content.
- **Wash** (wash) and **Muted Fill** (muted-fill): hover washes, the segmented control's track, count pills.
- **Hairline** (hairline) and **Input Stroke** (input-stroke): every border, ledger rule, dashed ticket and card divider, input stroke, scrollbar thumb.
- **Espresso** (espresso) and **Muted Ink** (muted-ink): body and secondary text; espresso at 45 to 80% is the scrim under photo labels.
- **Rail Text** (rail-text): resting text on the rail; active text is burgundy on the ivory pill.
- **Dark set**: espresso-black ground (dark-ground), cards (dark-card), page (dark-page), rail (dark-rail), ink (dark-ink).

### Status
- **Destructive** (destructive) for failures, the hot ticket's top edge and count, and a quota at or past its limit; **warning** for a plan ending within 14 days; **success** for the done stamp and ready states; **info** for processing. Dark mode lightens each (#f08a80, #e9c46a, #7cc892, #93aedb).

### Named Rules
**The Logo Keeps Its Colours Rule.** The Shoof mark is always a burgundy tile with ivory plates, in every theme and on every surface. The tile-less mark and wordmark use burgundy on light and ivory on dark. The console's own palette never re-themes the logo.

**The Terracotta Is Spent Rule.** A terracotta meter is a quota being consumed; plain progress (readiness, tables with QR, active dishes, plan period) is a burgundy meter, sand in dark. In light mode terracotta is never a button fill.

**The Red Means Failure Rule.** Destructive red marks only failed jobs, the hot ticket and a quota that is used up. Everything else that needs attention stays in espresso ink with an icon.

**The Photography Is The Colour Rule.** On the home and the menu, colour comes from the restaurant's own dish photos; surfaces around them stay ivory, sand and espresso. A missing photo shows the bin colour with a faint burgundy diagonal hatch and a "no photo" note, never a stock image.

**The Section Hue Rule.** Each navigation section owns one hue (terracotta Menu, ochre AI, rose Restaurant, slate Team), used only on that section's head icon on the rail. It is not a fill anywhere.

## Typography

**Display Font:** IBM Plex Sans Variable / IBM Plex Sans Arabic (with ui-sans-serif, system-ui), self-hosted
**Body Font:** the same family
**Label Font:** the same family

**Character:** One family for Arabic and Latin, so RTL and LTR read as one voice. Hierarchy comes from size and weight contrast and tabular figures, never from a second face.

### Hierarchy
- **Readiness** (700, 4.75rem at sm and up, 4rem on phones, line-height 1.1, -0.02em, tabular): the menu's readiness percentage on the home only, rolling into place digit by digit; the percent sign sits beside it at 1.75rem medium in muted ink.
- **Headline** (600, 2rem rising to 2.5rem at sm, leading-tight): the home greeting and the sign-in form title. The sign-in stage headline is a desktop-only clamp (2.25rem to 3.4rem, 1.12).
- **Numeral** (600, 1.75rem, line-height 1, tabular): ledger cells (1.5rem on phones) and ticket counts.
- **Section title** (600, 1rem): the headers of bins, ticket rail and shelf; stall names; dish names at 0.9375rem.
- **Body** (400, 0.9375rem, relaxed): the greeting's sub-line and descriptions.
- **Row** (500 to 600, 0.875rem): ticket labels, bin names, nav items, table rows.
- **Label** (400 to 600, 0.75rem; 0.6875rem for photo badges and ticket notes): ledger labels, "of N" suffixes, notes, chips. No uppercase, no tracking.

### Named Rules
**The One Hero Figure Rule.** The readiness percentage is the page's only hero figure. No other figure on the home repeats it or competes with its size.

**The Quiet Label Rule.** A figure is set large and tabular; its label is 0.75rem muted ink and never competes with it. A share always says what it is a share of ("20 of 51").

**The Lining Numerals Rule.** All numerals are lining and tabular in figures and tables; the UI's own numerals are used (Arabic-Indic in Arabic). Numbers in mixed-direction strings are isolated LTR.

## Layout

The signed-in shell is an inset sidebar on the page-sand step: the burgundy rail (272px, collapsing to an icon rail) at the start edge, which is the right in Arabic, and the paper canvas beside it with a 64px header. Content is capped at 1600px with 16px / 24px / 32px padding at mobile / md / lg.

The home is a single column of full-width bands, 28px apart: the greeting row (greeting, restaurant and date at the start; period filter and export at the end); the ledger slab; the category bins; the ticket rail; the dish shelf. There is no band of equal cards. The ledger slab splits 1fr to 1.75fr at lg: readiness figure, meter, next-threshold line and actions at the start (20px padding, 28px at sm), and eight hairline cells beside it (2 columns on phones, 4 at sm).

Bins fill an auto grid of 9.5rem minimum columns with 12px gaps, 3:4 tall; on phones they become 3 square-ish columns (4:5) with 8px gaps. Tickets run 216px wide in one row with 14px gaps and scroll on the rail. The dish shelf is a 240px row of slots (176px on phones, scrolling with snap).

The menu's categories are stall cards in a 1 / 2 / 3 column grid (sm, xl) with 16px gaps; dishes are a gallery in 1 / 2 / 3 / 4 columns (sm, lg, 2xl) with 16px gaps, or a table, chosen with a segmented switch that is remembered.

**The Hairline Ledger Rule.** Values that belong together sit in one slab, divided by sand hairlines (cells overlap by -1px so rules never double), never by nested cards or tiles.

## Elevation & Depth

Surfaces are flat with one soft espresso-tinted card shadow. Depth is reserved for the objects: bins lift when hovered, tickets hang from the rail with a falling shadow, the rail bar casts a small one, and the rail itself carries a faint top-light gradient so the burgundy deepens toward its foot.

### Shadow Vocabulary
- **Card** (`0 1px 2px 0 rgb(38 28 26 / 6%), 0 12px 28px -16px rgb(38 28 26 / 22%)`): cards, stalls, dish cards and the ledger slab.
- **Bin lift** (`0 16px 28px -18px rgb(38 28 26 / 0.55)`, with a 3px rise): a hovered bin.
- **Ticket** (`0 12px 20px -12px rgb(38 28 26 / 0.45), 0 0 0 1px rgb(38 28 26 / 0.05)`): every hanging ticket.
- **Hot ticket** (`inset 0 4px 0` destructive, added to the ticket shadow): a ticket for failed work.
- **Rail bar** (`0 3px 6px -2px rgb(38 28 26 / 0.3)`).
- **Active nav pill** (`0 6px 16px -8px rgb(0 0 0 / 0.45)`).
- **Photo chip** (`0 2px 8px rgb(38 28 26 / 0.22)`): ivory chips set over photos.

### Named Rules
**The Objects Carry Depth Rule.** Cards are flat paper. Only the things on the display (bins, tickets, the rail, the active pill) are lifted. The rail's top-light gradient is the one gradient that stands in for light.

## Shapes

Gently rounded from a 14px base radius: controls at 12px, nav items and the active pill at 14px, cards, stalls, bins and dish slots at 16px, the ledger slab at 24px. Tickets are paper: 3px at the top and a perforated, torn foot (half-circle punches every 12px). Chips, meters, badges and the segmented switch are full pills. The ticket clip is a 26 by 16px block with a 4px radius; the rail bar is a 10px pill. Borders are 1px sand hairlines; dividers inside tickets and cards are dashed.

## Components

### Buttons
- **Shape:** gently curved (12px).
- **Primary:** burgundy fill, ivory text, 40px tall at lg, 34px at md; in dark mode light terracotta with near-black text.
- **Outline:** paper ground, input-stroke border, burgundy text; wash on hover. **Ghost:** burgundy text, wash on hover.
- **Hover / Focus / Press:** 90% fill on hover; 3px ring at 30% of the terracotta ring colour on focus; every button presses to 0.97 scale (not under reduced motion).

### Chips
- **Photo chip:** ivory pill over a photo, espresso text, 0.75rem semibold tabular (bin percentage, dish price). The "3D" badge is ivory at 92% with burgundy bold text and a rotate icon; "no model" and "hidden from guests" are espresso at 65 to 75% with ivory text.
- **Segmented switch:** full-pill muted track; the selected option is card paper with a small shadow.

### Cards / Containers
- **Corner Style:** 16px (ledger slab 24px).
- **Background:** card paper on the paper canvas (dark: #251b19).
- **Shadow Strategy:** the single card shadow.
- **Border:** 1px hairline.
- **Internal Padding:** 16px; dashed hairline above a card's action row.

### Inputs / Fields
- **Style:** paper ground, 1px input stroke, 12px radius, 40px at lg, 34px at md.
- **Focus:** border turns terracotta with a 3px ring at 30%.
- **Error:** destructive border with a faint destructive ring.
- **Bilingual forms:** one content-language switch at the top of the form, not one per field.

### Navigation
- **Rail:** burgundy ground with a faint top-light gradient. Section heads are 0.8125rem semibold with the section's hue on the icon and a collapse chevron; sections are separated by a hairline.
- **Items:** 40px rows, 19px icon plus 0.875rem label in rail text. Hover washes the row in ivory at a low alpha; the active page is an ivory pill with burgundy semibold text and icon, sliding between rows on a spring.
- **Collapsed:** a centred 40px square per item; the active one keeps the ivory pill.

### Meter
One share of a whole: an 8px (4px thin) full-pill bar whose fill anchors to the reading start and whose track is the same colour at 16%. Tones: burgundy plain progress (sand in dark), terracotta usage, warning, destructive danger, success. The fill grows in over 0.8s on the shared curve.

### Ledger Slab (signature)
The home's first band. Readiness first: a muted heading, the rolling 76px percentage, its meter, the "N of M ready" line and the next round threshold ("Generate N more models to reach 70%"), then the primary action (generate the missing models) and a ghost link to the dishes without one. Beside it the eight-cell ledger: generation today and this month (terracotta meters), tables with QR, plan days left with its period meter and price, jobs processing, categories, active dishes, dishes without ingredients. Each cell is label, numeral with "of N", then meter and a one-line note; a linked cell washes on hover.

### Category Bins (signature)
Each top-level category is an open bin: its best dish photo fills it from the bottom to the share of dishes with a 3D model (capped at 78% so the name band stays clear), with a thin ivory rim where the photo meets the empty bin. The name and "N of M" sit at the top; an ivory percent chip at the bottom start. A bin opens that category's dishes, filtered to those without a model when any are missing. Fills rise over 1.2s, staggered 70ms.

### Kitchen Ticket Rail (signature)
The attention list as order tickets clipped to a steel rail, most urgent first: failed jobs, dishes without a model, tables without QR, dishes without ingredients, hidden dishes, a plan ending within 14 days, monthly generation at 80% or more. Each ticket names the work (the failed dishes and their error, the emptiest categories), shows its count large, and ends in a named link ("Open Drinks", "Open the jobs"). A failure is hot: a destructive top edge, icon and count. Tickets swing onto the rail (rotate -5 to 0 over 1.3s, 80ms apart); with nothing to do one ticket is stamped "منجز" in success green.

### Dish Shelf (signature)
A row of real dish photos as slots; the hovered or focused slot widens (flex 3.4) and reveals name, category and price over an espresso scrim, and dishes with a model carry the ivory "3D" badge.

### Category Stalls and Dish Gallery (menu)
A top-level category is a stall card: up to three of its dish photos across a 128px awning (zooming slightly on hover, an ivory arrow appearing at the end), then the name, item count, its 3D coverage meter, its sub-categories as hairline rows on a muted band, and a dashed action row with reorder, add, edit and delete. The dish gallery shows each dish photo first (4:3) with the 3D or "no model" badge, a hidden flag and an ivory price chip, then name, category and a dashed row with the guest-visibility switch and actions; hidden dishes desaturate. Cards settle in (10px rise over 520ms, 40ms apart). The item editor shows a live guest-facing card of the dish beside its form.

### Brand Mark and Loader
The logo is drawn only in `components/common/Brand`. On hover the pupils glance toward the dish (220ms). Loading uses the gaze loader, not a spinner.

## Do's and Don'ts

### Do:
- **Do** use the single motion curve `cubic-bezier(0.16, 1, 0.3, 1)` for entrances, fills, rolling digits and the nav pill; interface feedback always animates, decorative loops stop under reduced motion, and a still frame always shows the final state.
- **Do** draw every share with the one meter, saying what it is a share of.
- **Do** keep terracotta for spending and marks, burgundy for actions and plain progress.
- **Do** let dish photos carry the colour on the home and menu, and show the hatched bin when a photo is missing.
- **Do** name the work on an attention ticket and link straight to where it is fixed.
- **Do** mirror layouts with logical properties (start/end) so Arabic and English share one layout.

### Don't:
- **Don't** re-theme the Shoof logo.
- **Don't** set the home as a band of equal cards, or nest cards inside the ledger slab.
- **Don't** use terracotta as a light-mode button fill or for plain progress.
- **Don't** use red for anything but failure, the hot ticket and a used-up quota.
- **Don't** repeat or rival the readiness figure elsewhere on the home.
- **Don't** put small uppercase labels above headings; the date and restaurant name follow the greeting.
