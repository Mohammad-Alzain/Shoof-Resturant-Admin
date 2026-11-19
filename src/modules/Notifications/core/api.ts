import { http } from "@/Api/httpClient";
import type { DataParams, IPagedResponse } from "@/Api/types";

export interface INotification {
  id: string | string;
  /** 0 Generation ready, 1 failed, 2 cancelled, 3 bulk batch done, 4 announcement, 5 3D model awaiting approval,
   *  6 approved for sharing, 7 not approved, 8 extra credits added. Unknown values render generically. */
  type: number;
  title: string;
  body?: string | null;
  isRead: boolean;
  creationDateTime: string;
  restaurantId?: string | null;
  menuItemId?: string | null;
  jobId?: string | null;
  batchId?: string | null;
  model3DAssetId?: string | null;
}

export const NOTIFICATION_TYPE_KEYS: Record<number, string> = {
  0: "notif_generation_ready",
  1: "notif_generation_failed",
  2: "notif_generation_cancelled",
  3: "notif_batch_completed",
  4: "notif_announcement",
  5: "notif_model_awaiting_approval",
  6: "notif_model_approved",
  7: "notif_model_not_approved",
  8: "notif_credits_added",
};

export const listNotifications = (params?: DataParams) => http.get<IPagedResponse<INotification>>("notifications", { params });
export const getUnreadCount = async (): Promise<number> => {
  const r = await http.get<number | { count?: number; unreadCount?: number }>("notifications/unread-count");
  return typeof r === "number" ? r : (r?.unreadCount ?? r?.count ?? 0);
};
export const markRead = (id: string | string) => http.post<void>(`notifications/${id}/read`);
export const markAllRead = () => http.post<void>("notifications/read-all");

/** Where a notification leads: type 5 opens the 3D approval queue (spec §11, §18). */
export const notificationTarget = (n: INotification): string | null => {
  if (n.type === 5 || n.model3DAssetId) return "/dashboard/model3d-approvals";
  return null;
};
