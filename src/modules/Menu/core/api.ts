import { useQuery } from "@tanstack/react-query";
import { createCrudApi } from "@/Api/crud";
import { http } from "@/Api/httpClient";
import type { IPagedResponse } from "@/Api/types";

/* ---------------- categories (two levels: category -> sub-category) ---------------- */
export interface ICategory {
  id: string;
  restaurantId: string;
  parentCategoryId?: string | null;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}
export interface ICategoryBody {
  restaurantId?: string;
  parentCategoryId?: string | null;
  nameEn: string;
  nameAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  displayOrder: number;
  isActive?: boolean;
}
export const categoriesApi = createCrudApi<ICategory, ICategoryBody, ICategoryBody>("menu-categories", "menu-categories", { serverSearch: true });

/* ---------------- items ---------------- */
/** 0 Upload, 1 AI generated, 2 AI variant */
export enum ImageSource {
  Upload = 0,
  Ai = 1,
  Variant = 2,
}
export interface IItemImage {
  id: string;
  url: string;
  source: ImageSource;
  caption?: string | null;
  displayOrder: number;
}
export interface IItem {
  id: string;
  menuCategoryId: string;
  menuCategoryName?: string | null;
  name: string;
  description?: string | null;
  price: number;
  currencyId: string;
  currencyIsoCode?: string | null;
  isActive: boolean;
  displayOrder: number;
  images: IItemImage[];
  /** The item's active 3D model. Filled on GET only: create / edit replies return null (guide §4). */
  activeModel?: { id: string; glbUrl: string; usdzUrl?: string | null; thumbnailUrl?: string | null; sourceType: number; creationDateTime?: string } | null;
}
export interface IItemBody {
  menuCategoryId?: string;
  nameEn: string;
  nameAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: number;
  currencyId?: string | null;
  displayOrder: number;
  isActive?: boolean;
}
export const itemsApi = createCrudApi<IItem, IItemBody, IItemBody>("menu-items", "menu-items", { serverSearch: true });

/** The primary photo is the one with the lowest display order. */
export const primaryImage = (item: Pick<IItem, "images">): IItemImage | undefined =>
  [...(item.images ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)[0];

export const useItem = (id?: string) => useQuery({ queryKey: ["menu-items", "detail", id], queryFn: () => itemsApi.get(id as string), enabled: !!id });

export const uploadItemImage = (itemId: string, file: File): Promise<IItemImage> => {
  const body = new FormData();
  body.append("file", file);
  return http.post(`menu-items/${itemId}/images`, body);
};
export const deleteItemImage = (itemId: string, imageId: string) => http.delete(`menu-items/${itemId}/images/${imageId}`);
export const generateItemImage = (itemId: string) => http.post<unknown>(`menu-items/${itemId}/images/generate`);
export const variantItemImage = (itemId: string, imageId: string, body: { instruction: string; caption: string }) =>
  http.post<unknown>(`menu-items/${itemId}/images/${imageId}/variants`, body);

/* ---------------- ingredients ---------------- */
export interface IIngredient {
  id: string;
  name: string;
  description?: string | null;
}
export interface IIngredientBody {
  nameEn: string;
  nameAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
}
export const ingredientsApi = createCrudApi<IIngredient, IIngredientBody, IIngredientBody>("ingredients", "ingredients", { serverSearch: true });

export interface IItemIngredient {
  id: string;
  menuItemId: string;
  ingredientId: string;
  ingredientName?: string | null;
  note?: string | null;
  isRemovable: boolean;
}
export const itemIngredientsApi = createCrudApi<IItemIngredient, { menuItemId: string; ingredientId: string; note?: string | null; isRemovable: boolean }, { note?: string | null; isRemovable: boolean }>(
  "menu-item-ingredients",
  "menu-item-ingredients",
);
export const useItemIngredients = (menuItemId?: string) =>
  useQuery({
    queryKey: ["menu-item-ingredients", menuItemId],
    enabled: !!menuItemId,
    queryFn: async () => (await http.get<IPagedResponse<IItemIngredient>>("menu-item-ingredients", { params: { menuItemId, page: 1, pageSize: 100 } })).data ?? [],
  });

/* ---------------- manual 3D models ---------------- */
export interface IModel3D {
  id: string;
  menuItemId: string;
  glbUrl?: string | null;
  usdzUrl?: string | null;
  thumbnailUrl?: string | null;
  /** 0 AI generated, 1 Manual upload */
  sourceType: number;
  generationStatus: number;
  isActive: boolean;
}
export const model3dApi = createCrudApi<IModel3D>("menu-item-3d-models", "menu-item-3d-models");
export const useItemModels = (menuItemId?: string) =>
  useQuery({
    queryKey: ["menu-item-3d-models", menuItemId],
    enabled: !!menuItemId,
    queryFn: async () => (await http.get<IPagedResponse<IModel3D>>("menu-item-3d-models", { params: { menuItemId, page: 1, pageSize: 50 } })).data ?? [],
  });
export const uploadModel = (body: FormData): Promise<IModel3D> => http.post("menu-item-3d-models/upload", body);
