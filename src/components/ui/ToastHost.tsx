"use client";

import { useFeedbackStore } from "@/store/feedbackStore";

export function ToastHost() {
  const toast = useFeedbackStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-ink px-3.5 py-2 text-xs font-medium text-panel shadow-lg"
    >
      {toast}
    </div>
  );
}
