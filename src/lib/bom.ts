import type {
  PlanSymbol,
  ProjectData,
  SymbolCategory,
  SymbolKind,
} from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { isPanelSymbol, majorityField } from "@/lib/circuits";

export interface BomRow {
  kind: SymbolKind;
  label: string;
  labelPro: string;
  category: SymbolCategory;
  count: number;
  circuits: string[];
}

const SKIP = new Set(["furniture", "sanitary"]);

export function electricalSymbols(symbols: PlanSymbol[]): PlanSymbol[] {
  return symbols.filter((s) => !SKIP.has(getSymbolDef(s.kind).category));
}

export function bomForSymbols(symbols: PlanSymbol[]): BomRow[] {
  const map = new Map<SymbolKind, BomRow>();
  for (const s of electricalSymbols(symbols)) {
    const def = getSymbolDef(s.kind);
    const row = map.get(s.kind) ?? {
      kind: s.kind,
      label: def.label,
      labelPro: def.labelPro,
      category: def.category,
      count: 0,
      circuits: [],
    };
    row.count += 1;
    const c = s.circuitId?.trim();
    if (c && !row.circuits.includes(c)) row.circuits.push(c);
    map.set(s.kind, row);
  }
  return [...map.values()].sort((a, b) =>
    a.category === b.category
      ? b.count - a.count
      : a.category.localeCompare(b.category, "de")
  );
}

export function bomCsv(data: ProjectData): string {
  const lines = [
    "Etage;Bezeichnung;Fachkürzel;Anzahl;Stromkreise;FI;LS;Leitung",
  ];
  for (const floor of [...data.floors].sort((a, b) => a.order - b.order)) {
    const floorSymbols = data.symbols.filter((s) => s.floorId === floor.id);
    const rows = bomForSymbols(floorSymbols);
    for (const r of rows) {
      const ofKind = floorSymbols.filter((s) => s.kind === r.kind);
      lines.push(
        [
          floor.name,
          r.label,
          r.labelPro,
          String(r.count),
          r.circuits.join(", "),
          [...new Set(ofKind.map((s) => s.rcdGroup).filter(Boolean))].join(
            ", "
          ),
          [...new Set(ofKind.map((s) => s.breakerRating).filter(Boolean))].join(
            ", "
          ),
          [...new Set(ofKind.map((s) => s.cableType).filter(Boolean))].join(
            ", "
          ),
        ]
          .map(csvCell)
          .join(";")
      );
    }
  }
  return lines.join("\n");
}

/** Eine Zeile pro Gerät – für Schaltplan / Ausschreibung */
export function circuitDetailCsv(data: ProjectData): string {
  const lines = [
    "Etage;UV;FI;Stromkreis;LS;Leitung;Gerät;Fachkürzel;Bezeichnung;Höhe_cm",
  ];
  for (const floor of [...data.floors].sort((a, b) => a.order - b.order)) {
    const floorSymbols = data.symbols.filter((s) => s.floorId === floor.id);
    const forest = circuitForest(floorSymbols);
    const panelById = new Map(
      forest.panels.map((p) => [p.id, p.title] as const)
    );
    for (const s of electricalSymbols(floorSymbols)) {
      if (isPanelSymbol(s)) continue;
      const def = getSymbolDef(s.kind);
      const uv =
        (s.panelId && panelById.get(s.panelId)) ||
        (forest.panels.length === 1
          ? forest.panels[0].title
          : s.panelId
            ? "zugeordnet"
            : "");
      lines.push(
        [
          floor.name,
          uv,
          s.rcdGroup?.trim() ?? "",
          s.circuitId?.trim() ?? "",
          s.breakerRating?.trim() ?? "",
          s.cableType?.trim() ?? "",
          def.label,
          def.labelPro,
          s.label?.trim() ?? "",
          String(Math.round(s.mountHeight * 100)),
        ]
          .map(csvCell)
          .join(";")
      );
    }
  }

  lines.push("");
  lines.push("Etage;Von;Nach;Länge_m;Leitung;Stromkreis");
  for (const floor of [...data.floors].sort((a, b) => a.order - b.order)) {
    for (const c of data.connections.filter((x) => x.floorId === floor.id)) {
      const a = data.symbols.find((s) => s.id === c.fromSymbolId);
      const b = data.symbols.find((s) => s.id === c.toSymbolId);
      if (!a || !b) continue;
      const cable =
        a.cableType?.trim() && a.cableType.trim() === b.cableType?.trim()
          ? a.cableType.trim()
          : [a.cableType, b.cableType].filter(Boolean).join(" / ");
      const circuit =
        a.circuitId?.trim() && a.circuitId.trim() === b.circuitId?.trim()
          ? a.circuitId.trim()
          : [a.circuitId, b.circuitId].filter(Boolean).join(" / ");
      lines.push(
        [
          floor.name,
          a.label || getSymbolDef(a.kind).label,
          b.label || getSymbolDef(b.kind).label,
          (c.estimatedLengthM ?? 0).toFixed(2),
          cable,
          circuit,
        ]
          .map(csvCell)
          .join(";")
      );
    }
  }
  return lines.join("\n");
}

