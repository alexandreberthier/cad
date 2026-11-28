import type { PlanSymbol, SymbolKind } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";

export const PANEL_KINDS = new Set<SymbolKind>([
  "distribution_board",
  "main_panel",
  "meter_cabinet",
  "data_cabinet",
]);

export function isPanelKind(kind: SymbolKind): boolean {
  return PANEL_KINDS.has(kind);
}

export function isPanelSymbol(s: Pick<PlanSymbol, "kind">): boolean {
  return isPanelKind(s.kind);
}

/** Typische Leitung je Symbol – Praxis Wohnbau */
export function suggestCableType(kind: SymbolKind): string {
  switch (kind) {
    case "stove_outlet":
    case "ev_charger":
    case "heat_pump":
    case "pv_inverter":
      return "NYM-J 5×2,5";
    case "water_heater":
    case "washing_machine":
    case "dryer":
    case "dishwasher":
      return "NYM-J 3×2,5";
    case "ceiling_outlet":
    case "wall_outlet":
    case "recessed_spot":
    case "light_led_strip":
    case "light_pendant":
    case "light_wall_sconce":
    case "light_outdoor":
    case "light_garden":
    case "emergency_light":
    case "switch_off":
    case "switch_changeover":
    case "switch_cross":
    case "switch_series":
    case "switch_push":
    case "switch_dimmer":
    case "switch_hotel":
    case "switch_double_push":
    case "switch_pilot":
    case "knx_push":
    case "shutter_switch":
      return "NYM-J 3×1,5";
    case "rj45":
    case "rj45_double":
    case "fiber":
    case "phone":
      return "Cat.6A / LWL";
    case "outlet_cee":
      return "NYM-J 5×2,5";
    default:
      return "NYM-J 3×1,5";
  }
}

/** Typischer LS je Verbrauchergruppe */
export function suggestBreaker(kind: SymbolKind): string {
  switch (kind) {
    case "stove_outlet":
      return "B16 3P";
    case "ev_charger":
    case "heat_pump":
      return "C20 3P";
    case "water_heater":
    case "washing_machine":
    case "dryer":
    case "dishwasher":
    case "outlet_cee":
      return "B16";
    case "ceiling_outlet":
    case "wall_outlet":
    case "recessed_spot":
    case "light_led_strip":
    case "light_pendant":
    case "light_wall_sconce":
    case "light_outdoor":
    case "light_garden":
    case "emergency_light":
      return "B10";
    default:
      return "B16";
  }
}

export function suggestRcdGroup(kind: SymbolKind): string {
  if (
    kind === "outlet_wet" ||
    kind === "outlet_outdoor" ||
    kind === "washing_machine" ||
    kind === "dryer" ||
    kind === "dishwasher"
  ) {
    return "FI Bad";
  }
  const cat = getSymbolDef(kind).category;
  if (cat === "light" || cat === "switch") return "FI1";
  if (cat === "outlet" || cat === "appliance") return "FI2";
  if (cat === "data" || cat === "av" || cat === "control") return "FI3";
  return "FI1";
}

/** Existierende Werte für Datalist */
export function collectCircuitOptions(
  symbols: PlanSymbol[],
  field: "circuitId" | "rcdGroup" | "cableType" | "breakerRating"
): string[] {
  const set = new Set<string>();
  for (const s of symbols) {
    const v = s[field]?.trim();
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "de", { numeric: true }));
}

/**
 * Nächster freier Kreis: F1.1, F1.2 … oder FI1.1 wenn rcd gesetzt.
 * Pattern: Prefix + Nummer
 */
export function suggestNextCircuitId(
  symbols: PlanSymbol[],
  opts?: { rcdGroup?: string; panelId?: string }
): string {
  const rcd = opts?.rcdGroup?.trim();
  const prefix = rcd
    ? rcd.replace(/^FI\s*/i, "F").replace(/[^A-Za-z0-9]/g, "") || "F1"
    : "F1";
  const base = prefix.match(/F\d+/i)?.[0]?.toUpperCase() ?? "F1";

  const used = new Set<string>();
  for (const s of symbols) {
    if (opts?.panelId && s.panelId && s.panelId !== opts.panelId) continue;
    const id = s.circuitId?.trim();
    if (id) used.add(id.toUpperCase());
  }

  for (let i = 1; i <= 99; i++) {
    const candidate = `${base}.${i}`;
    if (!used.has(candidate.toUpperCase())) return candidate;
  }
  return `${base}.${used.size + 1}`;
}

/** Häufigster Wert in einer Gerätegruppe */
export function majorityField(
  devices: PlanSymbol[],
  field: "cableType" | "breakerRating" | "rcdGroup"
): string | undefined {
  const counts = new Map<string, number>();
  for (const d of devices) {
    const v = d[field]?.trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | undefined;
  let n = 0;
  for (const [k, c] of counts) {
    if (c > n) {
      n = c;
      best = k;
    }
  }
  return best;
}

export const CABLE_PRESETS = [
  "NYM-J 3×1,5",
  "NYM-J 3×2,5",
  "NYM-J 5×1,5",
  "NYM-J 5×2,5",
  "NYM-J 5×4",
  "NYY-J 5×16",
  "Cat.6A / LWL",
];

export const BREAKER_PRESETS = [
  "B10",
  "B16",
  "B20",
  "C16",
  "C20",
  "B16 3P",
  "C20 3P",
];

export const RCD_PRESETS = ["FI1", "FI2", "FI3", "FI4", "FI Bad", "FI Küche"];
