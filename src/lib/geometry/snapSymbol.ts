import type { PlanSymbol, Point2, SymbolKind, Wall } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { resolveSymbolSize } from "@/lib/symbols/size";
import {
  closestWall,
  dist,
  metersToPx,
  snapToEndpoints,
  wallAngle,
  wallSide,
} from "@/lib/geometry/math";

export type SnapPlacement = {
  position: Point2;
  rotation?: number;
  wallId?: string;
  wallT?: number;
  wallSide?: 1 | -1;
  snapped: boolean;
};

/**
 * Snap beim Platzieren/Verschieben:
 * – wandgebundene Symbole → an Wand
 * – Möbel/Sanitär → Ecken + optional flach an Wand (Rückseite)
 */
export function snapSymbolPlacement(
  kind: SymbolKind,
  raw: Point2,
  walls: Wall[],
  mpp: number,
  sizeOverride?: PlanSymbol["sizeM"],
  opts?: { freehand?: boolean }
): SnapPlacement {
  if (opts?.freehand || !walls.length) {
    return { position: raw, snapped: false };
  }

  const def = getSymbolDef(kind);
  const size = resolveSymbolSize(kind, sizeOverride);
  const cornerThresh = 22;
  const wallThresh = def.wallBound ? 56 : 28;

  // 1) Ecken (Wand-Endpunkte)
  const corner = snapToEndpoints(raw, walls, cornerThresh);
  if (dist(corner, raw) < cornerThresh - 0.5) {
    if (def.wallBound) {
      const hit = closestWall(walls, corner, wallThresh);
      if (hit) {
        return attachToWall(hit, corner, mpp, true);
      }
    }
    return { position: corner, snapped: true };
  }

  // 2) Wandgebunden → immer an Wand
  if (def.wallBound) {
    const hit = closestWall(walls, raw, wallThresh);
    if (hit) return attachToWall(hit, raw, mpp, true);
    return { position: raw, snapped: false };
  }

  // 3) Möbel / große Körper → flach an Wand (Rückseite)
  if (
    size &&
    (def.isFurniture || def.category === "sanitary" || def.category === "appliance")
  ) {
    const hit = closestWall(walls, raw, wallThresh);
    if (hit) {
      const side = wallSide(hit.wall, raw);
      const ang = wallAngle(hit.wall);
      const clearPx = metersToPx(hit.wall.thickness / 2 + size.d / 2 + 0.02, mpp);
      const nx = -Math.sin(ang) * side;
      const ny = Math.cos(ang) * side;
      return {
        position: {
          x: hit.point.x + nx * clearPx,
          y: hit.point.y + ny * clearPx,
        },
        rotation: ang + (side === 1 ? 0 : Math.PI),
        wallId: hit.wall.id,
        wallT: hit.t,
        wallSide: side,
        snapped: true,
      };
    }
  }

  return { position: raw, snapped: false };
}

function attachToWall(
  hit: { wall: Wall; t: number; point: Point2 },
  toward: Point2,
  mpp: number,
  snapped: boolean
): SnapPlacement {
  const side = wallSide(hit.wall, toward);
  const ang = wallAngle(hit.wall);
  const offsetPx = metersToPx(hit.wall.thickness / 2 + 0.02, mpp);
  const nx = -Math.sin(ang) * side;
  const ny = Math.cos(ang) * side;
  return {
    position: {
      x: hit.point.x + nx * offsetPx,
      y: hit.point.y + ny * offsetPx,
    },
    rotation: ang + (side === 1 ? 0 : Math.PI),
    wallId: hit.wall.id,
    wallT: hit.t,
    wallSide: side,
    snapped,
  };
}
