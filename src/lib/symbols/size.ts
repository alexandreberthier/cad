import type { SymbolKind } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";

export type Size3 = { w: number; d: number; h: number };

/** Effektive Maße: Symbol-Override > Katalog. null = nur Icon (kein Fußabdruck). */
export function resolveSymbolSize(
  kind: SymbolKind,
  override?: Partial<Size3> | null
): Size3 | null {
  const base = getSymbolDef(kind).sizeM;
  if (!base) {
    if (!override?.w && !override?.d && !override?.h) return null;
    return {
      w: clamp(override?.w ?? 0.5, 0.05, 12),
      d: clamp(override?.d ?? 0.5, 0.05, 12),
      h: clamp(override?.h ?? 0.5, 0.02, 4),
    };
  }
  return {
    w: clamp(override?.w ?? base.w, 0.05, 12),
    d: clamp(override?.d ?? base.d, 0.05, 12),
    h: clamp(override?.h ?? base.h, 0.02, 4),
  };
}

export function formatSize2(s: Size3): string {
  return `${s.w.toFixed(1)}×${s.d.toFixed(1)} m`;
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
