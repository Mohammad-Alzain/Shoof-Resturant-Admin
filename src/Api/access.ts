import { create } from "zustand";

/**
 * The API's "403 Forbidden" answers, kept so the shell can say why when the account is refused across the board.
 * A single refused page is not that: it gets a toast where it happens. The banner is for "nothing works", so any
 * allowed call (other than sign-in and the account's own profile, which the server answers even with a wrong app key)
 * proves the account works and keeps the banner away.
 */
interface AccessState {
  /** `X-Error-Code` header, e.g. SubscriptionExpired / IpNotAllowed; empty for a plain permission failure. */
  code: string;
  /** Plain-text body the server sent (may be empty). */
  text: string;
  /** How many calls were refused since the session started. */
  count: number;
  /** How many calls were allowed since the session started (sign-in and the profile excluded). */
  ok: number;
  dismissed: boolean;
  record: (code: string, text: string) => void;
  succeed: () => void;
  dismiss: () => void;
  /** A new session (sign-in, sign-out): forget what the previous one saw. */
  reset: () => void;
}

const DISMISS_KEY = "shoof.access.dismissed";
const readDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

export const useAccessStore = create<AccessState>((set) => ({
  code: "",
  text: "",
  count: 0,
  ok: 0,
  dismissed: readDismissed(),
  record: (code, text) => set((s) => ({ code: code || s.code, text: text || s.text, count: s.count + 1 })),
  succeed: () => set((s) => ({ ok: s.ok + 1 })),
  dismiss: () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: dismissed for this page only */
    }
    set({ dismissed: true });
  },
  reset: () => {
    try {
      sessionStorage.removeItem(DISMISS_KEY);
    } catch {
      /* nothing stored */
    }
    set({ code: "", text: "", count: 0, ok: 0, dismissed: false });
  },
}));

/** Refusals the banner explains: a blocking code (expired plan, IP not allowed, wrong app key), or every call refused, at least two. */
export const accessBlocked = (s: Pick<AccessState, "code" | "count" | "ok">) =>
  ["SubscriptionExpired", "IpNotAllowed", "InvalidApiKey"].includes(s.code) ? s.count > 0 : s.count >= 2 && s.ok === 0;
