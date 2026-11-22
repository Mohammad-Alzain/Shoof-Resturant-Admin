# Shoof — Frontend API Integration Guide

This document is a complete, verified-against-source reference for all three Shoof backend
APIs. It is written so it can be pasted directly to an AI coding agent (e.g. Claude) alongside
a frontend codebase, with the instruction: *"build the screens and wire them to these APIs."*
Routes, DTO fields, enums and permissions were checked against the C# source on 2026-11-22. Where the API
doesn't yet behave as you would expect, §3.5 "Known backend issues" says so.

## Changes in this release (breaking / behavioural)

### Update of 2026-11-22: start here

The backend changes of this date ship in three releases. **Ask the backend team which one is live** on the environment
you test against. Each dated change below is tagged with its release.

| Release | What it contains | Until it is live |
|---|---|---|
| Release 1 | Login roles, cross-tenant id checks | `roles` is `[]` |
| Release 1.1 | A renewed subscription keeps the customer on when the old one ends | Renew with Upgrade (§3.5) |
| Release 2 | Primary admin, permission limits, reusing deleted values, country/currency rules, duplicate checks, `isActive` filter fix | `isPrimary` is absent from `AdminUserDto` and `false` in a restaurant admin's profile; the new `400`s don't happen |

**To do: all apps**
- **Detect validation errors by content, not only by `Content-Type`.** Many arrive as `application/json`, not
  `application/problem+json`: accept both and read `errors` (§3.2). This corrects the earlier guide.
- **A `404` can have a JSON body, a text body or none.** Branch on the status (§3.2). This corrects the earlier guide.
- **An unknown id returns `500` instead of `404` on some endpoints.** They are listed in §3.5.

**To do: restaurant dashboard**
- Read `roles` from login and refresh. The caller is an Owner when it contains `"Owner"` (Release 1).
- Users screen: "Primary" badge and locked controls for `isPrimary`, plus the Owner-only rules (Release 2).
- Roles screen: confirm before deleting, and show the `400` when granting a permission the caller lacks (Release 2).
- Show the new `400` messages as they are, and reload the picker for a deleted country or currency (Release 2).
- Handle notification type `9` SubscriptionExpiring (§3.4). It already exists and was missing from this guide.
- Use `MenuItemDto.activeModel` for the 3D badge and preview. It already exists and was missing from this guide (§4).
- Show the "account disabled" screen when the subscription expired without a renewal: the whole tenant becomes
  inactive (§3.5).

**To do: SuperAdmin console**
- Permission editor and password reset: show the new `400`s (Release 2).
- Countries and currencies: show the in-use and duplicate `400`s (Release 2).
- **Renew subscriptions with Upgrade, not by creating a second one, until Release 1.1 is live** (§3.5).
- Two screens wait for a backend change: marking the primary SuperAdmin in the user list, and picking a restaurant
  admin to reset (§3.5).

**To do: customer menu**
- Nothing new to build. The menu returns `404` while the tenant is inactive, including after its subscription expired.

**Postman:** the collection now has corrected request bodies (`nameEn`/`nameAr`, restaurant onboarding) and
`GET api/restaurants/permissions`. Re-import it.

Read this first if you already have a frontend or an Integration client built against the previous release. Details are in the sections referenced.

**Hosting & URLs (all frontends)**: details in §1 "Deployed URLs".
- Each restaurant is `https://{slug}.{BaseDomain}`: customer menu at `/`, admin dashboard at **`/admin/`**, Restaurant API at
  **`/backend/`**. SuperAdmin: console at `https://superadmin.{BaseDomain}/`, API at `/backend/`.
- `BaseDomain` is `shoof.lambdor.com` (e.g. `https://pizzahut.shoof.lambdor.com`, `https://superadmin.shoof.lambdor.com`).
- **API base URL is `/backend`** (same origin, relative); SignalR hub at `/backend/hubs/notifications`.
- **Build the dashboard with base path `/admin/`**; every SPA ships a `web.config` SPA fallback (templates in §1).

**Login roles and cross-tenant checks (2026-11-22, Release 1)**
- Restaurant `login` and `refresh` now return the admin's `roles` (they were always `[]`).
- An id in a request body (`restaurantId`, `menuItemId`, `menuCategoryId`, `parentCategoryId`, `ingredientId`,
  `tableId`) must be the caller's own: another tenant's id and an unknown id both return `404`, on the Restaurant and
  Integration APIs. The exception is bulk generation: `200`, with the item in `skipped[]` as `NotFound`.

**Stored files**: details in §3.3 "Loading stored files".
- File URLs are public `GET`s (no headers); 3D models now come with proper content types (`model/gltf-binary`,
  `model/vnd.usdz+zip`), and a file uploaded through one API is served by the others too.
- Postman has a new **Files** folder to fetch the last uploaded file through the Restaurant and Integration APIs.

**Accounts & passwords (Restaurant + SuperAdmin)**: details in §2.1a.
- **Login:**
  - Restaurant admin login now requires `tenantSlug` (§2.1).
  - Both logins return `mustChangePassword`.
- **Forced password change:** accounts created by someone else must change their password first.
  Until then, every other call returns `403 "Password change required."`.
- **New `api/account` endpoints:** change-password, `GET/PUT me`, forgot-password and
  reset-password (an emailed link).
- **SuperAdmin password resets:**
  - Restaurant admins: `api/password-resets/...`, under the new `PasswordResets` permission.
  - Other SuperAdmins: `api/super-admin-users/{id}/reset-password`, under `SuperAdminUsers.Edit`.
- **The primary SuperAdmin** can't be deleted, edited, deactivated, have its permissions changed or
  be reset by others (`400`).

**Primary restaurant admin (2026-11-22, Release 2)**
- **`isPrimary: bool`** on `AdminUserDto`, and `MyProfileDto.isPrimary` is now `true` for that admin too. It marks the
  admin seeded with the restaurant, who can't be deleted, deactivated or removed from the Owner role (`400`): hide
  those controls.
- For restaurants that existed before Release 2, the primary is the earliest-created active Owner. A restaurant
  without an active Owner has none until a SuperAdmin runs `bootstrap-admin`.
- **Only an Owner can give someone the Owner role** (`400` otherwise): hide it in the role picker for non-Owners,
  unless the edited user already has it (then keep sending it).
- **Non-Owners can only grant permissions they hold** (`400` otherwise): when creating a role, adding permissions
  to one, giving someone a role, or reactivating someone.
- **Only an Owner can delete, deactivate or demote another Owner** (`400` otherwise).
- **Unknown role names** on admin-user create/update now return `400` and change nothing.
- **Deleting a role revokes it** from everyone who had it (within 30 seconds, the permission cache).
§4 "AdminUsersController" / "RolesController".

**Deleted values can be used again (2026-11-22, Release 2)**
- After a delete you can create again with the same admin email (per restaurant), SuperAdmin email, social-link
  platform, menu-item ingredient, country code or currency code. These used to fail (`500`, or `400` "already
  exists" for social links). It is always a new row with a new `id`: a rehired admin starts with only the roles
  given now, a recreated SuperAdmin with no permissions. Don't reuse cached ids.
- The primary SuperAdmin can change their email to a deleted SuperAdmin's email.
- A tenant slug is the exception: it is never reusable, because printed QR codes point at it.

**Countries, currencies, duplicates, admin filter (2026-11-22, Release 2)**
- `DELETE` of a country used by a restaurant, or of a currency used by a restaurant, menu item, subscription or
  credit pack, returns `400`. Show the message.
- Creating or changing a restaurant, menu item or subscription with a deleted or unknown `countryId`/`currencyId`
  returns `400` "The selected country/currency doesn't exist or was deleted." Reload the picker.
- A duplicate country code, currency code (both ignore case) or menu-item ingredient returns `400` instead of `500`.
- `GET api/admin-users?isActive=` now filters on the active switch (`false` used to always return an empty list, and
  `true` included inactive users).

**SuperAdmin permission limits (2026-11-22, Release 2)**
- Except for the primary, a SuperAdmin can only grant permissions they hold, and can only reactivate, or set the
  password of, a SuperAdmin whose permissions they all hold (`400` otherwise). §5 "SuperAdminUsersController".

**Restaurant onboarding, Owner role, contact details (2026-11-21)**
- **SuperAdmin `POST api/restaurants` body changed** to `OnboardRestaurantDto`: restaurant fields plus a nested
  `tenant { name, slug }` and `admin { fullName, email, password }`. One call creates the tenant, the restaurant,
  the locked **Owner** role and its first admin (who must change the password at first login). Nothing is created
  if any check fails (`400`: slug invalid/reserved/taken, weak password, invalid contact email/phone). §5 "RestaurantsController".
- **New SuperAdmin `GET api/restaurants/permissions`**: what the Owner role gets (every restaurant permission).
- **Permission catalogues are now scoped to their API:** Restaurant `GET api/roles/permissions` returns only
  restaurant-side groups; SuperAdmin `GET api/super-admin-users/permissions` returns only SuperAdmin-side groups.
  Permissions outside the API's scope are silently dropped when assigned. §2.3.
- **`isOwner: bool`** on `AdminRoleDto` and `AdminRoleListDto`. The Owner role can't be renamed, re-described,
  deleted or lose permissions; it can only gain them (`400` otherwise). The tenant's **last active Owner member**
  can't be deactivated, deleted or removed from the role (`400`). §4 "RolesController" / "AdminUsersController".
- **`contactEmail?` / `contactPhone?`** on `RestaurantDto`, `OnboardRestaurantDto`, `CreateRestaurantDto` and
  `UpdateRestaurantDto` (all three APIs). Subscription-expiry reminder emails (30, 7 and 1 days before the end date)
  go to `contactEmail`, or to the Owner admins when it's empty. Note: `PUT` replaces them, so send the current values back.

**Generation jobs (Restaurant + Integration)**
- **Triggers now queue.** `POST` trigger / regenerate / bulk return the job with `status = 0 Pending` (queued), not `1 Processing`. A worker
  submits queued jobs to the provider fairly across tenants; poll (or listen for webhooks) until `Ready`/`Failed`/`Cancelled`.
- **New status `Cancelled = 4`** (`ModelGenerationStatus`): a queued job withdrawn by the user (`POST .../cancel`); it never reached the provider.
  Treat unknown status values defensively.
- **Bulk is capped at 500 items** per request (`400` above that). Items that are not queued come back in `skipped[]` with `reason` one of:
  `NotFound`, `AlreadyProcessing`, `NoMeaningfulChange`, `QuotaExceeded`, `MonthlyQuotaExceeded`.
- **New failure messages** in `errorMessage` (show them as-is): `"Tenant inactive"` (the tenant was suspended while the job was queued),
  `"Submission interrupted"` (the provider submit could not be confirmed), `"Source image no longer exists"` (an image-variant job whose source
  photo was deleted), plus `"Menu item no longer exists"` / `"Source image could not be read"`.
- **Integration `GET api/model-generation-jobs` defaults to `kind = 0` (Model3D)** when `kind` is omitted; pass `kind=1` for AI images.

**Extra generation credits + per-API-key quota pools (new)**
- **Credit packs / purchases (SuperAdmin):** a SuperAdmin defines credit packs (`api/credit-packs`) and, after an offline payment, records a
  purchase (`api/credit-purchases`) for a restaurant **or** for an API key. Purchased credits are used only **after** the monthly plan
  allowance is gone (1 credit = 1 generation; library links are free; a cancelled queued job gives its credit back) and expire with the
  owner's registration that was active when the purchase was recorded. §5 "CreditPacksController" / "CreditPurchasesController".
- **API keys with their own subscription get their own pool.** A key whose rotation lineage has its own active registration has separate
  daily/monthly counters (from its own plan) and its own credits; restaurant staff usage and that key's usage no longer affect each other.
  A key without its own registration shares the restaurant pool exactly as before.
- **Usage fields:** `ModelGenerationQuotaDto` (Restaurant `GET .../quota`, Integration `GET api/api-key` → `quota`) adds `isApiKeyPool`,
  `extraCreditsRemaining`, `extraCreditsNearestExpiryUtc`; the dashboard's `GenerationUsage` adds `extraCreditsRemaining` /
  `extraCreditsNearestExpiryUtc` and its `MonthlyUsed` now counts **plan allowance only** (credit-paid generations are excluded); the
  generation-usage report adds the same two fields plus `apiKeyPools[]`. The restaurant's numbers no longer include generations made by
  keys that have their own plan.
- **Error text:** the monthly-quota `400` now reads "Monthly generation quota of {n} reached and no extra generation credits are left.
  Contact us to buy an extra credit pack." (Arabic equivalent with `X-Language: ar`). The daily limit still applies even when credits remain.
- **New notification type `CreditsPurchased = 8`** — to the restaurant's admins (restaurant purchase) or to the API key (key purchase; also
  `notification.created` webhook when enabled).

**Notifications** — new `NotificationType` values: `GenerationReady = 0`, `GenerationFailed = 1`, `GenerationCancelled = 2`,
`BatchCompleted = 3`, `Announcement = 4`, `Model3DAssetPendingApproval = 5` (SuperAdmin only), `Model3DAssetApproved = 6`,
`Model3DAssetRejected = 7`, `SubscriptionExpiring = 9` (render unknown values generically). `NotificationDto` has a new `Model3DAssetId?`.

**Shared 3D library now requires SuperAdmin approval** — a newly generated 3D model is linked to the generating restaurant's own item
immediately (unchanged), but is reused for **other** restaurants' dishes only after a SuperAdmin approves it (§5,
"Model3DAssetsController"). Existing library models start unapproved. The restaurant's admins get a `6`/`7` notification on the decision;
a rejection never removes the model from their item. SuperAdmin has a new inbox (`api/notifications` list/unread-count/read/read-all)
and a SignalR hub at `/hubs/notifications` on the SuperAdmin host.

**Integration API errors**
- `401` (empty body) for a missing, **malformed**, unknown, inactive, expired or deleted key — including keys in the wrong format.
- `403` with **`X-Error-Code: SubscriptionExpired`** (no active registration) or **`X-Error-Code: IpNotAllowed`** (client IP outside the key's
  allowlist). Branch on the header, not the localized body.
- `503` + `Retry-After` while key validation is momentarily saturated — retry with backoff.
- **`404` (not `500`)** for writes (update/delete/trigger/cancel) on ids that are unknown or belong to another tenant.
  Two `GET`-by-id endpoints still return `500` for them, and so does a malformed body (§3.5).

**Webhooks (new)** — signed `POST`s with the envelope `{ id, type, createdAt, data }`; `type` is one of `generation.queued|processing|ready|failed|cancelled`,
`batch.completed`, `notification.created`, `ping`. Enum values inside webhook payloads are **names** (e.g. `"status": "Ready"`), unlike the REST API.
Payload shapes, signing and retry rules: §6, "Webhooks".

## 1. System overview

Shoof is a multi-tenant e-menu SaaS backend. Restaurants, cafes, and bars manage digital menus
whose items can carry AI-generated or manually-uploaded 3D models. Customers reach a tenant's
menu via a QR code, browse categories/items, view items in an inline 3D viewer or AR, and see
ingredients.

**Tech stack**: .NET 10 (ASP.NET Core Web API), EF Core (PostgreSQL), ASP.NET Core Identity +
JWT for two of the three APIs.

### Three separate backend APIs, three separate audiences

| API | Audience | Auth | Tenant scoping |
|---|---|---|---|
| **Shoof.Api.Restaurant** | A restaurant's own admin dashboard | JWT (AdminUser) + `X-Api-Key` + `X-Tenant-Id` | Scoped to the caller's own tenant |
| **Shoof.Api.SuperAdmin** | Platform operator (you), not tenants | JWT (SuperAdminUser) | Cross-tenant by design |
| **Shoof.Api.Integration** | A B2B partner's own backend (e.g. a delivery app) | `X-Integration-Key` header only, no JWT | Scoped to the partner's own tenant, enforced purely by key possession |

A fourth surface, `PortalController` inside `Shoof.Api.Restaurant`, is the **anonymous
customer-facing menu website** — API-key protected but not JWT-protected, tenant resolved from
the request's `Host` header (subdomain), not from a token.

These are physically separate ASP.NET Core projects/processes with separate base URLs — a
frontend for restaurant admins talks only to `Shoof.Api.Restaurant`; the super admin console
talks only to `Shoof.Api.SuperAdmin`; a delivery-partner backend talks only to
`Shoof.Api.Integration`. **A JWT from one is rejected by the other two**, even if otherwise
valid (see §2).

### Base URLs (Development)

| API | HTTP | HTTPS | Swagger |
|---|---|---|---|
| Shoof.Api.Restaurant | `http://localhost:5272` | `https://localhost:7221` | `/swagger` |
| Shoof.Api.SuperAdmin | `http://localhost:5155` | `https://localhost:7060` | `/swagger` |
| Shoof.Api.Integration | `http://localhost:5333` | `https://localhost:7333` | `/swagger` |

There is no API version segment/prefix anywhere — every route is a literal `api/...` path (no
`[controller]` token routing, no `/v1/`).

### Deployed URLs — how the frontends are hosted

`{BaseDomain}` is `shoof.lambdor.com`. Every restaurant is a
subdomain; the frontends and the API share the same origin (IIS serves each under its own path):

| URL | What | Folder on the server |
|---|---|---|
| `https://{slug}.{BaseDomain}/` | **Customer menu** SPA | `Restaurant\Portal` |
| `https://{slug}.{BaseDomain}/admin/` | **Restaurant admin dashboard** SPA | `Restaurant\Dashboard` |
| `https://{slug}.{BaseDomain}/backend/` | Restaurant API (`/backend/api/...`, Swagger at `/backend/swagger`) | `Restaurant\API` |
| `https://superadmin.{BaseDomain}/` | **SuperAdmin console** SPA | `SuperAdmin\Portal` |
| `https://superadmin.{BaseDomain}/backend/` | SuperAdmin API (Swagger at `/backend/swagger`) | `SuperAdmin\API` |
| `https://integration.{BaseDomain}/` | Integration API (no frontend; Swagger at `/swagger`) | `Integration\API` |

What each frontend must do:

1. **API base URL = same origin + `/backend`.** Don't hard-code a domain. Use a build-time setting per environment:
   - deployed: `API_BASE_URL=/backend` (relative, so the same build works on every restaurant subdomain, and keeps working if the domain ever changes);
   - local dev: `API_BASE_URL=https://localhost:7221` (Restaurant) / `https://localhost:7060` (SuperAdmin).

   Every call is then `${API_BASE_URL}/api/...`, e.g. `/backend/api/portal/menu`. Because frontend and API share the origin
   when deployed, **no CORS** is involved there (CORS only matters in local dev — `Cors:AllowedOrigins`).
2. **Base path of each SPA build:**
   - Restaurant dashboard is served under **`/admin/`**: build it with that base path (Vite `base: '/admin/'`, Angular
     `ng build --base-href /admin/`, CRA `"homepage": "/admin"`) and set the router's basename to `/admin`
     (React Router `basename="/admin"`). All its routes live under `/admin/...` — e.g. the password-reset page must be at
     `/admin/reset-password` (that is the link the backend emails).
   - Customer menu and SuperAdmin console are served at the root **`/`** (default base path).
3. **Tenant slug = the first label of the host name** (skip a leading `www`):
   ```js
   const labels = location.hostname.split('.');
   const slug = labels[0] === 'www' ? labels[1] : labels[0];   // "pizzahut" for pizzahut.shoof.lambdor.com
   ```
   The dashboard sends it as `tenantSlug` on login / forgot-password. The customer menu does **not** send it — the API reads
   it from the `Host` header itself.
4. **SignalR hub:** `${API_BASE_URL}/hubs/notifications` → `/backend/hubs/notifications` when deployed.
5. **File URLs** (images, 3D models, QR codes) come back from the API as absolute URLs that already include `/backend`
   — use them as-is, never rebuild them. They are public (no headers needed) — see §3.3 "Loading stored files".
