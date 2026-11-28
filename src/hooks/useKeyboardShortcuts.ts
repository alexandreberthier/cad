"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useFeedbackStore } from "@/store/feedbackStore";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;

      const store = useProjectStore.getState();
      const temporal = useProjectStore.temporal.getState();

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        useFeedbackStore.getState().toggleHelp();
        return;
      }

      // Einpassen (wie CAD „Zoom Extents“)
      if (e.key === "Home") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("elektrocad:fit-plan"));
        return;
      }
      if (e.code === "Digit0" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (e.shiftKey && store.ui.selectedIds.length) {
          window.dispatchEvent(new CustomEvent("elektrocad:fit-selection"));
        } else {
          window.dispatchEvent(new CustomEvent("elektrocad:fit-plan"));
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const n = store.applyMissingCircuitSuggestions();
        useFeedbackStore
          .getState()
          .showToast(
            n ? `${n} Gerät(e) automatisch zugeordnet` : "Nichts offenes"
          );
        return;
      }

      if (e.key === "Shift" && !e.repeat) {
        store.setShiftFreehand(true);
      }

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        store.setSpacePanning(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        temporal.undo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" ||
          (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        temporal.redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (!store.ui.selectedIds.length) return;
        e.preventDefault();
        store.copySelected();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        store.pasteClipboard();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (!store.ui.selectedIds.length) return;
        e.preventDefault();
        store.copySelected();
        store.pasteClipboard();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const ids = store.ui.selectedIds;
        if (!ids.length) return;
        e.preventDefault();
        for (const id of ids) {
          if (store.walls.some((w) => w.id === id)) store.removeWall(id);
          else if (store.openings.some((o) => o.id === id))
            store.removeOpening(id);
          else if (store.symbols.some((s) => s.id === id))
            store.removeSymbol(id);
          else if (store.rooms.some((r) => r.id === id)) store.removeRoom(id);
          else if (store.connections.some((c) => c.id === id))
            store.removeConnection(id);
        }
        store.setSelectedIds([]);
        return;
      }

      // Drehen: Q / E = 15°, Shift = 90°
      if (e.key.toLowerCase() === "q" && !e.ctrlKey && !e.metaKey) {
        if (!store.ui.selectedIds.length) return;
        e.preventDefault();
        store.rotateSelected(e.shiftKey ? -Math.PI / 2 : -Math.PI / 12);
        return;
      }
      if (e.key.toLowerCase() === "e" && !e.ctrlKey && !e.metaKey) {
        if (!store.ui.selectedIds.length) return;
        e.preventDefault();
        store.rotateSelected(e.shiftKey ? Math.PI / 2 : Math.PI / 12);
        return;
      }

      // Escape wird im Canvas (capture) behandelt: erst Zeichnung abbrechen, dann Auswahl

      const map: Record<string, Parameters<typeof store.setTool>[0]> = {
        v: "select",
        w: "wall",
        t: "door",
        f: "window",
        r: "room",
        m: "calibrate",
        c: "connection",
      };
      const tool = map[e.key.toLowerCase()];
      if (tool) {
        if (tool === "calibrate") {
          const floor = store.getActiveFloor();
          if (!floor?.background) {
            useFeedbackStore
              .getState()
              .showToast("Zuerst Grundriss laden");
            return;
          }
        }
        store.setTool(tool);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        useProjectStore.getState().setShiftFreehand(false);
      }
      if (e.code === "Space") {
        useProjectStore.getState().setSpacePanning(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
