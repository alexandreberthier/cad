"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  BackgroundImage,
  Connection,
  Floor,
  Opening,
  PlanSymbol,
  Point2,
  ProjectData,
  Room,
  SymbolKind,
  Tool,
  UiState,
  ViewMode,
  Wall,
  AppMode,
} from "@/types/project";
import { id } from "@/lib/id";
import {
  createEmptyProject,
  createDefaultFloor,
  normalizeProjectData,
} from "@/lib/projectFactory";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { ROOM_TEMPLATES, templatePoint } from "@/lib/roomTemplates";
import {
  closestWall,
  dist,
  findWallForEdge,
  pointInPolygon,
  snapAngle,
  snapToEndpoints,
  wallAngle,
  wallSide,
  metersToPx,
} from "@/lib/geometry/math";
import { snapSymbolPlacement } from "@/lib/geometry/snapSymbol";
import { saveProject } from "@/lib/db/dexie";
import {
  isPanelSymbol,
  suggestBreaker,
  suggestCableType,
  suggestNextCircuitId,
  suggestRcdGroup,
} from "@/lib/circuits";

interface ProjectStore extends ProjectData {
  ui: UiState;

  // UI
  setMode: (mode: AppMode) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setTool: (tool: Tool) => void;
  setSelectedSymbolKind: (kind: SymbolKind | null) => void;
  setSelectedIds: (ids: string[]) => void;
  setWallThickness: (m: number) => void;
  setDefaultFloorHeight: (m: number) => void;
  toggleAngleSnap: () => void;
  setAngleSnapDegrees: (d: 15 | 45 | 90) => void;
  setShowFurniture: (v: boolean) => void;
  setShowSanitary: (v: boolean) => void;
  setShowHeights: (v: boolean) => void;
  setSpacePanning: (v: boolean) => void;
  setShiftFreehand: (v: boolean) => void;
  setPrintBlackSymbols: (v: boolean) => void;
  setSymbolColorDefault: (kind: SymbolKind, color: string | null) => void;

  // Floors
  setActiveFloor: (floorId: string) => void;
  addFloor: (name: string) => void;
  updateFloor: (floorId: string, patch: Partial<Floor>) => void;
  removeFloor: (floorId: string) => void;
  clearActiveFloor: () => void;
  newProject: (name?: string) => void;

  // Background / scale
  setBackground: (floorId: string, bg: BackgroundImage | undefined) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundLocked: (locked: boolean) => void;
  setCalibrationPoint: (point: Point2) => void;
  finishCalibration: (realLengthM: number) => void;
  clearCalibration: () => void;

  // Walls
  addWall: (start: Point2, end: Point2) => void;
  updateWall: (wallId: string, patch: Partial<Wall>) => void;
  removeWall: (wallId: string) => void;
  previewSnapPoint: (
    from: Point2 | null,
    raw: Point2,
    opts?: { freehand?: boolean }
  ) => Point2;

  // Openings
  addOpening: (
    kind: "door" | "window",
    position: Point2
  ) => import("@/types/project").Opening | null;
  updateOpening: (openingId: string, patch: Partial<Opening>) => void;
  removeOpening: (openingId: string) => void;

  // Symbols
  placeSymbol: (kind: SymbolKind, position: Point2) => void;
  updateSymbol: (symbolId: string, patch: Partial<PlanSymbol>) => void;
  removeSymbol: (symbolId: string) => void;
  moveSymbol: (symbolId: string, position: Point2) => void;
  rotateSelected: (deltaRad: number) => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  /** Stromkreis/FI/Kabel auf Auswahl setzen */
  assignSelectedCircuit: (
    patch: Partial<
      Pick<
        PlanSymbol,
        | "circuitId"
        | "rcdGroup"
        | "panelId"
        | "cableType"
        | "breakerRating"
      >
    >
  ) => void;
  /** Nächsten freien Kreis + typische FI/LS/Kabel vorschlagen */
  applyCircuitSuggestions: (symbolId: string) => void;
  /** Alle Geräte ohne Kreis auf der aktiven Etage automatisch befüllen */
  applyMissingCircuitSuggestions: () => number;
  applyRoomTemplate: (roomId: string, templateId: string) => void;

