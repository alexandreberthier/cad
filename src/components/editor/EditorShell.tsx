"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { TopBar } from "./TopBar";
import { Toolbar } from "./Toolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { ToastHost } from "@/components/ui/ToastHost";
import { ShortcutsHelp } from "@/components/ui/ShortcutsHelp";
import { MobileSheets } from "./MobileSheets";
import { useProjectStore } from "@/store/projectStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoPersist } from "@/hooks/useAutoPersist";

const PlanCanvas = dynamic(
  () => import("@/components/canvas2d/PlanCanvas").then((m) => m.PlanCanvas),
  { ssr: false, loading: () => <ViewportSkeleton label="2D-Plan" /> }
);

const Scene3D = dynamic(
  () => import("@/components/canvas3d/Scene3D").then((m) => m.Scene3D),
  { ssr: false, loading: () => <ViewportSkeleton label="3D-Ansicht" /> }
);

function ViewportSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-muted">
      {label} wird geladen…
    </div>
  );
}

export function EditorShell() {
  const viewMode = useProjectStore((s) => s.ui.viewMode);
  useKeyboardShortcuts();
  useAutoPersist();

  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest?.("[data-canvas-root]")) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col bg-bg text-ink">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Toolbar />
        <main
          data-canvas-root
          className="relative min-w-0 flex-1 overflow-hidden"
        >
          {viewMode === "2d" && <PlanCanvas />}
          {viewMode === "3d" && <Scene3D />}
          {viewMode === "split" && (
            <div className="grid h-full grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
              <div className="relative min-h-0 border-b border-line lg:border-b-0 lg:border-r">
                <PlanCanvas />
              </div>
              <div className="relative min-h-0">
                <Scene3D />
              </div>
            </div>
          )}
          <MobileSheets />
        </main>
        <div className="hidden md:flex">
          <PropertiesPanel />
        </div>
      </div>
      <ToastHost />
      <ShortcutsHelp />
    </div>
  );
}
