import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnreadCount, listNotifications, markAllRead, markRead } from "./api";

export type NotificationFilter = "all" | "unread" | "read";

export const useNotificationsList = (page: number, pageSize: number, filter: NotificationFilter) =>
  useQuery({
    queryKey: ["notifications", "list", page, filter],
    queryFn: () => listNotifications({ page, pageSize, isRead: filter === "all" ? undefined : filter === "read" }),
    placeholderData: keepPreviousData,
  });

/** Unread badge: refreshed by the realtime hub, with a slow poll as the fallback. */
export const useUnreadCount = () =>
  useQuery({ queryKey: ["notifications", "unread"], queryFn: getUnreadCount, refetchInterval: 120_000 });

export const useMarkRead = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: markRead, onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
};

export const useMarkAllRead = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: markAllRead, onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
};

/** Infinite list for the bell menu and the full page: pages of 12 are appended as the list is scrolled. */
export const useNotificationsInfinite = (filter: NotificationFilter) =>
  useInfiniteQuery({
    queryKey: ["notifications", "infinite", filter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listNotifications({ page: pageParam, pageSize: 12, isRead: filter === "all" ? undefined : filter === "read" }),
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