function csvCell(v: string): string {
  if (/[;"\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
  return v;
}

export interface CircuitNode {
  id: string;
  title: string;
  devices: PlanSymbol[];
  cableType?: string;
  breakerRating?: string;
}

export interface RcdNode {
  id: string;
  title: string;
  circuits: CircuitNode[];
  count: number;
  rcdHint?: string;
}

export interface PanelNode {
  id: string;
  title: string;
  panel?: PlanSymbol;
  rcds: RcdNode[];
  count: number;
}

function panelTitle(uv: PlanSymbol, index: number): string {
  if (uv.label?.trim()) return uv.label.trim();
  if (uv.kind === "main_panel") return `HV ${index + 1}`;
  if (uv.kind === "meter_cabinet") return `Zähler ${index + 1}`;
  return `UV ${index + 1}`;
}

/** UV/HV → FI → Stromkreis → Geräte. Eine UV bekommt alles, sonst nur explizit zugeordnete. */
export function circuitForest(
  symbols: PlanSymbol[]
): { panels: PanelNode[]; deviceCount: number } {
  const uvs = symbols.filter(isPanelSymbol);
  const devices = electricalSymbols(symbols).filter((s) => !isPanelSymbol(s));

  const buckets = new Map<string, PlanSymbol[]>();
  const loose: PlanSymbol[] = [];
  for (const d of devices) {
    const linked = d.panelId && uvs.some((u) => u.id === d.panelId);
    if (linked && d.panelId) {
      const list = buckets.get(d.panelId) ?? [];
      list.push(d);
      buckets.set(d.panelId, list);
    } else if (uvs.length === 1) {
      const list = buckets.get(uvs[0].id) ?? [];
      list.push(d);
      buckets.set(uvs[0].id, list);
    } else {
      loose.push(d);
    }
  }

  const panels: PanelNode[] = uvs.map((uv, i) =>
    toPanel(uv.id, panelTitle(uv, i), buckets.get(uv.id) ?? [], uv)
  );
  if (loose.length || uvs.length === 0) {
    panels.push(
      toPanel(
        "__loose",
        uvs.length ? "nicht zugeordnet" : "UV (noch nicht gesetzt)",
        uvs.length === 0 ? devices : loose
      )
    );
  }
  return { panels, deviceCount: devices.length };
}

function toPanel(
  id: string,
  title: string,
  devices: PlanSymbol[],
  panel?: PlanSymbol
): PanelNode {
  const byRcd = new Map<string, PlanSymbol[]>();
  for (const d of devices) {
    const key = d.rcdGroup?.trim() || "__none";
    const list = byRcd.get(key) ?? [];
    list.push(d);
    byRcd.set(key, list);
  }
  const rcds: RcdNode[] = [...byRcd.entries()]
    .sort(([a], [b]) => {
      if (a === "__none") return 1;
      if (b === "__none") return -1;
      return a.localeCompare(b, "de");
    })
    .map(([rid, list]) => {
      const byC = new Map<string, PlanSymbol[]>();
      for (const d of list) {
        const key = d.circuitId?.trim() || "__none";
        const bucket = byC.get(key) ?? [];
        bucket.push(d);
        byC.set(key, bucket);
      }
      const circuits = [...byC.entries()]
        .sort(([a], [b]) => {
          if (a === "__none") return 1;
          if (b === "__none") return -1;
          return a.localeCompare(b, "de");
        })
        .map(([cid, devs]) => ({
          id: cid,
          title: cid === "__none" ? "ohne Stromkreis" : cid,
          devices: devs,
          cableType: majorityField(devs, "cableType"),
          breakerRating: majorityField(devs, "breakerRating"),
        }));
      return {
        id: rid,
        title: rid === "__none" ? "ohne FI" : `FI ${rid}`,
        circuits,
        count: list.length,
        rcdHint: rid === "__none" ? undefined : "≤ 30 mA (Wohnung)",
      };
    });
  return { id, title, panel, rcds, count: devices.length };
}

export function kindSummary(devices: PlanSymbol[], pro: boolean): string {
  const m = new Map<string, number>();
  for (const d of devices) {
    const def = getSymbolDef(d.kind);
    const name = pro ? def.labelPro : def.label;
    m.set(name, (m.get(name) ?? 0) + 1);
  }
  return [...m.entries()].map(([n, c]) => `${c}× ${n}`).join(", ");
}
