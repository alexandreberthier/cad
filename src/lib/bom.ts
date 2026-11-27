import type {
  PlanSymbol,
  ProjectData,
  SymbolCategory,
  SymbolKind,
} from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";

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
    "Etage;Bezeichnung;Fachkürzel;Anzahl;Stromkreise",
  ];
  for (const floor of [...data.floors].sort((a, b) => a.order - b.order)) {
    const rows = bomForSymbols(
      data.symbols.filter((s) => s.floorId === floor.id)
    );
    for (const r of rows) {
      lines.push(
        [
          floor.name,
          r.label,
          r.labelPro,
          String(r.count),
          r.circuits.join(", "),
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
}

export interface RcdNode {
  id: string;
  title: string;
  circuits: CircuitNode[];
  count: number;
}

export interface PanelNode {
  id: string;
  title: string;
  panel?: PlanSymbol;
  rcds: RcdNode[];
  count: number;
}

/** UV → FI → Stromkreis → Geräte. Eine UV bekommt alles, sonst nur explizit zugeordnete. */
export function circuitForest(
  symbols: PlanSymbol[]
): { panels: PanelNode[]; deviceCount: number } {
  const uvs = symbols.filter((s) => s.kind === "distribution_board");
  const devices = electricalSymbols(symbols).filter(
    (s) => s.kind !== "distribution_board"
  );

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

  const panels: PanelNode[] = uvs.map((uv) =>
    toPanel(uv.id, uv.label?.trim() || "Unterverteilung", buckets.get(uv.id) ?? [], uv)
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
        }));
      return {
        id: rid,
        title: rid === "__none" ? "ohne FI" : `FI ${rid}`,
        circuits,
        count: list.length,
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
