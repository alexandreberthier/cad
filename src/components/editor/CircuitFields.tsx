"use client";

import { useMemo, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import type { PlanSymbol } from "@/types/project";
import {
  BREAKER_PRESETS,
  CABLE_PRESETS,
  RCD_PRESETS,
  collectCircuitOptions,
  isPanelSymbol,
  suggestNextCircuitId,
} from "@/lib/circuits";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { useFeedbackStore } from "@/store/feedbackStore";

/** Mehrfachauswahl → gemeinsamen Kreis/FI setzen */
export function BulkCircuitAssign() {
  const assignSelectedCircuit = useProjectStore((s) => s.assignSelectedCircuit);
  const symbols = useProjectStore((s) => s.symbols);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const showToast = useFeedbackStore((s) => s.showToast);
  const [circuitId, setCircuitId] = useState("");
  const [rcdGroup, setRcdGroup] = useState("");
  const [breakerRating, setBreakerRating] = useState("");
  const [cableType, setCableType] = useState("");
  const floorSymbols = useMemo(
    () => symbols.filter((s) => s.floorId === activeFloorId),
    [symbols, activeFloorId]
  );
  const nextId = suggestNextCircuitId(floorSymbols);

  return (
    <div className="mt-2 space-y-1.5 rounded-md border border-line bg-surface/70 p-2">
      <input
        className="w-full rounded border border-line bg-panel px-2 py-1 text-xs"
        placeholder={`Stromkreis (${nextId})`}
        value={circuitId}
        onChange={(e) => setCircuitId(e.target.value)}
        list="bulk-circuit-opts"
      />
      <datalist id="bulk-circuit-opts">
        {collectCircuitOptions(floorSymbols, "circuitId").map((c) => (
          <option key={c} value={c} />
        ))}
        <option value={nextId} />
      </datalist>
      <input
        className="w-full rounded border border-line bg-panel px-2 py-1 text-xs"
        placeholder="FI-Gruppe (FI1)"
        value={rcdGroup}
        onChange={(e) => setRcdGroup(e.target.value)}
        list="bulk-rcd-opts"
      />
      <datalist id="bulk-rcd-opts">
        {RCD_PRESETS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="grid grid-cols-2 gap-1.5">
        <input
          className="w-full rounded border border-line bg-panel px-2 py-1 text-xs"
          placeholder="LS (B16)"
          value={breakerRating}
          onChange={(e) => setBreakerRating(e.target.value)}
          list="bulk-ls-opts"
        />
        <input
          className="w-full rounded border border-line bg-panel px-2 py-1 text-xs"
          placeholder="Leitung"
          value={cableType}
          onChange={(e) => setCableType(e.target.value)}
          list="bulk-cable-opts"
        />
      </div>
      <datalist id="bulk-ls-opts">
        {BREAKER_PRESETS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="bulk-cable-opts">
        {CABLE_PRESETS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <button
        type="button"
        className="w-full rounded-md bg-ink px-2 py-1.5 text-[11px] font-semibold text-panel"
        onClick={() => {
          const patch: {
            circuitId?: string;
            rcdGroup?: string;
            breakerRating?: string;
            cableType?: string;
          } = {};
          if (circuitId.trim()) patch.circuitId = circuitId.trim();
          else patch.circuitId = nextId;
          if (rcdGroup.trim()) patch.rcdGroup = rcdGroup.trim();
          if (breakerRating.trim()) patch.breakerRating = breakerRating.trim();
          if (cableType.trim()) patch.cableType = cableType.trim();
          assignSelectedCircuit(patch);
          showToast(`Zuordnung gesetzt (${patch.circuitId})`);
        }}
      >
        Auf Auswahl anwenden
      </button>
    </div>
  );
}

/** Profi-Zuordnung: Stromkreis / FI / LS / Leitung mit Vorschlägen */
export function CircuitFields({ symbol }: { symbol: PlanSymbol }) {
  const symbols = useProjectStore((s) => s.symbols);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const updateSymbol = useProjectStore((s) => s.updateSymbol);
  const applyCircuitSuggestions = useProjectStore(
    (s) => s.applyCircuitSuggestions
  );
  const floorSymbols = useMemo(
    () => symbols.filter((s) => s.floorId === activeFloorId),
    [symbols, activeFloorId]
  );

  if (isPanelSymbol(symbol)) return null;
  const def = getSymbolDef(symbol.kind);
  if (
    def.isFurniture ||
    def.category === "sanitary" ||
    (def.category === "safety" && symbol.kind !== "alarm_siren")
  ) {
    return null;
  }

  const panels = floorSymbols.filter(
    (s) => isPanelSymbol(s) && s.id !== symbol.id
  );
  const circuitOpts = collectCircuitOptions(floorSymbols, "circuitId");
  const rcdOpts = [
    ...new Set([
      ...RCD_PRESETS,
      ...collectCircuitOptions(floorSymbols, "rcdGroup"),
    ]),
  ];
  const cableOpts = [
    ...new Set([
      ...CABLE_PRESETS,
      ...collectCircuitOptions(floorSymbols, "cableType"),
    ]),
  ];
  const breakerOpts = [
    ...new Set([
      ...BREAKER_PRESETS,
      ...collectCircuitOptions(floorSymbols, "breakerRating"),
    ]),
  ];

  const nextId = suggestNextCircuitId(floorSymbols, {
    rcdGroup: symbol.rcdGroup,
    panelId: symbol.panelId,
  });

  return (
    <div className="mt-2 space-y-2 rounded-md border border-line bg-surface/60 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          Stromkreis / FI / LS
        </span>
        <button
          type="button"
          className="rounded bg-ink px-2 py-1 text-[10px] font-semibold text-panel"
          title="Nächsten freien Kreis + typische FI/LS/Kabel setzen"
          onClick={() => {
            applyCircuitSuggestions(symbol.id);
            useFeedbackStore
              .getState()
              .showToast(`Zuordnung: ${nextId}`);
          }}
        >
          Auto {nextId}
        </button>
      </div>

      {panels.length > 0 && (
        <label className="block text-xs font-medium">
          Verteiler
          <select
            value={symbol.panelId ?? ""}
            onChange={(e) =>
              updateSymbol(symbol.id, {
                panelId: e.target.value || undefined,
              })
            }
            className="mt-1 w-full rounded-md border border-line bg-panel px-2 py-1.5"
          >
            <option value="">
              {panels.length === 1
                ? "automatisch (einzige UV/HV)"
                : "nicht zugeordnet"}
            </option>
            {panels.map((p, i) => (
              <option key={p.id} value={p.id}>
                {p.label ||
                  (p.kind === "main_panel"
                    ? `HV ${i + 1}`
                    : p.kind === "meter_cabinet"
                      ? `Zähler ${i + 1}`
                      : `UV ${i + 1}`)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-xs font-medium">
        Stromkreis
        <input
          list="circuit-id-options"
          value={symbol.circuitId ?? ""}
          placeholder={nextId}
          onChange={(e) =>
            updateSymbol(symbol.id, { circuitId: e.target.value })
          }
          className="mt-1 w-full rounded-md border border-line bg-panel px-2 py-1.5"
        />
        <datalist id="circuit-id-options">
          {circuitOpts.map((c) => (
            <option key={c} value={c} />
          ))}
          <option value={nextId} />
        </datalist>
      </label>

      <label className="block text-xs font-medium">
        FI-Gruppe
        <input
          list="rcd-options"
          value={symbol.rcdGroup ?? ""}
          placeholder="FI1"
          onChange={(e) =>
            updateSymbol(symbol.id, { rcdGroup: e.target.value })
          }
          className="mt-1 w-full rounded-md border border-line bg-panel px-2 py-1.5"
        />
        <datalist id="rcd-options">
          {rcdOpts.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-medium">
          LS
          <input
            list="breaker-options"
            value={symbol.breakerRating ?? ""}
            placeholder="B16"
            onChange={(e) =>
              updateSymbol(symbol.id, { breakerRating: e.target.value })
            }
            className="mt-1 w-full rounded-md border border-line bg-panel px-2 py-1.5"
          />
          <datalist id="breaker-options">
            {breakerOpts.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="block text-xs font-medium">
          Leitung
          <input
            list="cable-options"
            value={symbol.cableType ?? ""}
            placeholder="NYM-J 3×1,5"
            onChange={(e) =>
              updateSymbol(symbol.id, { cableType: e.target.value })
            }
            className="mt-1 w-full rounded-md border border-line bg-panel px-2 py-1.5"
          />
          <datalist id="cable-options">
            {cableOpts.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>
    </div>
  );
}
