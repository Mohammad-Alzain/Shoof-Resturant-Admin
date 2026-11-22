# 01 — Restaurant Admin Portal (CMS)

**Users:** a restaurant's owner and staff. **Backend:** `Shoof.Api.Restaurant`.
**Purpose:** build and maintain the restaurant's digital menu, its look, tables/QR codes, AI photos and 3D
models, and the team's access.

Read [README.md](README.md) §2 first (login, headers, permissions, errors, paging, language, time zones,
uploads, notifications). API details: [guide §4](../FE-API-INTEGRATION-GUIDE.md#4-shoofapirestaurant--endpoint-reference).

Every request sends `Authorization: Bearer`, `X-Api-Key`, `X-Tenant-Id`, `X-Language`.
Everything is automatically limited to the user's own tenant.

---

## Suggested navigation

```
Dashboard
Menu
 ├─ Categories (tree: category → sub-category)
 ├─ Items (list + item editor: details · photos · ingredients · 3D model)
 └─ Ingredients (library)
AI Generation
 ├─ Generation jobs (queue / history)
 └─ Bulk 3D generation
Restaurant
 ├─ Restaurant profile (name, logo, currency, country)
 ├─ Themes (light / dark)
 ├─ Social links
 └─ Tables & QR codes
Team
 ├─ Users
 └─ Roles & permissions
🔔 Notifications (header bell)
```

The tenant may own **several restaurants**. Most create forms need a `restaurantId` → show a
**restaurant switcher** in the header (from `GET api/restaurants`) and pre-fill it; hide it when there is only one.

---

## 1. Login & session

| Function | Endpoint | Notes |
|---|---|---|
| Log in | `POST api/auth/login` | Body: `tenantSlug` + `email` + `password`. The slug comes from the subdomain (`pepsi.shoof.lambdor.com` → `pepsi`), or the user types it as "Restaurant code". It's required because the same email can be a separate account in another restaurant. Error `400` "Incorrect email or password." (also returned for a wrong or missing slug) / "Account is inactive." |
| Refresh | `POST api/auth/refresh` | Rotating refresh token |
| Log out | `POST api/auth/revoke` | |
| Change my password | `POST api/account/change-password` | `currentPassword`, `newPassword` → new tokens (replace both). Forced when login returned `mustChangePassword: true` (everything else returns `403` "Password change required." until then). |
| My profile | `GET` / `PUT api/account/me` | Edit name + phone. Email is read-only. |
| Forgot password | `POST api/account/forgot-password` | `tenantSlug` (from the subdomain) + `email` → always `204`; emails a link to `https://{slug}.shoof.lambdor.com/admin/reset-password?email=…&token=…&slug=…` (expires after 2 hours) |
| Reset password page | `POST api/account/reset-password` | `/admin/reset-password` reads `email`, `token`, `slug` from the query string and posts them with `newPassword` → `204`, or `400` "This password reset link is invalid or has expired." |

Store `tenant_id` from the JWT and send it as `X-Tenant-Id`. Show `fullName` in the header.
No sign-up screen (not supported).

---

## 2. Dashboard — permission `RestaurantDashboard.View`

One overview page with an optional **restaurant** filter and **date range**, plus **Export to Excel**.

| Card | Content | Suggested UI |
|---|---|---|
| Menu content | restaurants, categories, active / inactive items, items missing ingredients, items missing a 3D model | KPI tiles; "missing" tiles link to filtered item lists (e.g. *Items → without 3D model*) |
| 3D models | jobs pending / processing / ready / failed + latest failed jobs (item, error, retries) | status tiles + small table with "retry" link to the item |
| Tables & QR | total / active tables, tables with / without QR, restaurants with a general QR | tiles; "without QR" → Tables screen |
| Subscription | plan, support tier, price, discount, effective price, currency, from / to, **days remaining**, active flag | card; warn when `daysRemaining` is low or `hasRegistration = false` |
| AI generation usage | daily used / limit / remaining, monthly used / limit / remaining, **extra credits remaining** + nearest expiry | progress bars; `null` limit = "Unlimited" |

- `GET api/dashboard/overview?restaurantId=&fromDate=&toDate=`
- `GET api/dashboard/export` (same filters) → downloads `restaurant-dashboard.xlsx`.
- Usage counts only the restaurant's own pool (partner keys with their own plan are not included).
  Monthly "used" counts plan allowance only; credit-paid generations show in the credits figure.

---

## 3. Menu categories — group `MenuCategories`

**Model:** two levels only — a **category** may have **sub-categories**; a sub-category cannot have children.

| Function | Permission | Endpoint |
|---|---|---|
| List / filter (parent, active) | View | `GET api/menu-categories?parentCategoryId=&isActive=` |
| View | View | `GET api/menu-categories/{id}` |
| Create | Add | `POST api/menu-categories` |
| Edit (incl. activate / deactivate, move parent) | Edit | `PUT api/menu-categories/{id}` |
| Delete | Delete | `DELETE api/menu-categories/{id}` |

**Form fields:** restaurant (create only), parent category (optional; only top-level categories may be
chosen), name EN* (≤ 200), name AR (≤ 200), description EN / AR, display order (int), active (edit only).

**Rules / errors**
- "A category cannot be its own parent." — exclude the category itself from the parent picker.
- "A sub-category cannot itself be used as a parent category." — the parent picker should list only categories with no parent.
- New categories start active.
- **Delete does not remove sub-categories or items** (soft delete of that row only). Block or warn on deleting
  a category that still has sub-categories/items ("Move or delete its items first"); prefer **Deactivate**.
- Display order: lower first. A drag-and-drop reorder must PUT each changed category (no bulk reorder endpoint).

**Suggested UI:** tree view with drag handles, active toggle, item count, "add sub-category" action.

---

## 4. Menu items — group `MenuItems`

| Function | Permission | Endpoint |
|---|---|---|
| List / filter (category, active, **without 3D model only**) + search | View | `GET api/menu-items?menuCategoryId=&isActive=&withoutModelOnly=` |
| View | View | `GET api/menu-items/{id}` |
| Create | Add | `POST api/menu-items` |
| Edit (incl. activate / deactivate) | Edit | `PUT api/menu-items/{id}` |
| Delete | Delete | `DELETE api/menu-items/{id}` |

**Form fields:** category* (create only), name EN* (≤ 200), name AR, description EN / AR, price* (decimal),
currency (defaults to the restaurant's currency; required on edit), display order, active (edit only).

**List columns:** primary photo thumbnail (image with the lowest `displayOrder`), name, category, price + currency
code, active toggle, 3D status badge, actions.

**Rules**
- Price is shown with the currency's `decimalPlaces` and `symbol` (load currencies once).
- Inactive items are hidden from the public menu.
- Changing name/description/ingredients affects whether a 3D model can be **regenerated** (see §7).

### 4.1 Item editor — suggested tabs

1. **Details** — form above.
2. **Photos** — §5.
3. **Ingredients** — §6.
4. **3D model** — §7 / §8 (status, viewer, generate / regenerate, manual upload).

---

## 5. Item photos — upload: `MenuItems.Edit`; AI: `ModelGenerationJobs.Add`

Gallery of up to **5 photos per item**. The **first** (lowest `displayOrder`) is the primary photo / card thumbnail.

| Function | Permission | Endpoint |
|---|---|---|
| Upload photo | MenuItems.Edit | `POST api/menu-items/{itemId}/images` (multipart `file`) |
| Delete photo | MenuItems.Edit | `DELETE api/menu-items/{itemId}/images/{imageId}` |
| **Generate AI photo** | ModelGenerationJobs.Add | `POST api/menu-items/{itemId}/images/generate` |
| **Create AI variant** of a photo | ModelGenerationJobs.Add | `POST api/menu-items/{itemId}/images/{imageId}/variants` |

**Variant form:** instruction* (≤ 300, e.g. "without onions"), caption* (≤ 100, shown under the photo).

**Rules / states**
- Limit 5 **including photos still being generated**. Over the limit: "A menu item can have at most 5 photos
  (including photos being generated)." → disable Upload/Generate at 5 and show the counter "3 / 5".
- Files: JPG/PNG/WEBP, ≤ 5 MB.
- AI photo and variant return a **job** (status Queued). Show a placeholder tile "Generating…" and poll
  `GET api/model-generation-jobs/{jobId}` or wait for the notification; when **Ready**, re-fetch the item — the
  new photo appears with source `1` (AI generated) or `2` (AI variant). On **Failed** show `errorMessage`.
- AI photos use the **same quota** as 3D generations (show remaining quota near the buttons, §9).
- Badge each photo by source: Uploaded / AI / AI variant (+ caption).
- Deleting the source photo of a queued variant makes that job fail with "Source image no longer exists".

---

## 6. Ingredients

### 6.1 Ingredient library — group `Ingredients`
Restaurant-wide list of reusable ingredients.

| Function | Permission | Endpoint |
|---|---|---|
| List + search | View | `GET api/ingredients` |
| Create / edit | Add / Edit | `POST` / `PUT api/ingredients/{id}` |
| Delete | Delete | `DELETE api/ingredients/{id}` |

Fields: name EN* (≤ 150), name AR (≤ 150), description EN / AR.

### 6.2 Item ingredients — group `MenuItemIngredients`
Attach library ingredients to an item.

| Function | Permission | Endpoint |
|---|---|---|
| List for item | View | `GET api/menu-item-ingredients?menuItemId=` |
| Attach | Add | `POST api/menu-item-ingredients` (`menuItemId`, `ingredientId`, `note?`, `isRemovable` default true) |
| Edit note / removable | Edit | `PUT api/menu-item-ingredients/{id}` |
| Detach | Delete | `DELETE api/menu-item-ingredients/{id}` |

- **Removable** = the guest may ask to leave it out (shown on the public menu). **Note** = free text, e.g. "spicy".
- Suggested UI: searchable multi-select of library ingredients + inline "create new ingredient".
- Adding/removing an ingredient always counts as a "meaningful change" (unlocks 3D regeneration).

---

## 7. AI 3D models & generation jobs — group `ModelGenerationJobs`

| Function | Permission | Endpoint |
|---|---|---|
| Generate 3D model for an item | Add | `POST api/model-generation-jobs` (`menuItemId`, `forceNew`) |
| **Bulk** generate (≤ 500 items) | Add | `POST api/model-generation-jobs/bulk` (`menuItemIds[]`, `forceNew`) |
| Cancel a queued job | Add | `POST api/model-generation-jobs/{id}/cancel` |
| Cancel a whole batch (queued part) | Add | `POST api/model-generation-jobs/batches/{batchId}/cancel` |
| Jobs grid | View | `GET api/model-generation-jobs` (filters below) |
| Job detail / poll | View | `GET api/model-generation-jobs/{id}` |
| Remaining quota | View | `GET api/model-generation-jobs/quota` |

### 7.1 Job lifecycle (status badge)

| # | Status | Label | Can cancel |
|---|---|---|---|
| 0 | Pending | **Queued** (show "position N in queue") | ✔ |
| 1 | Processing | Generating… | ✗ |
| 2 | Ready | Ready (thumbnail) | ✗ |
| 3 | Failed | Failed (show `errorMessage` as-is) | ✗ |
| 4 | Cancelled | Cancelled (didn't use quota) | ✗ |

- Triggers return **Queued** immediately; poll the job (e.g. every 5–10 s) or react to the notification.
- `queuePosition` = place in *your restaurant's* queue; it's not a time estimate.
- **Library match**: a job can come back immediately **Ready** with `isLibraryMatch = true` → show
  "Reused from the 3D library — instant and free". Use **"Force new model"** (`forceNew: true`) to skip reuse.
- Kind: `0` = 3D model, `1` = AI photo. The grid shows both; filter by kind.

### 7.2 Trigger errors (single)

| Message | Meaning / UI |
|---|---|
| "This item already has a generation job in progress." | Show the existing job instead |
| "This item already has a 3D model and hasn't changed enough to regenerate it." | Regenerate is locked until name/description changes substantially or ingredients change. Explain this in a tooltip |
| "Daily model-generation quota (N) reached for this tenant. Try again after midnight UTC." | Disable generate buttons for today |
| "Monthly generation quota of N reached and no extra generation credits are left. Contact us to buy an extra credit pack." | Show an upsell/contact message |

### 7.3 Bulk generation screen
1. Load items with `withoutModelOnly=true` (or any filter) → multi-select (max 500).
2. Show remaining quota (§9) and **cap the selection** at daily/monthly remaining + extra credits.
3. Submit → result has `batchId`, `created[]` (queued or instantly ready) and `skipped[]` with a reason per item:
   `NotFound`, `AlreadyProcessing`, `NoMeaningfulChange`, `QuotaExceeded`, `MonthlyQuotaExceeded` → show a
   per-item result list, **not** a single error.
4. Track progress via the jobs grid filtered by `batchId`; offer **Cancel remaining**.
5. When the batch finishes, a **"Bulk generation finished — X of Y ready, Z failed, W cancelled"** notification arrives.

### 7.4 Jobs grid filters & columns
Filters: item, status, kind, batch, restaurant, category, name search (≤ 100 chars, EN or AR), from/to date (local, inclusive).
Columns: item name, kind, status badge, queue position, batch, created / submitted / finished, library-match flag,
result thumbnail, error message, actions (cancel when queued, open item).

### 7.5 Possible failure messages (display as-is)
"Tenant inactive", "Submission interrupted", "Source image no longer exists", "Menu item no longer exists",
"Source image could not be read", plus provider errors.

### 7.6 Shared library approval (informational)
A model your restaurant generated is used on your item right away. It's shared with *other* restaurants only
after Lambdor approves it → you receive notification **6** (approved) or **7** (not approved + reason). Your item
keeps the model either way — no action needed. Show these as informational notifications.

---

## 8. Manual 3D models — group `MenuItem3DModels`

| Function | Permission | Endpoint |
|---|---|---|
| List for item | View | `GET api/menu-item-3d-models?menuItemId=` |
| Upload files | Add | `POST api/menu-item-3d-models/upload` (multipart: `menuItemId`, `glbFile`*, `usdzFile?`, `thumbnailFile?`) |
| Add by URL | Add | `POST api/menu-item-3d-models` (`glbUrl`*, `usdzUrl?`, `thumbnailUrl?`) |
| Edit URLs / activate | Edit | `PUT api/menu-item-3d-models/{id}` |
| Delete | Delete | `DELETE api/menu-item-3d-models/{id}` |

- GLB required (used by the web 3D viewer), USDZ optional (iOS AR Quick Look), thumbnail optional. Each ≤ 5 MB.
- Source badge: AI generated / Manual upload. Only **active** models show on the public menu.
- Preview with `<model-viewer src="{glb}" ios-src="{usdz}" camera-controls auto-rotate ar>`.

---

## 9. Quota & credits widget — `ModelGenerationJobs.View`

`GET api/model-generation-jobs/quota` → daily remaining, monthly remaining (`null` = unlimited), extra credits
remaining, nearest credit expiry (UTC).

Show it wherever generation can be triggered (item editor, bulk screen, photos tab):
"Today: 12 left · This month: 340 left · Extra credits: 50 (expire 30 Dec)".
Order of consumption: daily limit always applies → monthly plan allowance → extra credits (earliest expiry first).
A cancelled queued job returns its credit. Library reuse is free.
Credits are bought offline through Lambdor (no purchase screen here). A "credits added" notification (type 8) arrives when Lambdor records a purchase.

---

## 10. Restaurant profile — group `Restaurants`

| Function | Permission | Endpoint |
|---|---|---|
| List restaurants (for the switcher) | View | `GET api/restaurants` |
| View | View | `GET api/restaurants/{id}` |
| Edit name / contact / currency / country | Edit | `PUT api/restaurants/{id}` |
| Upload logo | Edit | `POST api/restaurants/{id}/logo` |

- Fields: name EN* (≤ 200), name AR, contact email, contact phone (≤ 50), currency* (picker from
  `GET api/currencies`), country* (picker from `GET api/countries`; the country sets the restaurant's
  **time zone**, shown read-only).
- **Contact email** gets the subscription-expiry reminders (30, 7 and 1 days before the end date); when empty,
  they go to the Owner admins. Errors: "The contact email address is not valid.", "The contact phone number is
  too long (50 characters at most).". The save replaces every field, so always send the current values.
- **Restaurants can't be created or deleted here** — Lambdor creates them in the SuperAdmin console.

---

## 11. Menu themes — group `MenuThemes`

Controls how the public menu looks. Each restaurant can have many themes, but only **one active Light** and
**one active Dark** theme at a time.

| Function | Permission | Endpoint |
|---|---|---|
| List (restaurant, mode, active) | View | `GET api/menu-themes` |
| Create / edit | Add / Edit | `POST` / `PUT api/menu-themes/{id}` |
| Delete | Delete | `DELETE api/menu-themes/{id}` |
| **Activate** | **MenuThemes.Activate** | `POST api/menu-themes/{id}/activate` |
| Background image | Edit | `POST api/menu-themes/{id}/background-image` |
| Header logo | Edit | `POST api/menu-themes/{id}/header-logo` |

**Theme editor fields** (colours ≤ 20 chars each, e.g. `#1A2B3C`; fonts ≤ 100):
- Name* (≤ 200), mode* Light/Dark (create only), restaurant (create only)
- Menu: background colour, background image
- Header: background colour, text colour, logo, logo position (Left / Center / Right)
- Footer: background colour, text colour
- Category: background, text · Sub-category: background, text · Item: background, text
- Fonts: header/footer, category, sub-category, item
- Page transition: None / Slide horizontal / Slide vertical / Fade / Page curl

**Rules**
- New themes are **inactive**. Activating one deactivates the other themes of the same restaurant **and mode**.
- Mode and restaurant can't change after creation.
- **Suggested UI:** colour pickers + font dropdown + a **live preview** pane that mimics the public menu; "Activate" button with a confirm.

---

## 12. Social links — group `RestaurantSocialLinks`

| Function | Permission | Endpoint |
|---|---|---|
| List | View | `GET api/restaurant-social-links?restaurantId=&platform=` |
| Add | Add | `POST api/restaurant-social-links` (`restaurantId`, `platform`, `url`) |
| Edit URL | Edit | `PUT api/restaurant-social-links/{id}` (URL only) |
| Delete | Delete | `DELETE api/restaurant-social-links/{id}` |

Platforms: Facebook, Instagram, Twitter, TikTok, WhatsApp, YouTube, Snapchat. **One link per platform per
restaurant** ("A social link for this platform already exists for this restaurant.") → only offer unused platforms.
To change a platform, delete and re-add.

---

## 13. Tables & QR codes — groups `Tables`, `QrCodes`

| Function | Permission | Endpoint |
|---|---|---|
| Tables list (active filter) | Tables.View | `GET api/tables` |
| Add table | Tables.Add | `POST api/tables` (`restaurantId`, `label` ≤ 50) |
| Rename / activate | Tables.Edit | `PUT api/tables/{id}` |
| Delete table | Tables.Delete | `DELETE api/tables/{id}` |
| QR list (restaurant, table) | QrCodes.View | `GET api/qr-codes` |
| **Generate QR** (restaurant-level or table) | QrCodes.Add | `POST api/qr-codes` (`restaurantId`, `tableId?`) |

- Two QR types: **general** (no table) and **per table**. Generating is idempotent — generating again returns the same QR.
- QR has `targetUrl` (where it points) and `imageUrl` (PNG) → **Download** and **Print** actions
  (suggest a printable sheet: table label + QR).
- QR codes can't be edited or deleted.
- The QR PNG and `targetUrl` hold the full absolute menu URL (`https://{slug}.shoof.lambdor.com/menu/{restaurantId}[/table/{tableId}]`),
  so a scanned QR opens the menu directly. Show `targetUrl` as a clickable link next to the QR.
- Tables list: label, active, "has QR" indicator, "Generate QR" action.

---

## 14. Team: users — group `AdminUsers`

| Function | Permission | Endpoint |
|---|---|---|
| List (active filter) + search | View | `GET api/admin-users` |
| View | View | `GET api/admin-users/{id}` |
| Create | Add | `POST api/admin-users` (`fullName`, `email`, `phoneNumber?`, `password`, `roles[]`) |
| Edit (name, phone, active, roles) | Edit | `PUT api/admin-users/{id}` |
| Delete | Delete | `DELETE api/admin-users/{id}` |

- Full name ≤ 200. Email is unique within this restaurant ("Email '…' is already taken."). Email can't be changed after creation.
- The password set here is temporary: the new user must change it at first login. A forgotten
  password is reset by the user through "Forgot password?", or by the platform (SuperAdmin).
- Roles = multi-select of role **names** from `GET api/roles`.
- Deactivating a user blocks them immediately (`403` on their next call).
- **Last Owner:** the restaurant must always keep one active user with the Owner role. Deactivating, deleting or
  removing the Owner role from the last one fails: "This is the restaurant's last active Owner. Assign the Owner
  role to another active admin first."

## 15. Team: roles & permissions — group `Roles`

| Function | Permission | Endpoint |
|---|---|---|
| List | View | `GET api/roles` |
| View (with permissions) | View | `GET api/roles/{id}` |
| Permission catalogue | View | `GET api/roles/permissions` → groups with their permission strings |
| Create / edit | Add / Edit | `POST` / `PUT api/roles/{id}` (`name`, `description?` ≤ 500, `permissions[]`) |
| Delete | Delete | `DELETE api/roles/{id}` |

- **Suggested UI:** a matrix — rows = permission groups (Menu items, Tables…), columns = View / Add / Edit / Delete
  (+ special ones like *Activate* for themes). Build it from `GET api/roles/permissions`; don't hard-code.
- The **Owner** role (`isOwner: true` in the list and detail) is created automatically with every permission and
  is **locked**: its name and description can't change, it can't be deleted, and its permissions can only be
  added, never removed. Show an "Owner" badge, disable the name/description fields, lock the already-checked
  boxes, and hide Delete. The server answers `400` "The Owner role can't be renamed, deleted or lose permissions.
  You can only add new permissions to it." otherwise.
- Unknown permission strings are silently ignored by the server.

Restaurant-side permission groups: AdminUsers, Roles, Restaurants (View/Edit), MenuCategories, MenuItems,
Ingredients, MenuItemIngredients, MenuItem3DModels, ModelGenerationJobs (View/Add), QrCodes (View/Add), Tables,
MenuThemes (+Activate), RestaurantSocialLinks, Currencies (View), Countries (View), RestaurantDashboard (View).

---

## 16. Lookups (read-only)

- Currencies `GET api/currencies` (`Currencies.View`): ISO code, symbol, display name, decimal places.
- Countries `GET api/countries` (`Countries.View`): ISO code, name EN/AR, time zone.

Load once and cache; used in restaurant and item forms.

---

## 17. Notifications — no permission (own inbox)

Bell icon + drawer + full inbox page. See README §2.8.

| Function | Endpoint |
|---|---|
| Inbox (read/unread, type, paging; newest first) | `GET api/notifications` |
| Unread badge | `GET api/notifications/unread-count` |
| Mark read | `POST api/notifications/{id}/read` |
| Mark all read | `POST api/notifications/read-all` |
| Realtime | SignalR `/hubs/notifications`, event `notificationReceived` |

Deep links: `jobId` → job detail · `menuItemId` → item editor · `batchId` → jobs grid filtered by batch ·
Announcement (type 4) → show full text in a dialog (plain text).
