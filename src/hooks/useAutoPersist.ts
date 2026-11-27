"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useFeedbackStore } from "@/store/feedbackStore";

export function useAutoPersist() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useProjectStore.subscribe(
      (s) => s.meta.updatedAt,
      () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          void (async () => {
            await useProjectStore.getState().persist();
            const at = new Date().toISOString();
            useFeedbackStore.getState().setLastSavedAt(at);
          })();
        }, 600);
      }
    );
    // Letztes Projekt laden (neueste updatedAt)
    void (async () => {
      try {
        const { listProjects } = await import("@/lib/db/dexie");
        const list = await listProjects();
        if (list[0]) {
          useProjectStore.getState().loadProjectData(list[0].data);
          useFeedbackStore.getState().setLastSavedAt(list[0].updatedAt);
        } else {
          await useProjectStore.getState().persist();
          useFeedbackStore
            .getState()
            .setLastSavedAt(new Date().toISOString());
        }
      } catch {
        // IndexedDB may be unavailable in private mode – ignore
      }
    })();
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
