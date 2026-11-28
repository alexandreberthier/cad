"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  Text,
  Group,
  Image as KonvaImage,
  Arc,
} from "react-konva";
import type Konva from "konva";
import { useProjectStore } from "@/store/projectStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import type { Point2, Wall } from "@/types/project";
import {
  closestWall,
  dist,
  metersToPx,
  mid,
  pointOnWall,
  polygonAreaM2,
  polygonCentroid,
  wallAngle,
  wallNormal,
} from "@/lib/geometry/math";
import { snapSymbolPlacement } from "@/lib/geometry/snapSymbol";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { resolvePlanSymbolColor } from "@/lib/symbols/colors";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";
import { KonvaSymbol } from "@/components/symbols/KonvaSymbol";
import { registerPlanStage } from "@/lib/planStage";
import { loadBackgroundFile } from "@/lib/background";
import { CalibrationModal } from "@/components/editor/CalibrationModal";

const WORLD = { w: 4000, h: 3000 };

/** Attr an Konva-Knoten → bestehende Objekte anklicken statt neu platzieren */
function findNodeAttr(
  target: Konva.Node | null | undefined,
  key: string
): string | null {
  let n: Konva.Node | null | undefined = target;
  while (n && n.getClassName() !== "Stage") {
    const v = n.getAttr(key);
    if (typeof v === "string" && v.length) return v;
    n = n.getParent();
  }
  return null;
}

function snapLength(from: Point2, to: Point2, mpp: number): Point2 {
  const lenPx = dist(from, to);
  if (lenPx < 1) return to;
  const lenM = lenPx * mpp;
  const snappedM = Math.max(0.05, Math.round(lenM / 0.05) * 0.05);
  const scale = snappedM / lenM;
  return {
    x: from.x + (to.x - from.x) * scale,
    y: from.y + (to.y - from.y) * scale,
  };
}

