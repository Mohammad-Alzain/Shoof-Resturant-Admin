# 03 — SuperAdmin Console (platform operator)

**Users:** Lambdor staff. **Backend:** `Shoof.Api.SuperAdmin`.
**Purpose:** onboard customers, sell and track subscriptions and AI credits, manage partner API keys, review
AI 3D models for the shared library, broadcast announcements, tune the AI provider, and monitor the platform
through dashboards, reports and logs. **Cross-tenant**: sees all customers.

Read [README.md](README.md) §2 first. API details:
[guide §5](../FE-API-INTEGRATION-GUIDE.md#5-shoofapisuperadmin--endpoint-reference).

Requests send `Authorization: Bearer <superadmin jwt>` and `X-Language`, **no** `X-Tenant-Id`. The calls made before there is a
token (login, refresh, logout, forgot and reset password) send `X-Api-Key` (the SuperAdmin app key) instead of the JWT.

---

## Suggested navigation

```
Dashboard
Customers
 ├─ Tenants (+ tenant detail: restaurants, subscriptions, usage, keys, credits)
 └─ Restaurants
Billing
 ├─ Subscriptions (registrations)
 ├─ Plans
 ├─ Support tiers
 ├─ Credit packs
 └─ Credit purchases
Integrations
 ├─ API keys (+ rotation, IP allowlist)
 └─ Integration request logs
AI
 ├─ 3D library approvals
 ├─ Force regenerate (support tool)
 └─ Generation settings
Communication
 └─ Broadcast announcement
Reports
 ├─ Tenant content · API key content · Subscriptions · Tenant revenue · Generation usage
Settings
 ├─ Currencies
 ├─ Countries
 └─ SuperAdmin users & permissions
Audit log
🔔 Notifications (header bell)
```

SuperAdmin permissions are **per user** (no roles). Each section below names the permission group; actions are
`View` / `Add` / `Edit` / `Delete` unless a special one is noted.

---

## 1. Login & session
Same as the Restaurant Admin (README §2.1): `POST api/auth/login | refresh | revoke`. `roles` is always empty.
No slug: SuperAdmin login is email + password.

Same account screens as the dashboard, without a slug:
- **Forced first-login change:** `POST api/account/change-password`.
- **My profile:** `GET` / `PUT api/account/me`.
- **Forgot password:** `POST api/account/forgot-password` `{ email }`. It emails a link to
  `https://superadmin.shoof.lambdor.com/reset-password?email=…&token=…`.
- **Reset password page** at `/reset-password`: `POST api/account/reset-password`.

**The primary SuperAdmin** (`me.isPrimary`) is the platform owner's account, created on the first
start with a password it must change:
- **Profile:** it's the only account whose profile can also change its **email**.
- **Forgot password:** its "Forgot password?" sends nothing. If its owner loses the password, a
  server admin sets `PrimaryRecovery:TemporaryPassword` in the SuperAdmin API config and restarts.
  The owner then logs in with that and must change it.

---

## 2. Dashboard — `Dashboard.View`

| Widget | Endpoint | Content |
|---|---|---|
| KPI tiles | `GET api/dashboard/overview` | tenants (total / active), restaurants, menu items, API keys (total / active / expired), 3D jobs by status |
| Alerts | `GET api/dashboard/alerts` | **API keys expiring soon** (key, tenant, expiry) · **failed generation jobs** (item, tenant, error, retries) · **empty tenants** (no restaurants / items) |
| Tenant growth chart | `GET api/dashboard/tenant-growth?days=30` | per day: new tenants + cumulative (Damascus calendar days) |

Alert rows should link to the related tenant, key or item.

---

## 3. Tenants — `Tenants`

| Function | Permission | Endpoint |
|---|---|---|
| List (active filter) + search | View | `GET api/tenants` |
| Detail (incl. subscriptions) | View | `GET api/tenants/{id}` |
| Usage (items, jobs triggered, API keys + last used) | View | `GET api/tenants/{id}/usage` |
| Typeahead lookup | View | `GET api/tenants/lookup?search=` |
| Create | Add | `POST api/tenants` (`name`, `slug`) |
| Edit / activate / deactivate | Edit | `PUT api/tenants/{id}` (`name`, `slug`, `isActive`) |
| Delete | Delete | `DELETE api/tenants/{id}` |
| **Create first admin (owner)** | Add | `POST api/tenants/{id}/bootstrap-admin` (`fullName`, `email`, `password`) |

**Slug rules** (it's the tenant's menu subdomain): required; lowercase letters, digits and hyphens only;
unique; reserved: `www, api, admin, portal, app, shared`. Name ≤ 200, slug ≤ 100.
Errors: "Slug is required.", "Slug may only contain lowercase letters, digits, and hyphens.", "Slug '…' is reserved and cannot be used."
Show a live preview: `https://{slug}.<menu-domain>` and warn that **changing the slug changes the menu URL** (printed QR codes stop working).

**Deactivate** = the tenant's admins, public menu and API keys stop working (up to ~5 min cache lag). Prefer it over delete.
An expired subscription does this automatically, and only `isActive: true` here undoes it (§5).
A deleted tenant's slug can never be used again.

### Onboarding wizard (suggested)
1. **Onboard the restaurant** in one form (§4): restaurant details + tenant name/slug + first admin. One call
   creates the tenant, restaurant, Owner role and admin together. That admin is the restaurant's **primary admin**
   and can't be deleted, deactivated or removed from the Owner role (Release 2), so confirm the email before submitting.
2. Create a subscription (§5) for the new tenant — without an active subscription, generation quotas fall back to
   defaults and API keys of the tenant are refused.
3. Optionally issue an API key (§9).

`POST api/tenants` + `bootstrap-admin` remain for special cases (for example a partner tenant with no
restaurant yet).

### Tenant detail page (suggested tabs)
Overview + usage · Restaurants (`GET api/restaurants?tenantId=`) · Subscriptions · API keys (`GET api/api-keys?tenantId=`) ·
Credit purchases (`GET api/credit-purchases?tenantId=`) · Audit log (`GET api/audit-log-entries?tenantId=`).

---

## 4. Restaurants — `Restaurants`

| Function | Permission | Endpoint |
|---|---|---|
| List across all tenants (tenant, countries) | View | `GET api/restaurants?tenantId=&countryIds=` |
| Detail | View | `GET api/restaurants/{id}` |
| **Onboard** (new tenant + restaurant + owner) | Add | `POST api/restaurants` (see below) |
| What the Owner role gets | View | `GET api/restaurants/permissions` (read-only list to show on the form) |

**Onboard form** — one screen, three parts:
- Restaurant: name EN*, name AR, currency*, country*, contact email, contact phone.
- Tenant: name*, slug* (same rules and live URL preview as §3).
- First admin (owner): full name*, email*, password* (temporary; they must change it at first login).

Body: `{ nameEn, nameAr?, currencyId, countryId, contactEmail?, contactPhone?, tenant: { name, slug }, admin: { fullName, email, password } }`.
It always creates a **new** tenant. If anything is wrong (slug taken/invalid/reserved, weak password, invalid
contact email, phone > 50) you get a `400` with the message and **nothing** is created, so the form can be fixed and
resent. After success, go to the new tenant's page to add the subscription.

The **contact email** receives the subscription-expiry reminders (30, 7 and 1 days before the end date); when empty,
they go to the restaurant's Owner admins.

No edit or delete here: the restaurant's own admins edit branding and contact details in their portal. The country sets the time zone.

---

## 5. Subscriptions (registrations) — `Registrations`

A registration = a subscription period for **either a tenant or an API key** (never both).

| Function | Permission | Endpoint |
|---|---|---|
| List (tenant, API key, plan, support tier, active) | View | `GET api/registrations` |
| Detail | View | `GET api/registrations/{id}` |
| Create | Add | `POST api/registrations` |
| Edit (price, currency, discount, dates, active, support price) | Edit | `PUT api/registrations/{id}` |
| Delete | Delete | `DELETE api/registrations/{id}` |
| **Upgrade / change plan** | Add | `POST api/registrations/{id}/upgrade` (`planId`, `supportTierId?`, `currencyId?`, `fromDate?`, `toDate`) |

**Create form:** subscriber type (Tenant / API key) → tenant or key picker · plan · support tier · price + currency ·
discount type (Percentage / Fixed amount) + discount · support price · from date · to date.

**Rules / errors**
- Exactly one of tenant / API key: "A Registration must have exactly one of TenantId or ApiKeyId set."
- Price and currency both set or both empty (empty = **free trial**): "Price and CurrencyId must both be set, or both left null…"
- Discount and discount type both set or both empty; percentage 0–100.
- From ≤ To: "FromDate must not be after ToDate."
- When a plan/support tier is chosen and price is left empty, the server copies the list price → pre-fill it in the form and let the user override it.
- Subscriber, plan and support tier **can't be edited**. To change plan use **Upgrade**, which ends the current
  registration now and creates a new one in one step.
- A rotated (replaced) API key can't get a new registration: "This API key has been rotated. Register the replacement key instead."
- **Dates in the request body are UTC** (convert from the picker); dates in responses are local.
- Show **effective price** = price minus discount.

### Expiry and renewal

- An hourly job switches off whoever's subscription has ended without a renewal: the **tenant** (admins, menu and keys stop working) or,
  for a key's own subscription, the **key**.
- **Before Release 1.1 it does so even if a newer subscription exists** ([known issue](../FE-API-INTEGRATION-GUIDE.md#35-known-backend-issues-as-of-2026-11-22)). So until that release is live, make the "Renew" button call
  **Upgrade** (same plan allowed, leave `fromDate` empty) rather than Create. Upgrade takes the list price and drops
  the discount: offer an edit right after it.
- From Release 1.1 Create works for renewing too, if done before the old subscription ends and for the same
  subscriber: a tenant subscription doesn't renew a key's own one, or the other way round. The start may be later.
- Creating or upgrading doesn't reactivate. After a lapse, show "Reactivate" → `PUT` the tenant or key with
  `isActive: true`.
- Extending `toDate` by Edit keeps the customer on, but reminders already sent don't repeat for the new date.
- When editing, convert the local dates you loaded back to **UTC** before saving.
- (Release 2) A deleted or unknown currency → `400` "The selected currency doesn't exist or was deleted."

---

## 6. Plans — `Plans`

`GET/POST/PUT/DELETE api/plans` (filter: active). Fields: name* (≤ 100), list price, **daily generation limit**,
**monthly generation limit** (empty = unlimited; not negative: "Generation limits cannot be negative."), active (edit).
The plan price is a list price only; each registration stores its own price.

## 7. Support tiers — `SupportTiers`

`GET/POST/PUT/DELETE api/support-tiers` (filter: active). Fields: name* (≤ 100), price, description (≤ 500), active.

---

## 8. Extra AI credits

### 8.1 Credit packs (catalogue) — `CreditPacks`
`GET/POST/PUT/DELETE api/credit-packs` (filter: active). Fields: name* (≤ 100), credits* (1–100,000), price* (≥ 0),
currency*, active (edit). Editing or deleting a pack never changes purchases already recorded.

### 8.2 Credit purchases — `CreditPurchases` (View, Add, **Cancel**)

Recorded **after the customer pays offline**.

| Function | Permission | Endpoint |
|---|---|---|
| List (tenant, API key, active) | View | `GET api/credit-purchases` |
| Detail | View | `GET api/credit-purchases/{id}` |
| Record purchase | Add | `POST api/credit-purchases` (`creditPackId`, **one of** `tenantId` / `apiKeyId`) |
| Cancel | **CreditPurchases.Cancel** | `POST api/credit-purchases/{id}/cancel` |

**Rules**
- Owner = a tenant (restaurant pool) **or** an API key that has its **own** subscription.
- The owner needs an **active subscription of its own** right now, otherwise: "Extra credits can only be added while
  the owner has an active subscription of its own. Record or renew the subscription first."
  A key that only rides on its tenant's subscription can't hold credits; record the purchase for the tenant.
- Only **active** packs can be bought. Rotated-out keys are refused.
- Credits **expire** with the owner's current subscription end date (shown as `expiresAt`, UTC).
- Credits are used only after the monthly plan allowance is used up.
- **Cancel** only while **no** credit was used ("Only an unused, not yet cancelled credit purchase can be cancelled.").
- The owner is notified (notification type 8).

List columns: owner (tenant / key), pack, credits, **used / remaining**, price + currency, expires, status
(Active / Expired / Cancelled), recorded by, date.

---

## 9. API keys (B2B partners) — `ApiKeys`, `ApiKeyRotation`, `ApiKeyAllowedIps`

| Function | Permission | Endpoint |
|---|---|---|
| List (tenant, active) | ApiKeys.View | `GET api/api-keys` |
| Detail | ApiKeys.View | `GET api/api-keys/{id}` |
| Lookup (typeahead) | ApiKeys.View | `GET api/api-keys/lookup?search=&tenantId=` |
| Create | ApiKeys.Add | `POST api/api-keys` (`tenantId`, `clientName` ≤ 100, `expiresAt?`, `rateLimitPerMinute?`) |
| Edit (name, active, expiry, rate limit) | ApiKeys.Edit | `PUT api/api-keys/{id}` |
| Delete | ApiKeys.Delete | `DELETE api/api-keys/{id}` |
| **Rotate** | **ApiKeyRotation.Rotate** | `POST api/api-keys/{id}/rotate` (`graceHours` 1–168, default 24) |
| **IP allowlist** | **ApiKeyAllowedIps.Edit** | `PUT api/api-keys/{id}/allowed-ip-ranges` (`allowedIpRanges[]`) |

**Show-once secret:** create and rotate return `plainTextKey` **only in that response**. Show it in a modal with
**Copy** and a warning ("You won't be able to see this key again"); never store it. Lists show only `keyPrefix`.

**Rotation:** creates a new key with the same settings; the old key keeps working for the grace period
(`min(old expiry, now + grace)`), then stops. Webhook and pending deliveries move to the new key. Both keys share a
`lineageId` (subscription and credits follow the lineage). Only an active, unexpired, not-yet-rotated key can be
rotated. In lists, show "Replaced by …" for rotated keys. A rotated key's expiry can only be shortened.

**IP allowlist:** up to 50 entries, each an IP or CIDR (`203.0.113.0/24`); empty list = any IP. Rejected: host bits
set (`10.0.0.5/24`), `/0`, shorthands (`10.1`). Single IPs come back normalised (`/32`). Validate client-side and
show per-row errors.

Rate limit empty = default 30 requests/min.

---

## 10. Integration request logs — `IntegrationRequestLogs.View`

Every partner API call and every webhook attempt, kept 180 days.

- List `GET api/integration-request-logs` with filters: tenant, API key, client IP, status code, method, path
  contains, direction (0 Inbound call / 1 Outbound webhook), from/to (UTC), correlation id.
  Columns: time, direction, key prefix, method, URL, status, duration, client IP, error, correlation id.
- Detail `GET api/integration-request-logs/{id}` → adds headers, request body and response body (sanitized).
  **Opening a detail is itself audited** — show a small notice ("Your access is logged").
- Use cases: support asks "what happened with correlation id X?" → search by correlation id.

---

## 11. 3D library approvals — `Model3DAssets` (View, **Approve**)

AI-generated 3D models enter a shared library. They're reused for **other** restaurants only after approval.

| Function | Permission | Endpoint |
|---|---|---|
| Review queue (status, default Pending; source tenant) | View | `GET api/model3d-assets?status=0&sourceTenantId=` |
| Detail | View | `GET api/model3d-assets/{id}` |
| Approve | Model3DAssets.Approve | `POST api/model3d-assets/{id}/approve` |
| Reject | Model3DAssets.Approve | `POST api/model3d-assets/{id}/reject` (`reason`* plain text ≤ 500) |

- **Review screen:** 3D viewer (GLB; asset URLs are full absolute URLs, e.g.
  `https://shared.shoof.lambdor.com/backend/shared/models/{file}.glb` — public, use as-is), thumbnail,
  dish text (`matchText`), ingredient signature, source tenant, created date. Approve / Reject (reason dialog).
- Statuses: 0 Pending · 1 Approved · 2 Rejected. Only Pending can be decided; if another SuperAdmin already decided:
  "This 3D model has already been reviewed." → refresh the row.
- Rejecting does **not** remove the model from the source restaurant's item.
- New models raise notification type **5** for every SuperAdmin with the Approve permission → deep-link to the review screen.

---

## 12. Force regenerate (support tool) — `ModelGenerationJobs.Add`

`POST api/tenants/{tenantId}/model-generation-jobs/force-trigger` (`menuItemId`).
Bypasses only the "hasn't changed enough to regenerate" lock for a customer's item. Quota and the
one-active-job rule still apply. UI: a tenant picker + item id/search + confirm dialog.

## 13. Generation settings — `GenerationSettings` (View, Edit)

Single settings form: `GET` / `PUT api/generation-settings`.

| Field | Rule |
|---|---|
| Provider plan name (label) | required, ≤ 100 |
| Max concurrent tasks (global) | ≥ 1 |
| Max concurrent tasks per tenant | ≥ 1 and ≤ global |
| Image model | required, ≤ 100 |
| Image-to-3D model | required, ≤ 100 |

Defaults: Pro, 10, 2, `nano-banana-2`, `meshy-6`. Changes apply within seconds. Show a warning: "Only raise the global
limit if the provider plan allows it."

---

## 14. Broadcast announcement — `Notifications.Add`

`POST api/notifications/broadcast`

Form: title EN* (≤ 150), title AR, message EN* (≤ 2000), message AR, target = **All restaurants** *or* **selected
restaurants** (multi-select ≤ 1000; exactly one option). Plain text only (no rich text editor).

- Generate a `broadcastId` (GUID) when the form opens and send it with every retry; retries never double-send.
- Result: tenants reached + recipients count → show a confirmation.
- Recipients: each targeted tenant's admins (inbox + realtime) and its API keys (inbox + webhook).
- Show a preview and a confirm step ("Send to N restaurants?").

---

## 15. Reports

All reports: filter panel + paged table; most have a **detail** drill-down and **Export to Excel** (needs the
separate `.Export` permission; the response is an `.xlsx` file download). The Excel exports add a
"Restaurant Locations" column that the table doesn't have.

| Report | Permission group | Filters | Table | Detail | Export |
|---|---|---|---|---|---|
| Tenant content `api/reports/tenant-content` | TenantContentReport | tenants, countries, active, date range | tenant, slug, active, restaurants, items, 3D jobs by status | restaurants → items → 3D models | ✔ |
| API key content `api/reports/api-key-content` | ApiKeyContentReport | keys, tenants, countries, active, dates | key, prefix, tenant, active, expiry, last used, rate limit, restaurants, items, models | per key | ✔ |
| Subscriptions `api/reports/registrations` | RegistrationsReport | tenants, keys, countries, source (Tenant/API key), active, dates | source, name, tenant, price, discount, effective price, currency, from/to, active, plan, support | — | ✔ |
| Tenant revenue `api/reports/tenant-revenue` | TenantRevenueReport | tenants, countries, active, dates | tenant, active, registrations count, **totals per currency**, latest subscription | all subscriptions + totals | ✔ |
| Generation usage `api/reports/generation-usage` | GenerationUsageReport (View only) | tenants, countries | tenant, plan, daily used/limit, monthly used/limit, extra credits + expiry, **nested API-key pools** | — | ✗ |

- Revenue is per currency; never add different currencies together.
- Generation usage: highlight tenants near or over their limit; show each API-key pool as an expandable sub-row.

---

## 16. Settings

### Currencies — `Currencies`
(Release 2) A currency can't be deleted while a restaurant, menu item, subscription or credit pack uses it, and its code must be
unique (`400`, show the message).
`GET/POST/PUT/DELETE api/currencies`. Fields: ISO code* (3 letters, create only), symbol* (≤ 10), display name* (≤ 100),
decimal places (default 2).

### Countries — `Countries`
(Release 2) A country can't be deleted while a restaurant uses it, and its code must be unique (`400`, show the message).
`GET/POST/PUT/DELETE api/countries`. Fields: ISO code* (≤ 3), name EN* (≤ 200), name AR, **time zone*** (valid IANA id,
e.g. `Asia/Damascus`; "'…' is not a valid IANA time zone id."). Use a searchable time-zone dropdown.

### SuperAdmin users & permissions — `SuperAdminUsers`

| Function | Endpoint |
|---|---|
| List / detail | `GET api/super-admin-users`, `GET api/super-admin-users/{id}` |
| Create (`fullName`, `email`, `password`) / edit (`fullName`, `isActive`) / delete | `POST` / `PUT` / `DELETE` |
| Permission catalogue (grouped) | `GET api/super-admin-users/permissions` |
| User's permissions | `GET` / `PUT api/super-admin-users/{id}/permissions` |

Permission editor: group rows × action checkboxes, built from the catalogue (it includes custom actions such as
`Rotate`, `Approve`, `Cancel`, `Export`). Add "select all in group" and "grant all".
(Release 2) Except for the primary, a SuperAdmin can only add permissions they hold themselves: disable the other boxes
(already-ticked ones may stay), and make "select all" / "grant all" skip them. Reactivating someone follows the same
rule for all of that person's permissions (`400` "You can only grant permissions you have yourself. ...").
Unknown strings are silently dropped. Warn before removing your own permissions. The catalogue contains only
SuperAdmin permissions (restaurant-only ones such as MenuItems or Tables are not listed and are dropped if sent).

- A created user must change the password you set at their first login.
- (Release 2) A deleted SuperAdmin's email can be used again: that is a new account, with none of the old permissions.
- **The primary SuperAdmin** (`isPrimary` on its profile) can't be edited, deactivated, deleted, have its
  permissions changed or be reset from here (`400` "The primary SuperAdmin account can only be changed by its owner.").
  The list doesn't identify it ([backend gap](../FE-API-INTEGRATION-GUIDE.md#35-known-backend-issues-as-of-2026-11-22)): `isPrimary` is only on your own profile. So show that
  `400` when it comes back, and don't guess the account from its email (it can change).

### Reset a password

| Function | Permission | Endpoint |
|---|---|---|
| Set a temporary password for a restaurant admin | `PasswordResets.Add` | `POST api/password-resets/tenants/{tenantId}/admin-users/{userId}` `{ temporaryPassword }` → `204` |
| Set a temporary password for another SuperAdmin | `SuperAdminUsers.Edit` | `POST api/super-admin-users/{id}/reset-password` `{ temporaryPassword }` → `204` |

`PasswordResets.Add` alone (for example a helpdesk role) can't reset a SuperAdmin. Choosing their
password would mean becoming them. For the same reason (Release 2), the caller must hold every permission the target holds (the
primary is exempt), else `400` "You can't set the password of someone with permissions you don't have: ...".

- **Effect:** the user's sessions end, and they must change the password at their next login.
- **Not allowed:** the primary SuperAdmin, or yourself (use "change my password"), both `400`. An
  admin not in that tenant gives `404`.
- **Where:** on the SuperAdmin user list. For restaurant admins it waits for a backend endpoint: this API can't list
  a tenant's admins yet ([gap](../FE-API-INTEGRATION-GUIDE.md#35-known-backend-issues-as-of-2026-11-22)). Ask for the
  temporary password twice, and never display it again.

---

## 17. Audit log — `AuditLogEntries.View`

`GET api/audit-log-entries?tenantId=&level=` + detail. Read-only. Columns: time, level (badge), tenant, source,
message; detail shows exception details (monospace, collapsible). Includes security events such as key rotation,
credit purchases, approvals, broadcasts and log-detail reads.

---

## 18. Notifications — own inbox (no permission)

Same inbox and realtime behaviour as the Restaurant Admin (README §2.8), on the SuperAdmin host
(`/hubs/notifications`). The main type here is **5 "3D model awaiting approval"** → deep-link to §11.

---

## SuperAdmin permission catalogue (reference)

Tenants, Restaurants (View/Add), ApiKeys, ApiKeyRotation (Rotate), ApiKeyAllowedIps (Edit), Registrations, Plans,
SupportTiers, CreditPacks, CreditPurchases (View/Add/Cancel), Currencies, Countries, SuperAdminUsers, Dashboard (View),
AuditLogEntries (View), IntegrationRequestLogs (View), ModelGenerationJobs (Add), GenerationSettings (View/Edit),
Model3DAssets (View/Approve), Notifications (Add = broadcast), TenantContentReport / ApiKeyContentReport /
RegistrationsReport / TenantRevenueReport (View/Export), GenerationUsageReport (View), PasswordResets (Add).
Always load the live list from `GET api/super-admin-users/permissions`.
