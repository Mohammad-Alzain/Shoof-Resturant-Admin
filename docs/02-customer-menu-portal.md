# 02 — Customer Menu Portal (public menu website)

**Users:** restaurant guests, anonymous, mostly on phones after scanning a QR code.
**Backend:** `Shoof.Api.Restaurant`, endpoints under `api/portal`.
**Purpose:** show the restaurant's live menu with photos, ingredients and 3D/AR models, styled by the
restaurant's active theme. **Read-only** — no ordering, cart, accounts or payments.

API details: [guide §4 "PortalController"](../FE-API-INTEGRATION-GUIDE.md#portalcontroller--apiportal--anonymous-customer-facing-menu-site).

---

## 1. How a guest arrives

1. The guest scans a QR code printed by the restaurant (general or per-table).
2. The QR opens the tenant's subdomain: `https://{tenantSlug}.shoof.lambdor.com/menu/{restaurantId}[/table/{tableId}]`
   (the QR image and `targetUrl` both hold this full absolute URL).
3. The site is served on that subdomain. The **backend works out the tenant from the `Host` header** — the
   frontend does not send a tenant id.

Every call: header `X-Api-Key: <Portal client key>` (not the admin key), optional `X-Language: en|ar`.
No JWT. Rate limit 60 requests/min per IP → cache responses and avoid polling.

---

## 2. Data the site loads

| Function | Endpoint | Use |
|---|---|---|
| Restaurant header | `GET api/portal/restaurant` | name, logo, currency code & symbol |
| Full menu tree | `GET api/portal/menu` | categories → sub-categories → items (single call) |
| Theme | `GET api/portal/theme` | colours, fonts, images, transitions (`404` = none → use default styling) |
| Social links | `GET api/portal/social-links` | footer icons |
| Currencies | `GET api/portal/currencies` | decimal places / symbols for price formatting |

Load restaurant + menu + theme + social links in parallel on first paint.

**The menu response contains only what guests should see:** active categories, active items and active, ready 3D
models. Don't filter again.

---

## 3. Screens & behaviour

### 3.1 Menu home
- Header: logo (or the theme's header logo at its position: left / center / right), restaurant name.
- Category navigation (tabs, chips or a side list), ordered by `displayOrder`; sub-categories nested under their parent.
- Item cards: **primary photo** (the image with the lowest `displayOrder`), name, short description, price.
- Footer: social links (Facebook, Instagram, Twitter, TikTok, WhatsApp, YouTube, Snapchat icons).
- Optional client-side search over item names.

### 3.2 Item detail (sheet or page)
- Photo gallery (all images, ordered by `displayOrder`; show the caption if present).
- Name, full description, price.
- **Ingredients** list: name, description, note (e.g. "spicy"); mark **removable** ones
  ("can be removed on request").
- **3D / AR** (only if the item has a model):
  `<model-viewer src="{glbUrl}" ios-src="{usdzUrl}" poster="{thumbnailUrl}" camera-controls auto-rotate ar>`.
  Show a "View in 3D" button; "View on your table (AR)" when the device supports it (USDZ = iOS Quick Look).
  Lazy-load the viewer, since GLB files can be several MB.

### 3.3 Price formatting
Use the item's `currencyIsoCode` → look up `symbol` and `decimalPlaces` from currencies; fall back to the
restaurant's currency symbol.

### 3.4 Theming
Apply the theme as CSS variables:

| Theme field | Applies to |
|---|---|
| menuBackgroundColor / menuBackgroundImageUrl | page background |
| headerBackgroundColor, headerTextColor, headerLogoUrl, headerLogoPosition | header |
| footerBackgroundColor, footerTextColor | footer |
| categoryBackgroundColor / TextColor | category tabs / headers |
| subCategoryBackgroundColor / TextColor | sub-category headers |
| itemBackgroundColor / TextColor | item cards |
| headerFooterFontFamily, categoryFontFamily, subCategoryFontFamily, itemFontFamily | fonts (load matching web fonts) |
| pageTransitionEffect | 0 None · 1 Slide horizontal · 2 Slide vertical · 3 Fade · 4 Page curl (between categories/pages) |

### 3.5 Language
Offer an EN/AR toggle → resend calls with `X-Language` and switch to **RTL** for Arabic. Arabic text falls back
to English when the restaurant didn't enter it.

### 3.6 Empty & error states

| Case | Response | UI |
|---|---|---|
| Unknown subdomain / tenant deactivated / tenant has no restaurant | `404` | "This menu isn't available" page |
| No active theme | `404` on theme | default Shoof styling |
| Category with no items | — | hide it, or show "Coming soon" |
| Too many requests | `429` | short retry message |

---

## 4. Open items (need a backend decision before building)

> ⚠️ **Multi-restaurant tenants:** the portal always serves the tenant's **first-created** restaurant. The
> `restaurantId` in the QR path (`/menu/{restaurantId}`) is **not** sent to or used by the API. A tenant with
> several branches therefore shows the same menu for every QR. Confirm with backend whether a
> `restaurantId` parameter will be added.

> ⚠️ **Light / dark theme:** restaurants can have one active Light **and** one active Dark theme, but
> `GET api/portal/theme` returns a single active theme (whichever it finds first) and has no mode parameter.
> Until that's resolved, don't build a dark-mode switch that relies on the restaurant's dark theme.

> ℹ️ **Table QR codes:** the table id in the URL is informational only (no ordering). You may show
> "Table {label}", but there is no portal endpoint that returns a table's label.
