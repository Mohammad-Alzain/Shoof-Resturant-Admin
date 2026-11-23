import { createCrudApi } from "@/Api/crud";
import { http } from "@/Api/httpClient";

/* ---------------- themes ---------------- */
export const THEME_MODES = ["Light", "Dark"] as const;
export const LOGO_POSITIONS = ["Left", "Center", "Right"] as const;
export const TRANSITIONS = ["None", "SlideHorizontal", "SlideVertical", "Fade", "PageCurl"] as const;

export interface ITheme {
  id: string;
  restaurantId: string;
  name: string;
  /** 0 Light, 1 Dark */
  themeMode: number;
  isActive: boolean;
  menuBackgroundColor?: string | null;
  menuBackgroundImageUrl?: string | null;
  headerBackgroundColor?: string | null;
  headerTextColor?: string | null;
  headerLogoUrl?: string | null;
  /** 0 Left, 1 Center, 2 Right */
  headerLogoPosition: number;
  footerBackgroundColor?: string | null;
  footerTextColor?: string | null;
  categoryBackgroundColor?: string | null;
  categoryTextColor?: string | null;
  subCategoryBackgroundColor?: string | null;
  subCategoryTextColor?: string | null;
  itemBackgroundColor?: string | null;
  itemTextColor?: string | null;
  headerFooterFontFamily?: string | null;
  categoryFontFamily?: string | null;
  subCategoryFontFamily?: string | null;
  itemFontFamily?: string | null;
  /** 0 None, 1 SlideHorizontal, 2 SlideVertical, 3 Fade, 4 PageCurl */
  pageTransitionEffect: number;
}
/** A new theme's starting colours (Shoof's own), and what the menu preview uses when no theme is active. */
export const DEFAULT_THEME: Partial<ITheme> = {
  name: "",
  themeMode: 0,
  menuBackgroundColor: "#FBF5E9",
  headerBackgroundColor: "#541F2D",
  headerTextColor: "#FBF5E9",
  headerLogoPosition: 1,
  footerBackgroundColor: "#261C1A",
  footerTextColor: "#FBF5E9",
  categoryBackgroundColor: "#E9DDCF",
  categoryTextColor: "#261C1A",
  subCategoryBackgroundColor: "#F3E7D6",
  subCategoryTextColor: "#261C1A",
  itemBackgroundColor: "#FFFFFF",
  itemTextColor: "#261C1A",
  headerFooterFontFamily: "IBM Plex Sans",
  categoryFontFamily: "IBM Plex Sans",
  subCategoryFontFamily: "IBM Plex Sans",
  itemFontFamily: "IBM Plex Sans",
  pageTransitionEffect: 3,
};

export const themesApi = createCrudApi<ITheme, Partial<ITheme>, Partial<ITheme>>("menu-themes", "menu-themes");
export const activateTheme = (id: string) => http.post<ITheme>(`menu-themes/${id}/activate`);
export const uploadThemeImage = (id: string, kind: "background-image" | "header-logo", file: File): Promise<ITheme> => {
  const body = new FormData();
  body.append("file", file);
  return http.post(`menu-themes/${id}/${kind}`, body);
};

/* ---------------- social links ---------------- */
export const PLATFORMS = ["Facebook", "Instagram", "Twitter", "TikTok", "WhatsApp", "YouTube", "Snapchat"] as const;
export interface ISocialLink {
  id: string;
  restaurantId: string;
  /** index into PLATFORMS (0 Facebook ... 6 Snapchat) */
  platform: number;
  url: string;
}
export const socialApi = createCrudApi<ISocialLink, { restaurantId: string; platform: number; url: string }, { url: string }>("restaurant-social-links", "restaurant-social-links");

/* ---------------- tables and QR ---------------- */
export interface ITable {
  id: string;
  restaurantId: string;
  label: string;
  isActive: boolean;
}
export const tablesApi = createCrudApi<ITable, { restaurantId: string; label: string }, { label: string; isActive: boolean }>("tables", "tables");

export interface IQr {
  id: string;
  restaurantId: string;
  tableId?: string | null;
  targetUrl: string;
  imageUrl?: string | null;
}
export const qrApi = createCrudApi<IQr, { restaurantId: string; tableId?: string | null }>("qr-codes", "qr-codes");
export const generateQr = (restaurantId: string, tableId?: string | null) => http.post<IQr>("qr-codes", { restaurantId, tableId: tableId ?? null });

/* ---------------- restaurant profile ---------------- */
export const uploadRestaurantLogo = (id: string, file: File) => {
  const body = new FormData();
  body.append("file", file);
  return http.post(`restaurants/${id}/logo`, body);
};
