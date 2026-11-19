# Shoof SuperAdmin: design system

Source of truth: `public/identity/` (Brand Book Study 01, `shoof-tokens.json`). Tokens live in `src/index.css`.

## Colour (60 / 15 / 15 / 8 / 2)
| Role | Light | Dark |
|---|---|---|
| Surface (ivory / espresso) | `#FBF5E9`, cards `#FFFCF5` | `#261C1A`, cards `#2F2421` |
| Page canvas | `#F1E8D8` | `#1B1311` |
| Supporting (sand) | `#E9DDCF` borders, `#F1E4D6` accents | `#43342F` borders, `#4A2A30` accents |
| Action (deep burgundy) | `#541F2D` | inverted to ivory `#FBF5E9` (burgundy on espresso is 1.27:1) |
| Accent (roasted terracotta, 2%) | `#B95035` | `#DD6A4C` |

Terracotta is for indicators and small marks (active-item marker, unread dots, badges), never body text.
`--chart-1..5` carry data colours; status colours (`success`, `warning`, `info`, `destructive`) are muted to sit on warm paper.
The hero card is always deep burgundy with ivory text.

## Type
IBM Plex Sans + IBM Plex Sans Arabic (`font-sans`, `font-display`). Weights 400/500/600. No letter-spacing on Arabic.

## Mark
Two plates with pupils ("the tasting gaze"): `BrandMark` (tile) and `Wordmark` (drawn paths, `currentColor`). Pupils drift toward the dish on hover (220ms).

## Motion
One curve for everything: exponential ease-out `[0.16,1,0.3,1]`, 450-820ms (the identity reveal range). Primitives in `components/common/Motion` (`Stagger/Item`, `Reveal`, `CountUp`); `MotionConfig reducedMotion="user"` wraps the app. Used for: page entrance, sidebar items, hero (counts, drifting dish, slow rings), KPI counts, chart line drawing itself, donut, usage bars, feed rows, table rows (CSS), loading (`GazeLoader`: pupils look around). Press feedback on every button.

## Brand module
The logo is drawn once in `components/common/Brand` (`BrandMark`, `Wordmark`, `BrandLockup`, `GazeLoader`); `public/images/logo.svg` and `public/favicon.svg` are the static tile. No other logo artwork exists.

## Shell
- Sidebar `variant="inset"`: floating cards on `bg-page`. Expanded rows are icon + label on a sand pill with a terracotta marker; collapsed rail is a centred 40px square per item, active filled with the action colour. One shared pill (`layoutId`) slides between items.
- Header: trigger, breadcrumbs, command palette (Ctrl/Cmd+K), notification menu (infinite scroll), language, theme, user.
- Tables: row actions are always view, edit, delete, then the page's extra actions last (`RowAction` icon buttons). A custom view replaces the default via `onView`.

## Dashboard
Hero (date, greeting, three numbers, quick actions, dish image) → KPI tiles (tinted icon, sparkline or segmented bar) → growth chart with 7/30/90 range + pending 3D approvals + status donut → generation usage, subscriptions, alerts → activity feed.

## Sign-in
Always dark (`.auth-dark`, espresso scene); the 3D dish is lit by a warm key and a terracotta backlight; the action button is ivory.
