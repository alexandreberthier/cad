"use client";

import { useMemo, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { resolvePlanSymbolColor } from "@/lib/symbols/colors";
import { circuitForest, kindSummary } from "@/lib/bom";

/**
 * Baum wie in der Verteilung: UV → FI → Stromkreis → Geräte.
 * Eine einzelne UV bekommt alle Geräte; bei mehreren nur die mit Zuordnung.
 */
export function CircuitTree() {
  const symbols = useProjectStore((s) => s.symbols);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const defaults = useProjectStore((s) => s.symbolColorDefaults);
  const printBlack = useProjectStore((s) => s.ui.printBlackSymbols);
  const selectedIds = useProjectStore((s) => s.ui.selectedIds);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const mode = useProjectStore((s) => s.ui.mode);
  const pro = mode === "pro";
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const forest = useMemo(() => {
    return circuitForest(symbols.filter((s) => s.floorId === activeFloorId));
  }, [symbols, activeFloorId]);

  const isOpen = (key: string, fallback = true) => open[key] ?? fallback;

  if (forest.deviceCount === 0 && forest.panels.every((p) => !p.panel)) {
    return (
      <section>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Verteiler
        </h3>
        <p className="text-[10px] leading-snug text-muted">
          Noch leer. UV/HV platzieren, Geräte setzen, dann im Profi-Modus
          Stromkreis (z.&nbsp;B. F1.1), FI und Verteiler zuweisen – der Baum
          baut sich automatisch auf (UV → FI → Kreis → Gerät).
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Verteiler
        </h3>
        <span className="text-[10px] text-muted">{forest.deviceCount} Geräte</span>
      </div>
      <p className="mb-2 text-[10px] leading-snug text-muted">
        Struktur wie in der Praxis: UV → FI → Stromkreis → Verbraucher.
        Profi-Felder am Symbol: Verteiler, FI-Gruppe, Stromkreis, Leitungstyp
        (NYM…). Klick im Baum markiert die Geräte im Plan.
      </p>

      <ul className="max-h-72 space-y-1 overflow-y-auto text-xs">
        {forest.panels.map((panel) => {
          const pKey = panel.id;
          const pOpen = isOpen(pKey);
          return (
            <li key={pKey}>
              <button
                type="button"
                className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left font-semibold hover:bg-surface"
                onClick={() => {
                  setOpen((o) => ({ ...o, [pKey]: !pOpen }));
                  if (panel.panel) setSelectedIds([panel.panel.id]);
                }}
              >
                <span className="w-3 text-muted">{pOpen ? "▾" : "▸"}</span>
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: "#1e293b" }}
                />
                <span className="truncate">{panel.title}</span>
                <span className="ml-auto text-[10px] font-normal text-muted">
                  {panel.count}
                </span>
              </button>
              {pOpen && (
                <ul className="ml-3 border-l border-line pl-2">
                  {panel.rcds.map((rcd) => {
                    const rKey = `${pKey}:${rcd.id}`;
                    const rOpen = isOpen(rKey);
                    return (
                      <li key={rKey} className="mt-0.5">
                        <button
                          type="button"
                          className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-surface"
                          onClick={() => {
                            setOpen((o) => ({ ...o, [rKey]: !rOpen }));
                            setSelectedIds(
                              rcd.circuits.flatMap((c) =>
                                c.devices.map((d) => d.id)
                              )
                            );
                          }}
                        >
                          <span className="w-3 text-muted">
                            {rOpen ? "▾" : "▸"}
                          </span>
                          <span className="font-medium">{rcd.title}</span>
                          {rcd.rcdHint && (
                            <span className="text-[9px] text-muted">
                              {rcd.rcdHint}
                            </span>
                          )}
                          <span className="text-[10px] text-muted">
                            {rcd.count}
                          </span>
                        </button>
                        {rOpen && (
                          <ul className="ml-3 border-l border-line pl-2">
                            {rcd.circuits.map((c) => {
                              const cKey = `${rKey}:${c.id}`;
                              const cOpen = isOpen(cKey, c.devices.length <= 8);
                              return (
                                <li key={cKey} className="mt-0.5">
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-surface"
                                    onClick={() => {
                                      setOpen((o) => ({
                                        ...o,
                                        [cKey]: !cOpen,
                                      }));
                                      setSelectedIds(c.devices.map((d) => d.id));
                                      queueMicrotask(() => {
                                        window.dispatchEvent(
                                          new CustomEvent(
                                            "elektrocad:fit-selection"
                                          )
                                        );
                                      });
                                    }}
                                  >
                                    <span className="w-3 text-muted">
                                      {cOpen ? "▾" : "▸"}
                                    </span>
                                    <span className="font-medium">{c.title}</span>
                                    <span className="text-[10px] text-muted">
                                      {c.devices.length}
                                    </span>
                                  </button>
                                  {(c.breakerRating || c.cableType) && (
                                    <div className="px-4 text-[10px] font-medium text-ink/80">
                                      {[c.breakerRating, c.cableType]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </div>
                                  )}
                                  <div className="px-4 text-[10px] leading-snug text-muted">
                                    {kindSummary(c.devices, pro)}
                                  </div>
                                  {cOpen && (
                                    <ul className="ml-3 space-y-0.5 border-l border-line pl-2">
                                      {c.devices.map((d) => {
                                        const def = getSymbolDef(d.kind);
                                        const color = resolvePlanSymbolColor(
                                          d,
                                          defaults,
                                          printBlack
                                        );
                                        const active = selectedIds.includes(d.id);
                                        return (
                                          <li key={d.id}>
                                            <button
                                              type="button"
                                              className={`flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left ${
                                                active
                                                  ? "bg-accent-soft text-accent-ink"
                                                  : "hover:bg-surface"
                                              }`}
                                              onClick={() =>
                                                setSelectedIds([d.id])
                                              }
                                            >
                                              <span
                                                className="inline-block h-2 w-2 shrink-0 rounded-full"
                                                style={{ background: color }}
                                              />
                                              <span className="truncate">
                                                {d.label ||
                                                  (pro
                                                    ? def.labelPro
                                                    : def.label)}
                                              </span>
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
