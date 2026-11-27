"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/projectStore";

export function useAutoPersist() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useProjectStore.subscribe(
      (s) => s.meta.updatedAt,
      () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          void useProjectStore.getState().persist();
        }, 600);
      }
    );
    // initial load of last project if any
    void (async () => {
      try {
        const { listProjects } = await import("@/lib/db/dexie");
        const list = await listProjects();
        if (list[0]) {
          useProjectStore.getState().loadProjectData(list[0].data);
        } else {
          await useProjectStore.getState().persist();
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