6. **Ship a `web.config` in each build output** (SPA fallback so deep links / page refreshes don't 404). IIS child
   applications inherit the parent's rewrite rules, so the root SPAs must not swallow `/admin` and `/backend`:

   Customer menu (`Restaurant\Portal\web.config`) and SuperAdmin console (`SuperAdmin\Portal\web.config`):
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="SPA fallback" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
               <add input="{REQUEST_URI}" pattern="^/(admin|backend)(/|$)" negate="true" />
             </conditions>
             <action type="Rewrite" url="/index.html" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```
   Restaurant dashboard (`Restaurant\Dashboard\web.config`) — clears the inherited rule and falls back to its own index:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <clear />
           <rule name="SPA fallback" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/admin/index.html" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```
7. **Deploying a new build** = replace the folder's contents (keep the `web.config`). No server restart needed for the SPAs.

Swagger is available in every environment (local: `/swagger`; deployed: `/backend/swagger`, Integration `/swagger`).

---

## 2. Authentication

### 2.1 Restaurant & SuperAdmin — JWT

**Login** (`[AllowAnonymous]`, rate-limited 10 req/min/IP under policy `"auth"`):

```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/revoke
```
Identical route shape on both APIs. The login body differs: the Restaurant API also needs the
tenant's slug, because an email is unique only **per tenant**. The same address can be two
unrelated accounts in two restaurants, so email + password alone can't identify the account.

```csharp
// Request — SuperAdmin API: POST /api/auth/login
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// Request — Restaurant API: POST /api/auth/login
public class AdminLoginDto : LoginDto
{
    // Required. The restaurant's slug (case-insensitive), e.g. "pepsi" for pepsi.shoof.lambdor.com.
    // Take it from the admin site's subdomain, or let the user type it ("Restaurant code").
    public string TenantSlug { get; set; } = string.Empty;
}

// Response — 200 OK
public class AuthResultDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiresAt { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = [];   // role names (login and refresh); always [] for SuperAdmin
    public bool MustChangePassword { get; set; }    // true → go straight to "change password" (§2.1a)
}

// Request — POST /api/auth/refresh and POST /api/auth/revoke
public class RefreshTokenDto
{
    public string RefreshToken { get; set; } = string.Empty;
}
```

- `POST /api/auth/login` → `200 OK` `AuthResultDto`, or `400 BadRequest` (plain text) on bad
  credentials or inactive account. On the Restaurant API a missing or unknown `tenantSlug` returns
  the same "Incorrect email or password." message, so the response doesn't reveal which restaurants exist.
- `POST /api/auth/refresh` → `200 OK` with a **new** `AuthResultDto` — refresh tokens rotate on
  use; the old one is revoked as part of the call.
- `POST /api/auth/revoke` → `204 NoContent` (logout).
- Refresh tokens are scoped by principal type — an Admin refresh token cannot be redeemed on
  the SuperAdmin API and vice versa. Expiry is `RefreshToken:DaysExpires` in config (dev = 30
  days). Access token expiry is `Jwt:MinutesExpires` (dev = 60 minutes).

**Is the caller an Owner?** `roles` contains `"Owner"` (that role can't be renamed). The list is a snapshot from
login or refresh, so a role change shows after the next refresh. The server always checks the current roles.

**Sending the token** — standard bearer scheme, literal scheme name `"Bearer"`:
```
Authorization: Bearer <jwt>
```

**JWT claims**:
- `sub`, `jti`, `ClaimTypes.NameIdentifier` = user id, `ClaimTypes.Name` = full name, `ClaimTypes.Email`
- `tenant_id` — **AdminUser tokens only** (SuperAdmin is cross-tenant, no tenant claim)
- `principal_type` — `"Admin"` or `"SuperAdmin"`
- `ClaimTypes.Role` — one per assigned role (AdminUser only; SuperAdminUser has no roles feature)

**Each API rejects the other's token** even though it authenticates successfully —
`principal_type` mismatch → `403 Forbidden`, empty body.

**Restaurant API — two extra requirements on top of the JWT**:
1. Header `X-Api-Key: <configured client key>` — client name `"Restaurant"` (dev value
   `CHANGE_ME_DEV_ONLY_RESTAURANT_API_KEY`, see `appsettings.Development.json` → `ApiKeys:Clients`). The
   public `PortalController` instead requires client `"Portal"` (dev value
   `CHANGE_ME_DEV_ONLY_PORTAL_API_KEY`) — **do not reuse the two**.
2. Header `X-Tenant-Id: <guid>` — must exactly match the JWT's `tenant_id` claim (case-insensitive).
   Missing/mismatched → `400 BadRequest`, plain text `"Missing or mismatched X-Tenant-Id header."`

**SuperAdmin API**: `ApiKeys:EnableFiltering = false` in dev config — **no `X-Api-Key`
requirement at all**, the JWT alone is sufficient.

**Active-status enforcement** (both APIs): a deactivated tenant or user with an otherwise
valid, non-expired JWT gets `403 Forbidden` with a plain-text body (`"Tenant is inactive."` /
`"User is inactive."`) on every subsequent call — this can happen mid-token-lifetime. Tenant
deactivation has up to ~5 minutes of cache lag.

**`X-Language` header** (`en` / `ar`, optional): drives server-side text resolution — any DTO
with a plain `Name`/`Description` field (as opposed to `NameEn`/`NameAr`) resolves it from this
header. Also drives localized error messages.

### 2.1a Account, passwords and the primary SuperAdmin (Restaurant & SuperAdmin)

**Forced password change.** An account whose password someone else chose must change it before
anything else works: a user created through `admin-users` / `super-admin-users`, a tenant's
bootstrapped owner, the seeded SuperAdmin, or any account given a temporary password by a
SuperAdmin. Its login returns `mustChangePassword: true`, and every call except
`POST api/account/change-password` and `GET api/account/me` returns `403` with the plain-text body
`"Password change required."`. On login with `mustChangePassword: true`, go straight to a
"choose a new password" screen.

**`api/account`, the signed-in user's own account (both APIs):**

| Method + Route | Auth | Body → result |
|---|---|---|
| `POST api/account/change-password` | JWT (allowed during a forced change) | `ChangePasswordDto` → `200 AuthResultDto` (**new tokens**: replace both). Wrong current password → `400` "The current password is incorrect." |
| `GET api/account/me` | JWT (allowed during a forced change) | → `MyProfileDto` |
| `PUT api/account/me` | JWT | `UpdateMyProfileDto` → `MyProfileDto` |
| `POST api/account/forgot-password` | anonymous, rate-limited `"auth"` | Restaurant `AdminForgotPasswordDto`, SuperAdmin `ForgotPasswordDto` → **always `204`** |
| `POST api/account/reset-password` | anonymous, rate-limited `"auth"` | Restaurant `AdminResetPasswordDto`, SuperAdmin `ResetPasswordDto` → `204`, or `400` "This password reset link is invalid or has expired. Request a new one." |

```csharp
public class ChangePasswordDto { public string CurrentPassword; public string NewPassword; }

public class MyProfileDto
{
    public Guid Id; public string FullName; public string? Email;
    public string? PhoneNumber;      // restaurant admins only
    public bool IsPrimary;           // the primary SuperAdmin, or the restaurant's seeded admin
    public bool MustChangePassword;
}

public class UpdateMyProfileDto
{
    public string FullName;
    public string? PhoneNumber;      // ignored for SuperAdmins
    public string? Email;            // only the primary SuperAdmin may change it; anyone else → 400
}

public class ForgotPasswordDto { public string Email; }                              // SuperAdmin API
public class AdminForgotPasswordDto : ForgotPasswordDto { public string TenantSlug; } // Restaurant API
public class ResetPasswordDto { public string Email; public string Token; public string NewPassword; }
public class AdminResetPasswordDto : ResetPasswordDto { public string TenantSlug; }
```

**Reset link flow.**
- **"Forgot password?" screen:** posts the email, plus the slug on the restaurant dashboard (taken
  from the subdomain). It always gets `204`, so always show "If the account exists, we've sent you a
  link."
- **The email** contains a link that expires after **2 hours**:
  - Restaurant: `https://{slug}.shoof.lambdor.com/admin/reset-password?email=…&token=…&slug=…`
  - SuperAdmin: `https://superadmin.shoof.lambdor.com/reset-password?email=…&token=…`
- **"Reset password" page** (it must exist at that path): reads the query string and posts it with
  the new password to `reset-password`. Pass the token through exactly as received.
- **After a successful reset:** the user logs in normally, and every existing session's refresh
  token is revoked.

**SuperAdmin sets a temporary password** (SuperAdmin API, §5): the target's sessions are revoked,
and it must change the password on its next login.
- A restaurant admin needs `PasswordResets.Add`.
- Another SuperAdmin needs `SuperAdminUsers.Edit`, plus every permission the target holds (the primary is exempt).
  Choosing someone's password means becoming
  them, so the helpdesk-level `PasswordResets` permission can't do it.

**The primary SuperAdmin** (`MyProfileDto.isPrimary`) is the one platform-owner account:
- It can't be deleted, edited, deactivated, have its permissions changed or be reset by anyone
  (`400` "The primary SuperAdmin account can only be changed by its owner."). Hide those actions for
  it in the user list.
- Its owner edits it through `PUT api/account/me`, the only place an email can change.
- It can't use the reset link: forgot-password for it sends nothing. Recovery is a server setting
  (`PrimaryRecovery:TemporaryPassword`), not a screen.

### 2.2 Integration API — raw ApiKey

```
X-Integration-Key: <plaintext partner key>
```

No JWT, no `[RequirePermission]` layer at all — **key possession is the entire authorization
model**. The same tenant EF query filters that scope every other tenant entity are what keep
one partner off another tenant's data.

The key is read from this header **only** — a key in the query string (`?X-Integration-Key=`,
`?apiKey=`, …), a cookie or the body is ignored (`401`).

Validation (`ApiKeyAuthenticationHandler` / `ApiKeyValidationService`):
1. Missing/blank header → unauthenticated (falls through to default `401`).
2. Key is hashed and looked up: must be `IsActive`, not soft-deleted, and (if set) not past
   `ExpiresAt` → otherwise `401`.
3. **IP allowlist**: if the key has `AllowedIpRanges`, the client IP (after `ForwardedHeaders`, i.e.
   `X-Forwarded-For` is honoured only from configured `KnownProxies`/`KnownNetworks`; IPv4-mapped IPv6
   is matched as IPv4) must fall in one of them → otherwise `403` with `X-Error-Code: IpNotAllowed`.
   Empty list = any IP.
4. **Subscription**: an active `Registration` must cover now (key-scoped for any key of the caller's
   rotation lineage first, else tenant-scoped,
   `FromDate <= now <= ToDate`) → otherwise `403` with `X-Error-Code: SubscriptionExpired`.
5. Lookups of real keys are cached for min(60 s, subscription `ToDate`, key `ExpiresAt`). A SuperAdmin
   change made in another process takes effect here within that window.
6. On success: claims `tenant_id` and `api_key_id` are set from the resolved key row.

The two `403`s keep the usual error shape (localized plain-text message body) and add the
machine-readable `X-Error-Code` response header; the IP check runs first, so a caller outside the
allowlist learns nothing about the key's subscription.
4. `FallbackPolicy` requires the `IntegrationApiKey` scheme on **every** endpoint — no
   per-controller `[Authorize]` needed. A deactivated tenant still blocks the call
   (`RequireActiveTenantFilter`).

**On missing/invalid/expired key**: default ASP.NET Core behavior — `401 Unauthorized`, **empty
body**, no custom JSON. A key belonging to a *different* tenant than the requested resource
gets the same answer as for an unknown id (not a distinct auth error): `404`, except where §3.5 lists a `500`.

**Self-introspection**: `GET /api/api-key` → `200 OK` `ApiKeySelfDto` for the calling key itself
(includes `AllowedIpRanges` and, during a rotation grace period, `ReplacedByApiKeyId`).
No rotate/update here — key lifecycle (create/rotate/revoke) is SuperAdmin-only
(`Shoof.Api.SuperAdmin`'s `ApiKeysController`).

### 2.3 Permission system (`[RequirePermission]`) — Restaurant & SuperAdmin only

Never applies to the Integration API.

- `[PermissionGroup(GroupName)]` on the controller class + `[RequirePermission(PermissionType.X)]`
  per action. The effective permission string checked is **`"{GroupName}.{PermissionType}"`**,
  e.g. `"MenuItems.View"`.
- `PermissionType` values: `View`, `Add`, `Edit`, `Delete` (some controllers also use a raw
  custom string like `"Activate"` or `"Export"` for a non-CRUD action).
- ⚠️ **Naming gotcha**: the C# property on `AppPermissions.<Group>` is named `Create`/`Update`,
  but the *string value* uses `Add`/`Edit` — i.e. `AppPermissions.MenuItems.Create ==
  "MenuItems.Add"`.
- **AdminUser** (Restaurant API): permission comes from **Roles** — each tenant-scoped
  `AdminRole` carries a permission set; the JWT carries `ClaimTypes.Role` claims, checked
  server-side against the role's stored permissions (not baked directly into a permission
  claim).
- **SuperAdminUser** (SuperAdmin API): **no Roles feature** — permissions are granted directly
  per-account and checked live via `SuperAdminDirectPermissionClaimsService`. The seeded
  `support@lambdor.com` account has every permission.
- Submitting an invalid/unknown permission string to an update-permissions endpoint is
  **silently dropped** server-side (`AppPermissions.FilterValid`), not rejected. So is a valid
  permission that belongs to the other API's scope (see below).
- **Each API has its own permission scope.** Restaurant roles can hold only: `AdminUsers`, `Roles`,
  `Restaurants`, `MenuCategories`, `MenuItems`, `Ingredients`, `MenuItemIngredients`,
  `MenuItem3DModels`, `ModelGenerationJobs`, `QrCodes`, `Tables`, `MenuThemes`,
  `RestaurantSocialLinks`, `Currencies`, `Countries`, `RestaurantDashboard`. SuperAdmin users can
  hold only the groups the SuperAdmin API enforces (`Tenants`, `Restaurants`, `ApiKeys`, reports,
  `Plans`, `Registrations`, …). Some group names (`Restaurants`, `Currencies`, `Countries`,
  `ModelGenerationJobs`) exist in both scopes. Build every permission editor from its own API's
  catalogue endpoint.

Full permission-constant reference (group → members → resulting group name used in the
permission string):

| Group | Members | GroupName |
|---|---|---|
| `AdminUsers` | View, Create→Add, Update→Edit, Delete | `AdminUsers` |
| `Roles` | View, Add, Edit, Delete | `Roles` |
| `Restaurants` | View, Add, Edit *(no Delete)* | `Restaurants` |
| `ModelGenerationJobs` | View, Add | `ModelGenerationJobs` |
| `QrCodes` | View, Add | `QrCodes` |
| `MenuCategories` | View, Add, Edit, Delete | `MenuCategories` |
| `MenuItems` | View, Add, Edit, Delete | `MenuItems` |
| `Ingredients` | View, Add, Edit, Delete | `Ingredients` |
| `MenuItemIngredients` | View, Add, Edit, Delete | `MenuItemIngredients` |
| `MenuItem3DModels` | View, Add, Edit, Delete | `MenuItem3DModels` |
| `Tables` | View, Add, Edit, Delete | `Tables` |
| `Currencies` | View, Add, Edit, Delete | `Currencies` |
| `Countries` | View, Add, Edit, Delete | `Countries` |
| `MenuThemes` | View, Add, Edit, Delete, **Activate** | `MenuThemes` |
| `RestaurantSocialLinks` | View, Add, Edit, Delete | `RestaurantSocialLinks` |
| `ApiKeys` | View, Add, Edit, Delete | `ApiKeys` |
| `AuditLogEntries` | View only | `AuditLogEntries` |
| `Registrations` | View, Add, Edit, Delete | `Registrations` |
| `SuperAdminUsers` | View, Add, Edit, Delete | `SuperAdminUsers` |
| `Tenants` | View, Add, Edit, Delete | `Tenants` |
| `RestaurantDashboard` | View only | `RestaurantDashboard` |
| `Dashboard` | View only | `Dashboard` |
| `TenantContentReport` | View, **Export** | `TenantContentReport` |
| `ApiKeyContentReport` | View, **Export** | `ApiKeyContentReport` |
| `RegistrationsReport` | View, **Export** | `RegistrationsReport` |
| `TenantRevenueReport` | View, **Export** | `TenantRevenueReport` |
| `GenerationUsageReport` | View only | `GenerationUsageReport` |
| `Plans` | View, Add, Edit, Delete | `Plans` |
| `SupportTiers` | View, Add, Edit, Delete | `SupportTiers` |
| `CreditPacks` | View, Add, Edit, Delete | `CreditPacks` |
| `CreditPurchases` | View, Add, **Cancel** | `CreditPurchases` |
| `ApiKeyRotation` | **Rotate** only | `ApiKeyRotation` |
| `ApiKeyAllowedIps` | Edit only | `ApiKeyAllowedIps` |
| `GenerationSettings` | View, Edit | `GenerationSettings` |
| `IntegrationRequestLogs` | View only | `IntegrationRequestLogs` |
| `Model3DAssets` | View, **Approve** | `Model3DAssets` |
| `Notifications` | Add only (broadcast) | `Notifications` |
| `PasswordResets` | Add only | `PasswordResets` |

The table above is the full set of constants across both APIs. A group shared by both APIs lists all its actions in
both catalogues, including some that one API doesn't use (for example `Currencies.Add` on the restaurant side). Don't hard-code it: `GET api/roles/permissions` (Restaurant API)
returns the restaurant scope, `GET api/super-admin-users/permissions` (SuperAdmin API) returns the
SuperAdmin scope, and `GET api/restaurants/permissions` (SuperAdmin API) returns what a new
restaurant's Owner role gets.

---

## 3. Common conventions (all three APIs)

### 3.1 Base DTO types

```csharp
// Lambdor.Library.Basics.DTOs — every response *Dto extends this (directly or via BasicDto)
public class BasicDto
{
    public Guid Id { get; set; }
}

// Every list-endpoint *Filter query DTO extends this
public class BasicFilterDto
{
    public string? SearchTerm { get; set; }
    public int Page { get; set; }        // 1-based, default 1
    public int PageSize { get; set; }     // default 10
    public DateOnly? CreatedFrom { get; set; }
    public DateOnly? CreatedTo { get; set; }
}

// Wraps every paged-list response
public class PaginatedDataDto<T>
{
    public List<T> Data { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}
```

**There is no generic `ApiResponse<T>` envelope anywhere.** Controllers return the DTO
directly with `200 OK` (`Ok(dto)`), `204 NoContent` with an empty body, or an error as in §3.2.

Example paged-list JSON shape:
```json
{
  "data": [ /* T[] */ ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 137,
  "totalPages": 7
}
```

Filter DTOs bind via `[FromQuery]` — plain query-string params: `?page=1&pageSize=20&isActive=true`.
Free-text search field name is **not consistent** across filters — some use `SearchTerm`
(inherited), some define their own `Search` — check the specific filter DTO per endpoint. There
is no generic `sort`/`orderBy` param; each service hardcodes its own ordering.

**Timezone-aware responses.** Any endpoint below whose response includes a date/time field
converts it from UTC storage to a *local* value before returning it: restaurant-local time when
the response/request resolves to exactly one `Restaurant`, otherwise `Asia/Damascus` (the
platform default). `RestaurantDto.TimeZoneId` tells you which IANA zone a given restaurant's
local times are expressed in. Filter query params named `fromDate`/`toDate` follow the same rule
on the way *in* — they're interpreted as local time (restaurant-local or Damascus) and converted
to UTC before filtering, not as raw UTC. `CreateXDto`/`UpdateXDto` request-body date fields are
the one exception: always raw UTC, unconverted, both directions. Storage itself stays plain
`DateTime` UTC everywhere (never `DateTimeOffset`) — this conversion happens only at the
read/filter boundary, never in the database.

### 3.2 Error response shapes

Exceptions are handled by a global `ExceptionHandlingMiddleware` and are returned as
**plain text**, not JSON:

| Case | Status | Body | Content-Type |
|---|---|---|---|
| Business rule violation (`BusinessException`) | `400 Bad Request` | plain message, e.g. `"Incorrect email or password."` | `text/plain` |
| Not found (`NotFoundException`) | `404 Not Found` | plain message | `text/plain` |
| Unhandled exception | `500 Internal Server Error` | fixed string `"An unexpected error occurred."` (never leaks details) | `text/plain` |

**Model-validation errors are different** (Restaurant and SuperAdmin APIs): a missing or malformed required field in
the request body returns standard ASP.NET Core `ValidationProblemDetails` **JSON**, sent as `application/json` on
most endpoints and as `application/problem+json` on the others:
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "Email": ["The Email field is required."] },
  "traceId": "00-...-00"
}
```
→ **a frontend must distinguish two different `400` shapes**: `text/plain` (business error, show the text) vs JSON
with an `errors` object (model validation). **Don't test for `application/problem+json` alone**, it misses most of them:

```js
async function readError(res) {
  const body = await res.text();
  if (/json/.test(res.headers.get('content-type') ?? '')) {
    const problem = JSON.parse(body);
    return { status: res.status, message: problem.title, fields: problem.errors ?? {} };
  }
  return { status: res.status, message: body, fields: {} };   // may be empty: use your own text for the status
}
```

The Integration API has no automatic model validation: a malformed body returns `500` (§3.5).

| Status | Meaning | Body |
|---|---|---|
| `401 Unauthorized` | Missing/invalid JWT or ApiKey | empty |
| `403 Forbidden` — wrong `principal_type` | wrong API for this token | empty |
| `403 Forbidden` — permission denied | `[RequirePermission]` failed | empty |
| `403 Forbidden` — inactive tenant/user | deactivated account | plain text (`"Tenant is inactive."` / `"User is inactive."`) |
| `404 Not Found` | resource missing, or another tenant's | plain text, or JSON problem details (`title`, `status`), or empty (Integration): branch on the status |
| `429 Too Many Requests` | rate limit hit (`"auth"` policy = 10/min/IP, `"portal"` = 60/min/IP, integration policy also applies) | — |

### 3.3 File uploads

Multipart form-data (`IFormFile` binding) — never JSON/base64.

| Route | API(s) | Fields |
|---|---|---|
| `POST /api/restaurants/{id}/logo` | Restaurant, Integration | `file: IFormFile` |
| `POST /api/menu-themes/{id}/background-image` | Restaurant | `file: IFormFile` |
| `POST /api/menu-themes/{id}/header-logo` | Restaurant | `file: IFormFile` |
| `POST /api/menu-items/{menuItemId}/images` | Restaurant | `file: IFormFile` (JPEG/PNG/WEBP) |
| `POST /api/menu-item-3d-models/upload` | Restaurant, Integration | `menuItemId: Guid` (form field), `glbFile: IFormFile` (required), `usdzFile: IFormFile?`, `thumbnailFile: IFormFile?` |

Validation (`FileStorageService`):
- Max size **5 MB** → over limit: `400`, `"File exceeds the 5MB limit."`
- Empty file → `400`, `"The uploaded file is empty."`
- Images: `.jpg`/`.jpeg`/`.png`/`.webp`, validated by **file-content magic bytes**, not just
  extension. Mismatch → `400`, `"The file content does not match its extension."`
- 3D models: `.glb` (magic `glTF`), `.usdz` (ZIP signature).
- Disallowed extension → `400`, `"File type not allowed. Accepted: {list}."`
- On success, the response DTO contains a **full absolute URL** (never a relative path) —
  store/display it directly.

**Loading stored files.** Every stored file (logos, theme images, item photos, 3D models, thumbnails, QR images) is a plain
public `GET` on the URL the API returned, shaped `{base}/{slug}/{category}/{file}`, e.g.
`https://pizzahut.shoof.lambdor.com/backend/pizzahut/logo/1b2c….png`:
- **No headers** — no `Authorization`, `X-Api-Key` or `X-Tenant-Id`; use the URL directly in `<img src>`,
  `<model-viewer src>`, a download link, etc.
