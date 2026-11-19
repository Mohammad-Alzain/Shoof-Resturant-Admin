# Security notes

## What the client does
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `document.write` anywhere; API text is always rendered as text.
- Production builds ship a `Content-Security-Policy` meta (see `vite.config.ts`): scripts only from this origin, no plugins, fixed `<base>`.
- `Referrer-Policy: no-referrer` meta; password-reset links are read once and the token is removed from the address bar.
- URLs that come from the API or from files (`window.open`, asset images) go through `src/helpers/url.ts` / `assetUrl`, which refuse `javascript:`, `data:text/html` and protocol-relative values.
- Sign-out clears the whole React Query cache, so the next operator never sees the previous one's data. Nothing from the API is cached in `localStorage` (only the session, theme and language).
- Refresh tokens rotate on every refresh; the access token is only ever sent to the API base URL.
- Destructive confirmations use an in-app dialog (`confirmAction`), not `window.confirm`.
- Removed unused dependencies with open advisories (`xlsx`, `react-quill-new`/`quill`).

- Request guard (`src/Api/httpClient.ts` + `isUnsafeApiPath`): every API path is refused if it is absolute / protocol-relative (the bearer token would follow it), contains `..` (also percent-encoded, even double-encoded), a backslash or a control character. Ids in CRUD paths are `encodeURIComponent`-ed and ids taken from the address bar (tenant detail) must be GUIDs.
- Production CSP limits `connect-src` to this origin and the configured API / SignalR origins (derived from `VITE_BASE_URL`, `VITE_HUB_URL`), and sets `frame-src 'none'`. A script-level frame-buster covers hosts that cannot send `frame-ancestors`.
- Injection check (read-only mock API returning `<img onerror>`, `<script>`, `javascript:` and template payloads in every text, link and image field, plus hostile URLs such as `/tenants/<img…>` and `/tenants/..%2F..%2Faccount%2Fme`): all 26 pages and their detail dialogs rendered the payloads as inert text; no handler ran, no `javascript:` href/src was created.
- CSV/Excel exports are produced by the server; it must prefix cells starting with `=`, `+`, `-`, `@` (formula injection).

## What the host must add (a meta tag cannot do these)
Send these response headers for the SPA (`public/_headers` ships them for Netlify/Cloudflare Pages; copy them into nginx/IIS otherwise):

```
Content-Security-Policy: frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=63072000; includeSubDomains
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Known trade-offs
- The session (access + refresh token) lives in `localStorage`, so any XSS could read it. Moving it to an `HttpOnly; Secure; SameSite=Strict` cookie needs backend support; until then the CSP above is the main mitigation.
- The API has no "my permissions" endpoint, so the UI shows every page and relies on the server's 403. The server is the only real authorisation boundary.
- `npm audit --omit=dev` still lists low/moderate advisories in build-time/polyfill chains (`elliptic` via `vite-plugin-node-polyfills`, `postcss-selector-parser` via the Tailwind typography plugin); none is reachable from user input.
