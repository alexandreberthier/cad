import type { Point2, Wall } from "@/types/project";

export const DEG = Math.PI / 180;

export function dist(a: Point2, b: Point2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function mid(a: Point2, b: Point2): Point2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function lerp(a: Point2, b: Point2, t: number): Point2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function sub(a: Point2, b: Point2): Point2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Point2, b: Point2): Point2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(v: Point2, s: number): Point2 {
  return { x: v.x * s, y: v.y * s };
}

export function normalize(v: Point2): Point2 {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

export function perpendicular(v: Point2): Point2 {
  return { x: -v.y, y: v.x };
}

export function wallAngle(wall: Wall): number {
  return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
}

export function wallLengthPx(wall: Wall): number {
  return dist(wall.start, wall.end);
}

export function wallNormal(wall: Wall): Point2 {
  return normalize(perpendicular(sub(wall.end, wall.start)));
}

export function pointOnWall(wall: Wall, t: number): Point2 {
  return lerp(wall.start, wall.end, t);
}

/** Projektion eines Punkts auf eine Wandlinie → t in [0,1] und Abstand */
export function projectOnWall(
  wall: Wall,
  p: Point2
): { t: number; point: Point2; distance: number } {
  const ab = sub(wall.end, wall.start);
  const len2 = ab.x * ab.x + ab.y * ab.y || 1;
  const ap = sub(p, wall.start);
  let t = (ap.x * ab.x + ap.y * ab.y) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = lerp(wall.start, wall.end, t);
  return { t, point, distance: dist(p, point) };
}

export function closestWall(
  walls: Wall[],
  p: Point2,
  maxDistPx: number
): { wall: Wall; t: number; point: Point2; distance: number } | null {
  let best: { wall: Wall; t: number; point: Point2; distance: number } | null =
    null;
  for (const wall of walls) {
    const proj = projectOnWall(wall, p);
    if (proj.distance <= maxDistPx && (!best || proj.distance < best.distance)) {
      best = { wall, ...proj };
    }
  }
  return best;
}

/** Welche Seite der Wand (Vorzeichen der Normalen-Dot) */
export function wallSide(wall: Wall, p: Point2): 1 | -1 {
  const n = wallNormal(wall);
  const v = sub(p, wall.start);
  return n.x * v.x + n.y * v.y >= 0 ? 1 : -1;
}

export function snapAngle(
  from: Point2,
  to: Point2,
  stepDeg: number
): Point2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return to;
  const angle = Math.atan2(dy, dx);
  const step = stepDeg * DEG;
  const snapped = Math.round(angle / step) * step;
  return {
    x: from.x + Math.cos(snapped) * len,
    y: from.y + Math.sin(snapped) * len,
  };
}

export function snapToEndpoints(
  p: Point2,
  walls: Wall[],
  thresholdPx: number
): Point2 {
  let best = p;
  let bestD = thresholdPx;
  for (const w of walls) {
    for (const ep of [w.start, w.end]) {
      const d = dist(p, ep);
      if (d < bestD) {
        bestD = d;
        best = { ...ep };
      }
    }
  }
  return best;
}

/** Point-in-polygon (ray casting) */
export function pointInPolygon(p: Point2, poly: Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pxToMeters(px: number, metersPerPixel: number): number {
  return px * metersPerPixel;
}

/** Polygonfläche in px² (Shoelace) */
export function polygonAreaPx2(points: Point2[]): number {
  if (points.length < 3) return 0;
  let a = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    a += points[j].x * points[i].y - points[i].x * points[j].y;
  }
  return Math.abs(a) / 2;
}

export function polygonAreaM2(points: Point2[], metersPerPixel: number): number {
  return polygonAreaPx2(points) * metersPerPixel * metersPerPixel;
}

/** Kantenmittelpunkt */
export function edgeKey(a: Point2, b: Point2): string {
  const p = [a, b].sort((u, v) => (u.x === v.x ? u.y - v.y : u.x - v.x));
  return `${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}|${p[1].x.toFixed(1)},${p[1].y.toFixed(1)}`;
}

/** Existiert schon eine Wand für diese Kante? */
export function findWallForEdge(
  walls: Wall[],
  a: Point2,
  b: Point2,
  tolPx = 14
): Wall | undefined {
  return walls.find((w) => {
    const same =
      (dist(w.start, a) <= tolPx && dist(w.end, b) <= tolPx) ||
      (dist(w.start, b) <= tolPx && dist(w.end, a) <= tolPx);
    return same;
  });
}

export function metersToPx(m: number, metersPerPixel: number): number {
  return m / metersPerPixel;
}