- Content types: images as `image/png|jpeg|webp`, `.glb` as `model/gltf-binary`, `.usdz` as `model/vnd.usdz+zip`
  (what `<model-viewer>` / iOS Quick Look expect).
- All APIs share one storage folder, so a file uploaded through one API is available everywhere: the same
  `{slug}/{category}/{file}` path is served by the Restaurant API (`/backend/...`) and the Integration API.
- **Postman:** the **Files** folder of `docs/postman/Shoof.postman_collection.json` fetches the last uploaded file. Every upload
  request (Set Logo, Upload Image (gallery), Upload (manual GLB/USDZ), Set Background Image, Set Header Logo) saves its path in
  the `storedFilePath` variable; then run *Get Stored File (Restaurant API)* / *(Integration API)* — both should return `200` with
  the content types above.

### 3.4 Domain enums (for dropdowns / status labels)

All `byte`-backed in `Shoof.Domain.Enums` unless noted. **All three APIs serialize enums as
numbers** (the underlying value: the first member is `0`, the next `1`, …; no
`JsonStringEnumConverter` is registered), and expect numbers in requests and query strings. The only
place enums appear as **names** is the body of outgoing **webhooks** (§6, e.g. `"status": "Ready"`).

```csharp
public enum ModelGenerationStatus : byte { Pending = 0 /* Queued */, Processing = 1, Ready = 2, Failed = 3, Cancelled = 4 }
public enum ModelGenerationKind : byte { Model3D = 0, Image = 1 }
public enum NotificationType : byte { GenerationReady = 0, GenerationFailed = 1, GenerationCancelled = 2, BatchCompleted = 3, Announcement = 4,
    Model3DAssetPendingApproval = 5, Model3DAssetApproved = 6, Model3DAssetRejected = 7, CreditsPurchased = 8,
    SubscriptionExpiring = 9 /* 30, 7 and 1 days before the end */ }
public enum Model3DAssetApprovalStatus : byte { Pending = 0, Approved = 1, Rejected = 2 }   // SuperAdmin library review
public enum WebhookDeliveryStatus : byte { Pending = 0, Delivered = 1, GaveUp = 2 }
public enum LogDirection : byte { Inbound = 0 /* a partner call */, Outbound = 1 /* our webhook attempt */ }
public enum MenuItemImageSource : byte { Upload, AiGenerated, AiVariant }
public enum ModelSourceType : byte { AiGenerated, ManualUpload }
public enum DiscountType : byte { Percentage, FixedAmount }
public enum HeaderLogoPosition : byte { Left, Center, Right }
public enum SocialMediaPlatform : byte { Facebook, Instagram, Twitter, TikTok, WhatsApp, YouTube, Snapchat }
public enum PageTransitionEffect : byte { None, SlideHorizontal, SlideVertical, Fade, PageCurl }
public enum ThemeMode : byte { Light, Dark }

// Shoof.Contracts.DTOs (DTO layer, not Domain)
public enum RegistrationSourceType { Tenant, ApiKey }
```

There is no `RegistrationStatus` enum — a `Registration` (billing record) just has `bool
IsActive` plus a `DateTime FromDate/ToDate` window.

`PrincipalTypes` (string constants, not an enum, `Shoof.Domain.Constants.ClaimNames`):
`"Admin"`, `"SuperAdmin"`. `AdminUser` roles are free-form tenant-defined names (no fixed set)
except the auto-provisioned `"Owner"` role (every Restaurant permission, `isOwner: true`, locked)
created when a restaurant is onboarded or a tenant is bootstrapped.

### 3.5 Known backend issues (as of 2026-11-22)

These describe what the API does **today**. Handle them, and don't build on them: they may be fixed.

**An unknown id returns `500` "An unexpected error occurred." instead of `404`.** Another tenant's id gets the same
answer. After such a `500`, reload the list: the row may have been deleted by someone else.

| API | Method | Endpoints |
|---|---|---|
| Restaurant | GET by id | `countries`, `currencies`, `ingredients`, `menu-categories`, `menu-item-3d-models`, `menu-themes`, `qr-codes`, `restaurant-social-links`, `tables` |
| Restaurant | PUT and DELETE | `ingredients`, `menu-item-ingredients`, `menu-themes`, `restaurant-social-links`, `tables` |
| SuperAdmin | GET by id | `api-keys`, `audit-log-entries`, `countries`, `currencies`, `plans`, `registrations`, `support-tiers` |
| SuperAdmin | PUT and DELETE | `api-keys`, `countries`, `credit-packs`, `currencies`, `plans`, `registrations`, `support-tiers`, `tenants` |
| SuperAdmin | POST | `registrations/{id}/upgrade` |
| Integration | GET by id | `menu-categories`, `menu-item-3d-models` |

`GET api/tenants/{id}/usage` is the opposite case: an unknown tenant returns `200` with zeros.

**Integration API, malformed body:** a body that isn't valid JSON returns `500`, not `400`.

**Subscription expiry switches the customer off.** An hourly job handles subscriptions past their end date:
- A tenant's subscription: the tenant becomes inactive. Its admins get `403` "Tenant is inactive.", its public menu
  returns `404` and its API keys stop working.
- An API key's own subscription: that key becomes inactive (`401`).
- A new subscription does **not** switch them back on. A SuperAdmin must set `isActive: true` on the tenant
  (`PUT api/tenants/{id}`) or on the key (`PUT api/api-keys/{id}`).
- **Before Release 1.1 this also happens when a newer subscription already exists.** From Release 1.1 a customer
  with another active subscription that hasn't ended stays on, including one that starts later (API keys answer
  `403 SubscriptionExpired` until it starts). Create it before the old one ends, for the **same owner**: the tenant,
  or the same key or one it was rotated to or from. A tenant subscription doesn't renew a key's own one, or the
  other way round. Until Release 1.1 is live, renew with
  `POST api/registrations/{id}/upgrade` (the same plan is fine), which closes the old subscription safely. Leave
  `fromDate` empty, or there is a gap until that date. Upgrade takes the plan's list price and drops the discount, so
  correct those afterwards with `PUT api/registrations/{id}`, sending its dates as UTC.
- Moving `toDate` with `PUT` also keeps the customer on, but expiry reminders already sent are not sent again for the
  new date.

**Missing from the API. Don't build these until the backend adds them:**
- "My permissions": a user without `Roles.View` or `SuperAdminUsers.View` can't read their own permissions. Where
  this guide says to disable what the caller lacks, do it when you can read them, and otherwise show the `400`.
- The SuperAdmin user list doesn't say who the primary is (`SuperAdminUserDto` has no `isPrimary`; only `GET
  api/account/me` has it, for yourself). Show the `400` when an action on that account is refused.
- The SuperAdmin API can't list a tenant's admins, so a console has no way to pick the `userId` for
  `POST api/password-resets/tenants/{tenantId}/admin-users/{userId}`. Only `bootstrap-admin` returns such an id.

---

## 4. Shoof.Api.Restaurant — endpoint reference

Base URL (dev): `https://localhost:7221`. Every endpoint below requires
`Authorization: Bearer <jwt>` + `X-Api-Key: <Restaurant client key>` + `X-Tenant-Id: <guid>`
unless marked otherwise (see §2.1). All resources are implicitly scoped to the caller's tenant
via EF Core global query filters.

### AuthController — `api/auth`
Anonymous, rate-limited (`"auth"`, 10/min/IP). See §2.1 for full DTO shapes.

| Method + Route | Description |
|---|---|
| `POST api/auth/login` | Log in an admin user → `AuthResultDto` |
| `POST api/auth/refresh` | Rotate access/refresh token pair |
| `POST api/auth/revoke` | Logout (revoke refresh token) → `204` |

### AccountController — `api/account`
The signed-in admin's own account; no permission needed. Full shapes in §2.1a.

