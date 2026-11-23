# Shoof — Functional Specifications for the Frontend Team

These documents describe **every business functionality** the Shoof backend offers, organised by the
application (UI) that should expose it. They tell you *what each screen must do, which rules apply, and
which errors the user can hit*. For exact request/response field lists, follow the links into
[`../FE-API-INTEGRATION-GUIDE.md`](../FE-API-INTEGRATION-GUIDE.md) (the API reference, verified against source).

> **Updated 2026-11-22.** Start with
> [what changed and what to do](../FE-API-INTEGRATION-GUIDE.md#update-of-2026-11-22-start-here), then check
> [known backend issues](../FE-API-INTEGRATION-GUIDE.md#35-known-backend-issues-as-of-2026-11-22).
> Rules marked **(Release 2)** work only once the backend team confirms that release is live.

| # | Document | Frontend app | Users | Backend |
|---|---|---|---|---|
| 1 | [01-restaurant-admin-portal.md](01-restaurant-admin-portal.md) | Restaurant Admin dashboard (CMS) | Restaurant owners & staff | `Shoof.Api.Restaurant` |
| 2 | [02-customer-menu-portal.md](02-customer-menu-portal.md) | Public menu website (QR landing) | Restaurant guests (anonymous) | `Shoof.Api.Restaurant` → `api/portal` |
| 3 | [03-superadmin-console.md](03-superadmin-console.md) | Platform operator console | Lambdor staff (SuperAdmins) | `Shoof.Api.SuperAdmin` |
| 4 | [04-integration-api.md](04-integration-api.md) | *No UI* — machine-to-machine; read for context & for the SuperAdmin key screens | B2B partners' backends | `Shoof.Api.Integration` |

### Where each app is hosted

`{BaseDomain}` = `shoof.lambdor.com` (e.g. `https://pizzahut.shoof.lambdor.com`).

| App | URL | Calls the API at |
|---|---|---|
| Public menu website | `https://{slug}.{BaseDomain}/` | `/backend/api/portal/...` |
| Restaurant Admin dashboard | `https://{slug}.{BaseDomain}/admin/` (build with base path `/admin/`) | `/backend/api/...` |
| SuperAdmin console | `https://superadmin.{BaseDomain}/` | `/backend/api/...` |

The API is on the same origin under `/backend` — use a relative base URL, not a hard-coded domain. The restaurant
`slug` is the first label of the host name. Build settings, SignalR URL and the required `web.config` files:
[FE guide §1 "Deployed URLs"](../FE-API-INTEGRATION-GUIDE.md#deployed-urls--how-the-frontends-are-hosted).

---

## 1. What the product is

Shoof is a multi-tenant **digital menu SaaS**. A **Tenant** (a customer account) owns one or more
**Restaurants**. Each restaurant manages a menu (categories → sub-categories → items), item photos,
ingredients, tables and QR codes, and the look of its public menu (themes). Menu items can get
**AI-generated photos** and **AI-generated 3D models** (viewable in 3D/AR by guests). Generation is
paid for by a **subscription plan** (daily/monthly quota) plus optional **extra credit packs**.

Guests scan a QR code → open the restaurant's public menu → browse, view photos, 3D/AR models and
ingredients. **There is no ordering, cart or payment** in the system.

Lambdor staff run the platform from the **SuperAdmin console**: onboard tenants, sell subscriptions and
credits, manage API keys for partners, approve AI 3D models for the shared library, broadcast
announcements, and watch reports/logs.

### Glossary

| Term | Meaning |
|---|---|
| Tenant | A customer account. Has a unique `slug` = its menu subdomain (`{slug}.{BaseDomain}`). |
| Restaurant | A branch/brand under a tenant. Has currency, country (→ time zone), logo. |
| Registration | A subscription record (date window + price + plan) for a tenant **or** an API key. |
| Plan | Subscription template that defines daily/monthly AI-generation limits. |
| Support tier | Optional paid support level attached to a registration. |
| Credit pack / purchase | Extra AI generations bought on top of the plan (recorded by SuperAdmin after offline payment). |
| Generation job | One AI request (3D model or photo). Queued → processing → ready/failed/cancelled. |
| Shared 3D library | Cross-restaurant pool of approved 3D models reused instantly and for free for matching dishes. |
| API key | Credential for a B2B partner (e.g. a delivery app) to call the Integration API. |

---

## 2. Cross-cutting rules every app must implement

### 2.1 Authentication & session (Restaurant Admin + SuperAdmin)

- **Login** with email + password → access token (JWT, ~60 min) + refresh token (~30 days).
  Restaurant Admin login also needs the restaurant's **slug** (`tenantSlug`), because the same email
  can be a separate account in another restaurant. See [01 §1](01-restaurant-admin-portal.md#1-login--session).
- **Silent refresh**: on `401`, call refresh once; refresh tokens **rotate** (always store the new pair). If refresh fails → log out.
- **Logout** = revoke the refresh token.
- **First login / temporary password**:
  - If login returns `mustChangePassword: true`, show only a "choose a new password" screen
    (`POST api/account/change-password`). It returns new tokens; replace both.
  - Until then every other call returns `403` `"Password change required."`.
  - This covers every account someone else created, and every password a SuperAdmin reset.
- **Forgot password?**:
  - The login page links to a form that posts the email (plus the slug on the restaurant dashboard)
    to `POST api/account/forgot-password`. It always gets `204`, so always say "If the account
    exists, we've sent you a link."
  - The email links to a **reset-password page** (`/admin/reset-password` on the dashboard,
    `/reset-password` on the SuperAdmin console). That page posts the query-string values plus the
    new password to `POST api/account/reset-password`.
  - The link expires after 2 hours, and an invalid or expired link returns `400`.
- **My profile**: `GET` / `PUT api/account/me`. Name (and phone for restaurant admins) is editable,
  and email is read-only. The one exception is the primary SuperAdmin, see [03 §16](03-superadmin-console.md#16-settings).
- Login, forgot and reset are rate-limited (10/min per IP) → show "too many attempts, try again shortly" on `429`.
- A user or tenant can be **deactivated mid-session**: any call may return `403` with text
  `"Tenant is inactive."` / `"User is inactive."` → show a blocking "account disabled" screen and log out.
  An expired subscription causes `"Tenant is inactive."` too, so word the screen "contact Shoof", not "you were banned".
- A token from one app is rejected by the other (`403`, empty body).
- Restaurant Admin calls also need headers `X-Api-Key` (app key) and `X-Tenant-Id` (= `tenant_id` claim of the JWT).
  **Each environment has its own app key**: the dev value `CHANGE_ME_DEV_ONLY_RESTAURANT_API_KEY` works only against a
  backend run locally; the deployed `*.shoof.lambdor.com` hosts need the production `Restaurant` key from the backend team.
  With the wrong key, login and `GET api/account/me` still succeed but every other call returns `403` with an empty body.
  The Portal (customer menu) has a separate key: never reuse one for the other.

Details: guide §2.1.

### 2.2 Permissions → what to show

Both admin apps are permission-driven. Every action needs a permission string `"{Group}.{Action}"`
(e.g. `MenuItems.Add`). The UI should **hide or disable** buttons/menu entries the user lacks, and still
handle `403` gracefully (empty body → "You don't have permission to do this").

- Restaurant Admin: permissions come from the user's **roles** (tenant-defined). The login
  and refresh responses contain the role **names** only (`roles[]`, filled from Release 1). The user is an Owner
  when the list contains `Owner`.
- SuperAdmin: permissions are assigned **directly per user**. The login response has no permissions.

> ⚠️ **Open item (backend):** there is no "my permissions" endpoint. Today the role/permission lookups
> (`GET api/roles/{id}`, `GET api/super-admin-users/{id}/permissions`) themselves require `Roles.View` /
> `SuperAdminUsers.View`, so a limited user can't read their own permissions. Until a
> `GET api/auth/me`-style endpoint exists, show navigation optimistically and rely on `403` handling.
> Agree the approach with the backend team before building permission-gated navigation.
> The same applies wherever a spec says to disable what the user lacks: if you can't read it, show the server's `400`.

Each spec lists the permission needed per action.

### 2.3 Errors — two kinds of `400`

| Response | How to recognise | What to show |
|---|---|---|
| Business rule error | `400`, `Content-Type: text/plain` | The body text as-is (already localized) in a toast/inline error |
| Field validation error | `400`, JSON body with `errors` (`application/json` **or** `application/problem+json`) | Map `errors.{Field}[]` to form fields |
| Not found | `404` (text, JSON or empty body) | "This item no longer exists" + refresh the list |
| Forbidden | `403` | Permission message, or the inactive-account flow (2.1) |
| Server error | `500`, body `"An unexpected error occurred."` | Generic error + retry. On a by-id call it can mean "not found" ([list](../FE-API-INTEGRATION-GUIDE.md#35-known-backend-issues-as-of-2026-11-22)): refresh the list |
| Rate limited | `429` | "Too many requests, please wait" |

### 2.4 Lists, paging, search

- Every list is paged: query `page` (1-based), `pageSize` (default 10), optional `searchTerm`,
  `createdFrom`/`createdTo` (dates). Response `{ data, page, pageSize, totalCount, totalPages }`.
- Sorting is **fixed by the server** — no sort parameter. Don't build clickable sort headers.
- Filters are per screen (listed in each spec).

### 2.5 Language (English / Arabic, RTL)

- Send `X-Language: en|ar` on every call. The server returns localized `name`/`description` and localized error text.
- Bilingual content is **edited** as pairs: `NameEn` (required) + `NameAr` (optional), same for descriptions.
  Forms need both inputs; lists show the single resolved `name`.
- The Arabic UI must be **RTL**.

### 2.6 Dates & time zones

- Dates in responses are already converted to the **restaurant's local time** (or `Asia/Damascus` when no
  single restaurant applies). Display as-is; `RestaurantDto.timeZoneId` tells you the zone if you want to label it.
- Date filters (`fromDate`/`toDate`) are interpreted as local dates.
- **Exception**: dates you *send* in create/update bodies (e.g. registration from/to) are **UTC**. Convert before sending.
- Fields ending in `Utc` are UTC — convert for display.

### 2.7 File uploads

- `multipart/form-data`, max **5 MB**, images `.jpg/.jpeg/.png/.webp`; 3D `.glb` (and optional `.usdz`).
- Server checks the real file content, not just the extension. Validate size/extension client-side too.
- Responses contain absolute URLs — display them directly.

### 2.8 Notifications (Restaurant Admin + SuperAdmin)

Both admin apps have a **bell / inbox**:
- List (filter read/unread, type), unread count badge, mark one read, mark all read.
- **Realtime** via SignalR hub `/hubs/notifications`, event `notificationReceived` → toast + update badge.
  Pass the JWT as `?access_token=`. Dedupe by `notification.id`; after reconnect reload the unread count.
- CORS on the API is configured per environment (`Cors:AllowedOrigins`, dev = `*`). With a wildcard origin,
  create the SignalR connection with `{ accessTokenFactory, withCredentials: false }`, otherwise the browser
  blocks the negotiate request. Give backend your production origins.
- Each notification can carry `restaurantId`, `menuItemId`, `jobId`, `batchId`, `model3DAssetId` → use them to **deep-link**.
- **Render title/body as plain text, never HTML.**

Notification types (numbers): `0` Generation ready · `1` Generation failed · `2` Generation cancelled ·
`3` Bulk batch completed · `4` Announcement · `5` 3D model awaiting approval (SuperAdmin only) ·
`6` 3D model approved for sharing · `7` 3D model not approved · `8` Extra credits added · `9` Subscription expiring. Render unknown types generically.

### 2.9 Enums are numbers

All APIs send/receive enums as **numbers** (`0, 1, 2…`). Keep a label map per enum in the frontend
(full list in guide §3.4). Treat unknown values defensively.

---

## 3. Feature → app matrix

| Feature | Restaurant Admin | Public menu | SuperAdmin | Integration API |
|---|---|---|---|---|
| Login / tokens | ✔ | — | ✔ | key only |
| Tenants (create, activate, slug) | — | — | ✔ | — |
| Restaurants | view + edit branding | view | view + onboard (new tenant + owner) | create + edit |
| Menu categories / items | full CRUD | view | — | full CRUD |
| Item photos (upload) | ✔ | view | — | — |
| AI photos & variants | ✔ | view | — | — |
| AI 3D models (trigger, bulk, cancel) | ✔ | view (3D/AR) | force-regenerate | ✔ |
| Manual 3D upload | ✔ | — | — | ✔ |
| Ingredients | ✔ | view | — | — |
| Tables & QR codes | ✔ | (QR target) | — | — |
| Themes | ✔ | applied | — | — |
| Social links | ✔ | view | — | — |
| Admin users & roles | ✔ (tenant) | — | SuperAdmin users | — |
| Currencies / countries | read | read | full CRUD | — |
| Subscriptions, plans, support tiers | dashboard only | — | ✔ | self-view |
| Credit packs & purchases | quota view | — | ✔ | self-view |
| 3D library approval | gets result | — | ✔ | — |
| Notifications inbox | ✔ + realtime | — | ✔ + realtime + broadcast | ✔ (pull + webhook) |
| Dashboard & reports | dashboard + Excel | — | dashboard, 5 reports, Excel | — |
| API keys, IP allowlist, rotation | — | — | ✔ | self-view, webhooks |
| Audit log, request logs | — | — | ✔ | own request log |
| Generation settings (provider limits) | — | — | ✔ | — |

**Out of scope (not in the backend):** ordering/cart, payments/invoicing, self sign-up, mobile-native code.
Don't design screens for these without a backend change.