export function PlanCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 40, y: 40 });
  const [draftStart, setDraftStart] = useState<Point2 | null>(null);
  const [draftCurrent, setDraftCurrent] = useState<Point2 | null>(null);
  const [roomDraft, setRoomDraft] = useState<Point2[]>([]);
  const [roomCursor, setRoomCursor] = useState<Point2 | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [pointer, setPointer] = useState<Point2 | null>(null);
  const [marquee, setMarquee] = useState<{ a: Point2; b: Point2 } | null>(null);
  const [emptyPan, setEmptyPan] = useState(false);
  const marqueeActive = useRef(false);
  const emptyGesture = useRef<"none" | "pending" | "pan" | "marquee">("none");
  const emptyDown = useRef<Point2 | null>(null);
  const panLastScreen = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickRef = useRef(0);
  const pinchRef = useRef<{
    active: boolean;
    lastDist: number;
    lastCenter: { x: number; y: number } | null;
  }>({ active: false, lastDist: 0, lastCenter: null });
  const viewRef = useRef({ scale: 1, x: 40, y: 40 });
  viewRef.current = { scale, x: stagePos.x, y: stagePos.y };

  useEffect(() => {
    registerPlanStage(stageRef.current);
    return () => registerPlanStage(null);
  }, []);

  const ui = useProjectStore((s) => s.ui);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const floors = useProjectStore((s) => s.floors);
  const allWalls = useProjectStore((s) => s.walls);
  const allOpenings = useProjectStore((s) => s.openings);
  const allSymbols = useProjectStore((s) => s.symbols);
  const allRooms = useProjectStore((s) => s.rooms);
  const allConnections = useProjectStore((s) => s.connections);
  const symbolColorDefaults = useProjectStore((s) => s.symbolColorDefaults);

  const floor = useMemo(
    () => floors.find((f) => f.id === activeFloorId),
    [floors, activeFloorId]
  );
  const walls = useMemo(
    () => allWalls.filter((w) => w.floorId === activeFloorId),
    [allWalls, activeFloorId]
  );
  const openings = useMemo(
    () => allOpenings.filter((o) => o.floorId === activeFloorId),
    [allOpenings, activeFloorId]
  );
  const symbols = useMemo(
    () => allSymbols.filter((sy) => sy.floorId === activeFloorId),
    [allSymbols, activeFloorId]
  );
  const rooms = useMemo(
    () => allRooms.filter((r) => r.floorId === activeFloorId),
    [allRooms, activeFloorId]
  );
  const connections = useMemo(
    () => allConnections.filter((c) => c.floorId === activeFloorId),
    [allConnections, activeFloorId]
  );
  const mpp = floor?.background?.metersPerPixel ?? 0.02;
  const wallHeightM = floor?.height ?? 2.5;
  const shiftFreehand = ui.shiftFreehand;

  const addWall = useProjectStore((s) => s.addWall);
  const addOpening = useProjectStore((s) => s.addOpening);
  const placeSymbol = useProjectStore((s) => s.placeSymbol);
  const addRoom = useProjectStore((s) => s.addRoom);
  const addConnection = useProjectStore((s) => s.addConnection);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const setCalibrationPoint = useProjectStore((s) => s.setCalibrationPoint);
  const previewSnapPoint = useProjectStore((s) => s.previewSnapPoint);
  const moveSymbol = useProjectStore((s) => s.moveSymbol);
  const setTool = useProjectStore((s) => s.setTool);
  const setBackground = useProjectStore((s) => s.setBackground);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const bgImage = useBackgroundImage(floor?.background?.src);
  const isEmptyFloor =
    walls.length === 0 &&
    rooms.length === 0 &&
    symbols.length === 0 &&
    !floor?.background;

  const fitPlan = useCallback(() => {
    const pts: Point2[] = [
      ...walls.flatMap((w) => [w.start, w.end]),
      ...rooms.flatMap((r) => r.points),
      ...symbols.map((s) => s.position),
    ];
    if (floor?.background) {
      pts.push(
        { x: 0, y: 0 },
        {
          x: floor.background.widthPx,
          y: floor.background.heightPx,
        }
      );
    }
    if (!pts.length) {
      setScale(1);
      setStagePos({ x: 40, y: 40 });
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const pad = 48;
    const bw = Math.max(80, maxX - minX);
    const bh = Math.max(80, maxY - minY);
    const sx = (size.w - pad * 2) / bw;
    const sy = (size.h - pad * 2) / bh;
    const next = Math.min(4, Math.max(0.2, Math.min(sx, sy)));
    setScale(next);
    setStagePos({
      x: pad - minX * next + (size.w - pad * 2 - bw * next) / 2,
      y: pad - minY * next + (size.h - pad * 2 - bh * next) / 2,
    });
  }, [walls, rooms, symbols, floor?.background, size.w, size.h]);

  useEffect(() => {
    const onFit = () => fitPlan();
    window.addEventListener("elektrocad:fit-plan", onFit);
    return () => window.removeEventListener("elektrocad:fit-plan", onFit);
  }, [fitPlan]);

  useEffect(() => {
    const onFitSel = () => {
      const ids = new Set(useProjectStore.getState().ui.selectedIds);
      const pts = symbols
        .filter((s) => ids.has(s.id))
        .map((s) => s.position);
      if (pts.length < 1) return;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of pts) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      const pad = 64;
      const bw = Math.max(40, maxX - minX + 40);
      const bh = Math.max(40, maxY - minY + 40);
      const sx = (size.w - pad * 2) / bw;
      const sy = (size.h - pad * 2) / bh;
      const next = Math.min(4, Math.max(0.35, Math.min(sx, sy)));
      setScale(next);
      setStagePos({
        x: pad - minX * next + (size.w - pad * 2 - bw * next) / 2,
        y: pad - minY * next + (size.h - pad * 2 - bh * next) / 2,
      });
    };
    window.addEventListener("elektrocad:fit-selection", onFitSel);
    return () =>
      window.removeEventListener("elektrocad:fit-selection", onFitSel);
  }, [symbols, size.w, size.h]);

  /** Messstrecke groß und mittig – damit man die Länge sehen kann */
  useEffect(() => {
    const onFitCal = () => {
      const c = floor?.background?.calibration;
      if (!c?.pointA || !c?.pointB) return;
      const minX = Math.min(c.pointA.x, c.pointB.x);
      const minY = Math.min(c.pointA.y, c.pointB.y);
      const maxX = Math.max(c.pointA.x, c.pointB.x);
      const maxY = Math.max(c.pointA.y, c.pointB.y);
      const pad = 80;
      const bw = Math.max(120, maxX - minX + 80);
      const bh = Math.max(120, maxY - minY + 80);
      const sx = (size.w - pad * 2) / bw;
      const sy = (size.h - pad * 2) / bh;
      const next = Math.min(6, Math.max(0.4, Math.min(sx, sy)));
      setScale(next);
      setStagePos({
        x: pad - minX * next + (size.w - pad * 2 - bw * next) / 2,
        y: pad - minY * next + (size.h - pad * 2 - bh * next) / 2 - 40,
      });
    };
    window.addEventListener("elektrocad:fit-calibration", onFitCal);
    return () =>
      window.removeEventListener("elektrocad:fit-calibration", onFitCal);
  }, [floor?.background?.calibration, size.w, size.h]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Toolwechsel → laufende Zeichnung abbrechen
  useEffect(() => {
    setDraftStart(null);
    setDraftCurrent(null);
    setRoomDraft([]);
    setConnectFrom(null);
  }, [ui.tool]);

  const isPanning = ui.tool === "pan" || ui.spacePanning;

  const clearEmptyGesture = useCallback(() => {
    emptyGesture.current = "none";
    emptyDown.current = null;
    panLastScreen.current = null;
    setEmptyPan(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const cursor = (() => {
    if (emptyPan) return "grabbing";
    if (isPanning) return "grab";
    if (marquee) return "crosshair";
    switch (ui.tool) {
      case "select":
        return "default";
      case "pan":
        return "grab";
      case "symbol":
        return "copy";
      case "connection":
        return "cell";
      case "calibrate":
        return "crosshair";
      default:
        return "crosshair";
    }
  })();

  const toWorld = useCallback((): Point2 => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale,
    };
  }, [scale, stagePos]);

  const refinePoint = useCallback(
    (from: Point2 | null, raw: Point2) => {
      let p = previewSnapPoint(from, raw, { freehand: shiftFreehand });
      if (from && !shiftFreehand) p = snapLength(from, p, mpp);
      return p;
    },
    [previewSnapPoint, mpp, shiftFreehand]
  );

  const cancelDrawing = useCallback(() => {
    setDraftStart(null);
    setDraftCurrent(null);
    setRoomDraft([]);
    setRoomCursor(null);
    setConnectFrom(null);
  }, []);

  const finishWallChain = useCallback(() => {
    setDraftStart(null);
    setDraftCurrent(null);
  }, []);

  const finishRoom = useCallback(() => {
    if (roomDraft.length >= 3) {
      const n =
        useProjectStore
          .getState()
          .rooms.filter((r) => r.floorId === activeFloorId).length + 1;
      const name = `Raum ${n}`;
      addRoom(roomDraft, name, { createWalls: true });
      useFeedbackStore
        .getState()
        .showToast(`${name} angelegt · Name tippen oder Chip wählen`);
    }
    setRoomDraft([]);
    setRoomCursor(null);
  }, [roomDraft, addRoom, activeFloorId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        const calNow =
          useProjectStore.getState().getActiveFloor()?.background
            ?.calibration;
        if (calNow?.pointA || calNow?.pointB) {
          useProjectStore.getState().clearCalibration();
          return;
        }
        if (draftStart || roomDraft.length > 0 || connectFrom) {
          cancelDrawing();
        } else if (ui.tool !== "select") {
          setTool("select");
        } else if (ui.selectedIds.length) {
          setSelectedIds([]);
        }
        return;
      }

      if (e.key === "Enter") {
        if (ui.tool === "wall" && draftStart) {
          e.preventDefault();
          finishWallChain();
        }
        if (ui.tool === "room" && roomDraft.length >= 3) {
          e.preventDefault();
          finishRoom();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [
    draftStart,
    roomDraft,
    connectFrom,
    ui.tool,
    cancelDrawing,
    finishWallChain,
    finishRoom,
    setTool,
  ]);

  const zoomAt = (
    screen: { x: number; y: number },
    oldScale: number,
    newScale: number,
    pos: { x: number; y: number }
  ) => {
    const clamped = Math.min(8, Math.max(0.15, newScale));
    const point = {
      x: (screen.x - pos.x) / oldScale,
      y: (screen.y - pos.y) / oldScale,
    };
    return {
      scale: clamped,
      pos: {
        x: screen.x - point.x * clamped,
        y: screen.y - point.y * clamped,
      },
    };
  };

  const touchScreenPoint = (touch: Touch) => {
    const stage = stageRef.current;
    if (!stage) return { x: touch.clientX, y: touch.clientY };
    const rect = stage.container().getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.08;
    const next = zoomAt(
      pointerPos,
      scale,
      direction > 0 ? scale * factor : scale / factor,
      stagePos
    );
    setScale(next.scale);
    setStagePos(next.pos);
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length >= 2) {
      e.evt.preventDefault();
      clearEmptyGesture();
      setEmptyPan(false);
      const a = touchScreenPoint(touches[0]);
      const b = touchScreenPoint(touches[1]);
      pinchRef.current = {
        active: true,
        lastDist: Math.hypot(b.x - a.x, b.y - a.y),
        lastCenter: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
      return;
    }
    handlePointerDown(e);
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length >= 2) {
      e.evt.preventDefault();
      const a = touchScreenPoint(touches[0]);
      const b = touchScreenPoint(touches[1]);
      const distNow = Math.hypot(b.x - a.x, b.y - a.y);
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const prev = pinchRef.current;
      if (!prev.active || prev.lastDist < 1) {
        pinchRef.current = {
          active: true,
          lastDist: distNow,
          lastCenter: center,
        };
        return;
      }
      const view = viewRef.current;
      const scaleFactor = distNow / prev.lastDist;
      const next = zoomAt(
        center,
        view.scale,
        view.scale * scaleFactor,
        { x: view.x, y: view.y }
      );
      // Zwei Finger: zusätzlich verschieben
      if (prev.lastCenter) {
        next.pos = {
          x: next.pos.x + (center.x - prev.lastCenter.x),
          y: next.pos.y + (center.y - prev.lastCenter.y),
        };
      }
      viewRef.current = { scale: next.scale, x: next.pos.x, y: next.pos.y };
      setScale(next.scale);
      setStagePos(next.pos);
      pinchRef.current = {
        active: true,
        lastDist: distNow,
        lastCenter: center,
      };
      return;
    }
    if (pinchRef.current.active) return;
    handlePointerMove();
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      pinchRef.current = { active: false, lastDist: 0, lastCenter: null };
    }
    if (e.evt.touches.length === 0) finishMarquee();
  };

  const handlePointerDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    if (ui.spacePanning || ui.tool === "pan") return;
    if (pinchRef.current.active) return;

    // Rechtsklick: Wandkette / Raum abschließen
    const native = e.evt as MouseEvent;
    if ("button" in native && native.button === 2) {
      e.evt.preventDefault();
      if (ui.tool === "wall") finishWallChain();
      else if (ui.tool === "room" && roomDraft.length >= 3) finishRoom();
      else cancelDrawing();
      return;
    }

    const world = toWorld();
    const clickedEmpty = e.target === e.target.getStage();
    const now = Date.now();
    const isDouble = now - lastClickRef.current < 280;
    lastClickRef.current = now;

    if (ui.tool === "calibrate") {
      const calState = floor?.background?.calibration;
      // Modal offen: keine neuen Punkte (sonst Reset per Fehlklick)
      if (calState?.pointA && calState?.pointB) return;
      // Wie Wand: 1. Punkt an Endpunkte, 2. Punkt Winkel-Snap + Endpunkte
      if (calState?.pointA && !calState.pointB) {
        setCalibrationPoint(refinePoint(calState.pointA, world));
      } else {
        setCalibrationPoint(previewSnapPoint(null, world));
        useFeedbackStore
          .getState()
          .showToast("Punkt 1 ok · jetzt Ende der bekannten Länge tippen");
      }
      return;
    }

    if (ui.tool === "wall") {
      if (isDouble) {
        finishWallChain();
        return;
      }
      const snapped = refinePoint(draftStart, world);
      if (!draftStart) {
        setDraftStart(snapped);
        setDraftCurrent(snapped);
      } else {
        const end = refinePoint(draftStart, world);
        if (dist(draftStart, end) >= 4) {
          const wasFirstWall =
            useProjectStore.getState().walls.filter(
              (w) => w.floorId === activeFloorId
            ).length === 0;
          addWall(draftStart, end);
          if (wasFirstWall) {
            const lenM = dist(draftStart, end) * mpp;
            useFeedbackStore
              .getState()
              .showToast(`Erste Wand · ${lenM.toFixed(2)} m`);
          }
          // Kettenmodus: weiterzeichnen ab Endpunkt
          setDraftStart(end);
          setDraftCurrent(end);
        }
      }
      return;
    }

    if (ui.tool === "door" || ui.tool === "window") {
      // Bestehende Öffnung anklicken → auswählen & bearbeiten, nicht neu setzen
      const openingId = findNodeAttr(e.target, "planOpeningId");
      if (openingId) {
        setSelectedIds([openingId]);
        setTool("select");
        return;
      }
      const created = addOpening(ui.tool, world);
      if (!created) {
        useFeedbackStore
          .getState()
          .showToast(
            walls.length
              ? "Näher an eine Wand tippen"
              : "Zuerst eine Wand zeichnen"
          );
      } else {
        useFeedbackStore
          .getState()
          .showToast(
            created.kind === "door"
              ? "Tür gesetzt · Anschlag rechts änderbar"
              : "Fenster gesetzt"
          );
      }
      return;
    }

    if (ui.tool === "symbol" && ui.selectedSymbolKind) {
      // Bestehendes Symbol → auswählen (verschieben/drehen), kein Duplikat
      const symbolId = findNodeAttr(e.target, "planSymbolId");
      if (symbolId) {
        setSelectedIds([symbolId]);
        setTool("select");
        return;
      }
      const kind = ui.selectedSymbolKind;
      placeSymbol(kind, world);
      const def = getSymbolDef(kind);
      useFeedbackStore.getState().showToast(`${def.label} gesetzt`);
      return;
    }

    if (ui.tool === "room") {
      if (isDouble && roomDraft.length >= 3) {
        finishRoom();
        return;
      }
      const snapped = refinePoint(
        roomDraft.length ? roomDraft[roomDraft.length - 1] : null,
        world
      );
      // Schließen zum Startpunkt
      if (roomDraft.length >= 3 && dist(snapped, roomDraft[0]) < 18) {
        finishRoom();
        return;
      }
      setRoomDraft((pts) => [...pts, snapped]);
      setRoomCursor(snapped);
      return;
    }

    if (ui.tool === "connection") {
      if (clickedEmpty) setConnectFrom(null);
      return;
    }

    if (ui.tool === "select" && clickedEmpty) {
      // Leer: Ziehen = Plan verschieben · Shift / Langdruck = Mehrfach-Rechteck
      const shift =
        "shiftKey" in e.evt ? Boolean((e.evt as MouseEvent).shiftKey) : false;
      emptyDown.current = world;
      if (shift) {
        emptyGesture.current = "marquee";
        marqueeActive.current = true;
        setMarquee({ a: world, b: world });
        setSelectedIds([]);
      } else {
        emptyGesture.current = "pending";
        longPressTimer.current = setTimeout(() => {
          if (emptyGesture.current === "pending" && emptyDown.current) {
            emptyGesture.current = "marquee";
            marqueeActive.current = true;
            setMarquee({ a: emptyDown.current, b: emptyDown.current });
            setSelectedIds([]);
          }
        }, 420);
      }
    }
  };

  const handlePointerMove = () => {
    const world = toWorld();
    const calState = floor?.background?.calibration;
    if (
      ui.tool === "calibrate" &&
      calState?.pointA &&
      !calState.pointB
    ) {
      setPointer(refinePoint(calState.pointA, world));
    } else if (ui.tool === "calibrate") {
      setPointer(previewSnapPoint(null, world));
    } else {
      setPointer(world);
    }
    if (ui.tool === "wall" && draftStart) {
      setDraftCurrent(refinePoint(draftStart, world));
    }
    if (ui.tool === "room" && roomDraft.length > 0) {
      const from = roomDraft[roomDraft.length - 1];
      let next = refinePoint(from, world);
      // Zum Startpunkt schließen (Magnet)
      if (roomDraft.length >= 3 && dist(next, roomDraft[0]) < 18) {
        next = { ...roomDraft[0] };
      }
      setRoomCursor(next);
    } else if (ui.tool !== "room") {
      setRoomCursor(null);
    }
    if (emptyGesture.current === "pending" && emptyDown.current) {
      if (dist(emptyDown.current, world) > 6) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        emptyGesture.current = "pan";
        setEmptyPan(true);
        setSelectedIds([]);
        const stage = stageRef.current;
        const screen = stage?.getPointerPosition();
        panLastScreen.current = screen ? { x: screen.x, y: screen.y } : null;
      }
    }
    if (emptyGesture.current === "pan") {
      const stage = stageRef.current;
      const screen = stage?.getPointerPosition();
      if (screen && panLastScreen.current) {
        const dx = screen.x - panLastScreen.current.x;
        const dy = screen.y - panLastScreen.current.y;
        panLastScreen.current = { x: screen.x, y: screen.y };
        setStagePos((p) => ({ x: p.x + dx, y: p.y + dy }));
      }
      return;
    }
    if (marqueeActive.current) {
      setMarquee((m) => (m ? { ...m, b: world } : { a: world, b: world }));
    }
  };

  const finishMarquee = () => {
    const wasMarquee = marqueeActive.current && marquee;
    const wasPending = emptyGesture.current === "pending";
    marqueeActive.current = false;
    clearEmptyGesture();

    if (wasPending) {
      setSelectedIds([]);
      setMarquee(null);
      return;
    }

    if (!wasMarquee || !marquee) {
      setMarquee(null);
      return;
    }
    const x1 = Math.min(marquee.a.x, marquee.b.x);
    const x2 = Math.max(marquee.a.x, marquee.b.x);
    const y1 = Math.min(marquee.a.y, marquee.b.y);
    const y2 = Math.max(marquee.a.y, marquee.b.y);
    const area = (x2 - x1) * (y2 - y1);
    if (area < 80) {
      setSelectedIds([]);
      setMarquee(null);
      return;
    }
    const hit = (p: Point2) =>
      p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2;

    const ids: string[] = [];
    for (const w of walls) {
      if (hit(w.start) || hit(w.end) || hit(mid(w.start, w.end))) ids.push(w.id);
    }
    for (const s of symbols) {
      if (hit(s.position)) ids.push(s.id);
    }
    for (const r of rooms) {
      if (r.points.some(hit)) ids.push(r.id);
    }
    for (const o of openings) {
      const wall = walls.find((w) => w.id === o.wallId);
      if (!wall) continue;
      const c = {
        x: wall.start.x + (wall.end.x - wall.start.x) * o.t,
        y: wall.start.y + (wall.end.y - wall.start.y) * o.t,
      };
      if (hit(c)) ids.push(o.id);
    }
    setSelectedIds(ids);
    setMarquee(null);
  };

  const gridLines = useMemo(() => {
    const lines: number[][] = [];
    const step = 50;
    for (let x = 0; x <= WORLD.w; x += step) lines.push([x, 0, x, WORLD.h]);
    for (let y = 0; y <= WORLD.h; y += step) lines.push([0, y, WORLD.w, y]);
    return lines;
  }, []);

  const cal = floor?.background?.calibration;

  const draftLenM =
    draftStart && draftCurrent
      ? dist(draftStart, draftCurrent) * mpp
      : null;
  const draftAngleDeg =
    draftStart && draftCurrent
      ? ((Math.atan2(
          draftCurrent.y - draftStart.y,
          draftCurrent.x - draftStart.x
        ) *
          180) /
          Math.PI +
          360) %
        360
      : null;

  const roomFrom =
    ui.tool === "room" && roomDraft.length > 0
      ? roomDraft[roomDraft.length - 1]
      : null;
  const roomTo = roomCursor;
  const roomSegLenM =
    roomFrom && roomTo ? dist(roomFrom, roomTo) * mpp : null;
  const roomSegAngle =
    roomFrom && roomTo
      ? ((Math.atan2(roomTo.y - roomFrom.y, roomTo.x - roomFrom.x) * 180) /
          Math.PI +
          360) %
        360
      : null;

  const hint = (() => {
    if (emptyPan || isPanning)
      return "Plan verschieben · Loslassen beendet";
    if (ui.tool === "select")
      return marquee
        ? "Rechteck-Auswahl… loslassen"
        : "Wählen/Verschieben · 2 Finger = Zoom/Pan · Langdruck = Mehrfach · ? = Hilfe";
    switch (ui.tool) {
      case "wall":
        return draftStart
          ? shiftFreehand
            ? `Freizeichnen ${draftAngleDeg?.toFixed(0) ?? "–"}° · ${draftLenM?.toFixed(2) ?? "–"} m · Shift los = Snap`
            : `Snap ${ui.angleSnapDegrees}° · ${draftAngleDeg?.toFixed(0) ?? "–"}° / ${draftLenM?.toFixed(2) ?? "–"} m · ${(ui.wallThickness * 100).toFixed(0)} cm · Enter beendet`
          : `Punkt setzen · ${(ui.wallThickness * 100).toFixed(0)} cm Stärke · Winkel-Snap (Shift = frei)`;
      case "room":
        return roomDraft.length >= 3
          ? `Segment ${roomSegLenM?.toFixed(2) ?? "–"} m · ${roomSegAngle?.toFixed(0) ?? "–"}° · Doppelklick/Enter/Start = schließen · erzeugt auch Wände`
          : "Raum-Ecken setzen (Winkel-Snap wie Wand) · Shift = frei · Esc raus";
      case "calibrate":
        return !cal?.pointA
          ? "Maßstab: Punkt 1 auf bekannte Strecke (z. B. Außenwand)"
          : !cal?.pointB
            ? `Messlinie mit ${ui.angleSnapDegrees}°-Snap · Shift = frei · Punkt 2 setzen`
            : "Länge im Dialog eingeben (Meter) und übernehmen";
      case "door":
        return "Tür an Wand setzen · orangene Vorschau zeigt Treffer";
      case "window":
        return "Fenster an Wand setzen · orangene Vorschau zeigt Treffer";
      case "symbol":
        return ui.selectedSymbolKind
          ? `${getSymbolDef(ui.selectedSymbolKind).label} – mehrfach setzen, Esc beendet`
          : "Links Kategorie öffnen und Symbol wählen";
      case "connection":
        return connectFrom
          ? "Jetzt zweites Symbol anklicken (gestrichelte Linie folgt)"
          : "Zuordnung: erstes Symbol klicken (Schalter/Taster), dann Lampe/Aktor";
      default:
        return "";
    }
  })();

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none bg-[#d9e2ec]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={isPanning}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onWheel={onWheel}
        onMouseDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onMouseMove={handlePointerMove}
        onTouchMove={handleTouchMove}
        onMouseUp={finishMarquee}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={() => {
          if (marqueeActive.current) finishMarquee();
        }}
        style={{ cursor }}
      >
        <Layer listening={false}>
          <Rect x={0} y={0} width={WORLD.w} height={WORLD.h} fill="#eef3f8" />
          {gridLines.map((pts, i) => (
            <Line
              key={i}
              points={pts}
              stroke="#c5d0dc"
              strokeWidth={
                pts[0] % 250 === 0 || pts[1] % 250 === 0 ? 1.2 : 0.5
              }
              opacity={0.7}
            />
          ))}
          {bgImage && floor?.background && (
            <KonvaImage
              image={bgImage}
              x={floor.background.offsetX}
              y={floor.background.offsetY}
              width={floor.background.widthPx}
              height={floor.background.heightPx}
              opacity={floor.background.opacity}
            />
          )}
        </Layer>

        <Layer>
          {rooms.map((r) => {
            const flat = r.points.flatMap((p) => [p.x, p.y]);
            const c = polygonCentroid(r.points);
            const selected = ui.selectedIds.includes(r.id);
            const inv = 1 / Math.max(0.2, scale);
            const labelW = 110 * inv;
            return (
              <Group
                key={r.id}
                onClick={() => setSelectedIds([r.id])}
                onTap={() => setSelectedIds([r.id])}
              >
                <Line
                  points={flat}
                  closed
                  fill={
                    selected
                      ? "rgba(224,138,30,0.22)"
                      : "rgba(37,99,235,0.14)"
                  }
                  stroke={selected ? "#e08a1e" : "#3b82f6"}
                  strokeWidth={1.5 * inv}
                />
                <Text
                  x={c.x - labelW / 2}
                  y={c.y - 16 * inv}
                  width={labelW}
                  align="center"
                  text={r.name}
                  fontSize={13 * inv}
                  fontStyle="bold"
                  fill="#1a2332"
                  listening={false}
                />
                <Text
                  x={c.x - labelW / 2}
                  y={c.y + 2 * inv}
                  width={labelW}
                  align="center"
                  text={`${polygonAreaM2(r.points, mpp).toFixed(1)} m²`}
                  fontSize={11 * inv}
                  fill="#5b6b7c"
                  listening={false}
                />
              </Group>
            );
          })}
        </Layer>

        <Layer>
          {walls.map((w) => (
            <WallShape
              key={w.id}
              wall={w}
              mpp={mpp}
              selected={ui.selectedIds.includes(w.id)}
              showDim={ui.selectedIds.includes(w.id) || scale >= 0.55}
              invScale={1 / Math.max(0.2, scale)}
              onSelect={() => setSelectedIds([w.id])}
            />
          ))}

          {openings.map((o) => {
            const wall = walls.find((w) => w.id === o.wallId);
            if (!wall) return null;
            return (
              <OpeningShape
                key={o.id}
                opening={o}
                wall={wall}
                mpp={mpp}
                selected={ui.selectedIds.includes(o.id)}
                invScale={1 / Math.max(0.2, scale)}
                onSelect={() => {
                  setSelectedIds([o.id]);
                  if (ui.tool === "door" || ui.tool === "window") {
                    setTool("select");
                  }
                }}
              />
            );
          })}

          {connections.map((c) => {
            const a = symbols.find((s) => s.id === c.fromSymbolId);
            const b = symbols.find((s) => s.id === c.toSymbolId);
            if (!a || !b) return null;
            const midX = (a.position.x + b.position.x) / 2;
            const midY = (a.position.y + b.position.y) / 2;
            const lenM =
              c.estimatedLengthM ??
              dist(a.position, b.position) * mpp * 1.15;
            const selectedWire = ui.selectedIds.includes(c.id);
            const sharedCircuit =
              a.circuitId?.trim() &&
              a.circuitId.trim() === b.circuitId?.trim()
                ? a.circuitId.trim()
                : null;
            const cableHint =
              a.cableType?.trim() &&
              a.cableType.trim() === b.cableType?.trim()
                ? a.cableType.trim()
                : null;
            const label = [
              sharedCircuit,
              `${lenM.toFixed(1)} m`,
              cableHint && ui.mode === "pro" ? cableHint : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <Group
                key={c.id}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedIds([c.id]);
                }}
              >
                <Line
                  points={[
                    a.position.x,
                    a.position.y,
                    midX,
                    a.position.y,
                    midX,
                    b.position.y,
                    b.position.x,
                    b.position.y,
                  ]}
                  stroke={selectedWire ? "#e08a1e" : "#64748b"}
                  dash={[6, 4]}
                  strokeWidth={selectedWire ? 2.2 : 1.5}
                  hitStrokeWidth={12}
                />
                <Text
                  x={midX - 48}
                  y={midY - 8}
                  width={96}
                  align="center"
                  text={label}
                  fontSize={9}
                  fill="#475569"
                  listening={false}
                />
              </Group>
            );
          })}

          {symbols
            .filter((s) => {
              const def = getSymbolDef(s.kind);
              if (!ui.showFurniture && def.isFurniture) return false;
              if (!ui.showSanitary && def.category === "sanitary") return false;
              return true;
            })
            .map((s) => {
              const selected = ui.selectedIds.includes(s.id);
              return (
                <Group
                  key={s.id}
                  planSymbolId={s.id}
                  x={s.position.x}
                  y={s.position.y}
                  rotation={(s.rotation * 180) / Math.PI}
                  draggable={ui.tool === "select"}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    if (ui.tool === "connection") {
                      if (!connectFrom) {
                        setConnectFrom(s.id);
                        useFeedbackStore
                          .getState()
                          .showToast("Zweites Symbol antippen");
                      } else {
                        addConnection(connectFrom, s.id);
                        setConnectFrom(null);
                        useFeedbackStore
                          .getState()
                          .showToast("Verbindung gesetzt");
                      }
                      return;
                    }
                    const additive =
                      e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey;
                    if (additive && ui.tool === "select") {
                      const ids = useProjectStore.getState().ui.selectedIds;
                      setSelectedIds(
                        ids.includes(s.id)
                          ? ids.filter((x) => x !== s.id)
                          : [...ids, s.id]
                      );
                    } else {
                      setSelectedIds([s.id]);
                    }
                    if (ui.tool === "symbol") setTool("select");
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedIds([s.id]);
                    if (ui.tool === "symbol") setTool("select");
                  }}
                  onDragMove={(e) => {
                    const snap = snapSymbolPlacement(
                      s.kind,
                      { x: e.target.x(), y: e.target.y() },
                      walls,
                      mpp,
                      s.sizeM,
                      { freehand: shiftFreehand }
                    );
                    e.target.position(snap.position);
                    if (snap.rotation != null) {
                      e.target.rotation((snap.rotation * 180) / Math.PI);
                    }
                  }}
                  onDragEnd={(e) => {
                    moveSymbol(s.id, { x: e.target.x(), y: e.target.y() });
                  }}
                >
                  <KonvaSymbol
                    kind={s.kind}
                    selected={selected}
                    showHeight={ui.mode === "pro" && ui.showHeights}
                    mountHeightCm={Math.round(s.mountHeight * 100)}
                    showCircuit={ui.mode === "pro"}
                    circuitId={s.circuitId}
                    metersPerPixel={mpp}
                    sizeOverride={s.sizeM}
                    color={resolvePlanSymbolColor(
                      s,
                      symbolColorDefaults,
                      ui.printBlackSymbols
                    )}
                  />
                </Group>
              );
            })}

          {/* Fangpunkte an Wandenden (Wand / Raum / Maßstab) */}
          {(ui.tool === "wall" ||
            ui.tool === "room" ||
            ui.tool === "calibrate") &&
            pointer &&
            (() => {
              const inv = 1 / Math.max(0.2, scale);
              const thresh = 28 * inv;
              const eps: Point2[] = [];
              for (const w of walls) {
                for (const ep of [w.start, w.end]) {
                  if (dist(pointer, ep) < thresh) eps.push(ep);
                }
              }
              if (!eps.length) return null;
              return (
                <Group listening={false}>
                  {eps.map((ep, i) => (
                    <Circle
                      key={`snap-${i}-${ep.x}-${ep.y}`}
                      x={ep.x}
                      y={ep.y}
                      radius={6 * inv}
                      stroke="#2563eb"
                      strokeWidth={2 * inv}
                      fill="rgba(37,99,235,0.15)"
                    />
                  ))}
                </Group>
              );
            })()}

          {draftStart && draftCurrent && (
            <Group>
              {/* Winkel-Hilfslinien (Snap-Schritte) */}
              {!shiftFreehand &&
                ui.angleSnapEnabled &&
                Array.from(
                  { length: Math.round(360 / ui.angleSnapDegrees) },
                  (_, i) => {
                    const a = (i * ui.angleSnapDegrees * Math.PI) / 180;
                    const len = 180;
                    return (
                      <Line
                        key={i}
                        points={[
                          draftStart.x,
                          draftStart.y,
                          draftStart.x + Math.cos(a) * len,
                          draftStart.y + Math.sin(a) * len,
                        ]}
                        stroke="#94a3b8"
                        strokeWidth={0.6}
                        opacity={0.35}
                        listening={false}
                      />
                    );
                  }
                )}
              <Line
                points={[
                  draftStart.x,
                  draftStart.y,
                  draftCurrent.x,
                  draftCurrent.y,
                ]}
                stroke="#e08a1e"
                strokeWidth={2}
                dash={shiftFreehand ? [2, 4] : [8, 4]}
              />
              <Circle
                x={draftStart.x}
                y={draftStart.y}
                radius={4}
                fill="#e08a1e"
              />
              <Circle
                x={draftCurrent.x}
                y={draftCurrent.y}
                radius={4}
                fill="#e08a1e"
              />
              {draftLenM != null && draftLenM > 0.02 && (
                <DimLabel
                  a={draftStart}
                  b={draftCurrent}
                  text={`${draftLenM.toFixed(2)} m · ${draftAngleDeg?.toFixed(0)}°`}
                  accent
                  invScale={1 / Math.max(0.2, scale)}
                />
              )}
            </Group>
          )}

          {roomDraft.length > 0 && (
            <Group>
              {/* Winkel-Hilfslinien wie beim Wandzeichnen */}
              {roomFrom &&
                !shiftFreehand &&
                ui.angleSnapEnabled &&
                Array.from(
                  { length: Math.round(360 / ui.angleSnapDegrees) },
                  (_, i) => {
                    const a = (i * ui.angleSnapDegrees * Math.PI) / 180;
                    const len = 180;
                    return (
                      <Line
                        key={`rg-${i}`}
                        points={[
                          roomFrom.x,
                          roomFrom.y,
                          roomFrom.x + Math.cos(a) * len,
                          roomFrom.y + Math.sin(a) * len,
                        ]}
                        stroke="#94a3b8"
                        strokeWidth={0.6}
                        opacity={0.35}
                        listening={false}
                      />
                    );
                  }
                )}
              <Line
                points={[
                  ...roomDraft.flatMap((p) => [p.x, p.y]),
                  ...(roomCursor ? [roomCursor.x, roomCursor.y] : []),
                ]}
                stroke="#2563eb"
                strokeWidth={1.5}
                dash={[4, 4]}
                closed={false}
              />
              {roomFrom && roomCursor && (
                <Line
                  points={[
                    roomFrom.x,
                    roomFrom.y,
                    roomCursor.x,
                    roomCursor.y,
                  ]}
                  stroke="#e08a1e"
                  strokeWidth={2}
                  dash={shiftFreehand ? [2, 4] : [8, 4]}
                />
              )}
              {roomDraft.map((p, i) => (
                <Circle
                  key={i}
                  x={p.x}
                  y={p.y}
                  radius={i === 0 ? 5 : 3.5}
                  fill={i === 0 ? "#2563eb" : "#93c5fd"}
                />
              ))}
              {roomCursor && (
                <Circle
                  x={roomCursor.x}
                  y={roomCursor.y}
                  radius={4}
                  fill="#e08a1e"
                />
              )}
              {roomFrom &&
                roomCursor &&
                roomSegLenM != null &&
                roomSegLenM > 0.02 && (
                  <DimLabel
                    a={roomFrom}
                    b={roomCursor}
                    text={`${roomSegLenM.toFixed(2)} m · ${roomSegAngle?.toFixed(0)}°`}
                    accent
                    invScale={1 / Math.max(0.2, scale)}
                  />
                )}
            </Group>
          )}

          {/* Maßstab: dicke Linie + screen-feste Beschriftung */}
          {cal?.pointA &&
            (() => {
              const a0 = cal.pointA;
              const b0 = cal.pointB ?? pointer ?? a0;
              const inv = 1 / Math.max(0.2, scale);
              const pxLen = dist(a0, b0);
              const guideLen = 180 * inv;
              return (
                <Group>
                  {!cal.pointB &&
                    !shiftFreehand &&
                    ui.angleSnapEnabled &&
                    Array.from(
                      { length: Math.round(360 / ui.angleSnapDegrees) },
                      (_, i) => {
                        const ang =
                          (i * ui.angleSnapDegrees * Math.PI) / 180;
                        return (
                          <Line
                            key={`cg-${i}`}
                            points={[
                              a0.x,
                              a0.y,
                              a0.x + Math.cos(ang) * guideLen,
                              a0.y + Math.sin(ang) * guideLen,
                            ]}
                            stroke="#94a3b8"
                            strokeWidth={0.6 * inv}
                            opacity={0.35}
                            listening={false}
                          />
                        );
                      }
                    )}
                  <Circle
                    x={a0.x}
                    y={a0.y}
                    radius={8 * inv}
                    fill="#e08a1e"
                    stroke="#fff"
                    strokeWidth={2 * inv}
                  />
                  <Line
                    points={[a0.x, a0.y, b0.x, b0.y]}
                    stroke="#e08a1e"
                    strokeWidth={4 * inv}
                    dash={
                      cal.pointB
                        ? undefined
                        : shiftFreehand
                          ? [4 * inv, 6 * inv]
                          : [10 * inv, 6 * inv]
                    }
                  />
                  {(cal.pointB || pointer) && (
                    <Circle
                      x={b0.x}
                      y={b0.y}
                      radius={8 * inv}
                      fill="#e08a1e"
                      stroke="#fff"
                      strokeWidth={2 * inv}
                    />
                  )}
                  {cal.pointB && (
                    <DimLabel
                      a={a0}
                      b={cal.pointB}
                      text={`${Math.round(pxLen)} px · Länge eingeben ↓`}
                      accent
                      invScale={inv}
                    />
                  )}
                  {!cal.pointB && pointer && (
                    <DimLabel
                      a={a0}
                      b={pointer}
                      text={`${Math.round(pxLen)} px · ${((Math.atan2(pointer.y - a0.y, pointer.x - a0.x) * 180) / Math.PI).toFixed(0)}°`}
                      accent
                      invScale={inv}
                    />
                  )}
                </Group>
              );
            })()}

          {/* Tür/Fenster-Vorschau an nächster Wand */}
          {(ui.tool === "door" || ui.tool === "window") &&
            pointer &&
            (() => {
              const coarse =
                typeof window !== "undefined" &&
                window.matchMedia("(pointer: coarse)").matches;
              const hit = closestWall(walls, pointer, coarse ? 56 : 40);
              if (!hit) return null;
              const widthM = ui.tool === "door" ? 0.9 : 1.2;
              const widthPx = metersToPx(widthM, mpp);
              const ang = wallAngle(hit.wall);
              return (
                <Group
                  x={hit.point.x}
                  y={hit.point.y}
                  rotation={(ang * 180) / Math.PI}
                  listening={false}
                  opacity={0.55}
                >
                  <Rect
                    x={-widthPx / 2}
                    y={-6}
                    width={widthPx}
                    height={12}
                    fill={ui.tool === "door" ? "#f7f9fc" : "#b8d4f0"}
                    stroke="#e08a1e"
                    strokeWidth={1.5}
                    dash={[4, 3]}
                  />
                </Group>
              );
            })()}

          {/* Symbol-Vorschau (Snap) */}
          {ui.tool === "symbol" &&
            ui.selectedSymbolKind &&
            pointer &&
            (() => {
              const snap = snapSymbolPlacement(
                ui.selectedSymbolKind,
                pointer,
                walls,
                mpp,
                undefined,
                { freehand: shiftFreehand }
              );
              return (
                <Group
                  x={snap.position.x}
                  y={snap.position.y}
                  rotation={
                    snap.rotation != null
                      ? (snap.rotation * 180) / Math.PI
                      : 0
                  }
                  opacity={0.45}
                  listening={false}
                >
                  <KonvaSymbol
                    kind={ui.selectedSymbolKind}
                    metersPerPixel={mpp}
                    color={
                      snap.snapped
                        ? getSymbolDef(ui.selectedSymbolKind).color
                        : "#94a3b8"
                    }
                  />
                </Group>
              );
            })()}

          {/* Zuordnung: Gummiband vom ersten Symbol */}
          {ui.tool === "connection" && connectFrom && pointer && (() => {
            const from = symbols.find((s) => s.id === connectFrom);
            if (!from) return null;
            return (
              <Line
                points={[
                  from.position.x,
                  from.position.y,
                  pointer.x,
                  pointer.y,
                ]}
                stroke="#2563eb"
                strokeWidth={1.5}
                dash={[6, 4]}
                listening={false}
              />
            );
          })()}

          {/* Rechteck-Auswahl */}
          {marquee && (
            <Rect
              x={Math.min(marquee.a.x, marquee.b.x)}
              y={Math.min(marquee.a.y, marquee.b.y)}
              width={Math.abs(marquee.b.x - marquee.a.x)}
              height={Math.abs(marquee.b.y - marquee.a.y)}
              stroke="#2563eb"
              strokeWidth={1.2}
              dash={[6, 4]}
              fill="rgba(37,99,235,0.08)"
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      <CalibrationModal />

      {isEmptyFloor && ui.tool === "select" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="pointer-events-auto w-full max-w-md rounded-xl border border-line bg-panel/95 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
              Plan starten
            </h2>
            <p className="mt-1 text-sm text-muted">
              Am schnellsten: Grundriss laden → 2 Punkte Maßstab → Wand
              zeichnen. Oder ohne Bild direkt zeichnen.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-panel"
                onClick={() => bgFileRef.current?.click()}
              >
                Grundriss laden
              </button>
              <button
                type="button"
                className="rounded-md bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-line/40"
                onClick={() => setTool("wall")}
              >
                Wand zeichnen
              </button>
              <button
                type="button"
                className="rounded-md bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-line/40"
                onClick={() => setTool("room")}
              >
                Raum zeichnen
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              Tipp: <kbd className="rounded bg-surface px-1">?</kbd> zeigt alle
              Tastenkürzel · Auto-Speichern lokal
            </p>
            <input
              ref={bgFileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file || !activeFloorId) return;
                try {
                  const bg = await loadBackgroundFile(file);
                  setBackground(activeFloorId, bg);
                  setTool("calibrate");
                  useFeedbackStore
                    .getState()
                    .showToast(
                      "Grundriss geladen · 2 Punkte für Maßstab setzen"
                    );
                } catch {
                  useFeedbackStore
                    .getState()
                    .showToast("Datei konnte nicht geladen werden");
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
        <div className="rounded-md bg-panel/95 px-2.5 py-1.5 text-[11px] text-muted shadow-sm">
          Zoom {Math.round(scale * 100)}% · H {wallHeightM.toFixed(2)} m ·
          {shiftFreehand
            ? " Freizeichnen (Shift)"
            : ` Snap ${ui.angleSnapDegrees}°`}
        </div>
        {floor?.background && floor.background.metersPerPixel == null && (
          <button
            type="button"
            className="pointer-events-auto rounded-md bg-accent-soft px-2.5 py-1.5 text-[11px] font-semibold text-accent-ink shadow-sm"
            title="Zwei Punkte auf bekannte Länge setzen"
            onClick={() => setTool("calibrate")}
          >
            Maßstab setzen
          </button>
        )}
        <button
          type="button"
          className="pointer-events-auto rounded-md bg-panel px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-sm"
          title="Rauszoomen"
          onClick={() => {
            const center = { x: size.w / 2, y: size.h / 2 };
            const next = zoomAt(center, scale, scale / 1.25, stagePos);
            setScale(next.scale);
            setStagePos(next.pos);
          }}
        >
          −
        </button>
        <button
          type="button"
          className="pointer-events-auto rounded-md bg-panel px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-sm"
          title="Reinzoomen"
          onClick={() => {
            const center = { x: size.w / 2, y: size.h / 2 };
            const next = zoomAt(center, scale, scale * 1.25, stagePos);
            setScale(next.scale);
            setStagePos(next.pos);
          }}
        >
          +
        </button>
        <button
          type="button"
          className="pointer-events-auto rounded-md bg-panel px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-sm"
          title="Zoom so, dass alles sichtbar ist (0 / Home) – zeichnet nichts"
          onClick={fitPlan}
        >
          Einpassen
        </button>
        <div className="max-w-xl rounded-md bg-ink px-2.5 py-1.5 text-[11px] font-medium text-panel shadow-sm">
          {hint}
        </div>
        {ui.tool === "wall" && draftStart && (
          <button
            type="button"
            className="pointer-events-auto rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-accent-ink shadow-sm"
            onClick={finishWallChain}
          >
            Wandkette beenden
          </button>
        )}
        {ui.tool === "room" && roomDraft.length >= 3 && (
          <button
            type="button"
            className="pointer-events-auto rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-accent-ink shadow-sm"
            onClick={finishRoom}
          >
            Raum schließen
          </button>
        )}
        {(ui.tool === "room" || draftStart || connectFrom) && (
          <button
            type="button"
            className="pointer-events-auto rounded-md bg-panel px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-sm"
            onClick={() => {
              cancelDrawing();
              if (!draftStart && roomDraft.length === 0) setTool("select");
            }}
          >
            Abbrechen (Esc)
          </button>
        )}
      </div>
    </div>
  );
}

function DimLabel({
  a,
  b,
  text,
  accent,
  invScale = 1,
}: {
  a: Point2;
  b: Point2;
  text: string;
  accent?: boolean;
  /** 1/zoom – hält Schrift bei starkem Zoom/Out lesbar */
  invScale?: number;
}) {
  const c = mid(a, b);
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  let deg = (ang * 180) / Math.PI;
  if (deg > 90 || deg < -90) deg += 180;
  const s = invScale;
  const w = Math.max(96, text.length * 7) * s;
  const h = 18 * s;
  return (
    <Group x={c.x} y={c.y} rotation={deg} listening={false}>
      <Rect
        x={-w / 2}
        y={-28 * s}
        width={w}
        height={h}
        fill={accent ? "#fff4e5" : "#ffffff"}
        stroke={accent ? "#e08a1e" : "#c5d0dc"}
        strokeWidth={1.2 * s}
        cornerRadius={3 * s}
      />
      <Text
        x={-w / 2}
        y={-25 * s}
        width={w}
        align="center"
        text={text}
        fontSize={11 * s}
        fontStyle="bold"
        fill="#1a2332"
      />
    </Group>
  );
}

function WallShape({
  wall,
  mpp,
  selected,
  showDim,
  invScale = 1,
  onSelect,
}: {
  wall: Wall;
  mpp: number;
  selected: boolean;
  showDim?: boolean;
  invScale?: number;
  onSelect: () => void;
}) {
  const thicknessPx = Math.max(2, metersToPx(wall.thickness, mpp));
  const n = wallNormal(wall);
  const half = thicknessPx / 2;
  const a1 = {
    x: wall.start.x + n.x * half,
    y: wall.start.y + n.y * half,
  };
  const a2 = {
    x: wall.start.x - n.x * half,
    y: wall.start.y - n.y * half,
  };
  const b1 = {
    x: wall.end.x + n.x * half,
    y: wall.end.y + n.y * half,
  };
  const b2 = {
    x: wall.end.x - n.x * half,
    y: wall.end.y - n.y * half,
  };
  const lenM = dist(wall.start, wall.end) * mpp;
  const epR = 2.5 * invScale;

  return (
    <Group onClick={onSelect} onTap={onSelect}>
      <Line
        points={[a1.x, a1.y, b1.x, b1.y, b2.x, b2.y, a2.x, a2.y]}
        closed
        fill={selected ? "#3d4f66" : "#2c3a4d"}
        stroke={selected ? "#e08a1e" : "#1a2332"}
        strokeWidth={selected ? 2 : 1}
      />
      {showDim && (
        <DimLabel
          a={wall.start}
          b={wall.end}
          text={`${lenM.toFixed(2)} m`}
          accent={selected}
          invScale={invScale}
        />
      )}
      <Circle
        x={wall.start.x}
        y={wall.start.y}
        radius={epR}
        fill="#94a3b8"
        listening={false}
      />
      <Circle
        x={wall.end.x}
        y={wall.end.y}
        radius={epR}
        fill="#94a3b8"
        listening={false}
      />
    </Group>
  );
}

function OpeningShape({
  opening,
  wall,
  mpp,
  selected,
  invScale = 1,
  onSelect,
}: {
  opening: import("@/types/project").Opening;
  wall: Wall;
  mpp: number;
  selected: boolean;
  invScale?: number;
  onSelect: () => void;
}) {
  const ang = wallAngle(wall);
  const center = pointOnWall(wall, opening.t);
  const widthPx = metersToPx(opening.width, mpp);
  const thicknessPx = Math.max(2, metersToPx(wall.thickness, mpp));
  const side = opening.opensInward ? 1 : -1;
  const label = `${opening.width.toFixed(2)} m`;

  const widthTag =
    selected || invScale < 1.2 ? (
      <Text
        x={-40 * invScale}
        y={thicknessPx / 2 + 4 * invScale}
        width={80 * invScale}
        align="center"
        text={label}
        fontSize={10 * invScale}
        fontStyle="bold"
        fill="#1a2332"
        listening={false}
      />
    ) : null;

  if (opening.kind === "window") {
    return (
      <Group
        planOpeningId={opening.id}
        x={center.x}
        y={center.y}
        rotation={(ang * 180) / Math.PI}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
      >
        <Rect
          x={-widthPx / 2}
          y={-thicknessPx / 2}
          width={widthPx}
          height={thicknessPx}
          fill="#b8d4f0"
          stroke={selected ? "#e08a1e" : "#1a2332"}
          strokeWidth={1.5}
        />
        <Line
          points={[-widthPx / 2, 0, widthPx / 2, 0]}
          stroke="#1a2332"
          strokeWidth={1}
        />
        {widthTag}
      </Group>
    );
  }

  const hingeX = opening.hingeLeft ? -widthPx / 2 : widthPx / 2;
  return (
    <Group
      planOpeningId={opening.id}
      x={center.x}
      y={center.y}
      rotation={(ang * 180) / Math.PI}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
    >
      <Rect
        x={-widthPx / 2}
        y={-thicknessPx / 2}
        width={widthPx}
        height={thicknessPx}
        fill="#f7f9fc"
        stroke={selected ? "#e08a1e" : "#1a2332"}
        strokeWidth={1.5}
      />
      <Line
        points={[
          hingeX,
          0,
          hingeX + (opening.hingeLeft ? widthPx : -widthPx) * 0.02,
          side * widthPx,
        ]}
        stroke="#1a2332"
        strokeWidth={1.5}
      />
      <Arc
        x={hingeX}
        y={0}
        innerRadius={0}
        outerRadius={widthPx}
        angle={90}
        rotation={
          opening.hingeLeft
            ? side > 0
              ? 0
              : -90
            : side > 0
              ? 90
              : 180
        }
        stroke="#64748b"
        strokeWidth={1}
        dash={[3, 3]}
      />
      {widthTag}
    </Group>
  );
}
