import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

/**
 * Content-Security-Policy for production builds (not dev: Vite HMR needs inline scripts).
 * Scripts only from this origin, no plugins, no <base> hijack. Frame-ancestors cannot be set from a <meta>:
 * the host must also send `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
 * `Referrer-Policy: no-referrer` and HSTS (see README security notes).
 */
const buildCsp = (apiOrigins: string[]) => [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  `connect-src 'self' ${apiOrigins.join(" ")} blob: data:`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "manifest-src 'self'",
].join("; ");

/** The API (and its SignalR socket) is the only cross-origin place the app may talk to. */
const originsOf = (...urls: (string | undefined)[]) =>
  [...new Set(urls.flatMap((u) => { try { const o = new URL(u ?? ""); return [o.origin, o.origin.replace(/^http/, "ws")]; } catch { return []; } }))];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // The shared 3D library (GLB/USDZ fetched by model-viewer) lives on its own host.
  const csp = buildCsp(originsOf(env.VITE_BASE_URL, env.VITE_HUB_URL, env.VITE_UPLOAD_URL, env.VITE_SHARED_ASSETS_ORIGIN || "https://shared.shoof.lambdor.com"));
  const devApiOrigin = (env.VITE_DEV_API_ORIGIN || process.env.VITE_DEV_API_ORIGIN || "https://localhost:7221").replace(/\/+$/, "");
  // localhost or a bare IP: the backend runs on a developer machine with its Development settings (and dev API key)
  const isLocalApi = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|(\d+\.){3}\d+)$/.test(new URL(devApiOrigin).hostname);
  return {
  plugins: [
    {
      name: "shoof-csp",
      apply: "build",
      transformIndexHtml: () => [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: csp }, injectTo: "head-prepend" }],
    },
    react(),
    tailwindcss(),
    nodePolyfills(),
  ],
  base: "/admin/",
  // Pre-bundle everything up front: discovering deps late re-optimises mid-session and can load two copies of React.
  optimizeDeps: {
    include: [
      "react",
      "react-dom/client",
      "radix-ui",
      "react-i18next",
      "vite-plugin-node-polyfills/shims/process",
      "vite-plugin-node-polyfills/shims/buffer",
      "vite-plugin-node-polyfills/shims/global",
    ],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      // Root-relative on purpose: an absolute path can differ in drive-letter case on Windows (E: vs e:),
      // which makes Vite load the same file twice and split React contexts.
      "@": "/src",
    },
  },
  // The app lives under /admin/ (base above), so the build goes to dist/admin: the host then serves
  // /admin/assets/... straight from disk, and the SPA fallback only has to cover /admin/*.
  build: { sourcemap: false, outDir: "dist/admin", emptyOutDir: true },
  server: {
    port: 3001,
    host: true,
    // The API shares the site's origin when deployed; in dev /backend is forwarded to a restaurant host.
    proxy: {
      "/backend": {
        target: devApiOrigin,
        changeOrigin: true,
        secure: false,
        // A backend run locally (`dotnet run`, https://localhost:7221 in the guide §1) serves `/api/...` and `/hubs/...` at its
        // root; IIS adds `/backend` only on deployed hosts. Strip it for a local target so the same app paths work on both.
        rewrite: (path) => (isLocalApi ? path.replace(/^\/backend(?=\/|$)/, "") : path),
        // changeOrigin only rewrites Host. The server also checks Origin/Referer against the restaurant's own domain,
        // so a browser request from http://localhost:3001 would be refused with 403: present the restaurant origin instead.
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            if (proxyReq.getHeader("origin")) proxyReq.setHeader("origin", devApiOrigin);
            const referer = proxyReq.getHeader("referer");
            if (referer) proxyReq.setHeader("referer", `${devApiOrigin}/admin/`);
          });
        },
      },
    },
  },
  };
});
