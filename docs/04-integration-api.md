# 04 — Integration API (B2B partners)

**Users:** a partner's **backend server** (e.g. a delivery app), not a person or a browser.
**Backend:** `Shoof.Api.Integration`. Auth: header `X-Integration-Key` only (no login, no JWT, no permissions).

> **No frontend app is needed for this API.** It's documented here so the frontend team understands what partners
> can do (it explains several SuperAdmin screens) and to scope a possible future **partner developer console**.
> Full reference, including webhooks: [guide §6](../FE-API-INTEGRATION-GUIDE.md#6-shoofapiintegration--endpoint-reference).

---

## 1. What a partner can do

A partner is onboarded by Lambdor as a **tenant** with one or more **API keys** (SuperAdmin §9). With a key, the
partner's system can:

| Capability | Endpoints |
|---|---|
| See its own key: status, expiry, rate limit, IP allowlist, **subscription** and **remaining AI quota / credits** | `GET api/api-key` |
| Create and edit **its own restaurants** (self-service, no approval) + upload logo | `api/restaurants` |
| Full CRUD of **menu categories** and **menu items** | `api/menu-categories`, `api/menu-items` |
| Trigger / bulk-trigger / cancel **AI 3D generation**, poll jobs; attach its own `metadata` (e.g. SKU) to jobs | `api/model-generation-jobs` |
| Upload or link **3D models** manually | `api/menu-item-3d-models` |
| Read a **notifications inbox** (generation results, announcements, credits added) | `api/notifications` |
| Register a **webhook** to receive events instead of polling; rotate its secret; send a test ping; see delivery history | `api/api-key/webhook…` |
| Read **its own request log** (for debugging with a correlation id) | `GET api/api-key/request-logs` |

Partners **cannot**: create/rotate/delete keys, change their IP allowlist, buy subscriptions or credits (all done by
Lambdor in the SuperAdmin console), manage ingredients, photos, themes, tables or QR codes.

## 2. Business rules that affect SuperAdmin screens

- A key works only while it's **active, not expired**, its tenant is active, the caller's IP is in the allowlist (if
  set), and an **active subscription** covers today: either the key's own (any key of its rotation lineage) or its tenant's.
  - No subscription → partner gets `403` + `X-Error-Code: SubscriptionExpired`.
  - Wrong IP → `403` + `X-Error-Code: IpNotAllowed`.
- **Quota pool:** a key with its **own** subscription has its own daily/monthly limits and its own extra credits,
  separate from the restaurant's. A key without one shares the tenant's pool. This is why registrations and credit
  purchases can target an API key, and why the generation-usage report shows "API key pools".
- **Rate limit:** per key, default 30 requests/min (`rateLimitPerMinute` on the key).
- **Rotation:** the old key works until the grace period ends. The webhook moves to the new key automatically.
- Generation rules (queue, statuses, library reuse, regeneration lock, quota, bulk ≤ 500, skip reasons) are identical
  to the Restaurant Admin ([01 §7](01-restaurant-admin-portal.md#7-ai-3d-models--generation-jobs--group-modelgenerationjobs)).
- Everything a partner does is logged → SuperAdmin "Integration request logs" (03 §10).
- **Subscription expiry** switches the tenant or the key off. Before Release 1.1 it does so even if already renewed
  with a second subscription
  ([known issue](../FE-API-INTEGRATION-GUIDE.md#35-known-backend-issues-as-of-2026-11-22)). Until that release, renew with Upgrade.
- **Ids:** another tenant's id gets the same answer as an unknown one (`404`, with two `GET` exceptions in that list).

## 3. Webhook events (for reference)

Signed `POST` to the partner's https URL, envelope `{ id, type, createdAt, data }`.
Types: `generation.queued`, `generation.processing`, `generation.ready`, `generation.failed`, `generation.cancelled`,
`batch.completed`, `notification.created`, `ping`. Enum values in webhooks are **names** (e.g. `"Ready"`), unlike the REST API.
Webhook URL rule: https, port 443, public host, length-limited.

## 4. If a partner developer console is built later (not in scope today)

It would be a thin UI over the endpoints above, authenticated by pasting the API key (kept in memory only, never
in local storage). Suggested pages: Key overview (subscription, quota, expiry warning) · Webhook settings (URL,
show-once secret, test ping, delivery log with status Pending / Delivered / Gave up) · Request log search by
correlation id · Jobs grid. Confirm with backend and product before starting; the API doesn't allow browser
calls today (CORS isn't configured for it).
