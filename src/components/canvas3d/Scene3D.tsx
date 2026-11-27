"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Billboard, OrbitControls, Text } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useProjectStore } from "@/store/projectStore";
import { dist, polygonAreaM2, wallAngle } from "@/lib/geometry/math";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { resolvePlanSymbolColor } from "@/lib/symbols/colors";
import type { Opening, Point2, Room, Wall } from "@/types/project";
import { SymbolMesh3D } from "./SymbolMesh3D";

export function Scene3D() {
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const floors = useProjectStore((s) => s.floors);
  const walls = useProjectStore((s) => s.walls);
  const mode = useProjectStore((s) => s.ui.mode);
  const floor = useMemo(
    () => floors.find((f) => f.id === activeFloorId),
    [floors, activeFloorId]
  );
  const height = floor?.height ?? 2.5;
  const hasWalls = walls.some((w) => w.floorId === activeFloorId);

  return (
    <div className="absolute inset-0 bg-[#cfd9e4]">
      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        camera={{ position: [8, 10, 12], fov: 45, near: 0.1, far: 500 }}
      >
        <color attach="background" args={["#cfd9e4"]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 12, 4]} intensity={0.75} />
        <Controls3D />
        <gridHelper
          args={[40, 40, "#9aabbc", "#b7c4d1"]}
          position={[0, 0.001, 0]}
        />
        <FloorScene mode={mode} />
      </Canvas>
      {!hasWalls && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-md bg-panel px-3 py-2 text-xs text-muted shadow">
            Noch keine Wände – im 2D-Plan zeichnen
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 max-w-sm rounded-md bg-panel/90 px-2.5 py-1.5 text-[11px] text-muted shadow-sm">
        3D · Wandhöhe {height.toFixed(2)} m · Symbole mit Form + Name · Maus
        drehen
      </div>
    </div>
  );
}

function Controls3D() {
  const invalidate = useThree((s) => s.invalidate);
  return (
    <OrbitControls
      makeDefault
      maxPolarAngle={Math.PI / 2.05}
      enableDamping
      dampingFactor={0.12}
      onChange={() => invalidate()}
    />
  );
}

function FloorScene({ mode }: { mode: "homeowner" | "pro" }) {
  const invalidate = useThree((s) => s.invalidate);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const floors = useProjectStore((s) => s.floors);
  const allWalls = useProjectStore((s) => s.walls);
  const allOpenings = useProjectStore((s) => s.openings);
  const allSymbols = useProjectStore((s) => s.symbols);
  const allRooms = useProjectStore((s) => s.rooms);
  const showFurniture = useProjectStore((s) => s.ui.showFurniture);
  const showSanitary = useProjectStore((s) => s.ui.showSanitary);
  const printBlackSymbols = useProjectStore((s) => s.ui.printBlackSymbols);
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
  const mpp = floor?.background?.metersPerPixel ?? 0.02;
  const height = floor?.height ?? 2.5;

  /** Stabile Opening-Listen pro Wand – verhindert Geometrie-Rebuild beim Orbit */
  const openingsByWall = useMemo(() => {
    const map = new Map<string, Opening[]>();
    for (const o of openings) {
      const list = map.get(o.wallId);
      if (list) list.push(o);
      else map.set(o.wallId, [o]);
    }
    return map;
  }, [openings]);

  const center = useMemo(() => {
    const pts = [
      ...walls.flatMap((w) => [w.start, w.end]),
      ...rooms.flatMap((r) => r.points),
    ];
    if (!pts.length) return { x: 0, z: 0 };
    let sx = 0;
    let sy = 0;
    for (const p of pts) {
      sx += p.x;
      sy += p.y;
    }
    return { x: (sx / pts.length) * mpp, z: (sy / pts.length) * mpp };
  }, [walls, rooms, mpp]);

  useEffect(() => {
    invalidate();
  }, [
    invalidate,
    walls,
    rooms,
    openings,
    symbols,
    showFurniture,
    showSanitary,
    printBlackSymbols,
    symbolColorDefaults,
    mode,
    height,
    mpp,
    center.x,
    center.z,
  ]);

  const visibleSymbols = useMemo(
    () =>
      symbols.filter((s) => {
        const def = getSymbolDef(s.kind);
        if (def.isFurniture && !showFurniture) return false;
        if (def.category === "sanitary" && !showSanitary) return false;
        return true;
      }),
    [symbols, showFurniture, showSanitary]
  );

  return (
    <group position={[-center.x, 0, -center.z]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[center.x, 0, center.z]}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#e7edf4" />
      </mesh>

      {rooms.map((r, i) => (
        <RoomFloor3D key={r.id} room={r} mpp={mpp} hue={i} />
      ))}

      {walls.map((w) => (
        <WallMesh
          key={w.id}
          wall={w}
          openings={openingsByWall.get(w.id) ?? EMPTY_OPENINGS}
          height={height}
          mpp={mpp}
        />
      ))}

      {openings
        .filter((o) => o.kind === "door")
        .map((o) => {
          const wall = walls.find((w) => w.id === o.wallId);
          if (!wall) return null;
          return (
            <DoorSwing3D
              key={`door-${o.id}`}
              opening={o}
              wall={wall}
              mpp={mpp}
            />
          );
        })}

      {visibleSymbols.map((s) => {
        const def = getSymbolDef(s.kind);
        const label = mode === "pro" ? def.labelPro : def.label;
        const scaled = {
          ...s,
          position: {
            x: s.position.x * mpp,
            y: s.position.y * mpp,
          },
        };
        return (
          <SymbolMesh3D
            key={s.id}
            symbol={scaled}
            label={label}
            color={resolvePlanSymbolColor(
              s,
              symbolColorDefaults,
              printBlackSymbols
            )}
          />
        );
      })}
    </group>
  );
}

