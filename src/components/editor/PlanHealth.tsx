"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/projectStore";
import { analyzePlanHealth } from "@/lib/planHealth";
import { useFeedbackStore } from "@/store/feedbackStore";

export function PlanHealth() {
  const symbols = useProjectStore((s) => s.symbols);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const floors = useProjectStore((s) => s.floors);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const setTool = useProjectStore((s) => s.setTool);
  const applyMissing = useProjectStore((s) => s.applyMissingCircuitSuggestions);
  const showToast = useFeedbackStore((s) => s.showToast);
  const floor = floors.find((f) => f.id === activeFloorId);

  const issues = useMemo(
    () =>
      analyzePlanHealth(symbols.filter((s) => s.floorId === activeFloorId), {
        hasBackground: Boolean(floor?.background),
        metersPerPixel: floor?.background?.metersPerPixel,
      }),
    [symbols, activeFloorId, floor?.background]
  );

  const hasGaps = issues.some(
    (i) =>
      i.id === "no-circuit" ||
      i.id === "no-rcd" ||
      i.id === "wet-no-rcd" ||
      i.id === "no-scale"
  );

  const tone = (level: string) => {
    if (level === "warn") return "border-accent/40 bg-accent-soft text-accent-ink";
    if (level === "ok") return "border-ok/30 bg-ok/10 text-ok";
    return "border-line bg-surface text-muted";
  };

  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Plan-Check
        </h3>
        {hasGaps && (
          <button
            type="button"
            className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-panel"
            onClick={() => {
              if (issues.some((i) => i.id === "no-scale")) {
                setTool("calibrate");
                showToast("Maßstab: 2 Punkte auf bekannte Länge");
                return;
              }
              const n = applyMissing();
              showToast(
                n ? `${n} Gerät(e) automatisch zugeordnet` : "Nichts offenes"
              );
            }}
          >
            {issues.some((i) => i.id === "no-scale") ? "Maßstab…" : "Auto F…"}
          </button>
        )}
      </div>
      {issues.map((issue) => (
        <button
          key={issue.id}
          type="button"
          className={`block w-full rounded-md border px-2 py-1.5 text-left ${tone(issue.level)}`}
          onClick={() => {
            if (issue.symbolIds?.length) {
              setTool("select");
              setSelectedIds(issue.symbolIds);
              queueMicrotask(() => {
                window.dispatchEvent(
                  new CustomEvent("elektrocad:fit-selection")
                );
              });
            }
          }}
        >
          <div className="text-[11px] font-semibold">{issue.title}</div>
          {issue.detail && (
            <div className="mt-0.5 text-[10px] leading-snug opacity-90">
              {issue.detail}
              {issue.symbolIds?.length
                ? " · Tippen markiert die Geräte"
                : ""}
            </div>
          )}
        </button>
      ))}
    </section>
  );
}
