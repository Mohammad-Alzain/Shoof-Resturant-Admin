import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/Api/httpClient";
import type { IPagedResponse } from "@/Api/types";

export interface IRestaurant {
  id: string;
  tenantId: string;
  name: string;
  logoUrl?: string | null;
  currencyId: string;
  currencyIsoCode?: string | null;
  countryId: string;
  countryIsoCode?: string | null;
  countryName?: string | null;
  timeZoneId?: string | null;
  /** Gets the subscription-expiry reminders; empty = they go to the Owner admins. */
  contactEmail?: string | null;
  contactPhone?: string | null;
}

const KEY = "shoof-restaurant-selected";
const read = (): string => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};

interface SwitcherState {
  /** "" = not chosen yet: the first restaurant is used. */
  restaurantId: string;
  select: (id: string) => void;
}

/** The restaurant the console is currently working on (a tenant may own several). */
export const useRestaurantStore = create<SwitcherState>((set) => ({
  restaurantId: read(),
  select: (id) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* private mode */
    }
    set({ restaurantId: id });
  },
}));

export const useRestaurants = () =>
  useQuery({
    queryKey: ["restaurants", "all"],
    staleTime: 5 * 60_000,
    queryFn: async () => (await http.get<IPagedResponse<IRestaurant>>("restaurants", { params: { page: 1, pageSize: 100 } })).data ?? [],
  });

/** The selected restaurant (or the first one, or undefined while loading). */
export function useCurrentRestaurant(): { restaurant?: IRestaurant; all: IRestaurant[]; loading: boolean } {
  const q = useRestaurants();
  const id = useRestaurantStore((s) => s.restaurantId);
  const all = q.data ?? [];
  return { restaurant: all.find((r) => r.id === id) ?? all[0], all, loading: q.isLoading };
}

/** `restaurantId` for create forms and filters. */
export const useRestaurantId = (): string => useCurrentRestaurant().restaurant?.id ?? "";
