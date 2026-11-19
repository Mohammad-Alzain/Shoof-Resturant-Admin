import { create } from "zustand";

/** The last "403 Forbidden" the API answered with, kept so the shell can say why instead of failing silently. */
interface AccessState {
  /** `X-Error-Code` header, e.g. SubscriptionExpired / IpNotAllowed; empty for a plain permission failure. */
  code: string;
  /** Plain-text body the server sent (may be empty). */
  text: string;
  /** How many calls were refused since the page loaded. */
  count: number;
  dismissed: boolean;
  record: (code: string, text: string) => void;
  dismiss: () => void;
}

export const useAccessStore = create<AccessState>((set) => ({
  code: "",
  text: "",
  count: 0,
  dismissed: false,
  record: (code, text) => set((s) => ({ code: code || s.code, text: text || s.text, count: s.count + 1 })),
  dismiss: () => set({ dismissed: true }),
}));
