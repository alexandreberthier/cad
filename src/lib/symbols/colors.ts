import type { PlanSymbol, SymbolKind } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";

/** DIN-Druck: Installationspläne werden üblicherweise schwarz geplottet */
export const PRINT_BLACK = "#1a2332";

/** Schnellwahl – typische CAD-Layer-Farben (keine DIN-Pflichtfarben) */
export const COLOR_PRESETS = [
  "#1a2332",
  "#1d4ed8",
  "#c2410c",
  "#ca8a04",
  "#15803d",
  "#7c3aed",
  "#0891b2",
  "#be123c",
  "#dc2626",
  "#475569",
  "#0369a1",
  "#b91c1c",
] as const;

/**
 * Auflösung der Symbolfarbe:
 * 1) Einzel-Override am Symbol
 * 2) Projekt-Default für diese Art
 * 3) Katalog-Default
 * Optional: printBlack → alles schwarz (Norm-Druck-Vorschau)
 */
export function resolveSymbolColor(
  kind: SymbolKind,
  opts?: {
    symbolColor?: string | null;
    projectDefaults?: Partial<Record<SymbolKind, string>>;
    printBlack?: boolean;
  }
): string {
  if (opts?.printBlack) return PRINT_BLACK;
  if (opts?.symbolColor) return opts.symbolColor;
  if (opts?.projectDefaults?.[kind]) return opts.projectDefaults[kind]!;
  return getSymbolDef(kind).color;
}

export function resolvePlanSymbolColor(
  symbol: PlanSymbol,
  projectDefaults: Partial<Record<SymbolKind, string>>,
  printBlack: boolean
): string {
  return resolveSymbolColor(symbol.kind, {
    symbolColor: symbol.color,
    projectDefaults,
    printBlack,
  });
}
