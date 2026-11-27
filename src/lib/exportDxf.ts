import { saveAs } from "file-saver";
import type { ProjectData } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";

/** Einfacher ASCII-DXF (Wände, Öffnungen, Symbole, Räume) – in Metern, Y nach oben. */
export function downloadDxf(data: ProjectData) {
  const lines: string[] = [];
  const push = (...vals: (string | number)[]) => {
    for (const v of vals) lines.push(String(v));
  };

  push(0, "SECTION", 2, "HEADER", 0, "ENDSEC");
  push(0, "SECTION", 2, "TABLES");
  push(0, "TABLE", 2, "LAYER", 70, 6);
  for (const [name, color] of [
    ["WALLS", 7],
    ["OPENINGS", 4],
    ["SYMBOLS", 2],
    ["ROOMS", 3],
    ["WIRES", 8],
  ] as const) {
    push(0, "LAYER", 2, name, 70, 0, 62, color, 6, "CONTINUOUS");
  }
  push(0, "ENDTAB", 0, "ENDSEC");
  push(0, "SECTION", 2, "ENTITIES");

  for (const floor of [...data.floors].sort((a, b) => a.order - b.order)) {
    const mpp = floor.background?.metersPerPixel ?? 0.02;
    const toX = (px: number) => +(px * mpp).toFixed(4);
    const toY = (py: number) => +(-(py * mpp)).toFixed(4); // CAD: Y up

    for (const w of data.walls.filter((w) => w.floorId === floor.id)) {
      push(
        0,
        "LINE",
        8,
        "WALLS",
        10,
        toX(w.start.x),
        20,
        toY(w.start.y),
        11,
        toX(w.end.x),
        21,
        toY(w.end.y)
      );
    }

    for (const o of data.openings.filter((o) => o.floorId === floor.id)) {
      const wall = data.walls.find((w) => w.id === o.wallId);
      if (!wall) continue;
      const t = o.t;
      const mx = wall.start.x + (wall.end.x - wall.start.x) * t;
      const my = wall.start.y + (wall.end.y - wall.start.y) * t;
      push(
        0,
        "CIRCLE",
        8,
        "OPENINGS",
        10,
        toX(mx),
        20,
        toY(my),
        40,
        +(o.width / 2).toFixed(4)
      );
      push(
        0,
        "TEXT",
        8,
        "OPENINGS",
        10,
        toX(mx),
        20,
        toY(my),
        40,
        0.12,
        1,
        o.kind === "door" ? "T" : "F"
      );
    }

    for (const r of data.rooms.filter((r) => r.floorId === floor.id)) {
      if (r.points.length < 2) continue;
      const pts = r.points.flatMap((p) => [toX(p.x), toY(p.y)]);
      push(0, "LWPOLYLINE", 8, "ROOMS", 90, r.points.length, 70, 1);
      for (let i = 0; i < pts.length; i += 2) {
        push(10, pts[i], 20, pts[i + 1]);
      }
      const cx = r.points.reduce((s, p) => s + p.x, 0) / r.points.length;
      const cy = r.points.reduce((s, p) => s + p.y, 0) / r.points.length;
      push(0, "TEXT", 8, "ROOMS", 10, toX(cx), 20, toY(cy), 40, 0.18, 1, r.name);
    }

    for (const s of data.symbols.filter((s) => s.floorId === floor.id)) {
      const def = getSymbolDef(s.kind);
      if (def.isFurniture) continue;
      push(
        0,
        "CIRCLE",
        8,
        "SYMBOLS",
        10,
        toX(s.position.x),
        20,
        toY(s.position.y),
        40,
        0.08
      );
      const label = s.circuitId
        ? `${def.labelPro} ${s.circuitId}`
        : def.labelPro;
      push(
        0,
        "TEXT",
        8,
        "SYMBOLS",
        10,
        toX(s.position.x + 12),
        20,
        toY(s.position.y),
        40,
        0.1,
        1,
        label
      );
    }

    for (const c of data.connections.filter((c) => c.floorId === floor.id)) {
      const a = data.symbols.find((s) => s.id === c.fromSymbolId);
      const b = data.symbols.find((s) => s.id === c.toSymbolId);
      if (!a || !b) continue;
      push(
        0,
        "LINE",
        8,
        "WIRES",
        10,
        toX(a.position.x),
        20,
        toY(a.position.y),
        11,
        toX(b.position.x),
        21,
        toY(b.position.y)
      );
    }
  }

  push(0, "ENDSEC", 0, "EOF");
  const blob = new Blob([lines.join("\n")], { type: "application/dxf" });
  const name =
    data.meta.name.trim().replace(/[^\wäöüÄÖÜß\- ]+/g, "").replace(/\s+/g, "-") ||
    "elektro-cad";
  saveAs(blob, `${name}.dxf`);
}
