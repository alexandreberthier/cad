"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/projectStore";

/** Summe der gezeichneten Verbindungslinien (Luftlinie ×1,15) */
export function WireSummary() {
  const connections = useProjectStore((s) => s.connections);
  const symbols = useProjectStore((s) => s.symbols);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const setTool = useProjectStore((s) => s.setTool);

  const floorWires = useMemo(
    () => connections.filter((c) => c.floorId === activeFloorId),
    [connections, activeFloorId]
  );

  const totalM = floorWires.reduce(
    (n, c) => n + (c.estimatedLengthM ?? 0),
    0
  );

  if (!floorWires.length) return null;

  const byCable = new Map<string, { m: number; n: number }>();
  for (const c of floorWires) {
    const a = symbols.find((s) => s.id === c.fromSymbolId);
    const b = symbols.find((s) => s.id === c.toSymbolId);
    const cable =
      a?.cableType?.trim() &&
      a.cableType.trim() === b?.cableType?.trim()
        ? a.cableType.trim()
        : "gemischt / offen";
    const cur = byCable.get(cable) ?? { m: 0, n: 0 };
    cur.m += c.estimatedLengthM ?? 0;
    cur.n += 1;
    byCable.set(cable, cur);
  }

  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Leitungen
        </h3>
        <span className="text-[10px] text-muted">
          {floorWires.length} · ca. {totalM.toFixed(1)} m
        </span>
      </div>
      <p className="mb-1.5 text-[10px] leading-snug text-muted">
        Länge = Luftlinie ×1,15 (Praxis-Zuschlag). Tippen markiert die Linie.
      </p>
      <ul className="space-y-0.5 text-xs">
        {[...byCable.entries()]
          .sort((a, b) => b[1].m - a[1].m)
          .map(([cable, { m, n }]) => (
            <li key={cable}>
              <button
                type="button"
                className="flex w-full items-baseline gap-2 rounded px-1 py-0.5 text-left hover:bg-surface"
                onClick={() => {
                  const ids = floorWires
                    .filter((c) => {
                      const a = symbols.find((s) => s.id === c.fromSymbolId);
                      const b = symbols.find((s) => s.id === c.toSymbolId);
                      const key =
                        a?.cableType?.trim() &&
                        a.cableType.trim() === b?.cableType?.trim()
                          ? a.cableType.trim()
                          : "gemischt / offen";
                      return key === cable;
                    })
                    .map((c) => c.id);
                  setTool("select");
                  setSelectedIds(ids);
                }}
              >
                <span className="w-10 shrink-0 text-right font-semibold tabular-nums">
                  {m.toFixed(1)}
                </span>
                <span className="min-w-0 flex-1 truncate">{cable}</span>
                <span className="shrink-0 text-[10px] text-muted">{n}×</span>
              </button>
            </li>
          ))}
      </ul>
    </section>
  );
}
