import type { PlanSymbol } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { electricalSymbols } from "@/lib/bom";
import { isPanelSymbol } from "@/lib/circuits";

export type HealthLevel = "info" | "warn" | "ok";

export interface HealthIssue {
  id: string;
  level: HealthLevel;
  title: string;
  detail?: string;
  symbolIds?: string[];
}

/** Praxis-Checks für Wohnungsinstallation (kein Ersatz für Normenprüfung) */
export function analyzePlanHealth(
  symbols: PlanSymbol[],
  opts?: { metersPerPixel?: number | null; hasBackground?: boolean }
): HealthIssue[] {
  const issues: HealthIssue[] = [];
  if (opts?.hasBackground && (opts.metersPerPixel == null || opts.metersPerPixel <= 0)) {
    issues.push({
      id: "no-scale",
      level: "warn",
      title: "Maßstab fehlt",
      detail: "Zwei Punkte auf bekannte Länge → Meter eingeben.",
    });
  }
  const devices = electricalSymbols(symbols).filter((s) => !isPanelSymbol(s));
  const panels = symbols.filter(isPanelSymbol);

  if (!devices.length) {
    return [
      {
        id: "empty",
        level: "info",
        title: "Noch keine Elektro-Symbole",
        detail: "Steckdosen, Schalter und UV platzieren.",
      },
    ];
  }

  if (!panels.length) {
    issues.push({
      id: "no-panel",
      level: "warn",
      title: "Keine UV/HV im Plan",
      detail: "Unterverteilung platzieren – sonst fehlt die Verteilerstruktur.",
    });
  }

  const needsCircuit = (s: PlanSymbol) => {
    const cat = getSymbolDef(s.kind).category;
    if (cat === "safety" && s.kind !== "alarm_siren") return false;
    return true;
  };

  const noCircuit = devices.filter(
    (s) => needsCircuit(s) && !s.circuitId?.trim()
  );
  if (noCircuit.length) {
    issues.push({
      id: "no-circuit",
      level: "warn",
      title: `${noCircuit.length} Gerät(e) ohne Stromkreis`,
      detail: "Auswahl → „Auto F…“ oder Mehrfachzuordnung.",
      symbolIds: noCircuit.map((s) => s.id),
    });
  }

  const noRcd = devices.filter(
    (s) => needsCircuit(s) && !s.rcdGroup?.trim()
  );
  if (noRcd.length) {
    issues.push({
      id: "no-rcd",
      level: "warn",
      title: `${noRcd.length} ohne FI-Gruppe`,
      detail: "Steckdosen- und Lichtkreise brauchen FI-Zuordnung (Praxis).",
      symbolIds: noRcd.map((s) => s.id),
    });
  }

  const noCable = devices.filter((s) => !s.cableType?.trim());
  if (noCable.length >= 3) {
    issues.push({
      id: "no-cable",
      level: "info",
      title: `${noCable.length} ohne Leitungstyp`,
      detail: "NYM-Querschnitt hilft bei Stückliste und Bestellung.",
      symbolIds: noCable.map((s) => s.id),
    });
  }

  const byCircuit = new Map<string, PlanSymbol[]>();
  for (const d of devices) {
    const c = d.circuitId?.trim();
    if (!c) continue;
    const list = byCircuit.get(c) ?? [];
    list.push(d);
    byCircuit.set(c, list);
  }
  for (const [cid, list] of byCircuit) {
    const outlets = list.filter(
      (s) => getSymbolDef(s.kind).category === "outlet"
    );
    if (outlets.length >= 8) {
      issues.push({
        id: `busy-${cid}`,
        level: "warn",
        title: `Kreis ${cid}: ${outlets.length} Steckdosen`,
        detail: "Prüfen, ob Aufteilung auf weitere Kreise sinnvoll ist.",
        symbolIds: outlets.map((s) => s.id),
      });
    }
  }

  const wet = devices.filter((s) => {
    const k = s.kind;
    return (
      k === "outlet_wet" ||
      k === "outlet_outdoor" ||
      k === "washing_machine" ||
      k === "dryer" ||
      k === "dishwasher"
    );
  });
  const wetNoRcd = wet.filter((s) => !s.rcdGroup?.trim());
  if (wetNoRcd.length) {
    issues.push({
      id: "wet-no-rcd",
      level: "warn",
      title: `${wetNoRcd.length} Feucht-/Nassgerät(e) ohne FI`,
      detail: "WM, TR, Feuchtraum- und Außen-SD sollten einer FI-Gruppe zugeordnet sein.",
      symbolIds: wetNoRcd.map((s) => s.id),
    });
  }

  const stove = devices.filter((s) => s.kind === "stove_outlet");
  const stoveWeak = stove.filter(
    (s) =>
      !s.breakerRating?.includes("3P") &&
      !s.cableType?.includes("5×")
  );
  if (stoveWeak.length) {
    issues.push({
      id: "stove-wiring",
      level: "info",
      title: "Herdanschluss prüfen",
      detail: "Typisch B16 3P und NYM-J 5×2,5 (je nach Herd/Herdplatte).",
      symbolIds: stoveWeak.map((s) => s.id),
    });
  }

  if (!issues.length) {
    issues.push({
      id: "ok",
      level: "ok",
      title: "Zuordnung wirkt vollständig",
      detail: `${devices.length} Geräte · ${panels.length} Verteiler · ${byCircuit.size} Kreise`,
    });
  }

  return issues;
}