  // Rooms
  addRoom: (
    points: Point2[],
    name: string,
    opts?: { createWalls?: boolean }
  ) => void;
  createWallsFromRoom: (roomId: string) => void;
  updateRoom: (roomId: string, patch: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;

  // Connections
  addConnection: (fromId: string, toId: string) => void;
  removeConnection: (connectionId: string) => void;

  // Project IO
  loadProjectData: (data: ProjectData) => void;
  renameProject: (name: string) => void;
  touchUpdated: () => void;
  persist: () => Promise<void>;
  getActiveFloor: () => Floor | undefined;
  getMetersPerPixel: () => number;
}

const defaultUi: UiState = {
  mode: "homeowner",
  viewMode: "2d",
  tool: "select",
  selectedSymbolKind: null,
  recentSymbolKinds: [],
  selectedIds: [],
  wallThickness: 0.12,
  defaultFloorHeight: 2.5,
  angleSnapEnabled: true,
  angleSnapDegrees: 15,
  showFurniture: true,
  showSanitary: true,
  showHeights: true,
  spacePanning: false,
  shiftFreehand: false,
  printBlackSymbols: false,
};

const initial = createEmptyProject("Mein Haus");

/** In-Memory Clipboard (nicht in IndexedDB) */
let clipboard: {
  symbols: PlanSymbol[];
  openings: Opening[];
  walls: Wall[];
} | null = null;

function withUpdated(meta: ProjectData["meta"]) {
  return { ...meta, updatedAt: new Date().toISOString() };
}

export const useProjectStore = create<ProjectStore>()(
  temporal(
    subscribeWithSelector((set, get) => ({
      ...initial,
      ui: defaultUi,

      setMode: (mode) => set((s) => ({ ui: { ...s.ui, mode } })),
      setViewMode: (viewMode) => set((s) => ({ ui: { ...s.ui, viewMode } })),
      setTool: (tool) =>
        set((s) => ({
          ui: {
            ...s.ui,
            tool,
            selectedSymbolKind:
              tool === "symbol" ? s.ui.selectedSymbolKind : null,
          },
        })),
      setSelectedSymbolKind: (kind) =>
        set((s) => {
          const recent = kind
            ? [
                kind,
                ...s.ui.recentSymbolKinds.filter((k) => k !== kind),
              ].slice(0, 8)
            : s.ui.recentSymbolKinds;
          return {
            ui: {
              ...s.ui,
              selectedSymbolKind: kind,
              recentSymbolKinds: recent,
              tool: kind ? "symbol" : s.ui.tool,
            },
          };
        }),
      setSelectedIds: (ids) => set((s) => ({ ui: { ...s.ui, selectedIds: ids } })),
      setWallThickness: (m) => set((s) => ({ ui: { ...s.ui, wallThickness: m } })),
      setDefaultFloorHeight: (m) =>
        set((s) => ({ ui: { ...s.ui, defaultFloorHeight: Math.max(1.5, m) } })),
      toggleAngleSnap: () =>
        set((s) => ({
          ui: { ...s.ui, angleSnapEnabled: !s.ui.angleSnapEnabled },
        })),
      setAngleSnapDegrees: (d) =>
        set((s) => ({ ui: { ...s.ui, angleSnapDegrees: d } })),
      setShowFurniture: (v) => set((s) => ({ ui: { ...s.ui, showFurniture: v } })),
      setShowSanitary: (v) => set((s) => ({ ui: { ...s.ui, showSanitary: v } })),
      setShowHeights: (v) => set((s) => ({ ui: { ...s.ui, showHeights: v } })),
      setSpacePanning: (v) => set((s) => ({ ui: { ...s.ui, spacePanning: v } })),
      setShiftFreehand: (v) => set((s) => ({ ui: { ...s.ui, shiftFreehand: v } })),
      setPrintBlackSymbols: (v) =>
        set((s) => ({ ui: { ...s.ui, printBlackSymbols: v } })),
      setSymbolColorDefault: (kind, color) =>
        set((s) => {
          const next = { ...s.symbolColorDefaults };
          if (color == null) delete next[kind];
          else next[kind] = color;
          return {
            symbolColorDefaults: next,
            meta: withUpdated(s.meta),
          };
        }),

      setActiveFloor: (floorId) =>
        set({ activeFloorId: floorId, ui: { ...get().ui, selectedIds: [] } }),

      addFloor: (name) => {
        const floors = get().floors;
        const floor = createDefaultFloor({
          name,
          order: floors.length,
          height: get().ui.defaultFloorHeight,
        });
        set({
          floors: [...floors, floor],
          activeFloorId: floor.id,
          meta: withUpdated(get().meta),
        });
      },

      updateFloor: (floorId, patch) =>
        set({
          floors: get().floors.map((f) =>
            f.id === floorId ? { ...f, ...patch } : f
          ),
          meta: withUpdated(get().meta),
        }),

      removeFloor: (floorId) => {
        const floors = get().floors;
        if (floors.length <= 1) return;
        const next = floors.filter((f) => f.id !== floorId);
        set({
          floors: next,
          activeFloorId:
            get().activeFloorId === floorId ? next[0].id : get().activeFloorId,
          walls: get().walls.filter((w) => w.floorId !== floorId),
          openings: get().openings.filter((o) => o.floorId !== floorId),
          symbols: get().symbols.filter((s) => s.floorId !== floorId),
          rooms: get().rooms.filter((r) => r.floorId !== floorId),
          connections: get().connections.filter((c) => c.floorId !== floorId),
          meta: withUpdated(get().meta),
          ui: { ...get().ui, selectedIds: [] },
        });
      },

      clearActiveFloor: () => {
        const floorId = get().activeFloorId;
        set({
          walls: get().walls.filter((w) => w.floorId !== floorId),
          openings: get().openings.filter((o) => o.floorId !== floorId),
          symbols: get().symbols.filter((s) => s.floorId !== floorId),
          rooms: get().rooms.filter((r) => r.floorId !== floorId),
          connections: get().connections.filter((c) => c.floorId !== floorId),
          floors: get().floors.map((f) =>
            f.id === floorId ? { ...f, background: undefined } : f
          ),
          meta: withUpdated(get().meta),
          ui: { ...get().ui, selectedIds: [], tool: "select" },
        });
      },

      newProject: (name = "Neues Projekt") => {
        const fresh = createEmptyProject(name);
        fresh.floors[0].height = get().ui.defaultFloorHeight;
        set({
          ...fresh,
          ui: {
            ...get().ui,
            selectedIds: [],
            tool: "select",
            selectedSymbolKind: null,
          },
        });
      },

      setBackground: (floorId, bg) => {
        set({
          floors: get().floors.map((f) =>
            f.id === floorId ? { ...f, background: bg } : f
          ),
          meta: withUpdated(get().meta),
        });
        if (bg) {
          queueMicrotask(() => {
            window.dispatchEvent(new CustomEvent("elektrocad:fit-plan"));
          });
          // Nach Layout nochmal – sonst oft zu kleiner Zoom beim ersten Laden
          window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent("elektrocad:fit-plan"));
          }, 120);
        }
      },

      setBackgroundOpacity: (opacity) => {
        const floorId = get().activeFloorId;
        set({
          floors: get().floors.map((f) =>
            f.id === floorId && f.background
              ? { ...f, background: { ...f.background, opacity } }
              : f
          ),
          meta: withUpdated(get().meta),
        });
      },

      setBackgroundLocked: (locked) => {
        const floorId = get().activeFloorId;
        set({
          floors: get().floors.map((f) =>
            f.id === floorId && f.background
              ? { ...f, background: { ...f.background, locked } }
              : f
          ),
          meta: withUpdated(get().meta),
        });
      },

      setCalibrationPoint: (point) => {
        const floorId = get().activeFloorId;
        set({
          floors: get().floors.map((f) => {
            if (f.id !== floorId || !f.background) return f;
            const cal = f.background.calibration ?? {
              pointA: null,
              pointB: null,
            };
            // Beide gesetzt → neuer Durchlauf ab Punkt A (frei wählbar)
            if (cal.pointA && cal.pointB) {
              return {
                ...f,
                background: {
                  ...f.background,
                  calibration: { pointA: point, pointB: null },
                },
              };
            }
            if (!cal.pointA) {
              return {
                ...f,
                background: {
                  ...f.background,
                  calibration: { pointA: point, pointB: null },
                },
              };
            }
            return {
              ...f,
              background: {
                ...f.background,
                calibration: { pointA: cal.pointA, pointB: point },
              },
            };
          }),
          meta: withUpdated(get().meta),
        });
        const after = get().getActiveFloor()?.background?.calibration;
        if (after?.pointA && after?.pointB) {
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent("elektrocad:fit-calibration")
            );
          });
        }
      },

      finishCalibration: (realLengthM) => {
        const floor = get().getActiveFloor();
        const cal = floor?.background?.calibration;
        if (!floor?.background || !cal?.pointA || !cal?.pointB) return;
        const px = dist(cal.pointA, cal.pointB);
        if (px < 1 || realLengthM <= 0) return;
        const metersPerPixel = realLengthM / px;
        set({
          floors: get().floors.map((f) =>
            f.id === floor.id
              ? {
                  ...f,
                  background: {
                    ...f.background!,
                    metersPerPixel,
                    calibration: undefined,
                  },
                }
              : f
          ),
          meta: withUpdated(get().meta),
          ui: { ...get().ui, tool: "select" },
        });
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent("elektrocad:fit-plan"));
        });
      },

      clearCalibration: () => {
        const floorId = get().activeFloorId;
        set({
          floors: get().floors.map((f) =>
            f.id === floorId && f.background
              ? {
                  ...f,
                  background: { ...f.background, calibration: undefined },
                }
              : f
          ),
          meta: withUpdated(get().meta),
        });
      },

      previewSnapPoint: (from, raw, opts) => {
        const { walls, activeFloorId, ui } = get();
        const floorWalls = walls.filter((w) => w.floorId === activeFloorId);
        // Tablet: größerer Fangradius
        const thresh =
          typeof window !== "undefined" &&
          window.matchMedia("(pointer: coarse)").matches
            ? 28
            : 14;
        let p = snapToEndpoints(raw, floorWalls, thresh);
        const freehand = opts?.freehand || ui.shiftFreehand;
        if (from && ui.angleSnapEnabled && !freehand) {
          p = snapAngle(from, p, ui.angleSnapDegrees);
          p = snapToEndpoints(p, floorWalls, thresh);
        }
        return p;
      },

      addWall: (start, end) => {
        if (dist(start, end) < 4) return;
        const wall: Wall = {
          id: id(),
          floorId: get().activeFloorId,
          start,
          end,
          thickness: get().ui.wallThickness,
        };
        set({
          walls: [...get().walls, wall],
          meta: withUpdated(get().meta),
        });
      },

      updateWall: (wallId, patch) =>
        set({
          walls: get().walls.map((w) =>
            w.id === wallId ? { ...w, ...patch } : w
          ),
          meta: withUpdated(get().meta),
        }),

      removeWall: (wallId) =>
        set({
          walls: get().walls.filter((w) => w.id !== wallId),
          openings: get().openings.filter((o) => o.wallId !== wallId),
          symbols: get().symbols.map((s) =>
            s.wallId === wallId
              ? { ...s, wallId: undefined, wallT: undefined, wallSide: undefined }
              : s
          ),
          meta: withUpdated(get().meta),
          ui: {
            ...get().ui,
            selectedIds: get().ui.selectedIds.filter((x) => x !== wallId),
          },
        }),

      addOpening: (kind, position) => {
        const floorWalls = get().walls.filter(
          (w) => w.floorId === get().activeFloorId
        );
        const coarse =
          typeof window !== "undefined" &&
          window.matchMedia("(pointer: coarse)").matches;
        const hit = closestWall(floorWalls, position, coarse ? 56 : 40);
        if (!hit) return null;
        const mpp = get().getMetersPerPixel();
        const opening: Opening = {
          id: id(),
          floorId: get().activeFloorId,
          wallId: hit.wall.id,
          kind,
          t: hit.t,
          width: kind === "door" ? 0.9 : 1.2,
          height: kind === "door" ? 2.0 : 1.2,
          sillHeight: kind === "door" ? 0 : 0.9,
          hingeLeft: true,
          opensInward: true,
        };
        const wallLenM = dist(hit.wall.start, hit.wall.end) * mpp;
        if (opening.width > wallLenM * 0.95) return null;
        set({
          openings: [...get().openings, opening],
          meta: withUpdated(get().meta),
          ui: { ...get().ui, selectedIds: [opening.id] },
        });
        return opening;
      },

      updateOpening: (openingId, patch) =>
        set({
          openings: get().openings.map((o) =>
            o.id === openingId ? { ...o, ...patch } : o
          ),
          meta: withUpdated(get().meta),
        }),

      removeOpening: (openingId) =>
        set({
          openings: get().openings.filter((o) => o.id !== openingId),
          meta: withUpdated(get().meta),
        }),

      placeSymbol: (kind, position) => {
        const def = getSymbolDef(kind);
        const floorId = get().activeFloorId;
        const floorWalls = get().walls.filter((w) => w.floorId === floorId);
        const mpp = get().getMetersPerPixel();
        const snap = snapSymbolPlacement(
          kind,
          position,
          floorWalls,
          mpp,
          undefined,
          { freehand: get().ui.shiftFreehand }
        );

        const rooms = get().rooms.filter((r) => r.floorId === floorId);
        const room = rooms.find((r) =>
          pointInPolygon(snap.position, r.points)
        );

        const panelish = isPanelSymbol({ kind });
        const floorPanels = get().symbols.filter(
          (s) => s.floorId === floorId && isPanelSymbol(s)
        );
        const autoPanelId =
          !panelish && floorPanels.length === 1 ? floorPanels[0].id : undefined;
        const symbol: PlanSymbol = {
          id: id(),
          floorId,
          kind,
          position: snap.position,
          rotation: snap.rotation ?? 0,
          mountHeight: def.defaultHeight,
          wallId: snap.wallId,
          wallT: snap.wallT,
          wallSide: snap.wallSide,
          roomId: room?.id,
          label: def.label,
          panelId: autoPanelId,
          ...(panelish ||
          def.isFurniture ||
          def.category === "sanitary" ||
          (def.category === "safety" && kind !== "alarm_siren")
            ? {}
            : {
                rcdGroup: suggestRcdGroup(kind),
                cableType: suggestCableType(kind),
                breakerRating: suggestBreaker(kind),
              }),
        };

        set({
          symbols: [...get().symbols, symbol],
          meta: withUpdated(get().meta),
          ui: { ...get().ui, selectedIds: [symbol.id] },
        });
      },

      updateSymbol: (symbolId, patch) =>
        set({
          symbols: get().symbols.map((s) =>
            s.id === symbolId ? { ...s, ...patch } : s
          ),
          meta: withUpdated(get().meta),
        }),

      assignSelectedCircuit: (patch) => {
        const ids = new Set(get().ui.selectedIds);
        if (!ids.size) return;
        set({
          symbols: get().symbols.map((s) =>
            ids.has(s.id) ? { ...s, ...patch } : s
          ),
          meta: withUpdated(get().meta),
        });
      },

      applyCircuitSuggestions: (symbolId) => {
        const s = get().symbols.find((x) => x.id === symbolId);
        if (!s || isPanelSymbol(s)) return;
        const floorSymbols = get().symbols.filter(
          (x) => x.floorId === s.floorId
        );
        const rcd = s.rcdGroup?.trim() || suggestRcdGroup(s.kind);
        const circuitId =
          s.circuitId?.trim() ||
          suggestNextCircuitId(floorSymbols, {
            rcdGroup: rcd,
            panelId: s.panelId,
          });
        set({
          symbols: get().symbols.map((x) =>
            x.id === symbolId
              ? {
                  ...x,
                  circuitId,
                  rcdGroup: rcd,
                  cableType: x.cableType?.trim() || suggestCableType(x.kind),
                  breakerRating:
                    x.breakerRating?.trim() || suggestBreaker(x.kind),
                }
              : x
          ),
          meta: withUpdated(get().meta),
        });
      },

      applyMissingCircuitSuggestions: () => {
        const floorId = get().activeFloorId;
        const next = get().symbols.map((s) => ({ ...s }));
        let filled = 0;
        /** Gleiche FI + Kategorie teilen sich einen neuen Kreis */
        const groupCircuit = new Map<string, string>();
        for (let i = 0; i < next.length; i++) {
          const s = next[i];
          if (s.floorId !== floorId || isPanelSymbol(s)) continue;
          const def = getSymbolDef(s.kind);
          if (
            def.isFurniture ||
            def.category === "sanitary" ||
            (def.category === "safety" && s.kind !== "alarm_siren")
          ) {
            continue;
          }
          if (s.circuitId?.trim() && s.rcdGroup?.trim()) continue;
          const floorSnap = next.filter((x) => x.floorId === floorId);
          const rcd = s.rcdGroup?.trim() || suggestRcdGroup(s.kind);
          const gKey = `${s.panelId ?? ""}|${rcd}|${def.category}`;
          let circuitId = s.circuitId?.trim();
          if (!circuitId) {
            circuitId = groupCircuit.get(gKey);
            if (!circuitId) {
              circuitId = suggestNextCircuitId(floorSnap, {
                rcdGroup: rcd,
                panelId: s.panelId,
              });
              groupCircuit.set(gKey, circuitId);
            }
          }
          next[i] = {
            ...s,
            circuitId,
            rcdGroup: rcd,
            cableType: s.cableType?.trim() || suggestCableType(s.kind),
            breakerRating: s.breakerRating?.trim() || suggestBreaker(s.kind),
          };
          filled += 1;
        }
        if (filled) {
          set({ symbols: next, meta: withUpdated(get().meta) });
        }
        return filled;
      },

      rotateSelected: (deltaRad) => {
        const ids = new Set(get().ui.selectedIds);
        if (!ids.size) return;
        set({
          symbols: get().symbols.map((s) =>
            ids.has(s.id)
              ? { ...s, rotation: s.rotation + deltaRad }
              : s
          ),
          meta: withUpdated(get().meta),
        });
      },

      copySelected: () => {
        const ids = new Set(get().ui.selectedIds);
        if (!ids.size) {
          clipboard = null;
          return;
        }
        clipboard = {
          symbols: get().symbols.filter((s) => ids.has(s.id)),
          openings: get().openings.filter((o) => ids.has(o.id)),
          walls: get().walls.filter((w) => ids.has(w.id)),
        };
      },

      pasteClipboard: () => {
        if (
          !clipboard ||
          (!clipboard.symbols.length &&
            !clipboard.openings.length &&
            !clipboard.walls.length)
        ) {
          return;
        }
        const floorId = get().activeFloorId;
        const offset = 36;
        const newIds: string[] = [];
        const wallIdMap = new Map<string, string>();

        const walls = clipboard.walls.map((w) => {
          const nid = id();
          wallIdMap.set(w.id, nid);
          newIds.push(nid);
          return {
            ...w,
            id: nid,
            floorId,
            start: { x: w.start.x + offset, y: w.start.y + offset },
            end: { x: w.end.x + offset, y: w.end.y + offset },
          };
        });

        const openings = clipboard.openings.map((o) => {
          const nid = id();
          newIds.push(nid);
          const mappedWall = wallIdMap.get(o.wallId) ?? o.wallId;
          // nur einfügen wenn Wand existiert (kopiert oder schon im Plan)
          const wallOk =
            wallIdMap.has(o.wallId) ||
            get().walls.some((w) => w.id === o.wallId && w.floorId === floorId);
          if (!wallOk) return null;
          return {
            ...o,
            id: nid,
            floorId,
            wallId: mappedWall,
          };
        }).filter(Boolean) as Opening[];

        const symbols = clipboard.symbols.map((s) => {
          const nid = id();
          newIds.push(nid);
          return {
            ...s,
            id: nid,
            floorId,
            position: {
              x: s.position.x + offset,
              y: s.position.y + offset,
            },
            wallId: s.wallId ? wallIdMap.get(s.wallId) ?? s.wallId : undefined,
          };
        });

        set({
          walls: [...get().walls, ...walls],
          openings: [...get().openings, ...openings],
          symbols: [...get().symbols, ...symbols],
          meta: withUpdated(get().meta),
          ui: { ...get().ui, selectedIds: newIds, tool: "select" },
        });
      },

      removeSymbol: (symbolId) =>
        set({
          symbols: get().symbols.filter((s) => s.id !== symbolId),
          connections: get().connections.filter(
            (c) => c.fromSymbolId !== symbolId && c.toSymbolId !== symbolId
          ),
          meta: withUpdated(get().meta),
        }),

      applyRoomTemplate: (roomId, templateId) => {
        const room = get().rooms.find((r) => r.id === roomId);
        const template = ROOM_TEMPLATES.find((t) => t.id === templateId);
        if (!room || !template || room.points.length < 3) return;
        const floorId = get().activeFloorId;
        const floorWalls = get().walls.filter((w) => w.floorId === floorId);
        const mpp = get().getMetersPerPixel();
        const created: PlanSymbol[] = [];

        for (const item of template.items) {
          const def = getSymbolDef(item.kind);
          let pos = templatePoint(room.points, item.u, item.v);
          let rotation = 0;
          let wallId: string | undefined;
          let wallT: number | undefined;
          let side: 1 | -1 | undefined;
          if (def.wallBound) {
            const hit = closestWall(floorWalls, pos, 80);
            if (hit) {
              wallId = hit.wall.id;
              wallT = hit.t;
              side = wallSide(hit.wall, pos);
              const offsetPx = metersToPx(hit.wall.thickness / 2 + 0.02, mpp);
              const ang = wallAngle(hit.wall);
              const nx = -Math.sin(ang) * side;
              const ny = Math.cos(ang) * side;
              pos = {
                x: hit.point.x + nx * offsetPx,
                y: hit.point.y + ny * offsetPx,
              };
              rotation = ang + (side === 1 ? 0 : Math.PI);
            }
          }
          created.push({
            id: id(),
            floorId,
            kind: item.kind,
            position: pos,
            rotation,
            mountHeight: def.defaultHeight,
            wallId,
            wallT,
            wallSide: side,
            roomId: room.id,
            label: item.label ?? def.label,
            ...(def.isFurniture ||
            def.category === "sanitary" ||
            isPanelSymbol({ kind: item.kind }) ||
            (def.category === "safety" && item.kind !== "alarm_siren")
              ? {}
              : {
                  circuitId: item.circuitId,
                  rcdGroup: item.rcdGroup,
                  cableType: item.cableType ?? suggestCableType(item.kind),
                  breakerRating:
                    item.breakerRating ?? suggestBreaker(item.kind),
                  panelId:
                    get().symbols.filter(
                      (s) => s.floorId === floorId && isPanelSymbol(s)
                    ).length === 1
                      ? get().symbols.find(
                          (s) => s.floorId === floorId && isPanelSymbol(s)
                        )?.id
                      : undefined,
                }),
          });
        }

        set({
          symbols: [...get().symbols, ...created],
          meta: withUpdated(get().meta),
          ui: {
            ...get().ui,
            selectedIds: created.map((s) => s.id),
            tool: "select",
          },
        });
      },

      moveSymbol: (symbolId, position) => {
        const sym = get().symbols.find((s) => s.id === symbolId);
        if (!sym) return;
        const floorWalls = get().walls.filter(
          (w) => w.floorId === get().activeFloorId
        );
        const mpp = get().getMetersPerPixel();
        const freehand = get().ui.shiftFreehand;
        const snap = snapSymbolPlacement(
          sym.kind,
          position,
          floorWalls,
          mpp,
          sym.sizeM,
          { freehand }
        );

        const patch: Partial<PlanSymbol> = {
          position: snap.position,
          ...(snap.rotation != null ? { rotation: snap.rotation } : {}),
          wallId: snap.wallId,
          wallT: snap.wallT,
          wallSide: snap.wallSide,
        };

        const rooms = get().rooms.filter(
          (r) => r.floorId === get().activeFloorId
        );
        const room = rooms.find((r) =>
          pointInPolygon(snap.position, r.points)
        );
        patch.roomId = room?.id;

        const symbols = get().symbols.map((s) =>
          s.id === symbolId ? { ...s, ...patch } : s
        );
        const connections = get().connections.map((c) => {
          if (c.fromSymbolId !== symbolId && c.toSymbolId !== symbolId) {
            return c;
          }
          const a = symbols.find((s) => s.id === c.fromSymbolId);
          const b = symbols.find((s) => s.id === c.toSymbolId);
          if (!a || !b) return c;
          return {
            ...c,
            estimatedLengthM: dist(a.position, b.position) * mpp * 1.15,
          };
        });

        set({
          symbols,
          connections,
          meta: withUpdated(get().meta),
        });
      },

      addRoom: (points, name, opts) => {
        if (points.length < 3) return;
        const floorId = get().activeFloorId;
        const room: Room = {
          id: id(),
          floorId,
          name,
          points,
        };
        const symbols = get().symbols.map((s) =>
          s.floorId === floorId && pointInPolygon(s.position, points)
            ? { ...s, roomId: room.id }
            : s
        );

        const createWalls = opts?.createWalls !== false;
        const thickness = get().ui.wallThickness;
        const existing = get().walls.filter((w) => w.floorId === floorId);
        const newWalls: Wall[] = [];
        if (createWalls) {
          for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            if (dist(a, b) < 4) continue;
            if (findWallForEdge(existing, a, b) || findWallForEdge(newWalls, a, b))
              continue;
            newWalls.push({
              id: id(),
              floorId,
              start: { ...a },
              end: { ...b },
              thickness,
            });
          }
        }

        set({
          rooms: [...get().rooms, room],
          walls: [...get().walls, ...newWalls],
          symbols,
          meta: withUpdated(get().meta),
          ui: { ...get().ui, selectedIds: [room.id], tool: "select" },
        });
      },

      createWallsFromRoom: (roomId) => {
        const room = get().rooms.find((r) => r.id === roomId);
        if (!room || room.points.length < 3) return;
        const thickness = get().ui.wallThickness;
        const existing = get().walls.filter((w) => w.floorId === room.floorId);
        const newWalls: Wall[] = [];
        for (let i = 0; i < room.points.length; i++) {
          const a = room.points[i];
          const b = room.points[(i + 1) % room.points.length];
          if (dist(a, b) < 4) continue;
          if (findWallForEdge(existing, a, b) || findWallForEdge(newWalls, a, b))
            continue;
          newWalls.push({
            id: id(),
            floorId: room.floorId,
            start: { ...a },
            end: { ...b },
            thickness,
          });
        }
        if (!newWalls.length) return;
        set({
          walls: [...get().walls, ...newWalls],
          meta: withUpdated(get().meta),
        });
      },

      updateRoom: (roomId, patch) =>
        set({
          rooms: get().rooms.map((r) =>
            r.id === roomId ? { ...r, ...patch } : r
          ),
          meta: withUpdated(get().meta),
        }),

      removeRoom: (roomId) =>
        set({
          rooms: get().rooms.filter((r) => r.id !== roomId),
          symbols: get().symbols.map((s) =>
            s.roomId === roomId ? { ...s, roomId: undefined } : s
          ),
          meta: withUpdated(get().meta),
        }),

      addConnection: (fromId, toId) => {
        if (fromId === toId) return;
        const from = get().symbols.find((s) => s.id === fromId);
        const to = get().symbols.find((s) => s.id === toId);
        if (!from || !to) return;
        const mpp = get().getMetersPerPixel();
        const lengthPx = dist(from.position, to.position);
        const estimatedLengthM = lengthPx * mpp * 1.15;
        const conn: Connection = {
          id: id(),
          floorId: get().activeFloorId,
          fromSymbolId: fromId,
          toSymbolId: toId,
          estimatedLengthM,
        };
        set({
          connections: [...get().connections, conn],
          meta: withUpdated(get().meta),
        });
      },

      removeConnection: (connectionId) =>
        set({
          connections: get().connections.filter((c) => c.id !== connectionId),
          meta: withUpdated(get().meta),
        }),

      loadProjectData: (data) =>
        set({
          ...normalizeProjectData(data),
          ui: { ...get().ui, selectedIds: [], tool: "select" },
        }),

      renameProject: (name) =>
        set({ meta: withUpdated({ ...get().meta, name }) }),

      touchUpdated: () => set({ meta: withUpdated(get().meta) }),

      persist: async () => {
        const s = get();
        const data: ProjectData = {
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
        await saveProject(data);
      },

      getActiveFloor: () =>
        get().floors.find((f) => f.id === get().activeFloorId),

      getMetersPerPixel: () => {
        const floor = get().getActiveFloor();
        // Unkalibriert: 2 cm/px → 12-cm-Wand wirkt nicht übertrieben breit
        return floor?.background?.metersPerPixel ?? 0.02;
      },
    })),
    {
      partialize: (state) => {
        const {
          meta,
          floors,
          activeFloorId,
          walls,
          openings,
          symbols,
          rooms,
          connections,
          symbolColorDefaults,
        } = state;
        return {
          meta,
          floors,
          activeFloorId,
          walls,
          openings,
          symbols,
          rooms,
          connections,
          symbolColorDefaults,
        };
      },
      limit: 100,
    }
  )
);

/** Selektoren – vermeiden unnötige Re-Renders */
export const useUi = () => useProjectStore((s) => s.ui);
export const useActiveFloor = () =>
  useProjectStore((s) => s.floors.find((f) => f.id === s.activeFloorId));