| Method + Route | Description |
|---|---|
| `POST api/account/change-password` | Change own password → new `AuthResultDto` (allowed during a forced change) |
| `GET api/account/me` | Own profile → `MyProfileDto` (allowed during a forced change) |
| `PUT api/account/me` | Edit own name + phone (email can't change) |
| `POST api/account/forgot-password` | Anonymous: `{ tenantSlug, email }` → always `204`, emails a reset link |
| `POST api/account/reset-password` | Anonymous: `{ tenantSlug, email, token, newPassword }` → `204` |

### MenuCategoriesController — `api/menu-categories` (permission group `MenuCategories`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/menu-categories` | `.View` | Query `MenuCategoryFilter`: `ParentCategoryId: Guid?`, `IsActive: bool?` | `PaginatedDataDto<MenuCategoryDto>` |
| `GET api/menu-categories/{id:guid}` | `.View` | route `id` | `MenuCategoryDto` |
| `POST api/menu-categories` | `.Add` | `CreateMenuCategoryDto`: `RestaurantId`, `ParentCategoryId?`, `NameEn`, `NameAr?`, `DescriptionEn?`, `DescriptionAr?`, `DisplayOrder: int` | `MenuCategoryDto` |
| `PUT api/menu-categories/{id:guid}` | `.Edit` | `UpdateMenuCategoryDto`: `ParentCategoryId?`, `NameEn`, `NameAr?`, `DescriptionEn?`, `DescriptionAr?`, `DisplayOrder`, `IsActive: bool` | `MenuCategoryDto` |
| `DELETE api/menu-categories/{id:guid}` | `.Delete` | route `id` | `200` |

`MenuCategoryDto`: `Id`, `RestaurantId: Guid`, `ParentCategoryId: Guid?`, `Name: string`
(resolved from NameEn/NameAr via `X-Language`), `Description: string?`, `DisplayOrder: int`,
`IsActive: bool`.

### MenuItemsController — `api/menu-items` (permission group `MenuItems`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/menu-items` | `.View` | Query `MenuItemFilter`: `MenuCategoryId: Guid?`, `IsActive: bool?`, `WithoutModelOnly: bool?` (true → only items with no `Ready` 3D model) | `PaginatedDataDto<MenuItemDto>` |
| `GET api/menu-items/{id:guid}` | `.View` | route `id` | `MenuItemDto` |
| `POST api/menu-items` | `.Add` | `CreateMenuItemDto`: `MenuCategoryId`, `NameEn`, `NameAr?`, `DescriptionEn?`, `DescriptionAr?`, `Price: decimal`, `CurrencyId: Guid?` (defaults to restaurant's currency), `DisplayOrder: int` | `MenuItemDto` |
| `PUT api/menu-items/{id:guid}` | `.Edit` | `UpdateMenuItemDto`: `NameEn`, `NameAr?`, `DescriptionEn?`, `DescriptionAr?`, `Price`, `CurrencyId: Guid`, `IsActive`, `DisplayOrder` | `MenuItemDto` |
| `DELETE api/menu-items/{id:guid}` | `.Delete` | route `id` | `200` |

`MenuItemDto`: `Id`, `MenuCategoryId: Guid`, `MenuCategoryName: string?`, `Name: string`,
`Description: string?`, `Price: decimal`, `CurrencyId: Guid`, `CurrencyIsoCode: string?`,
`IsActive: bool`, `DisplayOrder: int`, `Images: MenuItemImageDto[]`, `ActiveModel: MenuItemActiveModelDto?`.

`MenuItemActiveModelDto`: `{ Id, GlbUrl, UsdzUrl?, ThumbnailUrl?, SourceType, CreationDateTime }`, the item's active
Ready 3D model (`null` if it has none). It is filled **only by `GET`** (list and by id). The `POST`/`PUT` responses
always have `null`, so don't overwrite your cached value with theirs.

`MenuItemImageDto`: `{ Id, Url (absolute), Source, Caption?, DisplayOrder }`. `Source` is a
`MenuItemImageSource` enum: `0` Upload, `1` AiGenerated, `2` AiVariant. The **primary photo is the
one with the lowest `DisplayOrder`** (use it as the card thumbnail); the rest form the gallery.

### MenuItemImagesController — `api/menu-items/{menuItemId}/images` (permission group `MenuItems`) — photo gallery

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `POST api/menu-items/{menuItemId:guid}/images` | `.Edit` | multipart `file: IFormFile` (JPEG/PNG/WEBP, 5 MB, see §3.3) | `MenuItemImageDto` |
| `DELETE api/menu-items/{menuItemId:guid}/images/{imageId:guid}` | `.Edit` | route ids | `204` / `404` |

**Limit: 5 photos per item.** Pending AI photo jobs count toward the 5. Going over the limit
(upload or generate) returns `400`; deleting a photo frees a slot.

### MenuItemImageGenerationController — same routes (permission group `ModelGenerationJobs`) — AI photos

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `POST api/menu-items/{menuItemId:guid}/images/generate` | `.Add` | none | `ModelGenerationJobDto` (`Kind` = `1` Image) |
| `POST api/menu-items/{menuItemId:guid}/images/{imageId:guid}/variants` | `.Add` | `GenerateMenuItemImageVariantDto`: `Instruction` (required, max 300, e.g. "without onions"), `Caption` (required, max 100) | `ModelGenerationJobDto` (`Kind` = `1`) |

These are gated by `ModelGenerationJobs.Add` (not `MenuItems.Edit`) because they spend provider credits
and quota. Both return a job; **poll `GET api/model-generation-jobs/{id}`** (`Pending → Processing →
Ready|Failed`). When the job is `Ready` the new photo appears in `MenuItemDto.Images` with `Source`
`1` (generated) or `2` (variant) — re-fetch the item. A variant is made from the given source
photo (`404` if `imageId` isn't one of the item's photos). Invalid/over-long `Instruction` or
`Caption` -> `400`. AI photos, variants and 3D generations **share the same plan daily/monthly
quota** (see `ModelGenerationJobsController`).

### IngredientsController — `api/ingredients` (permission group `Ingredients`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/ingredients` | `.View` | Query `IngredientFilter` (no extra fields) | `PaginatedDataDto<IngredientDto>` |
| `GET api/ingredients/{id:guid}` | `.View` | route `id` | `IngredientDto` |
| `POST api/ingredients` | `.Add` | `CreateIngredientDto`: `NameEn`, `NameAr?`, `DescriptionEn?`, `DescriptionAr?` | `IngredientDto` |
| `PUT api/ingredients/{id:guid}` | `.Edit` | `UpdateIngredientDto`: same fields | `IngredientDto` |
| `DELETE api/ingredients/{id:guid}` | `.Delete` | route `id` | `200` |

`IngredientDto`: `Id`, `Name: string`, `Description: string?`.

### MenuItemIngredientsController — `api/menu-item-ingredients` (permission group `MenuItemIngredients`)

Join entity attaching an ingredient to a menu item with a note/removable flag.

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/menu-item-ingredients` | `.View` | Query `MenuItemIngredientFilter`: `MenuItemId: Guid?` | `PaginatedDataDto<MenuItemIngredientDto>` |
| `GET api/menu-item-ingredients/{id:guid}` | `.View` | route `id` | `MenuItemIngredientDto` |
| `POST api/menu-item-ingredients` | `.Add` | `CreateMenuItemIngredientDto`: `MenuItemId`, `IngredientId`, `Note: string?`, `IsRemovable: bool` (default `true`) | `MenuItemIngredientDto` |
| `PUT api/menu-item-ingredients/{id:guid}` | `.Edit` | `UpdateMenuItemIngredientDto`: `Note?`, `IsRemovable` | `MenuItemIngredientDto` |
| `DELETE api/menu-item-ingredients/{id:guid}` | `.Delete` | route `id` | `200` |

`MenuItemIngredientDto`: `Id`, `MenuItemId: Guid`, `IngredientId: Guid`, `IngredientName:
string?`, `Note: string?`, `IsRemovable: bool`.

### TablesController — `api/tables` (permission group `Tables`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/tables` | `.View` | Query `TableFilter`: `IsActive: bool?` | `PaginatedDataDto<TableDto>` |
| `GET api/tables/{id:guid}` | `.View` | route `id` | `TableDto` |
| `POST api/tables` | `.Add` | `CreateTableDto`: `RestaurantId`, `Label: string` | `TableDto` |
| `PUT api/tables/{id:guid}` | `.Edit` | `UpdateTableDto`: `Label`, `IsActive: bool` | `TableDto` |
| `DELETE api/tables/{id:guid}` | `.Delete` | route `id` | `200` |

`TableDto`: `Id`, `RestaurantId: Guid`, `Label: string`, `IsActive: bool`.

### RestaurantSocialLinksController — `api/restaurant-social-links` (permission group `RestaurantSocialLinks`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/restaurant-social-links` | `.View` | Query `RestaurantSocialLinkFilter`: `RestaurantId: Guid?`, `Platform: SocialMediaPlatform?` | `PaginatedDataDto<RestaurantSocialLinkDto>` |
| `GET api/restaurant-social-links/{id:guid}` | `.View` | route `id` | `RestaurantSocialLinkDto` |
| `POST api/restaurant-social-links` | `.Add` | `CreateRestaurantSocialLinkDto`: `RestaurantId`, `Platform: SocialMediaPlatform`, `Url: string` | `RestaurantSocialLinkDto` |
| `PUT api/restaurant-social-links/{id:guid}` | `.Edit` | `UpdateRestaurantSocialLinkDto`: `Url` only (`RestaurantId`/`Platform` immutable — delete+recreate to change platform) | `RestaurantSocialLinkDto` |
| `DELETE api/restaurant-social-links/{id:guid}` | `.Delete` | route `id` | `200` |

`RestaurantSocialLinkDto`: `Id`, `RestaurantId: Guid`, `Platform: SocialMediaPlatform`, `Url: string`.

### QrCodesController — `api/qr-codes` (permission group `QrCodes`) — read + generate only, no update

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/qr-codes` | `.View` | Query `QrCodeFilter`: `RestaurantId: Guid?`, `TableId: Guid?` | `PaginatedDataDto<QrCodeDto>` |
| `GET api/qr-codes/{id:guid}` | `.View` | route `id` | `QrCodeDto` |
| `POST api/qr-codes` | `.Add` | `CreateQrCodeDto`: `RestaurantId`, `TableId: Guid?` (null = restaurant-level QR, set = table-specific QR) | `QrCodeDto` |

`QrCodeDto`: `Id`, `RestaurantId: Guid`, `TableId: Guid?`, `TargetUrl: string`, `ImageUrl: string?`.

Idempotent: a `RestaurantId`+`TableId` pair is unique — re-POSTing the same pair returns the
existing row. `TargetUrl` is generated server-side as a full absolute URL on the tenant's subdomain
(`https://{slug}.shoof.lambdor.com/menu/{restaurantId}` or `.../menu/{restaurantId}/table/{tableId}`) and is exactly what the QR
encodes; `ImageUrl` is the server-rendered PNG (a public stored file, §3.3). Re-POSTing redraws the image only when the URL changed
(e.g. after a domain switch), keeping the same row.

### ModelGenerationJobsController — `api/model-generation-jobs` (permission group `ModelGenerationJobs`) — read + trigger + cancel

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/model-generation-jobs` | `.View` | Query `ModelGenerationJobFilter` (all optional, see "Grid filters" below) | `PaginatedDataDto<ModelGenerationJobDto>` |
| `GET api/model-generation-jobs/{id:guid}` | `.View` | route `id` | `ModelGenerationJobDto` |
| `GET api/model-generation-jobs/quota` | `.View` | none | `ModelGenerationQuotaDto` |
| `POST api/model-generation-jobs` | `.Add` | `CreateModelGenerationJobDto`: `MenuItemId: Guid`, `ForceNew: bool` (default false) | `ModelGenerationJobDto` |
| `POST api/model-generation-jobs/bulk` | `.Add` | `CreateBulkModelGenerationJobDto`: `MenuItemIds: List<Guid>` (max 500), `ForceNew: bool` (default false) | `BulkModelGenerationJobResultDto` |
| `POST api/model-generation-jobs/{id:guid}/cancel` | `.Add` | route `id` | `ModelGenerationJobDto` (now `Status` `4`) / `400` / `404` |
| `POST api/model-generation-jobs/batches/{batchId:guid}/cancel` | `.Add` | route `batchId` | `int` — how many still-queued jobs were cancelled / `404` |

`ModelGenerationJobDto`: `Id`, `MenuItemId: Guid`, `MenuItemName: string?`, `Status:
ModelGenerationStatus`, `Kind: ModelGenerationKind` (`0` Model3D, `1` Image), `ExternalProviderName: string?`, `ExternalProviderJobId: string?`,
`RetryCount: int`, `ErrorMessage: string?`, `BatchId: Guid?` (shared by every job of one bulk request; `null` for a single
request), `SubmittedAt: DateTime?` (UTC; when the queue sent it to the provider — `null` while queued), `FinishedAt: DateTime?`
(UTC; Ready/Failed/Cancelled), `IsLibraryMatch: bool`, `QueuePosition: int?` (only while `Pending`), `ResultThumbnailUrl: string?`
(`null` until Ready), `Metadata: object?` (Integration API only; always `null`/absent for restaurant-created jobs).

**Grid filters** (query params of `GET api/model-generation-jobs`, on top of the inherited `page`, `pageSize`, `searchTerm`):

| Param | Type | Meaning |
|---|---|---|
| `menuItemId` | Guid | one item's jobs |
| `status` | `0`..`4` | see the status table below |
| `kind` | `0` / `1` | 3D model / AI photo |
| `batchId` | Guid | every job of one bulk request |
| `restaurantId` | Guid | the item's restaurant |
| `menuCategoryId` | Guid | the item's category |
| `search` | string (≤ 100 chars) | case-insensitive "contains" on the item's English **or** Arabic name |
| `fromDate`, `toDate` | `yyyy-MM-dd` | restaurant-local calendar day, **inclusive** on both ends |
| `metadataSearch` | string | Integration-created jobs only; see §6 (restaurant callers have no metadata, so it matches nothing) |

Grid columns to render: item name, `kind`, `status` (badge), `queuePosition` (while queued), `batchId`, creation / `submittedAt` /
`finishedAt`, `isLibraryMatch` ("instant, free"), `resultThumbnailUrl`, `errorMessage` on `Failed`.

**Status values and queue semantics.**

| `Status` | Name | Meaning | Cancellable |
|---|---|---|---|
| `0` | Pending = **Queued** | Accepted; nothing has been sent to the provider yet | yes |
| `1` | Processing | Sent to the provider (`submittedAt` set) | **no** |
| `2` | Ready | Result attached (or library link) | no |
| `3` | Failed | `errorMessage` explains | no |
| `4` | Cancelled | Withdrawn while queued; it never reached the provider and does **not** count against quota | no |

- `POST api/model-generation-jobs` and `.../bulk` **always return `Pending` (`0`)**, except a shared-library match, which is returned
  already `Ready` with `isLibraryMatch = true` (instant and free — no queue, no provider cost, no quota).
- A background queue sends jobs to the provider (Meshy) when a slot is free. The platform has a global concurrency cap and a
  per-tenant cap (SuperAdmin-managed, §5; default Meshy Pro = 10 concurrent, 2 per tenant), and slots are shared **round-robin across
  tenants**, so one restaurant's large bulk request cannot starve another restaurant's single request. Inside one tenant,
  single (interactive) requests go before bulk ones, then oldest first.
- `queuePosition` is the 1-based place **within your own tenant's queue** (same ordering rule as above); it is `null` once the job is
  `Processing` or later. It can go down as your earlier jobs finish or are cancelled; do not treat it as a time estimate.
- Poll `GET api/model-generation-jobs/{id}` (or the list, filtered by `status`/`batchId`) to follow `Pending → Processing → Ready|Failed`,
  or react to the push notification (§4 "Notifications").
- **Cancel** (`POST .../{id}/cancel`) works only while `Pending`. Errors: `400` `"This generation has already started and can no longer be
  cancelled."` (Processing), `400` `"This generation has already finished or was cancelled."` (Ready/Failed/Cancelled), `404`
  (unknown id or another tenant's job — never `403`). If the worker claims the job in the same instant, the cancel loses and you get
  the Processing `400`.
- **Cancel batch** (`POST .../batches/{batchId}/cancel`) cancels only the batch's still-queued jobs and returns the count (`0` is a valid
  answer); jobs already running continue. `404` for an unknown batch or another tenant's batch.

`ModelGenerationQuotaDto`: `{ DailyRemaining: int?, MonthlyRemaining: int?, IsApiKeyPool: bool, ExtraCreditsRemaining: int,
ExtraCreditsNearestExpiryUtc: DateTime? }` — `DailyRemaining`/`MonthlyRemaining` null means unlimited (the plan has no cap for that
period); `MonthlyRemaining` is the **plan allowance** left. `ExtraCreditsRemaining` = purchased extra generations still usable (not
expired), spent one per generation once `MonthlyRemaining` reaches 0; `ExtraCreditsNearestExpiryUtc` = when the soonest-expiring
purchase that still has credits lapses (**UTC**), `null` when there are none. `IsApiKeyPool` is `true` only for an Integration key with its
own subscription (always `false` for restaurant staff). Poll this before offering a multi-select
"generate 3D models" action so the picker can't be over-selected past what will actually succeed;
it's a UX convenience, not the enforcement point, so the bulk endpoint below can still legitimately
skip items with `QuotaExceeded`/`MonthlyQuotaExceeded` if remaining quota shifted between the two calls.

Daily and monthly quota per tenant come from the tenant's current `Plan` (SuperAdmin-managed, via
their `Registration`) when one exists, else config fallback (`ModelGeneration:DailyQuotaPerTenant`/
`MonthlyQuotaPerTenant`, default 50/day and 1000/month). Either may be unlimited (no cap). Single
trigger (`POST api/model-generation-jobs`) can fail `400` for:
- **Already has an active job** — the item already has a `Pending`/`Processing` job; poll it
  instead of retriggering.
- **Not changed enough to regenerate** — the item already has a `Ready` 3D model and hasn't
  changed enough since it was generated (an ingredient add/remove always counts as a change;
  a name/description edit only counts once it's a substantial rewrite, not a minor wording tweak).
- **Daily/monthly quota reached** — sourced from the plan. Order: the **daily** limit always applies (credit-paid generations count
  towards it too); then the **monthly plan allowance**; when that is used up, one **extra credit** is consumed (earliest-expiring purchase
  first). Only when no unexpired credit is left does the call fail with the monthly message ("... no extra generation credits are left.
  Contact us to buy an extra credit pack."). Bulk items skipped for this reason still report `MonthlyQuotaExceeded`.

**Shared 3D library (instant reuse).** Before calling the provider, the backend looks in a shared,
cross-tenant library for a matching dish (same ingredients by English name, and similar name +
description). On a hit the model is **linked instantly**: the trigger returns a job with `Status`
`Ready` and `ExternalProviderName = "library"`, the item's 3D model is already attached, no
provider cost is incurred and **it does not count against quota**. Only models a SuperAdmin has
**approved** are reused for other restaurants; a restaurant's own freshly generated model is attached to its own item at once, and is also reused
(free) for that same restaurant's other matching items while it awaits review, but is not shared with other restaurants until approved.
A rejected model is never reused. Send `ForceNew: true` (single or
bulk) to skip the library and always generate a fresh model. Library hits in a bulk call appear in
`Created` with `Status` `Ready`. If the item has gallery photos, the primary photo is used as the
3D source image; AI variants are never used as a 3D source.

**Photo jobs.** `ModelGenerationJobDto.Kind` distinguishes 3D (`0`) from photo (`1`) jobs; filter
the list with `?kind=`. Quota (`GET .../quota`) is shared by 3D generations, AI photos and variants;
library reuse is free.

**Viewer note (FE).** The backend serves textured GLB/USDZ. Show the GLB in a viewer with
zoom/rotate, e.g. `<model-viewer src="{glbUrl}" camera-controls auto-rotate ar ios-src="{usdzUrl}">`
(USDZ is used for iOS AR Quick Look).

Generation is now **queued** (see the status/queue notes above): the trigger responds immediately with `Pending`, and a background
worker later sends the job to the provider and polls it; **frontend should poll** `GET .../{id}` (or listen for the
`notificationReceived` push) to observe `Pending → Processing → Ready|Failed|Cancelled`. The same queue serves AI photos and variants
(`Kind = 1`), whose trigger endpoints (the AI-photo routes above) now also return `Pending`.

**Bulk trigger** — pairs with `GET api/menu-items?withoutModelOnly=true` to power a multi-select
"generate 3D models" action. Best-effort, never an all-or-nothing `400`: every `MenuItemId` gets
either a created job or a skip reason back in the same response.

```
BulkModelGenerationJobResultDto: { Created: ModelGenerationJobDto[], Skipped: BulkModelGenerationSkippedItemDto[] }
BulkModelGenerationSkippedItemDto: { MenuItemId: Guid, Reason: string }
```

`BulkModelGenerationJobResultDto` also carries `BatchId: Guid` (shared by all `Created` jobs; use it for
`GET ...?batchId=` and `POST .../batches/{batchId}/cancel`). A request may list at most **500** items (`400` otherwise).

`Reason` is one of: `NotFound` (unknown item / not yours), `AlreadyProcessing` (item already has a `Pending`/`Processing` job — poll
the existing one instead), `QuotaExceeded` (daily cap reached partway through the batch),
`MonthlyQuotaExceeded` (monthly cap reached partway through the batch), `NoMeaningfulChange`
(item already has a `Ready` model and hasn't changed enough to regenerate — see above). Provider errors no longer skip items at
request time: the job is queued and, if the provider later rejects it, ends `Failed`. Frontend should surface `Created` as "started" (poll each via
`GET api/model-generation-jobs/{id}`) and `Skipped` as a per-item reason list, not a single
batch-level error. Quota is Restaurant API only; trigger, bulk trigger and both cancel endpoints also exist on the Integration API
(with `metadata` support) — see §6. The Restaurant API rejects `Metadata`/`MetadataByMenuItemId` with `400`
`"Client metadata can only be sent by an integration API key."`.

### NotificationsController — `api/notifications` — admin inbox + realtime push

JWT only (the usual `Authorization` + `X-Api-Key` + `X-Tenant-Id` headers of §2.1; no `[RequirePermission]` group — every admin sees only
their own notifications).

| Method + Route | Request | Response |
|---|---|---|
| `GET api/notifications` | Query `NotificationFilter`: `IsRead: bool?`, `Type: NotificationType?`, plus `page`/`pageSize` | `PaginatedDataDto<NotificationDto>` (newest first) |
| `GET api/notifications/unread-count` | none | `int` |
| `POST api/notifications/{id:guid}/read` | route `id` | `204` / `404` (unknown or someone else's) |
| `POST api/notifications/read-all` | none | `int` — how many were marked read |

`NotificationDto`: `Id`, `Type: NotificationType` (`0` GenerationReady, `1` GenerationFailed, `2` GenerationCancelled, `3` BatchCompleted,
`4` Announcement, `6` Model3DAssetApproved, `7` Model3DAssetRejected, `8` CreditsPurchased, `9` SubscriptionExpiring), `Title`, `Body` (localized per the request language, English
fallback), `RestaurantId?`, `MenuItemId?`, `JobId?`, `BatchId?`, `Model3DAssetId?` (use them to deep-link: open the item / job / batch),
`IsRead`, `CreationDateTime`. `6`/`7` tell the admins that a 3D model their restaurant generated was approved / not approved for reuse by
other restaurants (`7`'s body includes the SuperAdmin's reason, plain text); the model stays on their own item either way. SuperAdmin announcements
(`Type = 4`) are **plain text**: render `Title`/`Body` as text, never as HTML.

`9` is sent to all the tenant's active admins 30, 7 and 1 days before the subscription ends (not once it is renewed
with a later end date). It has no ids to deep-link: open the dashboard's subscription card. For an API key's own
subscription it goes to that key's inbox and webhook.

**Realtime (SignalR).** Hub path: `/hubs/notifications` on the Restaurant API host. Server-push only (no client-callable methods).

- **Auth**: the same admin JWT. Browsers cannot set headers on a WebSocket, so send it as `?access_token=<jwt>` — this is accepted
  **only** for `/hubs/*` paths and never for normal REST calls. A SuperAdmin token, an inactive admin or an inactive tenant is
  refused at connect.
- **Event**: `notificationReceived`, payload (camelCase JSON; enums are numbers):

```json
{
  "notification": { "id": "…", "type": 0, "title": "Your 3D model is ready", "body": "…", "restaurantId": "…", "menuItemId": "…",
                    "jobId": "…", "batchId": null, "isRead": false, "creationDateTime": "2026-11-12T10:15:30Z" },
  "ar": { "title": "…", "body": "…" },
  "unreadCount": 4
}
```

  `notification.title/body` are English; `ar` holds the Arabic text (English when none was stored) — show whichever matches your UI
  language. `unreadCount` is the recipient's count at push time.
- **Delivery is at-least-once**: dedupe by `notification.id` (a re-sent push can arrive after a server hiccup).
- **Reconnect**: the push is only a hint — after (re)connecting (`onreconnected`), reload `GET unread-count` (and the list if the
  panel is open). Pushes older than 24 h that were never delivered are not replayed; they stay in the inbox.

```js
const conn = new signalR.HubConnectionBuilder()
  .withUrl(`${restaurantBaseUrl}/hubs/notifications`, { accessTokenFactory: () => adminToken })
  .withAutomaticReconnect().build();
const seen = new Set();
conn.on('notificationReceived', ({ notification, ar, unreadCount }) => {
  if (seen.has(notification.id)) return;
  seen.add(notification.id);
  showToast(lang === 'ar' ? ar.title : notification.title);   // as text, not HTML
  setBadge(unreadCount);
});
conn.onreconnected(() => refreshUnreadCount());
await conn.start();
```

Operations note: connections live in one process's memory — see `docs/DEPLOYMENT-SECURITY.md` for the single-instance / Redis
backplane constraint.

### MenuItem3DModelsController — `api/menu-item-3d-models` (permission group `MenuItem3DModels`)

Manual-upload path (AI-generated models come from `ModelGenerationJobsController` instead).

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/menu-item-3d-models` | `.View` | Query `MenuItem3DModelFilter`: `MenuItemId: Guid?` | `PaginatedDataDto<MenuItem3DModelDto>` |
| `GET api/menu-item-3d-models/{id:guid}` | `.View` | route `id` | `MenuItem3DModelDto` |
| `POST api/menu-item-3d-models` | `.Add` | `CreateMenuItem3DModelDto`: `MenuItemId`, `GlbUrl: string`, `UsdzUrl?`, `ThumbnailUrl?` (by URL, not file) | `MenuItem3DModelDto` |
| `POST api/menu-item-3d-models/upload` | `.Add` | multipart: `menuItemId: Guid`, `glbFile: IFormFile`, `usdzFile: IFormFile?`, `thumbnailFile: IFormFile?` | `MenuItem3DModelDto` |
| `PUT api/menu-item-3d-models/{id:guid}` | `.Edit` | `UpdateMenuItem3DModelDto`: `GlbUrl?`, `UsdzUrl?`, `ThumbnailUrl?`, `IsActive: bool` | `MenuItem3DModelDto` |
| `DELETE api/menu-item-3d-models/{id:guid}` | `.Delete` | route `id` | `200` |

`MenuItem3DModelDto`: `Id`, `MenuItemId: Guid`, `GlbUrl: string?`, `UsdzUrl: string?`,
`ThumbnailUrl: string?`, `SourceType: ModelSourceType`, `GenerationStatus:
ModelGenerationStatus`, `IsActive: bool`. Both create paths force `SourceType = ManualUpload`,
`GenerationStatus = Ready` server-side.

### MenuThemesController — `api/menu-themes` (permission group `MenuThemes`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/menu-themes` | `.View` | Query `MenuThemeFilter`: `RestaurantId: Guid?`, `ThemeMode: ThemeMode?`, `IsActive: bool?` | `PaginatedDataDto<MenuThemeDto>` |
| `GET api/menu-themes/{id:guid}` | `.View` | route `id` | `MenuThemeDto` |
| `POST api/menu-themes` | `.Add` | `CreateMenuThemeDto` (see below) | `MenuThemeDto` |
| `PUT api/menu-themes/{id:guid}` | `.Edit` | `UpdateMenuThemeDto` (see below) | `MenuThemeDto` |
| `DELETE api/menu-themes/{id:guid}` | `.Delete` | route `id` | `200` |
| `POST api/menu-themes/{id:guid}/activate` | **`.Activate`** | route `id` | `MenuThemeDto` |
| `POST api/menu-themes/{id:guid}/background-image` | `.Edit` | multipart `file: IFormFile` | `MenuThemeDto` |
| `POST api/menu-themes/{id:guid}/header-logo` | `.Edit` | multipart `file: IFormFile` | `MenuThemeDto` |

Shared theme fields (Create additionally requires `RestaurantId: Guid`, `ThemeMode: ThemeMode`;
`MenuThemeDto` additionally has `Id`, `RestaurantId`, `IsActive: bool`):
```
Name: string
MenuBackgroundColor / MenuBackgroundImageUrl: string?
HeaderBackgroundColor / HeaderTextColor / HeaderLogoUrl: string?
HeaderLogoPosition: HeaderLogoPosition
FooterBackgroundColor / FooterTextColor: string?
CategoryBackgroundColor / CategoryTextColor: string?
SubCategoryBackgroundColor / SubCategoryTextColor: string?
ItemBackgroundColor / ItemTextColor: string?
HeaderFooterFontFamily / CategoryFontFamily / SubCategoryFontFamily / ItemFontFamily: string?
PageTransitionEffect: PageTransitionEffect
```

Rules: new themes start `IsActive = false`; only `/activate` flips it on, and deactivates all
*other* themes for the same `RestaurantId` + `ThemeMode` (Light and Dark can each have their
own independently-active theme). `RestaurantId`/`ThemeMode` are immutable after creation.

### RestaurantsController — `api/restaurants` (permission group `Restaurants`) — read + branding-update only

Creation happens only in `Shoof.Api.SuperAdmin` at tenant onboarding — `Restaurants.Add`/`.Delete`
are not wired on this API at all.

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/restaurants` | `.View` | Query `RestaurantFilter`: `TenantId: Guid?`, `CountryIds: Guid[]?` | `PaginatedDataDto<RestaurantDto>` |
| `GET api/restaurants/{id:guid}` | `.View` | route `id` | `RestaurantDto` |
| `PUT api/restaurants/{id:guid}` | `.Edit` | `UpdateRestaurantDto`: `NameEn`, `NameAr?`, `LogoUrl?`, `ContactEmail?`, `ContactPhone?`, `CurrencyId: Guid`, `CountryId: Guid` | `RestaurantDto` |
| `POST api/restaurants/{id:guid}/logo` | `.Edit` | multipart `file: IFormFile` | `RestaurantDto` |

`ContactEmail` (one valid address, ≤ 256) and `ContactPhone` (≤ 50) are optional; blank is saved as
`null`. Errors: `400` "The contact email address is not valid." / "The contact phone number is too
long (50 characters at most).". Subscription-expiry reminder emails go to `ContactEmail`, or to the
Owner admins' emails when it's empty. `PUT` replaces every field, so send the current contact values
back when editing something else.

`RestaurantDto`: `Id`, `TenantId: Guid`, `Name: string` (resolved), `LogoUrl: string?`,
`ContactEmail: string?`, `ContactPhone: string?`, `CurrencyId: Guid`, `CurrencyIsoCode: string?`, `CountryId: Guid`, `CountryIsoCode: string?`,
`CountryName: string?`, `TimeZoneId: string?` (the IANA zone this restaurant's date/time fields
are converted to — see §3.1's timezone-aware-responses rule).

### AdminUsersController — `api/admin-users` (permission group `AdminUsers`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/admin-users` | `.View` | Query `AdminUserFilter`: `IsActive: bool?` | `PaginatedDataDto<AdminUserDto>` |
| `GET api/admin-users/{id:guid}` | `.View` | route `id` | `AdminUserDto` / `404` |
| `POST api/admin-users` | `.Add` | `CreateAdminUserDto`: `FullName`, `Email`, `PhoneNumber?`, `Password`, `Roles: List<string>` (role names) | `AdminUserDto` |
| `PUT api/admin-users/{id:guid}` | `.Edit` | `UpdateAdminUserDto`: `FullName`, `PhoneNumber?`, `IsActive: bool`, `Roles: List<string>` | `AdminUserDto` |
| `DELETE api/admin-users/{id:guid}` | `.Delete` | route `id` | `200` |

`AdminUserDto`: `Id`, `TenantId: Guid`, `FullName: string`, `Email: string?`, `PhoneNumber:
string?`, `IsActive: bool`, `IsPrimary: bool`, `Roles: List<string>`.

**Primary admin (`IsPrimary: true`, at most one per tenant):** the admin seeded with the restaurant. A `DELETE`,
or a `PUT` that deactivates them or omits the Owner role, returns `400` "The restaurant's primary admin can't
be deleted, deactivated or removed from the Owner role." Name, phone and other roles can still change.

**Granting Owner:** only a caller who holds the Owner role can give it to a new or existing admin, else `400`
"Only an Owner can give someone the Owner role." Re-sending it for someone who already has it is fine.

**Granting other roles:** a non-Owner can only give a role whose every permission they hold, else `400` "You can
only grant permissions you have yourself. You don't have: ...". Roles the user already has can be re-sent.
Reactivating someone counts as giving them all of their roles (including Owner).

**Removing an Owner:** only an Owner can delete, deactivate or take the Owner role from an Owner, else `400` "Only
an Owner can delete, deactivate or remove the Owner role from another Owner."

**Unknown roles:** any role name that doesn't exist returns `400` "These roles don't exist: ..." and nothing is saved.

**Last Owner rule** (applies to restaurants without a primary admin): a tenant always keeps at least one active member of its Owner role. A `PUT`
that deactivates the last one or removes the Owner role from them, and a `DELETE` of the last one,
return `400` "This is the restaurant's last active Owner. Assign the Owner role to another active
admin first.". Give someone else the Owner role first.

### RolesController — `api/roles` (permission group `Roles`) — tenant-scoped role management

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/roles` | `.View` | Query `AdminRoleFilter` (no extra fields) | `PaginatedDataDto<AdminRoleListDto>` (lighter than the get-by-id shape) |
| `GET api/roles/{id:guid}` | `.View` | route `id` | `AdminRoleDto` (full) |
| `GET api/roles/permissions` | `.View` | — | `List<PermissionGroupDto>` — restaurant-scope groups only (§2.3), for building the role-editor UI |
| `POST api/roles` | `.Add` | `CreateAdminRoleDto`: `Name`, `Description?`, `Permissions: List<string>` | `AdminRoleDto` |
| `PUT api/roles/{id:guid}` | `.Edit` | `UpdateAdminRoleDto`: `Name`, `Description?`, `Permissions: List<string>` | `AdminRoleDto` |
| `DELETE api/roles/{id:guid}` | `.Delete` | route `id` | `200` |

`AdminRoleDto`: `Id`, `TenantId: Guid`, `Name: string`, `Description: string?`, `IsOwner: bool`,
`Permissions: List<string>`. `AdminRoleListDto`: `Id`, `Name`, `Description?`, `IsOwner: bool`.
`PermissionGroupDto`: `Group: string`, `Permissions: List<string>`.

**Deleting a role:** removes it from everyone who had it. They lose its permissions within 30 seconds (the
permission cache) and there is no undo, so confirm before calling it. The name can be used again: a new role
with that name starts with no members.

**Granting permissions:** a non-Owner can only create a role with, or add to a role, permissions they hold
themselves, else `400` "You can only grant permissions you have yourself. You don't have: ...". Permissions the
role already has can be re-sent. An Owner can grant any restaurant permission.

**Owner role (`IsOwner: true`, one per tenant):** read-only except for adding permissions. A `PUT`
that changes `Name` or `Description` or drops any current permission, and any `DELETE`, return
`400` "The Owner role can't be renamed, deleted or lose permissions. You can only add new
permissions to it.". In the UI: show a badge, disable name/description, lock the checked boxes, and
hide Delete.

### CurrenciesController — `api/currencies` (permission group `Currencies`) — read-only here

Currency is a shared platform lookup owned/written by `Shoof.Api.SuperAdmin`; exposed here
read-only for the admin dashboard's currency picker.

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/currencies` | `.View` | Query `CurrencyFilter` (no extra fields) | `PaginatedDataDto<CurrencyDto>` |
| `GET api/currencies/{id:guid}` | `.View` | route `id` | `CurrencyDto` |

`CurrencyDto`: `Id`, `IsoCode: string`, `Symbol: string`, `DisplayName: string`,
`DecimalPlaces: int`.

### CountriesController — `api/countries` (permission group `Countries`) — read-only here

Country is a shared platform lookup owned/written by `Shoof.Api.SuperAdmin`; exposed here
read-only for the restaurant admin dashboard's country picker.

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/countries` | `.View` | Query `CountryFilter` (no extra fields) | `PaginatedDataDto<CountryDto>` |
| `GET api/countries/{id:guid}` | `.View` | route `id` | `CountryDto` |

`CountryDto`: `Id`, `IsoCode: string`, `NameEn: string`, `NameAr: string?`, `TimeZoneId: string`.

### DashboardController — `api/dashboard` (permission group `RestaurantDashboard`) — read-only

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/dashboard/overview` | `.View` | Query `RestaurantDashboardFilter`: `RestaurantId: Guid?`, `FromDate: DateTime?`, `ToDate: DateTime?` | `RestaurantDashboardOverviewDto` |
| `GET api/dashboard/export` | `.View` | Query `RestaurantDashboardFilter` (same) | Binary `.xlsx` download (`restaurant-dashboard.xlsx`) |

```
RestaurantDashboardOverviewDto
├─ MenuContent: { RestaurantCount, CategoryCount, ActiveItemCount, InactiveItemCount,
│                 ItemsMissingIngredientsCount, ItemsMissingModelCount: int }
├─ Models: { Counts: { Pending, Processing, Ready, Failed: int },
│            RecentFailedJobs: [{ JobId, MenuItemId, MenuItemName, ErrorMessage?, RetryCount }] }
├─ TablesAndQr: { TotalTables, ActiveTables, TablesWithQrCode, TablesWithoutQrCode,
│                 RestaurantsWithGeneralQrCodeCount: int }
├─ Subscription: { HasRegistration: bool, Price?: decimal, DiscountType?, Discount?: decimal,
│                   EffectivePrice: decimal, CurrencyCode?, FromDate?, ToDate?,
│                   DaysRemaining?: int, IsActive: bool, PlanName?: string, SupportTierName?: string }
└─ GenerationUsage: { DailyUsed: int, DailyLimit?: int, DailyRemaining?: int,
                       MonthlyUsed: int, MonthlyLimit?: int, MonthlyRemaining?: int,
                       ExtraCreditsRemaining: int, ExtraCreditsNearestExpiryUtc?: DateTime }
```

`GenerationUsage` is the **restaurant's own pool** (what staff generations count against): generations made by API keys that have
their own subscription are not included. `MonthlyUsed` counts plan-allowance generations only (credit-paid ones are excluded).

`GenerationUsage`'s `DailyLimit`/`MonthlyLimit`/`*Remaining` are null when the tenant's plan has no
cap for that period (unlimited) — same convention as `ModelGenerationQuotaDto` above.
`Subscription.FromDate`/`ToDate` are restaurant-local when the request's `RestaurantId` filter is
set, else `Asia/Damascus`.

### PortalController — `api/portal` — anonymous customer-facing menu site

`[ApiKeyProtected("Portal")]` only — **no JWT, no `X-Tenant-Id`**. Rate-limited 60 req/min/IP
(`"portal"` policy). Tenant is resolved from the request's `Host` header subdomain (leading
`www.` stripped; a bare host with no dot is used as-is, for local dev).

| Method + Route | Request | Response |
|---|---|---|
| `GET api/portal/restaurant` | — (tenant via Host) | `PortalRestaurantDto` / `404` |
| `GET api/portal/menu` | — | `List<PortalMenuCategoryDto>` / `404` |
| `GET api/portal/theme` | — | `MenuThemeDto` / `404` |
| `GET api/portal/social-links` | — | `List<RestaurantSocialLinkDto>` / `404` |
| `GET api/portal/currencies` | Query `CurrencyFilter` | `PaginatedDataDto<CurrencyDto>` |

```
PortalRestaurantDto: { Id, Name, LogoUrl?, CurrencyIsoCode?, CurrencySymbol? }
PortalMenuCategoryDto: { Id, Name, Description?, DisplayOrder,
                          SubCategories: PortalMenuCategoryDto[] (recursive),
                          Items: PortalMenuItemDto[] }
PortalMenuItemDto: { Id, Name, Description?, Price, CurrencyIsoCode?, DisplayOrder,
                      Ingredients: PortalIngredientDto[], Models: PortalMenuItem3DModelDto[],
                      Images: MenuItemImageDto[] }  // lowest DisplayOrder = primary photo
PortalIngredientDto: { Id, Name, Description?, Note?, IsRemovable }
PortalMenuItem3DModelDto: { Id, GlbUrl?, UsdzUrl?, ThumbnailUrl? }
```

This is the endpoint set a **public menu website / QR-landing frontend** should build against —
distinct from the admin dashboard, which uses everything else in this section.

---

## 5. Shoof.Api.SuperAdmin — endpoint reference

Base URL (dev): `https://localhost:7060`. Every endpoint requires `Authorization: Bearer <jwt>`
(SuperAdminUser token) — **no `X-Api-Key`, no `X-Tenant-Id`** (this API is cross-tenant by
design). See §2.1/§2.3 for auth/permission mechanics.

Most controllers extend generic base classes providing standard CRUD shape:
- Query-only base: `GET {prefix}` (paged list) + `GET {prefix}/{id:guid}` (detail, 404 if missing)
- Command base (adds): `POST {prefix}` (create) + `PUT {prefix}/{id:guid}` (update, route `id`
  overwrites body `Id`) + `DELETE {prefix}/{id:guid}`

### AuthController — `api/auth`
Identical to the Restaurant API's (§2.1/§4) — `POST login`, `POST refresh`, `POST revoke`.
`AuthResultDto.Roles` is always `[]` for SuperAdmin tokens (no roles feature).

### AccountController — `api/account`
Same routes as the Restaurant API's (§2.1a), without the slug: `POST change-password`, `GET/PUT me`
(only the primary SuperAdmin may change its email), `POST forgot-password` `{ email }` (never
for the primary), `POST reset-password` `{ email, token, newPassword }`.

### Setting temporary passwords
Set a temporary password the owner must change on next login; the owner's sessions are revoked.

| Method + Route | Permission | Body → result |
|---|---|---|
| `POST api/password-resets/tenants/{tenantId}/admin-users/{userId}` | `PasswordResets.Add` | `{ temporaryPassword }` → `204`; `404` if the admin isn't in that tenant |
| `POST api/super-admin-users/{id}/reset-password` | `SuperAdminUsers.Edit` | `{ temporaryPassword }` → `204`; `400` for the primary SuperAdmin, yourself (use change-password), or someone holding permissions you don't |

The primary SuperAdmin also can't be the target of `PUT/DELETE api/super-admin-users/{id}` or
`PUT .../{id}/permissions` (`400`).

### TenantsController — `api/tenants` (permission group `Tenants`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/tenants` | `.View` | Query `TenantFilter`: `IsActive: bool?` | `PaginatedDataDto<TenantDto>` |
| `GET api/tenants/{id:guid}` | `.View` | route `id` | `TenantDto` (only this call populates `Registrations`) |
| `POST api/tenants` | `.Add` | `CreateTenantDto`: `Name: string`, `Slug: string` | `TenantDto` |
| `PUT api/tenants/{id:guid}` | `.Edit` | `UpdateTenantDto`: `Name`, `IsActive: bool`, `Slug` | `TenantDto` |
| `DELETE api/tenants/{id:guid}` | `.Delete` | route `id` | `200` |
| `POST api/tenants/{id:guid}/bootstrap-admin` | `.Add` | `BootstrapTenantAdminDto`: `FullName`, `Email`, `Password` | `AdminUserDto` |
| `GET api/tenants/{id:guid}/usage` | `.View` | route `id` | `TenantUsageDto` |
| `GET api/tenants/lookup` | `.View` | Query `TenantLookupFilter`: `Search: string?` | `PaginatedDataDto<TenantLookupDto>` (cheap `{Id, Name}` typeahead) |

`bootstrap-admin` idempotently find-or-creates the locked "Owner" `AdminRole` (every Restaurant-side
permission) and creates an `AdminUser` under it, marked `IsPrimary` if the tenant has no primary admin yet. For a new customer, prefer the
single-call onboarding `POST api/restaurants` below, which does tenant + restaurant + Owner in one go.

```
TenantDto: { Id, Name, IsActive, Slug, CreationDateTime, Registrations: RegistrationDto[] }
TenantUsageDto: { TenantId, MenuItemsCount, ModelGenerationJobsTriggeredCount,
                   ActiveApiKeysCount, ApiKeys: [{ Id, ClientName, IsActive, LastUsedAt? }] }
TenantLookupDto: { Id, Name }
```

`CreationDateTime` and each `Registrations[].FromDate/ToDate` follow the timezone rule in §3.1.

### RestaurantsController — `api/restaurants` (permission group `Restaurants`) — query-only + create

No PUT/DELETE at all — branding updates happen on `Shoof.Api.Restaurant` instead.

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/restaurants` | `.View` | Query `RestaurantFilter`: `TenantId: Guid?`, `CountryIds: Guid[]?` | `PaginatedDataDto<RestaurantDto>` (true cross-tenant view, bypasses the tenant query filter) |
| `GET api/restaurants/{id:guid}` | `.View` | route `id` | `RestaurantDto` |
| `POST api/restaurants` | `.Add` | `OnboardRestaurantDto` (below) | `RestaurantDto` |
| `GET api/restaurants/permissions` | `.View` | — | `List<PermissionGroupDto>` — what the new Owner role is granted |

**`POST api/restaurants` onboards a new customer** — it always creates a **new tenant** (it no
longer takes a `TenantId`):

```
OnboardRestaurantDto: {
  nameEn, nameAr?, currencyId, countryId, contactEmail?, contactPhone?,
  tenant: { name, slug },                 // same rules as POST api/tenants
  admin:  { fullName, email, password }   // the restaurant's first admin
}
```

In one transaction it creates the tenant, the restaurant, the locked Owner role (every restaurant
permission) and the admin in it. The admin gets `mustChangePassword: true`, so send them the
password and they replace it at first login. All checks run before anything is saved; on any
`400` nothing is created: slug errors ("Slug is required.", "…lowercase letters, digits, and
hyphens.", "…reserved…", "Slug '…' is already taken by another tenant."), password rule
violations, or invalid contact email/phone. Then create the subscription (`api/registrations`)
for the new `tenantId` from the response.

`RestaurantDto` field shapes are identical to §4's `RestaurantsController` above (including
`ContactEmail`/`ContactPhone`, `CountryId`/`CountryIsoCode`/`CountryName`/`TimeZoneId`).

### ApiKeysController — `api/api-keys` (permission group `ApiKeys`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/api-keys` | `.View` | Query `ApiKeyFilter`: `TenantId: Guid?`, `IsActive: bool?` | `PaginatedDataDto<ApiKeyDto>` |
| `GET api/api-keys/{id:guid}` | `.View` | route `id` | `ApiKeyDto` |
| `POST api/api-keys` | `.Add` | `CreateApiKeyDto`: `TenantId`, `ClientName`, `ExpiresAt: DateTime?`, `RateLimitPerMinute: int?` | `ApiKeyDto` (`PlainTextKey` populated **only** here — never retrievable again) |
| `PUT api/api-keys/{id:guid}` | `.Edit` | `UpdateApiKeyDto`: `ClientName`, `IsActive`, `ExpiresAt?`, `RateLimitPerMinute?` | `ApiKeyDto` |
| `DELETE api/api-keys/{id:guid}` | `.Delete` | route `id` | `200` |
| `GET api/api-keys/lookup` | `.View` | Query `ApiKeyLookupFilter`: `Search?`, `TenantId?` | `PaginatedDataDto<ApiKeyLookupDto>` |
| `POST api/api-keys/{id:guid}/rotate` | `ApiKeyRotation.Rotate` (own group) | `RotateApiKeyDto`: `GraceHours: int` (default 24, 1..168) | `ApiKeyDto` of the **new** key, `PlainTextKey` populated **only** here |
| `PUT api/api-keys/{id:guid}/allowed-ip-ranges` | `ApiKeyAllowedIps.Edit` (own group) | `UpdateApiKeyAllowedIpRangesDto`: `AllowedIpRanges: string[]` (≤ 50 CIDRs or single IPs; `[]` = any IP) | `ApiKeyDto` (ranges normalized, e.g. `203.0.113.7` → `203.0.113.7/32`) |

`ApiKeyDto`: `Id`, `TenantId`, `ClientName`, `KeyPrefix: string`, `IsActive`, `ExpiresAt?`,
`LastUsedAt?` (accepted calls only), `RateLimitPerMinute?`, `AllowedIpRanges: string[]`, `ReplacedByApiKeyId?`,
`LineageId`, `PlainTextKey?`, `WebhookUrl?` (query string and fragment removed), `WebhookEnabled: bool`.

**Rotation**: the new key gets the same tenant, client name, rate limit, IP allowlist, webhook (URL,
secret, enabled) and expiry; the old key keeps working until `min(its ExpiresAt, now + GraceHours)`,
then `401`. The old key's webhook is switched off (the new key receives events — no duplicates) and its
unfinished (`Pending`) webhook deliveries move to the new key unchanged. Registrations are never touched:
both keys share a `LineageId`, and a key-scoped registration of any key in the lineage covers all of them
(so the old key stays covered during grace, and billing history/reports keep the original key id). The
grace expiry of a rotated key can be shortened via `PUT api/api-keys/{id}` but never extended or cleared
(`400`), and new registrations cannot target a rotated key (`400` — register the replacement). Two
concurrent rotations of one key: exactly one wins, the other gets `400`. An `AuditLogEntry` (source `ApiKeys.Rotate`: SuperAdmin id, old/new key ids,
grace) is written — never the key. Only an active, unexpired, not-yet-rotated key can be rotated (`400`).
Request/response bodies of this route are never logged.

**Allowed IP ranges**: each entry must parse as a CIDR or single IP; rejected (`400`): host bits set
(`10.0.0.5/24`), `/0`, IPv4 shorthands (`10.1`), zone ids, more than 50 entries. `ApiKeyLookupDto`: `Id`, `ClientName`,
`TenantId`, `TenantName`.

`ExpiresAt?`/`LastUsedAt?` follow the timezone rule in §3.1 — this is the same conversion (same
underlying service) on both the SuperAdmin and Integration (B2B self-service) responses.

### CurrenciesController — `api/currencies` (permission group `Currencies`) — full CRUD (write side lives here)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/currencies` | `.View` | Query `CurrencyFilter` | `PaginatedDataDto<CurrencyDto>` |
| `GET api/currencies/{id:guid}` | `.View` | route `id` | `CurrencyDto` |
| `POST api/currencies` | `.Add` | `CreateCurrencyDto`: `IsoCode`, `Symbol`, `DisplayName`, `DecimalPlaces: int` (default 2) | `CurrencyDto` |
| `PUT api/currencies/{id:guid}` | `.Edit` | `UpdateCurrencyDto`: `Symbol`, `DisplayName`, `DecimalPlaces` | `CurrencyDto` |
| `DELETE api/currencies/{id:guid}` | `.Delete` | route `id` | `200`; `400` while in use |

### CountriesController — `api/countries` (permission group `Countries`) — full CRUD

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/countries` | `.View` | Query `CountryFilter` | `PaginatedDataDto<CountryDto>` |
| `GET api/countries/{id:guid}` | `.View` | route `id` | `CountryDto` |
| `POST api/countries` | `.Add` | `CreateCountryDto`: `IsoCode`, `NameEn`, `NameAr?`, `TimeZoneId` (must be a valid IANA id) | `CountryDto` |
| `PUT api/countries/{id:guid}` | `.Edit` | `UpdateCountryDto`: `IsoCode`, `NameEn`, `NameAr?`, `TimeZoneId` | `CountryDto` |
| `DELETE api/countries/{id:guid}` | `.Delete` | route `id` | `200`; `400` while in use |

### RegistrationsController — `api/registrations` (permission group `Registrations`) — billing records

**When a subscription ends with no renewal, the tenant (or key) is switched off.** Before Release 1.1 that happens
even with a renewal, so renew with `upgrade` until then. Reactivate by hand after a lapse: §3.5.

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/registrations` | `.View` | Query `RegistrationFilter`: `TenantId?`, `ApiKeyId?`, `PlanId?`, `SupportTierId?`, `IsActive?` | `PaginatedDataDto<RegistrationDto>` |
| `GET api/registrations/{id:guid}` | `.View` | route `id` | `RegistrationDto` |
| `POST api/registrations` | `.Add` | `CreateRegistrationDto` (below) | `RegistrationDto` |
| `PUT api/registrations/{id:guid}` | `.Edit` | `UpdateRegistrationDto` (below) | `RegistrationDto` |
| `DELETE api/registrations/{id:guid}` | `.Delete` | route `id` | `200` |
| `POST api/registrations/{id:guid}/upgrade` | `.Add` | `UpgradeRegistrationDto` (below) | `RegistrationDto` |

Exactly one of `TenantId`/`ApiKeyId` must be set (validated server-side) — a registration bills
either a direct tenant or an API-key partner; both are immutable after creation, same as
`PlanId`/`SupportTierId` (see **Upgrade** below for how a plan actually changes).
`Price`/`CurrencyId`/`DiscountType`/`Discount` are nullable together (supports a free trial). When
`PlanId`/`SupportTierId` is set and `Price`/`SupportPrice` is omitted on create, it's copied from
the plan/support tier's current list price; an explicit value overrides that.

```
RegistrationDto: { Id, TenantId?, ApiKeyId?, Price?, CurrencyId?, CurrencyIsoCode?,
                    DiscountType?, Discount?, FromDate, ToDate, IsActive,
                    PlanId?, PlanName?, SupportPrice?, SupportTierId?, SupportTierName? }
CreateRegistrationDto: { TenantId?, ApiKeyId?, Price?, CurrencyId?, DiscountType?, Discount?,
                          FromDate, ToDate, PlanId?, SupportTierId?, SupportPrice? }
UpdateRegistrationDto: { Price?, CurrencyId?, DiscountType?, Discount?, FromDate, ToDate,
                          IsActive, SupportPrice? }
```

`RegistrationDto.FromDate/ToDate` follow the timezone rule in §3.1, resolved via the owning
tenant (`TenantId`, or the API key's tenant when the registration is `ApiKeyId`-billed instead).
`CreateRegistrationDto`/`UpdateRegistrationDto`'s `FromDate/ToDate` are the raw-UTC exception —
see §3.1.

**Upgrade** — ends the target registration (`IsActive = false`, `ToDate = now`) and creates a new
one on the given plan for the same subject, as a single atomic operation. This is the only way to
change a registration's plan — `PlanId`/`SupportTierId` aren't in `UpdateRegistrationDto` at all.

```
UpgradeRegistrationDto: { PlanId: Guid, SupportTierId?: Guid, CurrencyId?: Guid, FromDate?: DateTime, ToDate: DateTime }
```

### PlansController — `api/plans` (permission group `Plans`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/plans` | `.View` | Query `PlanFilter`: `IsActive?` | `PaginatedDataDto<PlanDto>` |
| `GET api/plans/{id:guid}` | `.View` | route `id` | `PlanDto` |
| `POST api/plans` | `.Add` | `CreatePlanDto` (below) | `PlanDto` |
| `PUT api/plans/{id:guid}` | `.Edit` | `UpdatePlanDto` (below) | `PlanDto` |
| `DELETE api/plans/{id:guid}` | `.Delete` | route `id` | `200` |

`DailyGenerationLimit`/`MonthlyGenerationLimit` are `null` for unlimited. `Price` is a
reference/list price only — what a `Registration` actually bills is a separate, independently
stored field (see `RegistrationsController` above).

```
PlanDto: { Id, Name, Price?: decimal, DailyGenerationLimit?: int, MonthlyGenerationLimit?: int, IsActive: bool }
CreatePlanDto: { Name, Price?, DailyGenerationLimit?, MonthlyGenerationLimit? }
UpdatePlanDto: { Name, Price?, DailyGenerationLimit?, MonthlyGenerationLimit?, IsActive }
```

### CreditPacksController — `api/credit-packs` (permission group `CreditPacks`) — extra-generation catalog

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/credit-packs` | `.View` | Query `CreditPackFilter`: `IsActive?` | `PaginatedDataDto<CreditPackDto>` |
| `GET api/credit-packs/{id:guid}` | `.View` | route `id` | `CreditPackDto` |
| `POST api/credit-packs` | `.Add` | `CreateCreditPackDto` | `CreditPackDto` |
| `PUT api/credit-packs/{id:guid}` | `.Edit` | `UpdateCreditPackDto` | `CreditPackDto` |
| `DELETE api/credit-packs/{id:guid}` | `.Delete` | route `id` | `200` |

```
CreditPackDto: { Id, Name, Credits: int, Price: decimal, CurrencyId, CurrencyCode?, IsActive: bool }
CreateCreditPackDto: { Name, Credits, Price, CurrencyId }
UpdateCreditPackDto: { Id, Name, Credits, Price, CurrencyId, IsActive }
```

`400` when `Name` is empty or > 100 chars, `Credits` is not 1..100000, `Price` < 0 or `CurrencyId` is unknown. A pack is a template:
editing or deleting it never changes purchases already recorded (they keep the copied name/credits/price/currency). Only active packs can be
purchased. Every write is audited.

### CreditPurchasesController — `api/credit-purchases` (permission group `CreditPurchases`) — recorded offline payments

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/credit-purchases` | `.View` | Query `CreditPurchaseFilter`: `TenantId?`, `ApiKeyId?` (matches the key's whole rotation lineage), `IsActive?` (`true` = not cancelled and not expired, `false` = expired or cancelled), `page`, `pageSize` (max 100) | `PaginatedDataDto<CreditPurchaseDto>` (newest first) |
| `GET api/credit-purchases/{id:guid}` | `.View` | route `id` | `CreditPurchaseDto` / `404` |
| `POST api/credit-purchases` | `.Add` | `RecordCreditPurchaseDto` | `CreditPurchaseDto` |
| `POST api/credit-purchases/{id:guid}/cancel` | `.Cancel` | route `id` | `CreditPurchaseDto` |

```
RecordCreditPurchaseDto: { CreditPackId, TenantId?: Guid, ApiKeyId?: Guid }   // exactly one of TenantId / ApiKeyId
CreditPurchaseDto: { Id, TenantId, TenantName?, ApiKeyId?, ApiKeyLineageId?, ApiKeyClientName?, CreditPackId, PackName, Credits: int,
                     RemainingCredits: int, UsedCredits: int, Price: decimal, CurrencyId, CurrencyCode?, RegistrationId,
                     ExpiresAt: DateTime (UTC), IsExpired: bool, CancelledAt?: DateTime, RecordedBySuperAdminId?, CreationDateTime }
```

Rules (all `400` with a localized message unless noted):
- Exactly one owner: `TenantId` (the restaurant's own pool) **or** `ApiKeyId` (that key's own pool). Both or neither → `400`.
- The owner must have an **active registration of its own right now**: for a restaurant, a tenant registration; for a key, a registration
  on the key (or its rotation lineage). A key that only rides on its restaurant's registration shares the restaurant pool and cannot hold
  credits — record the purchase for the restaurant instead. Message: "Extra credits can only be added while the owner has an active
  subscription of its own. Record or renew the subscription first."
- A rotated-out key (`ReplacedByApiKeyId` set) is refused — record it for the replacement key. Unknown/deleted key, tenant or pack → `404`;
  an inactive pack → `400`.
- `ExpiresAt` = `ToDate` of the owner's active registration at recording time; unused credits lapse then. Credits/price/currency are copied
  from the pack.
- Cancel is allowed only while **no** credit of the purchase has been used (`400` otherwise, or if already cancelled); a cancelled purchase
  has `RemainingCredits = 0`.
- Recording notifies the owner (`CreditsPurchased = 8`): the restaurant's active admins (in-app + SignalR) for a restaurant purchase, or the
  key (inbox + `notification.created` webhook when enabled) for a key purchase. Record and cancel are audited (ids and numbers only).

### SupportTiersController — `api/support-tiers` (permission group `SupportTiers`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/support-tiers` | `.View` | Query `SupportTierFilter`: `IsActive?` | `PaginatedDataDto<SupportTierDto>` |
| `GET api/support-tiers/{id:guid}` | `.View` | route `id` | `SupportTierDto` |
| `POST api/support-tiers` | `.Add` | `CreateSupportTierDto` (below) | `SupportTierDto` |
| `PUT api/support-tiers/{id:guid}` | `.Edit` | `UpdateSupportTierDto` (below) | `SupportTierDto` |
| `DELETE api/support-tiers/{id:guid}` | `.Delete` | route `id` | `200` |

```
SupportTierDto: { Id, Name, Price?: decimal, Description?: string, IsActive: bool }
CreateSupportTierDto: { Name, Price?, Description? }
UpdateSupportTierDto: { Name, Price?, Description?, IsActive }
```

### SuperAdminUsersController — `api/super-admin-users` (permission group `SuperAdminUsers`)

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/super-admin-users` | `.View` | Query `SuperAdminUserFilter` | `PaginatedDataDto<SuperAdminUserDto>` |
| `GET api/super-admin-users/{id:guid}` | `.View` | route `id` | `SuperAdminUserDto` |
| `POST api/super-admin-users` | `.Add` | `CreateSuperAdminUserDto`: `FullName`, `Email`, `Password` | `SuperAdminUserDto` |
| `PUT api/super-admin-users/{id:guid}` | `.Edit` | `UpdateSuperAdminUserDto`: `FullName`, `IsActive` | `SuperAdminUserDto` |
| `DELETE api/super-admin-users/{id:guid}` | `.Delete` | route `id` | `200` |
| `GET api/super-admin-users/{id:guid}/permissions` | `.View` | route `id` | `List<string>` |
| `PUT api/super-admin-users/{id:guid}/permissions` | `.Edit` | `UpdateSuperAdminUserPermissionsDto`: `Permissions: List<string>` | `List<string>` (invalid values silently dropped) |
| `GET api/super-admin-users/permissions` | `.View` | — | `List<PermissionGroupDto>` — SuperAdmin-scope permissions only (§2.3), grouped |

`SuperAdminUserDto`: `Id`, `FullName`, `Email?`, `IsActive` (no `IsPrimary`, §3.5). No Roles endpoint here —
SuperAdminUser is permission-based, not role-based.

**Permission limits** (the primary SuperAdmin is exempt): adding a permission you don't hold, or reactivating
someone who holds one, returns `400` "You can only grant permissions you have yourself. You don't have: ...".
Setting such a person's password returns `400` "You can't set the password of someone with permissions you don't
have: ...". Permissions the target already has can be re-sent.

### DashboardController — `api/dashboard` (permission group `Dashboard`) — platform-wide landing page

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/dashboard/overview` | `.View` | — | `DashboardOverviewDto` |
| `GET api/dashboard/alerts` | `.View` | — | `DashboardAlertsDto` |
| `GET api/dashboard/tenant-growth` | `.View` | Query `days: int` (`<=0` → default 30) | `List<TenantGrowthPointDto>` |

```
DashboardOverviewDto: { TotalTenants, ActiveTenants, TotalRestaurants, TotalMenuItems,
                         TotalApiKeys, ActiveApiKeys, ExpiredApiKeys: int,
                         Models: { Pending, Processing, Ready, Failed: int } }
DashboardAlertsDto: { ExpiringApiKeys: [{ ApiKeyId, ClientName, TenantId, TenantName, ExpiresAt }],
                       FailedGenerationJobs: [{ JobId, MenuItemId, MenuItemName, TenantId,
                                                 TenantName, ErrorMessage?, RetryCount }],
                       EmptyTenants: [{ TenantId, TenantName, RestaurantCount, MenuItemCount }] }
TenantGrowthPointDto: { Date: DateOnly, NewTenantCount: int, CumulativeTenantCount: int }
```

`DashboardAlertsDto.ExpiringApiKeys[].ExpiresAt` follows the timezone rule in §3.1.
`TenantGrowthPointDto.Date` is bucketed by `Asia/Damascus` calendar day, not UTC day.

### AuditLogEntriesController — `api/audit-log-entries` (permission group `AuditLogEntries`) — read-only

Entries are written internally only — no create/update/delete endpoints exist (`AppPermissions.AuditLogEntries` only defines `View`).

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/audit-log-entries` | `.View` | Query `AuditLogEntryFilter`: `TenantId?`, `Level: string?` | `PaginatedDataDto<AuditLogEntryDto>` |
| `GET api/audit-log-entries/{id:guid}` | `.View` | route `id` | `AuditLogEntryDto` |

`AuditLogEntryDto`: `Id`, `TenantId?`, `Level: string`, `Message: string`, `ExceptionDetails?`,
`Source?`, `CreationDateTime`.

`CreationDateTime` follows the timezone rule in §3.1, resolved via `TenantId` when set, else
`Asia/Damascus`.

### ModelGenerationJobsController — `api/tenants/{tenantId:guid}/model-generation-jobs` (permission group `ModelGenerationJobs`) — admin override only

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `POST api/tenants/{tenantId:guid}/model-generation-jobs/force-trigger` | `.Add` | `CreateModelGenerationJobDto`: `MenuItemId: Guid` | `ModelGenerationJobDto` / `404` if the item doesn't belong to `tenantId` |

Support-case admin override: bypasses only the "not changed enough to regenerate" lock (see §4's
`ModelGenerationJobsController`) for the given tenant's item — an active-job conflict and the
tenant's quota still apply. `tenantId` is explicit in the route since a SuperAdmin request has no
ambient tenant.

### GenerationSettingsController — `api/generation-settings` (permission group `GenerationSettings`)

Runtime-editable Meshy concurrency limits (one settings row, no deploy needed). The Meshy **API key is never stored here** (secrets only).

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/generation-settings` | `.View` | none | `GenerationSettingsDto` |
| `PUT api/generation-settings` | `.Edit` | `UpdateGenerationSettingsDto` (same fields) | `GenerationSettingsDto` |

Fields: `MeshyPlanName: string` (label, ≤ 100 chars), `MaxConcurrentTasks: int` (global cap, ≥ 1), `MaxConcurrentTasksPerTenant: int` (≥ 1 and
≤ `MaxConcurrentTasks`), `ImageModel: string` (Meshy model for text/image-to-image, ≤ 100 chars), `ImageTo3DModel: string` (≤ 100 chars).
Seeded default: `Pro`, **10** concurrent (the Meshy Pro limit), **2** per tenant, `nano-banana-2`, `meshy-6`. Raise the global cap only when the
Meshy plan allows it; the per-tenant cap is what keeps one restaurant from taking every slot. Invalid combinations return `400`
(`"Max concurrent tasks must be at least 1."`, `"Max concurrent tasks per tenant must be at least 1 and no more than the global maximum."`).
Changes apply to the running queue on its next tick.

### Model3DAssetsController — `api/model3d-assets` (permission group `Model3DAssets`) — shared 3D library approval

Every AI-generated 3D model enters a cross-tenant library. It is attached to the generating restaurant's own item at once, but it is
**reused for other restaurants' matching dishes only after approval here** (protects tenants from another tenant's unreviewed model).

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/model3d-assets` | `Model3DAssets.View` | Query `Model3DAssetReviewFilter`: `Status: Model3DAssetApprovalStatus` (default `0` Pending), `SourceTenantId: Guid?`, `page`/`pageSize` (≤ 100) | `PaginatedDataDto<Model3DAssetReviewDto>` (newest first) |
| `GET api/model3d-assets/{id:guid}` | `Model3DAssets.View` | route `id` | `Model3DAssetReviewDto` / `404` |
| `POST api/model3d-assets/{id:guid}/approve` | `Model3DAssets.Approve` | none | `Model3DAssetReviewDto` |
| `POST api/model3d-assets/{id:guid}/reject` | `Model3DAssets.Approve` | `RejectModel3DAssetDto`: `Reason` (required, plain text, ≤ 500) | `Model3DAssetReviewDto` |

`Model3DAssetReviewDto`: `Id`, `GlbUrl?`, `UsdzUrl?`, `ThumbnailUrl?` (full absolute URLs under the reserved slug `shared`, e.g.
`https://shared.shoof.lambdor.com/backend/shared/models/{file}.glb` — public, no headers; use them as-is for the preview, see §3.3
"Loading stored files"), `MatchText` (source dish "name description"), `IngredientNamesSignature`,
`SourceTenantId`, `SourceTenantName?`, `ApprovalStatus`, `CreationDateTime`, `ReviewedAt?`, `ReviewedBySuperAdminId?`, `RejectionReason?`.

- **Only a Pending model can be decided.** Approving/rejecting an already decided model is a localized `400` — also when another
  SuperAdmin decided a moment earlier (concurrent decisions are safe: exactly one wins). Unknown id: `404`. A missing/blank/over-long
  reason (or one containing control characters): `400`.
- **Rejection** stops the model from being shared; it does **not** remove it from the source restaurant's item and does not regenerate
  anything.
- The source restaurant's admins get an in-app notification + SignalR push (`6` Approved / `7` Rejected, the latter with the reason).
  No API-key / webhook notification is sent for decisions.
- Every decision is audited (who / which model / decision — not the reason text).

### NotificationsController — `api/notifications` — SuperAdmin's own inbox + realtime push

JWT only (no `[RequirePermission]`): every SuperAdmin sees only their **own** notifications; someone else's id is a `404`. Same shapes as
the Restaurant inbox (§4): `GET api/notifications` (`NotificationFilter`), `GET api/notifications/unread-count`,
`POST api/notifications/{id:guid}/read` (`204`/`404`), `POST api/notifications/read-all` (`int`).

- **`5` Model3DAssetPendingApproval** — created for **every active SuperAdmin holding `Model3DAssets.Approve`** when a new 3D model enters the library;
  `Model3DAssetId` points at it (open `GET api/model3d-assets/{id}`).
- **Realtime**: SignalR hub at `/hubs/notifications` **on the SuperAdmin host**, event `notificationReceived`, same payload as the
  Restaurant hub (`{ notification, ar: { title, body }, unreadCount }`, enums as numbers). Authenticate with the SuperAdmin JWT as
  `?access_token=` (accepted only on `/hubs/*`); a restaurant-admin token or an inactive SuperAdmin is refused. At-least-once: dedupe by
  `notification.id`; reload `unread-count` after reconnecting.

```js
const conn = new signalR.HubConnectionBuilder()
  .withUrl(`${superAdminBaseUrl}/hubs/notifications`, { accessTokenFactory: () => superAdminToken })
  .withAutomaticReconnect().build();
conn.on('notificationReceived', ({ notification, ar, unreadCount }) => { /* toast as text + badge */ });
await conn.start();
```

### NotificationsController — `api/notifications` (permission group `Notifications`) — broadcast announcements

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `POST api/notifications/broadcast` | `.Add` | `BroadcastNotificationDto` | `BroadcastResultDto` |

`BroadcastNotificationDto`: `BroadcastId: Guid?`, `TitleEn` (required, ≤ 150), `TitleAr?`, `BodyEn` (required, ≤ 2000), `BodyAr?`,
`AllRestaurants: bool`, `RestaurantIds: Guid[]` (≤ 1000). Targets: **exactly one of** `AllRestaurants = true` **or** a non-empty
`RestaurantIds` list (`400` for both/neither, for unknown restaurants, and for over-long text). Text is **plain text** — never rendered as HTML by any client.
`BroadcastResultDto`: `BroadcastId`, `TenantCount` (tenants that received at least one notification), `RecipientCount`.

- **Idempotency**: send your own `BroadcastId` (a GUID you keep with the form). A retry with the same value never double-sends (tenants already served are skipped, so a half-failed broadcast resumes), even
  if two requests race; the counts in the result include earlier attempts. Omit it to have the server generate one (returned in the result).
- **Recipients**: each targeted (active) tenant's admins get an inbox entry plus a SignalR push (§4); its API keys get an inbox entry
  (§6) and, when a webhook is enabled, a `notification.created` event.
- **Audit**: who/which broadcast/how many recipients is written to the audit log — never the message body. A failed broadcast is audited too.

### IntegrationRequestLogsController — `api/integration-request-logs` (permission group `IntegrationRequestLogs`) — read-only

Every Integration API call **and** every webhook delivery attempt, across all tenants, kept 180 days (append-only; only the retention job deletes).

| Method + Route | Permission | Request | Response |
|---|---|---|---|
| `GET api/integration-request-logs` | `.View` | Query `IntegrationRequestLogFilter`: `TenantId?`, `ApiKeyId?`, `ClientIp?`, `StatusCode?: int`, `Method?`, `PathContains?`, `Direction?: LogDirection` (`0` Inbound, `1` Outbound), `FromUtc?`, `ToUtc?`, `CorrelationId?` | `PaginatedDataDto<IntegrationRequestLogDto>` — **metadata only** |
| `GET api/integration-request-logs/{id:guid}` | `.View` | route `id` | `IntegrationRequestLogDetailDto` (adds sanitized headers + bodies) / `404` |

`IntegrationRequestLogDto`: `Id`, `Direction`, `TenantId?`, `ApiKeyId?`, `KeyPrefix?`, `ClientIp`, `UserAgent?`, `Method`, `Url` (query values
of sensitive-looking names redacted), `StatusCode?`, `DurationMs`, `RequestedAtUtc`, `BodyTruncated`, `ErrorType?`, `ErrorMessage?`,
`CorrelationId` (the `X-Correlation-Id` the partner sees), `WebhookDeliveryId?`. The detail adds `RequestHeadersJson?`, `RequestBody?`,
`ResponseBody?`. **Every detail read is itself written to the audit log** (the entry names the SuperAdmin and the log row). What is and
is not stored: see `docs/DEPLOYMENT-SECURITY.md` ("Logging").

### Reports (5 controllers — most follow the same list / detail / export shape)

Each has a `.View` permission for list (and, where present, detail). Most also expose a separate
`.Export` permission (literal string, not a `PermissionType` constant) for an Excel download —
export responses are binary files
(`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`), not JSON.
`GenerationUsageReportController` is the one exception: list-only, no detail route and no export.

**TenantContentReportsController — `api/reports/tenant-content`** (group `TenantContentReport`)
| Route | Response |
|---|---|
| `GET api/reports/tenant-content` (Query `TenantContentReportFilter`: `TenantIds: List<Guid>?`, `CountryIds: List<Guid>?`, `IsActive?`, `FromDate?`, `ToDate?`) | `PaginatedDataDto<TenantContentReportListDto>` |
| `GET api/reports/tenant-content/{tenantId:guid}` | `TenantContentReportDetailDto` |
| `GET api/reports/tenant-content/export` | `.xlsx` file (`tenant-content-report.xlsx`) |

```
TenantContentReportListDto: { TenantId, Name, Slug, IsActive, RestaurantCount, MenuItemCount,
                               Models: { Pending, Processing, Ready, Failed } }
TenantContentReportDetailDto: { TenantId, Name, Restaurants: RestaurantReportDto[] }
RestaurantReportDto: { Id, Name, CountryIsoCode?, CountryName?, MenuItems: MenuItemReportDto[] }
MenuItemReportDto: { Id, Name, IsActive, Models: MenuItem3DModelReportDto[] }
MenuItem3DModelReportDto: { Id, SourceType, GenerationStatus, GlbUrl?, UsdzUrl?, ThumbnailUrl?, IsActive }
```

The `/export` `.xlsx` adds a trailing **Restaurant Locations** column (not present in the JSON
responses above) — one semicolon-joined `"Name — Country (Zone, local time as of export)"` entry
per restaurant owned by that row's tenant.

**ApiKeyContentReportsController — `api/reports/api-key-content`** (group `ApiKeyContentReport`)
— same shape, scoped per API key instead of per tenant.
| Route | Response |
|---|---|
| `GET api/reports/api-key-content` (Query `ApiKeyContentReportFilter`: `ApiKeyIds?`, `TenantIds?`, `CountryIds?`, `IsActive?`, `FromDate?`, `ToDate?`) | `PaginatedDataDto<ApiKeyContentReportListDto>` |
| `GET api/reports/api-key-content/{apiKeyId:guid}` | `ApiKeyContentReportDetailDto` |
| `GET api/reports/api-key-content/export` | `.xlsx` (`api-key-content-report.xlsx`) |

```
ApiKeyContentReportListDto: { ApiKeyId, ClientName, KeyPrefix, TenantId, TenantName, IsActive,
                               ExpiresAt?, LastUsedAt?, RateLimitPerMinute?, RestaurantCount,
                               MenuItemCount, Models: {...} }
ApiKeyContentReportDetailDto: { ApiKeyId, ClientName, TenantId, TenantName,
                                 Restaurants: RestaurantReportDto[] }
```

`ApiKeyContentReportListDto.ExpiresAt/LastUsedAt` follow the timezone rule in §3.1. The `/export`
`.xlsx` adds the same trailing **Restaurant Locations** column described above.

**RegistrationsReportController — `api/reports/registrations`** (group `RegistrationsReport`) —
flat, platform-wide list unifying tenant-direct and API-key-billed registrations.
| Route | Response |
|---|---|
| `GET api/reports/registrations` (Query `RegistrationsReportFilter`: `TenantIds?`, `ApiKeyIds?`, `CountryIds?`, `SourceType: RegistrationSourceType?`, `IsActive?`, `FromDate?`, `ToDate?`) | `PaginatedDataDto<RegistrationReportDto>` |
| `GET api/reports/registrations/export` | `.xlsx` (`registrations-report.xlsx`) |

```
RegistrationReportDto: { Id, SourceType, SourceName, TenantId, TenantName, Price?,
                          DiscountType?, Discount?, EffectivePrice, CurrencyCode, FromDate,
                          ToDate, IsActive, PlanName?, SupportPrice?, SupportTierName? }
```

`RegistrationReportDto.FromDate/ToDate` follow the timezone rule in §3.1. The `/export` `.xlsx`
adds the same trailing **Restaurant Locations** column described above.

**GenerationUsageReportController — `api/reports/generation-usage`** (group `GenerationUsageReport`) —
per-tenant daily/monthly AI-generation usage vs. plan limits, for spotting tenants near/over cap.
| Route | Response |
|---|---|
| `GET api/reports/generation-usage` (Query `GenerationUsageReportFilter`: `TenantIds?`, `CountryIds?`) | `PaginatedDataDto<TenantGenerationUsageDto>` |

```
TenantGenerationUsageDto: { TenantId, TenantName, PlanName?, DailyUsed: int, DailyLimit?: int, MonthlyUsed: int, MonthlyLimit?: int,
                            ExtraCreditsRemaining: int, ExtraCreditsNearestExpiryUtc?: DateTime,
                            ApiKeyPools: ApiKeyGenerationUsageDto[] }
ApiKeyGenerationUsageDto: { ApiKeyId, LineageId, ClientName, PlanName?, DailyUsed: int, DailyLimit?: int, MonthlyUsed: int,
                            MonthlyLimit?: int, ExtraCreditsRemaining: int, ExtraCreditsNearestExpiryUtc?: DateTime }
```

The tenant-level numbers are the restaurant pool only. `ApiKeyPools` lists one row per API key **lineage** (rotations share a row; the
current key is shown) that has its own active subscription — each is a separate pool. `MonthlyUsed` = plan allowance used.

**TenantRevenueReportsController — `api/reports/tenant-revenue`** (group `TenantRevenueReport`)
— per-tenant income rollup grouped by currency.
| Route | Response |
|---|---|
| `GET api/reports/tenant-revenue` (Query `TenantRevenueReportFilter`: `TenantIds?`, `CountryIds?`, `IsActive?`, `FromDate?`, `ToDate?`) | `PaginatedDataDto<TenantRevenueReportListDto>` |
| `GET api/reports/tenant-revenue/{tenantId:guid}` | `TenantRevenueReportDetailDto` |
| `GET api/reports/tenant-revenue/export` | `.xlsx` (`tenant-revenue-report.xlsx`) |

```
TenantRevenueReportListDto: { TenantId, TenantName, IsActive, RegistrationCount,
                               TotalsByCurrency: [{ CurrencyCode, TotalIncome }],
                               LatestRegistration?: RegistrationReportDto }
TenantRevenueReportDetailDto: { TenantId, TenantName, Registrations: RegistrationReportDto[],
                                 TotalsByCurrency: [{ CurrencyCode, TotalIncome }] }
```

Nested `RegistrationReportDto.FromDate/ToDate` (in `LatestRegistration`/`Registrations`) follow
the timezone rule in §3.1. The `/export` `.xlsx` adds the same trailing **Restaurant Locations**
column described above.

---

## 6. Shoof.Api.Integration — endpoint reference

Base URL (dev): `https://localhost:7333`. Every endpoint requires `X-Integration-Key: <key>`
only — no JWT, no permission checks (see §2.2). All resources are scoped to the calling key's
own tenant automatically.

### ApiKeyController — `api/api-key`

| Method + Route | Description | Response |
|---|---|---|
| `GET api/api-key` | Self-info of the calling key | `ApiKeySelfDto` |
| `PUT api/api-key/webhook` | Set the webhook URL; **issues a new signing secret** | `WebhookSecretDto` (`Url`, `Secret`) — secret shown **once** |
| `POST api/api-key/webhook/rotate-secret` | New secret, same URL | `WebhookSecretDto` — secret shown **once** |
| `DELETE api/api-key/webhook` | Remove the webhook (also disables it) | `204` |
| `POST api/api-key/webhook/test` | Queue a signed `ping` event | `202` + `WebhookDeliveryDto` |
| `GET api/api-key/webhook/deliveries` | Your delivery log, newest first | `PaginatedDataDto<WebhookDeliveryDto>` |
| `GET api/api-key/request-logs` | Your own call/attempt log, newest first | `PaginatedDataDto<ApiKeyRequestLogDto>` |

`ApiKeySelfDto` (never carries the key, its hash or the webhook secret): `Id`, `TenantId`, `ClientName`, `KeyPrefix`, `IsActive`, `ExpiresAt?`,
`LastUsedAt?`, `RateLimitPerMinute?` (`null` = default 30/min), `WebhookUrl?` (the full URL you registered), `WebhookEnabled`,
`AllowedIpRanges: string[]` (`[]` = any IP), `ReplacedByApiKeyId?` (set during a rotation grace period), `LineageId`,
`PlainTextKey` (always `null` here), plus:

- `Subscription?` — `{ PlanName?, FromDate, ToDate, DaysRemaining }` of the registration that currently covers the key (`null` if none).
- `Quota` — `ModelGenerationQuotaDto` (§4): `{ DailyRemaining: int?, MonthlyRemaining: int?, IsApiKeyPool, ExtraCreditsRemaining,
  ExtraCreditsNearestExpiryUtc? }` (`null` = unlimited), the exact figures the trigger endpoints enforce for **this** key. If your key has
  its own subscription (`IsApiKeyPool = true`) these are your own counters and credits, separate from the restaurant's; otherwise you
  share the restaurant's pool. The pool follows your key across rotations.

**Timezone note**: `FromDate`/`ToDate`/`ExpiresAt`/`LastUsedAt` are returned in the tenant's local timezone (§3.1), but
`DaysRemaining` is computed in **UTC** (rounded up, never negative) — near midnight it can differ by one from what you'd count on the local dates.

No rotate/update here — key lifecycle (create/rotate/revoke) and the IP allowlist are SuperAdmin-only.

### RestaurantsController — `api/restaurants` — self-service onboarding

`CreateAsync` forces `TenantId` to the caller's own tenant server-side regardless of what's
sent — a partner can never create a restaurant under a tenant it doesn't hold the key for.

| Method + Route | Request | Response |
|---|---|---|
| `GET api/restaurants` | Query `RestaurantFilter`: `TenantId?`, `CountryIds: Guid[]?` | `PaginatedDataDto<RestaurantDto>` |
| `GET api/restaurants/{id:guid}` | route `id` | `RestaurantDto` / `404` |
| `POST api/restaurants` | `CreateRestaurantDto`: `TenantId` (overwritten), `NameEn`, `NameAr?`, `ContactEmail?`, `ContactPhone?`, `CurrencyId`, `CountryId` | `RestaurantDto` |
| `PUT api/restaurants/{id:guid}` | `UpdateRestaurantDto`: `NameEn`, `NameAr?`, `LogoUrl?`, `ContactEmail?`, `ContactPhone?`, `CurrencyId`, `CountryId` | `RestaurantDto` |
| `POST api/restaurants/{id:guid}/logo` | multipart `file: IFormFile` | `RestaurantDto` |

`RestaurantDto`/`CreateRestaurantDto`/`UpdateRestaurantDto` field shapes are identical to §4's
`RestaurantsController` — see there for the full field list. `CountryId` is now required on
`POST api/restaurants` for B2B partner self-service restaurant creation too.

### MenuCategoriesController — `api/menu-categories`

| Method + Route | Request | Response |
|---|---|---|
| `GET api/menu-categories` | Query `MenuCategoryFilter`: `ParentCategoryId?`, `IsActive?` | `PaginatedDataDto<MenuCategoryDto>` |
| `GET api/menu-categories/{id:guid}` | route `id` | `MenuCategoryDto` (`500` if unknown, §3.5) |
| `POST api/menu-categories` | `CreateMenuCategoryDto`: `RestaurantId`, `ParentCategoryId?`, `NameEn`, `NameAr?`, `DescriptionEn?`, `DescriptionAr?`, `DisplayOrder` | `MenuCategoryDto` |
| `PUT api/menu-categories/{id:guid}` | `UpdateMenuCategoryDto`: same minus `RestaurantId` | `MenuCategoryDto` |
| `DELETE api/menu-categories/{id:guid}` | route `id` | `204` |

### MenuItemsController — `api/menu-items`

| Method + Route | Request | Response |
|---|---|---|
| `GET api/menu-items` | Query `MenuItemFilter`: `MenuCategoryId?`, `IsActive?` | `PaginatedDataDto<MenuItemDto>` |
| `GET api/menu-items/{id:guid}` | route `id` | `MenuItemDto` / `404` |
| `POST api/menu-items` | `CreateMenuItemDto`: `MenuCategoryId`, `NameEn`, `NameAr?`, `DescriptionEn?`, `DescriptionAr?`, `Price`, `CurrencyId?`, `DisplayOrder` | `MenuItemDto` |
| `PUT api/menu-items/{id:guid}` | `UpdateMenuItemDto`: `NameEn`, `NameAr?`, `DescriptionEn?`, `DescriptionAr?`, `Price`, `CurrencyId`, `IsActive`, `DisplayOrder` | `MenuItemDto` |
| `DELETE api/menu-items/{id:guid}` | route `id` | `204` |

### ModelGenerationJobsController — `api/model-generation-jobs` — trigger, bulk, cancel + poll

| Method + Route | Request | Response |
|---|---|---|
| `GET api/model-generation-jobs` | Query `ModelGenerationJobFilter` (§4 "Grid filters", incl. `BatchId`, `Search`, `FromDate`/`ToDate`, `MetadataSearch`); `Kind` defaults to `0` (3D jobs) on this API, pass `kind=1` for photo jobs | `PaginatedDataDto<ModelGenerationJobDto>` |
| `GET api/model-generation-jobs/{id:guid}` | route `id` | `ModelGenerationJobDto` / `404` |
| `POST api/model-generation-jobs` | `CreateModelGenerationJobDto`: `MenuItemId`, `ForceNew?`, `Metadata?` | `ModelGenerationJobDto` (`Status` `0`, or `2` on a library match) |
| `POST api/model-generation-jobs/bulk` | `CreateBulkModelGenerationJobDto`: `MenuItemIds` (≤ 500), `ForceNew?`, `MetadataByMenuItemId?` | `BulkModelGenerationJobResultDto` |
| `POST api/model-generation-jobs/{id:guid}/cancel` | route `id` | `ModelGenerationJobDto` / `400` / `404` |
| `POST api/model-generation-jobs/batches/{batchId:guid}/cancel` | route `batchId` | `int` (cancelled count) / `404` |

Trigger, bulk, cancel and the queue/status semantics (Pending = Queued, fair per-tenant scheduling, `queuePosition`, free instant library
reuse) are identical to the Restaurant API — read §4's `ModelGenerationJobsController` for statuses, error messages and bulk `Reason`
values. Triggers are subject to the same daily/monthly quota (+ extra credits) and regeneration-lock checks — counted in your key's
own pool when it has its own subscription, else in the restaurant's. The quota-remaining figures are in
`GET api/api-key` (`Quota`). Rather than polling, register a webhook (below) and receive `generation.*` events.

**Request `metadata`** (single and bulk). Attach your own identifiers to a job so you can correlate results without keeping a map of job ids:

- `Metadata` is any **JSON object** (not an array/scalar), at most **4096 bytes** of UTF-8 (multi-byte characters count their bytes),
  nested at most **5** levels, at most **100** properties in total; otherwise `400`
  `"Metadata must be a JSON object of at most 4096 bytes, nested at most 5 levels deep, with at most 100 properties in total."`
- Bulk: `MetadataByMenuItemId` is `{ "<menuItemId>": { … } }`; every key must be one of `MenuItemIds`
  (`400` `"MetadataByMenuItemId contains an item id that is not listed in MenuItemIds."`). Items without an entry get no metadata.
- It is returned as `Metadata` on the job (`GET`), and echoed **unchanged, as a nested object** in every `generation.*` webhook for that job.
  `batch.completed` carries only a summary (no metadata) — match jobs by `jobId`/`menuItemId` from the earlier `generation.*` events.
- Search it: `GET api/model-generation-jobs?metadataSearch=SKU-1001` — a case-insensitive "contains" over the stored JSON text (trimmed, ≤ 100 chars).
- **It is untrusted data you sent, and it passes through logs and webhooks: never put secrets in it, and never render it as HTML.**
  (Request logs redact the *values* of fields whose names look sensitive, e.g. names containing `key`, `token`, `secret`, `auth`.)



### MenuItem3DModelsController — `api/menu-item-3d-models`

| Method + Route | Request | Response |
|---|---|---|
| `GET api/menu-item-3d-models` | Query `MenuItem3DModelFilter`: `MenuItemId?` | `PaginatedDataDto<MenuItem3DModelDto>` |
| `GET api/menu-item-3d-models/{id:guid}` | route `id` | `MenuItem3DModelDto` (`500` if unknown, §3.5) |
| `POST api/menu-item-3d-models` | `CreateMenuItem3DModelDto`: `MenuItemId`, `GlbUrl`, `UsdzUrl?`, `ThumbnailUrl?` | `MenuItem3DModelDto` |
| `POST api/menu-item-3d-models/upload` | multipart: `menuItemId`, `glbFile`, `usdzFile?`, `thumbnailFile?` | `MenuItem3DModelDto` |
| `PUT api/menu-item-3d-models/{id:guid}` | `UpdateMenuItem3DModelDto`: `GlbUrl?`, `UsdzUrl?`, `ThumbnailUrl?`, `IsActive` | `MenuItem3DModelDto` |
| `DELETE api/menu-item-3d-models/{id:guid}` | route `id` | `204` |

All DTOs here are identical in shape to the ones documented in §4/§5 — see those sections for
field-level detail (`MenuCategoryDto`, `MenuItemDto`, `RestaurantDto`, `ModelGenerationJobDto`,
`MenuItem3DModelDto`).

### Auth, error codes and limits (Integration API)

- **Header only**: `X-Integration-Key: <key>`. A key in the query string, a cookie or the body is not read (the call is `401`).
- `401` — missing, malformed, unknown, inactive, expired or soft-deleted key (empty body).
- `403` — a **real** key that may not be used right now; the machine-readable reason is in the **`X-Error-Code` response header**
  (the body is a localized plain-text message):
  - `X-Error-Code: IpNotAllowed` — your client IP is outside the key's allowed IP ranges (checked first).
  - `X-Error-Code: SubscriptionExpired` — no active registration (subscription) covers today.
  Only `403` with these codes means "fix the subscription / allowlist"; `401` means "wrong or dead key".
- `429` — rate limit: **per key**, fixed one-minute window, default **30 requests/min** (a SuperAdmin can set `RateLimitPerMinute` on the key).
  Unauthenticated/invalid calls share **one** bucket (300/min, plus a per-IP budget of 30/min when per-IP limits are on), so garbage traffic can
  neither exhaust your key's bucket nor create new ones.
- `503` + `Retry-After: 1` — the server is momentarily busy validating keys; retry after the indicated seconds (use backoff).
- Every response (errors included) carries **`X-Correlation-Id`**; quote it to support. The same id appears in `GET api/api-key/request-logs`.
- Business rule violations are `400` with a plain-text body (§3.2). A malformed body is `500` (§3.5). Other tenants' ids get
  the unknown-id answer: `404`, except the two `GET`s in §3.5.

### Notifications inbox (keys)

`GET api/notifications` (`IsRead?`, `Type?`, paging), `GET api/notifications/unread-count`, `POST api/notifications/{id}/read` (`204`/`404`),
`POST api/notifications/read-all` (`int`) — same shapes as the Restaurant inbox (§4 `NotificationDto`). Pull-only: there is no SignalR on this
API; use webhooks (`notification.created`) for push. Announcement text is plain text — never render as HTML.

### Webhooks

Instead of polling, give the API a URL and it POSTs signed events to it.

**Setup**
1. `PUT api/api-key/webhook` with `{ "url": "https://partner.example.com/shoof/hook" }` → `{ "url", "secret" }`. **Store the secret now — it is never shown again.**
   The URL must be `https`, port 443, no embedded credentials, and its host must resolve **only to public addresses** (private, loopback,
   link-local and other non-public ranges are rejected, and re-checked at connect time on every delivery). Redirects are **not followed**.
2. **Every `PUT` issues a new secret and the previous secret stops working immediately (no grace period)** — deploy the new secret before/at the moment you re-PUT.
   `POST api/api-key/webhook/rotate-secret` does the same without changing the URL; when you need overlap, accept both secrets in your verifier during the swap.
3. `POST api/api-key/webhook/test` queues a `ping` event; follow it in `GET api/api-key/webhook/deliveries`.
4. `DELETE api/api-key/webhook` stops delivery (pending retries are dropped).

(When SuperAdmin rotates your API key, the webhook — URL and secret — moves to the new key automatically, together with any
not-yet-delivered events. During the old key's grace period, `PUT api/api-key/webhook`, `rotate-secret` and `test` called with the **old** key
return `400` "This key was rotated; configure webhooks on the new key" — use the new key. The old key receives no further events or
notifications.)

**Delivery log** — `GET api/api-key/webhook/deliveries?status=&eventType=&page=&pageSize=` (page size ≤ 100): `WebhookDeliveryDto`
`{ Id (= X-Shoof-Delivery), EventId, EventType, Status (0 Pending, 1 Delivered, 2 GaveUp), Attempts, LastStatusCode?, LastError?, CreationDateTime, LastAttemptAt?, NextAttemptAt?, DeliveredAt? }`.
No payloads or headers are stored in this view.

**Request your endpoint receives** — `POST`, `Content-Type: application/json; charset=utf-8`, headers:

| Header | Value |
|---|---|
| `X-Shoof-Event` | event type, e.g. `generation.ready` |
| `X-Shoof-Delivery` | delivery id (GUID), **stable across retries** |
| `X-Shoof-Signature` | `t=<unix seconds>,v1=<lowercase hex HMAC-SHA256>` |
| `User-Agent` | identifies Shoof webhooks |

Return any `2xx` within **10 seconds** (connect + send + response). Anything else (non-2xx, timeout, connection error) is a failed attempt.

**Retries and at-least-once.** Failed attempts are retried after **1 min, 5 min, 30 min, 2 h, 6 h**; after the 6th failed attempt the delivery
is `GaveUp` (no more retries; recover by reading job state via the API). Delivery is **at-least-once**: you can receive the same event more than
once (retries, or a lost acknowledgement) and events can arrive out of order — **dedupe on `X-Shoof-Delivery`** (or the envelope `id`), and
treat the job's `status`/`finishedAt` as authoritative when order matters.

**Envelope** (camelCase JSON; **enum values are names here**, unlike the REST API; timestamps UTC):

```json
{ "id": "7f0c…", "type": "generation.ready", "createdAt": "2026-11-12T10:15:30Z", "data": { … } }
```

| `type` | When | `data` |
|---|---|---|
| `generation.queued` | job seen still queued by the event sweep (may be skipped — see below) | generation payload |
| `generation.processing` | job seen at the provider by the event sweep (may be skipped) | generation payload |
| `generation.ready` | finished OK | generation payload with `result` |
| `generation.failed` | failed | generation payload with `errorMessage` |
| `generation.cancelled` | cancelled while queued | generation payload |
| `batch.completed` | once, when the last job of a bulk request finished | batch summary |
| `notification.created` | a notification (e.g. SuperAdmin announcement) was created for your key | notification payload |
| `ping` | `POST api/api-key/webhook/test` | `{ "message": "ping" }` |

**Events are status snapshots, not a transition log.** Generation events report the job's status **at the time the event sweep runs**, so
intermediate states can be skipped: a job claimed by the queue before the next sweep sends no `generation.queued`, and a fast job can go straight
to `generation.ready`/`generation.failed` with no `generation.processing`. Only the terminal event (`ready`, `failed` or `cancelled`) is
guaranteed. **Library matches** (instant reuse of an existing model, `isLibraryMatch: true`) are Ready from the start: they arrive as a single
`generation.ready` with no prior `queued`/`processing`, and they count as `ready` in `batch.completed`.

Generation payload (`data`):

```json
{
  "jobId": "…", "batchId": null, "menuItemId": "…",
  "status": "Ready", "kind": "Model3D", "isLibraryMatch": false,
  "result": { "glbUrl": "https://…/model.glb", "usdzUrl": "https://…/model.usdz", "thumbnailUrl": "https://…/thumb.png", "imageUrl": null },
  "errorMessage": null,
  "queuedAt": "2026-11-12T10:10:00Z", "submittedAt": "2026-11-12T10:10:20Z", "finishedAt": "2026-11-12T10:15:30Z",
  "metadata": { "productId": "SKU-1001" }
}
```

`result` is **`null` until the job is Ready**; then only the URLs relevant to the kind are non-null (3D: `glbUrl`, `usdzUrl`, `thumbnailUrl`; image jobs: `imageUrl`).
`metadata` is your request metadata, echoed as a nested object (`null` if none). `batchId` is set for bulk jobs.

`batch.completed` (`data`): `{ "batchId", "total", "ready", "failed", "cancelled", "items": [ { "jobId", "menuItemId", "status" } ] }` — a summary
only; each job's metadata and result URLs are in that job's own `generation.*` events.

`notification.created` (`data`): `{ "notificationId", "type", "titleEn", "titleAr", "bodyEn", "bodyAr", "restaurantId", "broadcastId", "createdAt" }`.

**Security rules for the receiver**
- Verify the signature on every request, over the **raw body bytes exactly as received** (do not parse and re-serialize first).
- Signed string: `"<t>.<raw body>"`; key: the UTF-8 bytes of your secret string; HMAC-SHA256; compare the lowercase hex in **constant time**;
  reject if `|now - t| > 5 minutes` (replay protection).
- Payload text (metadata, titles, bodies, error messages) can contain raw `<` and `>` characters and is **client/operator supplied**: never embed it unescaped
  into HTML, SQL or shell commands.

Node.js (Express — note `express.raw`, not `express.json`):

```js
const crypto = require('crypto');

function verifyShoofSignature(rawBody /* Buffer */, header /* X-Shoof-Signature */, secret) {
  const parts = Object.fromEntries((header || '').split(',').map(p => p.split('=', 2)));
  const t = Number(parts.t);
  if (!parts.v1 || !Number.isFinite(t)) return false;
  if (Math.abs(Date.now() / 1000 - t) > 300) return false;                 // 5-minute tolerance
  const expected = crypto.createHmac('sha256', secret)                      // secret string -> UTF-8 key
    .update(Buffer.concat([Buffer.from(`${t}.`), rawBody])).digest();       // "<t>." + raw bytes
  let given; try { given = Buffer.from(parts.v1, 'hex'); } catch { return false; }
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

app.post('/shoof/hook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verifyShoofSignature(req.body, req.get('X-Shoof-Signature'), process.env.SHOOF_WEBHOOK_SECRET))
    return res.sendStatus(401);
  const deliveryId = req.get('X-Shoof-Delivery');
  if (alreadyProcessed(deliveryId)) return res.sendStatus(200);            // dedupe (at-least-once)
  const event = JSON.parse(req.body.toString('utf8'));
  enqueueForProcessing(deliveryId, event);                                  // do the work async, answer fast
  res.sendStatus(200);
});
```

C# (ASP.NET Core minimal API):

```csharp
using System.Security.Cryptography;
using System.Text;

static bool VerifyShoofSignature(byte[] rawBody, string? header, string secret, DateTimeOffset now)
{
    if (string.IsNullOrEmpty(header)) return false;
    long? t = null; string? v1 = null;
    foreach (var part in header.Split(','))
    {
        var kv = part.Split('=', 2);
        if (kv.Length != 2) continue;
        if (kv[0] == "t" && long.TryParse(kv[1], out var ts)) t = ts;
        else if (kv[0] == "v1") v1 = kv[1];
    }
    if (t is null || v1 is null) return false;
    if (Math.Abs(now.ToUnixTimeSeconds() - t.Value) > 300) return false;       // 5-minute tolerance

    var prefix = Encoding.UTF8.GetBytes($"{t.Value}.");
    var signed = new byte[prefix.Length + rawBody.Length];
    prefix.CopyTo(signed, 0); rawBody.CopyTo(signed, prefix.Length);            // "<t>." + raw bytes
    var expected = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), signed);

    byte[] given;
    try { given = Convert.FromHexString(v1); } catch (FormatException) { return false; }
    return CryptographicOperations.FixedTimeEquals(given, expected);            // constant time
}

app.MapPost("/shoof/hook", async (HttpRequest request) =>
{
    using var ms = new MemoryStream();
    await request.Body.CopyToAsync(ms);                                         // raw bytes, before any JSON binding
    var body = ms.ToArray();
    if (!VerifyShoofSignature(body, request.Headers["X-Shoof-Signature"], secret, DateTimeOffset.UtcNow))
        return Results.Unauthorized();
    var deliveryId = request.Headers["X-Shoof-Delivery"].ToString();           // dedupe on this (at-least-once)
    // if (AlreadyProcessed(deliveryId)) return Results.Ok(); else enqueue and return 200 quickly
    return Results.Ok();
});
```

### Your request log

`GET api/api-key/request-logs` (filters as §5 `IntegrationRequestLogFilter`; `TenantId`/`ApiKeyId` are ignored — you only ever see your own key):
`ApiKeyRequestLogDto { RequestedAtUtc, Direction (0 Inbound call, 1 Outbound webhook attempt), ClientIp, Method, Url, StatusCode?, DurationMs, CorrelationId }`
— metadata only, no headers or bodies. Kept for 180 days. Send the `CorrelationId` to support when reporting a problem.


---

## 6a. Deploying API key security (Task 11) — pre-deploy check

> Operators: the full deployment/security checklist (proxy IPs, Data Protection certificate, Meshy secrets, logging and retention,
> single-instance notes) is in [`docs/DEPLOYMENT-SECURITY.md`](DEPLOYMENT-SECURITY.md). This section keeps the pre-deploy SQL.

From this release an Integration key **stops working (`403 SubscriptionExpired`)** unless an active
registration covers it. Before deploying, list the active keys that would be cut off and either
create/renew a registration for them or warn the partner:

```sql
-- Active, unexpired keys with no active key-scoped or tenant-scoped registration covering now.
SELECT k."Id", k."TenantId", t."Name" AS "TenantName", k."ClientName", k."KeyPrefix", k."LastUsedAt", k."ExpiresAt"
FROM "ApiKeys" k
LEFT JOIN "Tenants" t ON t."Id" = k."TenantId"
WHERE k."IsActive" AND NOT k."Deleted"
  AND (k."ExpiresAt" IS NULL OR k."ExpiresAt" >= now())
  AND NOT EXISTS (
      SELECT 1 FROM "Registrations" r
      WHERE r."IsActive" AND NOT r."Deleted"
        AND r."FromDate" <= now() AND r."ToDate" >= now()
        AND (r."ApiKeyId" = k."Id" OR (r."ApiKeyId" IS NULL AND r."TenantId" = k."TenantId")))
ORDER BY k."LastUsedAt" DESC NULLS LAST;
```

Run it before the migrations (`AddApiKeyAllowedIpRanges`, `AddApiKeyLineageId` only add columns; existing
keys get an empty allowlist = any IP and `LineageId = Id`). Behind a reverse proxy, configure `ForwardedHeaders:KnownProxies`/`KnownNetworks`
on the Integration host **before** assigning any IP allowlist, or every partner is seen as the proxy's IP.
HSTS is sent by all three APIs outside Development.

## 7. Quick-start checklist for building a screen against these APIs

1. **Identify which of the 3 APIs the screen belongs to** — restaurant admin dashboard →
   `Shoof.Api.Restaurant`; platform operator console → `Shoof.Api.SuperAdmin`; partner
   integration → `Shoof.Api.Integration`; public menu/QR landing page → `PortalController`
   inside `Shoof.Api.Restaurant`.
2. **Auth**: log in via that API's `/api/auth/login` (Restaurant/SuperAdmin) or use the
   provisioned `X-Integration-Key` (Integration/Portal use API keys instead of login).
3. **Every subsequent call** needs the headers listed in §2 for that API — most commonly
   forgotten: `X-Tenant-Id` on Restaurant, `X-Api-Key` on Restaurant/Portal.
4. **List screens**: bind to `PaginatedDataDto<T>.Data`, drive pagination off `Page`/`PageSize`/
   `TotalCount`/`TotalPages`, and pass filter fields as query params (check each `*Filter` DTO
   in §4/§5/§6 for what's filterable beyond the inherited `SearchTerm`/`Page`/`PageSize`).
5. **Forms**: `Create*Dto`/`Update*Dto` field sets are intentionally different per action (e.g.
   `CreateMenuItemDto` has `NameEn`/`NameAr`, but `MenuItemDto` — the read shape — has a single
   resolved `Name`) — do not assume they're the same shape.
6. **Error handling**: for `400`, plain text is a message and JSON with `errors` is field validation
   (either JSON content type, see §3.2). Treat `403` with a body as an explicit message worth surfacing
   to the user, and check §3.5 for endpoints that answer `500` for an unknown id.
7. **File uploads**: always `multipart/form-data`, 5 MB cap, and the response always contains a
   ready-to-use absolute URL — never construct the URL client-side.
8. **Enums**: the APIs serialize/deserialize them as **numbers** (§3.4); only webhook bodies
   carry enum names.
