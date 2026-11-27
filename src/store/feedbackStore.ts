"use client";

import { create } from "zustand";

type FeedbackState = {
  toast: string | null;
  lastSavedAt: string | null;
  helpOpen: boolean;
  showToast: (message: string, ms?: number) => void;
  clearToast: () => void;
  setLastSavedAt: (iso: string) => void;
  setHelpOpen: (open: boolean) => void;
  toggleHelp: () => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useFeedbackStore = create<FeedbackState>((set) => ({
  toast: null,
  lastSavedAt: null,
  helpOpen: false,
  showToast: (message, ms = 2600) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), ms);
  },
  clearToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },
  setLastSavedAt: (iso) => set({ lastSavedAt: iso }),
  setHelpOpen: (open) => set({ helpOpen: open }),
  toggleHelp: () => set((s) => ({ helpOpen: !s.helpOpen })),
}));
