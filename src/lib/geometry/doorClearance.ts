import type { Opening, PlanSymbol, Point2, Wall } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { resolveSymbolSize } from "@/lib/symbols/size";
import {
  dist,
  metersToPx,
  pointOnWall,
  wallAngle,
  wallNormal,
} from "@/lib/geometry/math";

/** Grobe Prüfung: Symbol-Mittelpunkt im Türschwenk-Kreisviertel? */
export function symbolsInDoorSwing(
  symbols: PlanSymbol[],
  openings: Opening[],
  walls: Wall[],
  mpp: number
): { symbolId: string; doorId: string }[] {
  const hits: { symbolId: string; doorId: string }[] = [];
  const doors = openings.filter((o) => o.kind === "door");

  for (const door of doors) {
    const wall = walls.find((w) => w.id === door.wallId);
    if (!wall) continue;
    const center = pointOnWall(wall, door.t);
    const ang = wallAngle(wall);
    const n = wallNormal(wall);
    const side = door.opensInward ? 1 : -1;
    const widthPx = metersToPx(door.width, mpp);
    const hinge: Point2 = {
      x:
        center.x +
        Math.cos(ang) * (door.hingeLeft ? -widthPx / 2 : widthPx / 2),
      y:
        center.y +
        Math.sin(ang) * (door.hingeLeft ? -widthPx / 2 : widthPx / 2),
    };

    for (const s of symbols) {
      if (s.floorId !== door.floorId) continue;
      const def = getSymbolDef(s.kind);
      if (!def.isFurniture && def.category !== "sanitary") continue;
      const size = resolveSymbolSize(s.kind, s.sizeM);
      const radius = size
        ? metersToPx(Math.max(size.w, size.d) * 0.35, mpp)
        : 12;
      const d = dist(s.position, hinge);
      if (d > widthPx + radius) continue;

      // auf der Öffnungsseite?
      const vx = s.position.x - hinge.x;
      const vy = s.position.y - hinge.y;
      const alongN = vx * n.x + vy * n.y;
      if (alongN * side < -radius) continue;

      hits.push({ symbolId: s.id, doorId: door.id });
    }
  }
  return hits;
}
