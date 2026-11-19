import { getBaseUrlDomain } from "@/Api/httpClient";

export function getPhotoUrl(data: any) {
  if (!data) return "";
  if (typeof data === "string") {
    if (data.startsWith("http://") || data.startsWith("https://")) return data;
    const domainBase = getBaseUrlDomain().replace(/\/$/, "");
    const cleanPath = data.replace(/^\//, "");
    return `${domainBase}/${cleanPath}`;
  }
  if (data?.url) {
    if (data.url.startsWith("http://") || data.url.startsWith("https://")) return data.url;
    const domainBase = getBaseUrlDomain().replace(/\/$/, "");
    const cleanPath = data.url.replace(/^\//, "");
    return `${domainBase}/${cleanPath}`;
  }
  if (data?.path) {
    if (data.path.startsWith("http://") || data.path.startsWith("https://")) return data.path;
    const domainBase = getBaseUrlDomain().replace(/\/$/, "");
    const cleanPath = data.path.replace(/^\//, "");
    return `${domainBase}/${cleanPath}`;
  }
  if (data?.full_path) {
    if (data.full_path.startsWith("http://") || data.full_path.startsWith("https://")) return data.full_path;
    const domainBase = getBaseUrlDomain().replace(/\/$/, "");
    const cleanPath = data.full_path.replace(/^\//, "");
    return `${domainBase}/${cleanPath}`;
  }
  const { base_url, destination, name } = data || {};
  if (base_url && destination && name) {
    return `https://${base_url}/${destination}/${name}`;
  }
  return "";
}

export function getPhotoUrlView({
  base_url = getBaseUrlDomain(),
  destination = "",
  name = "",
}) {
  // return `https://${base_url}/${destination}/${name}`;
  return (
    (base_url && `${base_url}`) +
    (destination && `${destination}`) +
    (name && `/${name}`)
  );
}

