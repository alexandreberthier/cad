"use client";

import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { IconRedo, IconUndo } from "@/components/icons/ToolIcons";
import {
  downloadBomCsv,
  downloadProjectJson,
  downloadReportPdf,
  parseProjectFile,
} from "@/lib/exportProject";
import { downloadDxf } from "@/lib/exportDxf";
import { capturePlanPng } from "@/lib/planStage";
import {
  deleteProject,
  listProjects,
  type ProjectRecord,
} from "@/lib/db/dexie";
import type { ProjectData } from "@/types/project";

const FLOOR_PRESETS = ["KG", "EG", "OG", "DG"];

type MenuId = "plan" | "export" | null;

function formatSaved(iso: string | null): string {
  if (!iso) return "Noch nicht gespeichert";
  try {
    return `Gespeichert · ${new Date(iso).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "Gespeichert";
  }
}

function useUndoRedoFlags() {
  const [flags, setFlags] = useState({ canUndo: false, canRedo: false });
  useEffect(() => {
    const sync = () => {
      const t = useProjectStore.temporal.getState();
      setFlags({
        canUndo: t.pastStates.length > 0,
        canRedo: t.futureStates.length > 0,
      });
    };
    sync();
    return useProjectStore.temporal.subscribe(sync);
  }, []);
  return flags;
}

export function TopBar() {
  const meta = useProjectStore((s) => s.meta);
  const floors = useProjectStore((s) => s.floors);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const mode = useProjectStore((s) => s.ui.mode);
  const viewMode = useProjectStore((s) => s.ui.viewMode);
  const setActiveFloor = useProjectStore((s) => s.setActiveFloor);
  const addFloor = useProjectStore((s) => s.addFloor);
  const removeFloor = useProjectStore((s) => s.removeFloor);
  const clearActiveFloor = useProjectStore((s) => s.clearActiveFloor);
  const newProject = useProjectStore((s) => s.newProject);
  const updateFloor = useProjectStore((s) => s.updateFloor);
  const setDefaultFloorHeight = useProjectStore((s) => s.setDefaultFloorHeight);
  const defaultFloorHeight = useProjectStore((s) => s.ui.defaultFloorHeight);
  const setMode = useProjectStore((s) => s.setMode);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const renameProject = useProjectStore((s) => s.renameProject);
  const loadProjectData = useProjectStore((s) => s.loadProjectData);
  const persist = useProjectStore((s) => s.persist);
  const showToast = useFeedbackStore((s) => s.showToast);
  const lastSavedAt = useFeedbackStore((s) => s.lastSavedAt);
  const setHelpOpen = useFeedbackStore((s) => s.setHelpOpen);
  const { canUndo, canRedo } = useUndoRedoFlags();
  const undo = () => useProjectStore.temporal.getState().undo();
  const redo = () => useProjectStore.temporal.getState().redo();
  const activeFloor = floors.find((f) => f.id === activeFloorId);
  const importRef = useRef<HTMLInputElement>(null);
  const planMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      const root =
        openMenu === "plan" ? planMenuRef.current : exportMenuRef.current;
      if (root && !root.contains(t)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [openMenu]);

  useEffect(() => {
    if (openMenu !== "plan") return;
    void listProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [openMenu, meta.id, meta.updatedAt]);

  const closeMenus = () => setOpenMenu(null);

  const refreshProjects = async () => {
    try {
      setProjects(await listProjects());
    } catch {
      setProjects([]);
    }
  };

  const openStoredProject = async (record: ProjectRecord) => {
    if (record.id === meta.id) {
      closeMenus();
      return;
    }
    await persist();
    loadProjectData(record.data);
    useFeedbackStore.getState().setLastSavedAt(record.updatedAt);
    showToast(`Geöffnet: ${record.name}`);
    closeMenus();
  };

  const snapshot = (): ProjectData => {
    const s = useProjectStore.getState();
    return {
      meta: s.meta,
      floors: s.floors,
      activeFloorId: s.activeFloorId,
      walls: s.walls,
      openings: s.openings,
      symbols: s.symbols,
      rooms: s.rooms,
      connections: s.connections,
      symbolColorDefaults: s.symbolColorDefaults,
    };
  };

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-[11px] font-bold tracking-wide text-panel">
          EC
        </div>
        <div className="min-w-0">
          <input
            className="w-[min(200px,24vw)] truncate border-0 bg-transparent font-[family-name:var(--font-display)] text-base font-semibold outline-none"
            value={meta.name}
            onChange={(e) => renameProject(e.target.value)}
            aria-label="Projektname"
            title="Projektname"
          />
          <div className="text-[10px] text-muted">
            {activeFloor?.name ?? "—"} · {formatSaved(lastSavedAt)}
          </div>
        </div>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-line md:block" />

      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
        <span className="mr-1 hidden text-[10px] font-semibold uppercase tracking-[0.08em] text-muted sm:inline">
          Etage
        </span>
        {floors
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((f) => (
            <button
              key={f.id}
              type="button"
              title={`Geschosshöhe ${f.height.toFixed(2)} m · Rechtsklick: löschen`}
              onClick={() => setActiveFloor(f.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (floors.length <= 1) {
                  showToast("Mindestens eine Etage nötig");
                  return;
                }
                if (
                  window.confirm(
                    `Etage „${f.name}“ mit allen Wänden/Symbolen löschen?`
                  )
                ) {
                  removeFloor(f.id);
                }
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                f.id === activeFloorId
                  ? "bg-ink text-panel"
                  : "bg-surface text-muted hover:text-ink"
              }`}
            >
              {f.name}
            </button>
          ))}
        <button
          type="button"
          title="Neue Etage hinzufügen"
          className="rounded-md px-2 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-ink"
          onClick={() => {
            const used = new Set(floors.map((f) => f.name));
            const next =
              FLOOR_PRESETS.find((n) => !used.has(n)) ??
              `E${floors.length + 1}`;
            addFloor(next);
          }}
        >
          +
        </button>

        <label
          className="ml-1 hidden items-center gap-1 rounded-md bg-surface px-2 py-1 text-[11px] text-muted lg:flex"
          title="Lichte Wand-/Geschosshöhe der aktiven Etage (3D)"
        >
          Wandhöhe
          <input
            type="number"
            step="0.05"
            min="1.5"
            max="6"
            value={activeFloor?.height ?? 2.5}
            onChange={(e) => {
              if (!activeFloor) return;
              const h = Number(e.target.value);
              updateFloor(activeFloor.id, { height: h });
            }}
            className="w-14 rounded border border-line bg-panel px-1 py-0.5 text-xs font-semibold text-ink"
          />
          <span className="font-semibold text-ink">m</span>
        </label>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={planMenuRef}>
          <button
            type="button"
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold hover:bg-surface ${
              openMenu === "plan" ? "bg-surface text-ink" : "text-ink"
            }`}
            aria-expanded={openMenu === "plan"}
            onClick={() =>
              setOpenMenu((m) => (m === "plan" ? null : "plan"))
            }
          >
            Plan
          </button>
          {openMenu === "plan" && (
            <div className="absolute right-0 z-30 mt-1 w-64 rounded-md border border-line bg-panel p-1 shadow-lg">
              <MenuButton
                onClick={async () => {
                  await persist();
                  newProject("Mein Haus");
                  await persist();
                  useFeedbackStore
                    .getState()
                    .setLastSavedAt(new Date().toISOString());
                  showToast("Neuer Plan gestartet");
                  await refreshProjects();
                  closeMenus();
                }}
                label="Neuer Plan"
              />
              <MenuButton
                onClick={() => {
                  if (
                    window.confirm(
                      `Etage „${activeFloor?.name ?? ""}“ komplett leeren?`
                    )
                  ) {
                    clearActiveFloor();
                    showToast("Etage geleert");
                  }
                  closeMenus();
                }}
                label="Diese Etage leeren"
              />
              <MenuButton
                onClick={() => {
                  if (floors.length <= 1) {
                    showToast("Mindestens eine Etage nötig");
                    closeMenus();
                    return;
                  }
                  if (
                    activeFloor &&
                    window.confirm(`Etage „${activeFloor.name}“ löschen?`)
                  ) {
                    removeFloor(activeFloor.id);
                  }
                  closeMenus();
                }}
                label="Diese Etage löschen"
              />
              <div className="mx-1 my-1 border-t border-line" />
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Gespeicherte Projekte
              </p>
              <div className="max-h-40 overflow-y-auto">
                {projects.length === 0 && (
                  <p className="px-2 py-1.5 text-[11px] text-muted">
                    Noch keine weiteren Projekte
                  </p>
                )}
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1 rounded px-1 hover:bg-surface"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate px-1 py-1.5 text-left text-xs"
                      onClick={() => void openStoredProject(p)}
                      title={new Date(p.updatedAt).toLocaleString("de-DE")}
                    >
                      <span
                        className={
                          p.id === meta.id ? "font-semibold text-ink" : ""
                        }
                      >
                        {p.name || "Ohne Namen"}
                      </span>
                      {p.id === meta.id && (
                        <span className="ml-1 text-[10px] text-muted">
                          (aktuell)
                        </span>
                      )}
                    </button>
                    {p.id !== meta.id && (
                      <button
                        type="button"
                        className="shrink-0 rounded px-1.5 py-1 text-[10px] text-danger hover:bg-panel"
                        title="Projekt löschen"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (
                            !window.confirm(
                              `Projekt „${p.name}“ endgültig löschen?`
                            )
                          )
                            return;
                          await deleteProject(p.id);
                          await refreshProjects();
                          showToast("Projekt gelöscht");
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mx-1 my-1 border-t border-line" />
              <label className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
                <span className="text-muted">Default-Höhe</span>
                <span className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    min="1.5"
                    max="6"
                    value={defaultFloorHeight}
                    onChange={(e) =>
                      setDefaultFloorHeight(Number(e.target.value))
                    }
                    className="w-14 rounded border border-line bg-surface px-1 py-0.5 font-semibold"
                  />
                  m
                </span>
              </label>
              <p className="px-2 pb-1 text-[10px] leading-snug text-muted">
                Gilt für neue Etagen. Aktuelle Wandhöhe oben neben den Etagen.
              </p>
            </div>
          )}
        </div>
        <Group label="Ansicht">
          {(
            [
              ["2d", "2D"],
              ["3d", "3D"],
              ["split", "Split"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              title={`Ansicht: ${label}`}
              onClick={() => setViewMode(id)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                viewMode === id
                  ? "bg-panel text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </Group>

        <Group label="Modus">
          <button
            type="button"
            title="Bauherr: einfache Namen, Möbel, Tipps – ohne Stromkreis/FI/Leitung"
            onClick={() => setMode("homeowner")}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              mode === "homeowner"
                ? "bg-accent-soft text-accent-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            Bauherr
          </button>
          <button
            type="button"
            title="Profi: Fachkürzel, Stromkreis, FI, Leitungstyp, Einbauhöhen, Warnungen"
            onClick={() => setMode("pro")}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              mode === "pro" ? "bg-ink text-panel" : "text-muted hover:text-ink"
            }`}
          >
            Profi
          </button>
        </Group>

        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold hover:bg-surface ${
              openMenu === "export" ? "bg-surface text-ink" : "text-ink"
            }`}
            aria-expanded={openMenu === "export"}
            onClick={() =>
              setOpenMenu((m) => (m === "export" ? null : "export"))
            }
          >
            Export
          </button>
          {openMenu === "export" && (
            <div className="absolute right-0 z-30 mt-1 w-52 rounded-md border border-line bg-panel p-1 shadow-lg">
              <MenuButton
                onClick={() => {
                  downloadProjectJson(snapshot());
                  closeMenus();
                }}
                label="Projekt (JSON)"
              />
              <MenuButton
                onClick={() => {
                  downloadBomCsv(snapshot());
                  closeMenus();
                }}
                label="Stückliste (CSV)"
              />
              <MenuButton
                onClick={() => {
                  downloadDxf(snapshot());
                  showToast("DXF gespeichert");
                  closeMenus();
                }}
                label="CAD (DXF)"
              />
              <MenuButton
                onClick={() => {
                  const png = capturePlanPng();
                  downloadReportPdf(snapshot(), png);
                  showToast(
                    png
                      ? "PDF mit Plan gespeichert"
                      : "PDF ohne Plan – 2D-Ansicht öffnen"
                  );
                  closeMenus();
                }}
                label="Bericht (PDF)"
              />
              <MenuButton
                onClick={() => {
                  const png = capturePlanPng();
                  if (!png) {
                    showToast("PNG braucht die 2D- oder Split-Ansicht");
                    closeMenus();
                    return;
                  }
                  const a = document.createElement("a");
                  a.href = png;
                  a.download = `${meta.name || "plan"}.png`;
                  a.click();
                  showToast("Plan als PNG gespeichert");
                  closeMenus();
                }}
                label="Plan (PNG)"
              />
              <MenuButton
                onClick={() => {
                  importRef.current?.click();
                  closeMenus();
                }}
                label="Projekt laden…"
              />
            </div>
          )}
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                await persist();
                loadProjectData(parseProjectFile(await file.text()));
                await persist();
                useFeedbackStore
                  .getState()
                  .setLastSavedAt(new Date().toISOString());
                showToast("Projekt geladen");
              } catch {
                showToast("Keine gültige Projektdatei");
              }
            }}
          />
        </div>

        <button
          type="button"
          title="Tastenkürzel (?)"
          onClick={() => setHelpOpen(true)}
          className="hidden rounded-md px-2 py-1.5 text-xs font-semibold text-muted hover:bg-surface hover:text-ink sm:inline"
        >
          ?
        </button>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Rückgängig (Strg+Z)"
            onClick={undo}
            disabled={!canUndo}
            className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink disabled:opacity-30"
          >
            <IconUndo className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Wiederholen (Strg+Y)"
            onClick={redo}
            disabled={!canRedo}
            className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink disabled:opacity-30"
          >
            <IconRedo className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function MenuButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-surface"
    >
      {label}
    </button>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hidden items-center gap-1 sm:flex">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <div className="flex items-center rounded-lg bg-surface p-0.5">
        {children}
      </div>
    </div>
  );
}
