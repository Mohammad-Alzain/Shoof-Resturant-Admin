/** A file from /public, prefixed with the app's base path (the dashboard is served under /admin/). */
export const asset = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
