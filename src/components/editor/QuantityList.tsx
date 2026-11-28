"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/projectStore";
import { CATEGORY_LABELS } from "@/lib/symbols/catalog";
import { bomForSymbols } from "@/lib/bom";

export function QuantityList() {
  const symbols = useProjectStore((s) => s.symbols);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const mode = useProjectStore((s) => s.ui.mode);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const setTool = useProjectStore((s) => s.setTool);

  const rows = useMemo(
    () => bomForSymbols(symbols.filter((s) => s.floorId === activeFloorId)),
    [symbols, activeFloorId]
  );
  const total = rows.reduce((n, r) => n + r.count, 0);
  if (!rows.length) return null;

  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Stückzahlen
        </h3>
        <span className="text-[10px] text-muted">{total} gesamt</span>
      </div>
      <p className="mb-1.5 text-[10px] text-muted">Zeile tippen = alle auswählen</p>
      <ul className="space-y-0.5 text-xs">
        {rows.map((r) => (
          <li key={r.kind}>
            <button
              type="button"
              className="flex w-full items-baseline gap-2 rounded px-1 py-0.5 text-left hover:bg-surface"
              onClick={() => {
                const ids = symbols
                  .filter(
                    (s) => s.floorId === activeFloorId && s.kind === r.kind
                  )
                  .map((s) => s.id);
                setTool("select");
                setSelectedIds(ids);
                queueMicrotask(() => {
                  window.dispatchEvent(
                    new CustomEvent("elektrocad:fit-selection")
                  );
                });
              }}
            >
              <span className="w-6 shrink-0 text-right font-semibold tabular-nums">
                {r.count}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {mode === "pro" ? r.labelPro : r.label}
                {r.circuits.length > 0 && (
                  <span className="ml-1 text-[10px] font-normal text-muted">
                    {r.circuits.slice(0, 3).join(", ")}
                    {r.circuits.length > 3 ? "…" : ""}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[10px] text-muted">
                {CATEGORY_LABELS[r.category]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