const EMPTY_OPENINGS: Opening[] = [];

/** Weiche Raumfarben – klar getrennt vom Wandgrau */
const ROOM_COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#c084fc",
  "#22d3ee",
];

function polygonCentroid(points: Point2[]): Point2 {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  const n = points.length || 1;
  return { x: x / n, y: y / n };
}

function DimLabel3D({
  position,
  text,
  fontSize = 0.16,
  color = "#334155",
}: {
  position: [number, number, number];
  text: string;
  fontSize?: number;
  color?: string;
}) {
  return (
    <Billboard position={position} follow>
      <Text
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.018}
        outlineColor="#f8fafc"
        fillOpacity={0.85}
        renderOrder={15}
        onSync={(troika) => {
          const mat = troika.material as {
            depthTest?: boolean;
            depthWrite?: boolean;
          };
          if (mat) {
            mat.depthTest = false;
            mat.depthWrite = false;
          }
        }}
      >
        {text}
      </Text>
    </Billboard>
  );
}

function useDisposableGeometry(factory: () => THREE.BufferGeometry | null, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geom = useMemo(factory, deps);
  useEffect(() => {
    return () => {
      geom?.dispose();
    };
  }, [geom]);
  return geom;
}

function RoomFloor3D({
  room,
  mpp,
  hue,
}: {
  room: Room;
  mpp: number;
  hue: number;
}) {
  const geom = useDisposableGeometry(() => {
    if (room.points.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(room.points[0].x * mpp, room.points[0].y * mpp);
    for (let i = 1; i < room.points.length; i++) {
      shape.lineTo(room.points[i].x * mpp, room.points[i].y * mpp);
    }
    shape.closePath();
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [room.points, mpp]);

  const c = useMemo(() => polygonCentroid(room.points), [room.points]);
  const area = useMemo(
    () => polygonAreaM2(room.points, mpp),
    [room.points, mpp]
  );

  if (!geom) return null;
  return (
    <group>
      <mesh
        geometry={geom}
        position={[0, 0.012, 0]}
        receiveShadow={false}
        renderOrder={1}
      >
        <meshBasicMaterial
          color={ROOM_COLORS[hue % ROOM_COLORS.length]}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
      <DimLabel3D
        position={[c.x * mpp, 0.08, c.y * mpp]}
        text={`${room.name}  ·  ${area.toFixed(1)} m²`}
        fontSize={0.18}
        color="#1e293b"
      />
    </group>
  );
}

function WallMesh({
  wall,
  openings,
  height,
  mpp,
}: {
  wall: Wall;
  openings: Opening[];
  height: number;
  mpp: number;
}) {
  const geom = useDisposableGeometry(() => {
    const length = dist(wall.start, wall.end) * mpp;
    const shape2 = new THREE.Shape();
    shape2.moveTo(0, 0);
    shape2.lineTo(length, 0);
    shape2.lineTo(length, height);
    shape2.lineTo(0, height);
    shape2.closePath();

    for (const o of openings) {
      const cx = o.t * length;
      const half = o.width / 2;
      const bottom = o.sillHeight;
      const top = Math.min(height - 0.01, o.sillHeight + o.height);
      const hole = new THREE.Path();
      hole.moveTo(cx - half, bottom);
      hole.lineTo(cx + half, bottom);
      hole.lineTo(cx + half, top);
      hole.lineTo(cx - half, top);
      hole.closePath();
      shape2.holes.push(hole);
    }

    const g = new THREE.ExtrudeGeometry(shape2, {
      depth: wall.thickness,
      bevelEnabled: false,
    });
    g.translate(0, 0, -wall.thickness / 2);
    return g;
  }, [
    wall.start.x,
    wall.start.y,
    wall.end.x,
    wall.end.y,
    wall.thickness,
    openings,
    height,
    mpp,
  ]);

  const ang = wallAngle(wall);
  const x = wall.start.x * mpp;
  const z = wall.start.y * mpp;
  const lenM = dist(wall.start, wall.end) * mpp;
  const midX = ((wall.start.x + wall.end.x) / 2) * mpp;
  const midZ = ((wall.start.y + wall.end.y) / 2) * mpp;
  // Label etwas über Boden, dezent
  const labelY = Math.min(0.55, height * 0.22);

  return (
    <group>
      <mesh
        geometry={geom ?? undefined}
        position={[x, 0, z]}
        rotation={[0, -ang, 0]}
        renderOrder={2}
      >
        <meshBasicMaterial
          color="#8b9aab"
          transparent
          opacity={0.34}
          depthWrite={false}
        />
      </mesh>
      {lenM >= 0.4 && (
        <DimLabel3D
          position={[midX, labelY, midZ]}
          text={`${lenM.toFixed(2)} m`}
          fontSize={0.14}
          color="#475569"
        />
      )}
    </group>
  );
}

/** Türflügel ~80° offen + Boden-Schwenkfläche (Stellplatz-Hinweis) */
function DoorSwing3D({
  opening,
  wall,
  mpp,
}: {
  opening: Opening;
  wall: Wall;
  mpp: number;
}) {
  const ang = wallAngle(wall);
  const length = dist(wall.start, wall.end) * mpp;
  const cx = opening.t * length;
  const x0 = wall.start.x * mpp;
  const z0 = wall.start.y * mpp;
  const side = opening.opensInward ? 1 : -1;
  const hingeLocal = opening.hingeLeft ? -opening.width / 2 : opening.width / 2;
  const openRad = (Math.PI / 2) * 0.85 * side * (opening.hingeLeft ? 1 : -1);

  const hx = x0 + Math.cos(ang) * (cx + hingeLocal);
  const hz = z0 + Math.sin(ang) * (cx + hingeLocal);

  const leafH = Math.min(opening.height, 2.05);
  const leafW = opening.width * 0.98;
  const leafThick = 0.04;

  const sector = useDisposableGeometry(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    const steps = 10;
    const start = 0;
    const end = (Math.PI / 2) * side * (opening.hingeLeft ? 1 : -1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = start + (end - start) * t;
      shape.lineTo(Math.cos(a) * leafW, Math.sin(a) * leafW);
    }
    shape.closePath();
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [leafW, side, opening.hingeLeft]);

  return (
    <group position={[hx, 0, hz]} rotation={[0, -ang, 0]}>
      {sector && (
        <mesh geometry={sector} position={[0, 0.02, 0]}>
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      )}
      <group position={[hingeLocal, 0, 0]} rotation={[0, openRad, 0]}>
        <mesh
          position={[
            opening.hingeLeft ? leafW / 2 : -leafW / 2,
            leafH / 2,
            side * leafThick,
          ]}
        >
          <boxGeometry args={[leafW, leafH, leafThick]} />
          <meshBasicMaterial color="#e8eef5" transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}
