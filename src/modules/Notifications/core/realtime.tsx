import { useEffect, useRef } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getBaseUrl } from "@/Api/httpClient";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import type { INotification } from "./api";

/** Hub URL: `VITE_HUB_URL`, else `/hubs/notifications` next to the API (`…/backend/api/` → `…/backend/hubs/…`). */
const hubUrl = () => {
  if (import.meta.env.VITE_HUB_URL) return import.meta.env.VITE_HUB_URL as string;
  return `${getBaseUrl().replace(/\/?api\/?$/, "")}/hubs/notifications`.replace(/([^:])\/\//g, "$1/");
};

/**
 * Realtime inbox: toast + refresh on `notificationReceived`, de-duplicated by id, and a fresh unread count
 * after every reconnect. The JWT goes as `?access_token=`; with a wildcard CORS origin credentials stay off.
 */
export function useNotificationsRealtime() {
  const token = useAuthStore((s) => s.auth?.token);
  const mustChange = useAuthStore((s) => s.auth?.mustChangePassword);
  const client = useQueryClient();
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!token || mustChange) return;
    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl(), {
        // Read the live token on every (re)connect: it rotates every ~60 minutes.
        accessTokenFactory: () => useAuthStore.getState().auth?.token ?? "",
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    const refresh = () => {
      client.invalidateQueries({ queryKey: ["notifications"] });
    };

    connection.on("notificationReceived", (n: INotification) => {
      const id = String(n?.id);
      if (seen.current.has(id)) return;
      seen.current.add(id);
      // Title and body are plain text: React renders them escaped.
      toast(n.title, { description: n.body ?? undefined });
      refresh();
    });
    connection.onreconnected(refresh);

    connection.start().catch(() => undefined); // offline or hub unreachable: the inbox still works by polling on focus
    return () => {
      connection.off("notificationReceived");
      connection.stop().catch(() => undefined);
    };
  }, [token, mustChange, client]);
}
