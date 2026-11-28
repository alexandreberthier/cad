"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { dist } from "@/lib/geometry/math";
import { useFeedbackStore } from "@/store/feedbackStore";

const PRESETS = [1, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];

/** Modal direkt nach dem zweiten Messpunkt – Länge eingeben ohne rechte Sidebar */
export function CalibrationModal() {
  const floor = useProjectStore((s) => s.getActiveFloor());
  const finishCalibration = useProjectStore((s) => s.finishCalibration);
  const clearCalibration = useProjectStore((s) => s.clearCalibration);
  const setTool = useProjectStore((s) => s.setTool);
  const showToast = useFeedbackStore((s) => s.showToast);
  const cal = floor?.background?.calibration;
  const ready = Boolean(cal?.pointA && cal?.pointB);
  const [length, setLength] = useState("5");
  const inputRef = useRef<HTMLInputElement>(null);

  const px =
    ready && cal?.pointA && cal?.pointB
      ? dist(cal.pointA, cal.pointB)
      : 0;

  const meters = Number(String(length).replace(",", "."));
  const preview = useMemo(() => {
    if (!px || !Number.isFinite(meters) || meters <= 0) return null;
    const mpp = meters / px;
    return {
      cmPerPx: mpp * 100,
      pxPerM: 1 / mpp,
    };
  }, [meters, px]);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => inputRef.current?.select(), 50);
    return () => clearTimeout(t);
  }, [ready, px]);

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        clearCalibration();
        setTool("calibrate");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, clearCalibration, setTool]);

  if (!ready || !floor?.background) return null;

  const apply = (andDrawWall = false) => {
    const n = Number(String(length).replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      showToast("Bitte eine Länge in Metern eingeben");
      return;
    }
    finishCalibration(n);
    showToast(
      andDrawWall
        ? `Maßstab ok · jetzt Wand zeichnen`
        : `Maßstab gesetzt · ${n} m ≈ ${Math.round(px)} px`
    );
    if (andDrawWall) setTool("wall");
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-ink/25 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
      role="dialog"
      aria-modal
      aria-label="Maßstab setzen"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-4 shadow-2xl">
        <div className="mb-1 text-sm font-semibold text-ink">
          Reale Länge der Messstrecke
        </div>
        <p className="mb-3 text-[12px] leading-snug text-muted">
          Orangene Linie = Messstrecke (
          <strong>{Math.round(px)} Pixel</strong>
          ). Wie viele Meter ist das in Wirklichkeit?
        </p>

        <label className="block text-xs font-medium">
          Länge in Metern
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply(true);
              }
            }}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base font-semibold tabular-nums"
            autoFocus
          />
        </label>

        {preview && (
          <p className="mt-1.5 text-[11px] tabular-nums text-muted">
            ≈ {preview.cmPerPx.toFixed(2)} cm/px ·{" "}
            {preview.pxPerM.toFixed(0)} px pro Meter
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              className={`min-h-9 rounded-md border px-2.5 py-1.5 text-[12px] font-semibold ${
                Number(length) === m
                  ? "border-ink bg-ink text-panel"
                  : "border-line bg-surface hover:border-ink/30"
              }`}
              onClick={() => setLength(String(m))}
            >
              {m} m
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => apply(true)}
            className="flex-1 rounded-lg bg-ink px-3 py-2.5 text-sm font-semibold text-panel"
          >
            Übernehmen & Wand zeichnen
          </button>
          <button
            type="button"
            onClick={() => apply(false)}
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-semibold"
          >
            Nur Maßstab
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            clearCalibration();
            setTool("calibrate");
          }}
          className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-ink"
        >
          Neu messen
        </button>
        <p className="mt-1 text-[10px] leading-snug text-muted">
          Enter = übernehmen & Wand · Esc = neu messen
        </p>
      </div>
    </div>
  );
}
