export function dashboardUrl(path = ""): string {
  path = path.replace(/^\/|\/$/g, "");
  return path ? `/dashboard/${path}` : "/dashboard";
}
