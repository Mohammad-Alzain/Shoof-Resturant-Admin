import { create } from "zustand";

/**
 * Signals the HTTP client raises for the app shell (it has no access to React or the query cache):
 * - `disabled`: the account or the whole tenant was switched off ("User/Tenant is inactive."), including after an
 *   expired subscription. The shell shows a blocking screen instead of a toast.
 * - `staleTick`: something the screens show is out of date (a deleted country/currency, a row deleted by someone
 *   else behind a by-id 500), so the query cache refetches what is on screen.
 */
interface AccountState {
  disabled: string | null;
  staleTick: number;
  lookupsTick: number;
  setDisabled: (message: string | null) => void;
  markStale: () => void;
  markLookupsStale: () => void;
}

export const useAccountState = create<AccountState>((set) => ({
  disabled: null,
  staleTick: 0,
  lookupsTick: 0,
  setDisabled: (disabled) => set({ disabled }),
  markStale: () => set((s) => ({ staleTick: s.staleTick + 1 })),
  markLookupsStale: () => set((s) => ({ lookupsTick: s.lookupsTick + 1 })),
}));
