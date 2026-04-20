import { create } from "zustand";

type AppState = {
  lastPing: number;
  setLastPing: (t: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  lastPing: 0,
  setLastPing: (t) => set({ lastPing: t }),
}));
