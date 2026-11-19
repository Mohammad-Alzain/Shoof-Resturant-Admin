import { useQuery } from "@tanstack/react-query";
import { http } from "@/Api/httpClient";
import type { DataParams } from "@/Api/types";

export interface IOverview {
  menuContent: { restaurantCount: number; categoryCount: number; activeItemCount: number; inactiveItemCount: number; itemsMissingIngredientsCount: number; itemsMissingModelCount: number };
  models: {
    counts: { pending: number; processing: number; ready: number; failed: number };
    recentFailedJobs: { jobId: string; menuItemId: string; menuItemName?: string | null; errorMessage?: string | null; retryCount: number }[];
  };
  tablesAndQr: { totalTables: number; activeTables: number; tablesWithQrCode: number; tablesWithoutQrCode: number; restaurantsWithGeneralQrCodeCount: number };
  subscription: {
    hasRegistration: boolean;
    price?: number | null;
    discountType?: number | null;
    discount?: number | null;
    effectivePrice: number;
    currencyCode?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    daysRemaining?: number | null;
    isActive: boolean;
    planName?: string | null;
    supportTierName?: string | null;
  };
  generationUsage: {
    dailyUsed: number;
    dailyLimit?: number | null;
    dailyRemaining?: number | null;
    monthlyUsed: number;
    monthlyLimit?: number | null;
    monthlyRemaining?: number | null;
    extraCreditsRemaining: number;
    extraCreditsNearestExpiryUtc?: string | null;
  };
}

export const useOverview = (params: DataParams) =>
  useQuery({ queryKey: ["dashboard", "overview", params], queryFn: () => http.get<IOverview>("dashboard/overview", { params }) });

export const downloadDashboard = async (params: DataParams) => {
  const blob = await http.get<Blob>("dashboard/export", { params, responseType: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "restaurant-dashboard.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
