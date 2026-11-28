"use client";

import { useFeedbackStore } from "@/store/feedbackStore";

const ROWS: { keys: string; action: string }[] = [
  { keys: "V", action: "Auswahl" },
  { keys: "W", action: "Wand zeichnen" },
  { keys: "R", action: "Raum zeichnen" },
  { keys: "T / F", action: "Tür / Fenster" },
  { keys: "M", action: "Maßstab" },
  { keys: "C", action: "Zuordnung (Leitung)" },
  { keys: "Q / E", action: "Drehen (15° · Shift = 90°)" },
  { keys: "Shift", action: "Freier Winkel / Mehrfach-Rechteck" },
  { keys: "Leertaste", action: "Plan verschieben (halten)" },
  { keys: "0 / Home", action: "Plan einpassen (Zoom auf alles)" },
  { keys: "Shift+0", action: "Auswahl einpassen" },
  { keys: "Maßstab", action: "2 Punkte → Dialog mit Länge in m" },
  { keys: "Strg+Shift+F", action: "Fehlende Kreise/FI automatisch" },
  { keys: "2 Finger", action: "Zoom + Pan (Touch / iPad)" },
  { keys: "Langdruck", action: "Mehrfach-Rechteck (Touch)" },
  { keys: "Strg+Klick", action: "Mehrfachauswahl ergänzen" },
  { keys: "Strg+C / V / D", action: "Kopieren / Einfügen / Duplizieren" },
  { keys: "Strg+Z / Y", action: "Rückgängig / Wiederholen" },
  { keys: "Entf", action: "Auswahl löschen" },
  { keys: "Esc", action: "Zeichnung abbrechen / Auswahl leeren" },
  { keys: "Plan-Check", action: "Hinweis antippen → Geräte markieren + Zoom" },
  { keys: "?", action: "Diese Hilfe" },
];

export function ShortcutsHelp() {
  const open = useFeedbackStore((s) => s.helpOpen);
  const setHelpOpen = useFeedbackStore((s) => s.setHelpOpen);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4"
      onClick={() => setHelpOpen(false)}
      role="dialog"
      aria-modal
      aria-label="Tastenkürzel"
    >
      <div
        className="w-full max-w-md rounded-xl border border-line bg-panel p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
            Tastenkürzel
          </h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-surface hover:text-ink"
            onClick={() => setHelpOpen(false)}
          >
            Schließen
          </button>
        </div>
        <ul className="max-h-[min(60vh,420px)] space-y-1.5 overflow-y-auto text-sm">
          {ROWS.map((row) => (
            <li
              key={row.keys}
              className="flex items-baseline justify-between gap-3 border-b border-line/70 py-1.5 last:border-0"
            >
              <kbd className="shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink">
                {row.keys}
              </kbd>
              <span className="text-right text-muted">{row.action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
