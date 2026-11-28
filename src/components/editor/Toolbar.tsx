"use client";

import { useRef, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import type { SymbolCategory, SymbolKind, Tool } from "@/types/project";
import {
  CATEGORY_LABELS,
  SYMBOL_CATALOG,
} from "@/lib/symbols/catalog";
import { resolveSymbolColor } from "@/lib/symbols/colors";
import { loadBackgroundFile } from "@/lib/background";
import { useFeedbackStore } from "@/store/feedbackStore";
import { SymbolGlyph } from "@/components/symbols/SymbolGlyph";
import {
  IconCalibrate,
  IconDoor,
  IconRoom,
  IconSelect,
  IconWall,
  IconWindow,
  IconWire,
} from "@/components/icons/ToolIcons";

const TOOLS: {
  id: Tool;
  label: string;
  tip: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "select",
    label: "Auswahl",
    tip: "Tippen = wählen · Objekt ziehen = verschieben · Leer ziehen = Plan · Shift/Langdruck = Mehrfach (V)",
    Icon: IconSelect,
  },
  {
    id: "wall",
    label: "Wand",
    tip: "Wandkette zeichnen (W) · Shift = freier Winkel",
    Icon: IconWall,
  },
  {
    id: "door",
    label: "Tür",
    tip: "Tür auf eine Wand setzen (T)",
    Icon: IconDoor,
  },
  {
    id: "window",
    label: "Fenster",
    tip: "Fenster auf eine Wand setzen (F)",
    Icon: IconWindow,
  },
  {
    id: "room",
    label: "Raum",
    tip: "Raum umfahren (R) · Enter / Doppelklick schließen",
    Icon: IconRoom,
  },
  {
    id: "calibrate",
    label: "Maßstab",
    tip: "Zwei Punkte auf bekannter Strecke → echte Länge in Metern",
    Icon: IconCalibrate,
  },
  {
    id: "connection",
    label: "Zuordnung",
    tip: "1. Symbol klicken, dann 2. Symbol (z. B. Schalter → Lampe)",
    Icon: IconWire,
  },
];

/** Reihenfolge wie in CAD-Symbolbibliotheken */
const CATEGORY_ORDER: SymbolCategory[] = [
  "outlet",
  "switch",
  "light",
  "data",
  "av",
  "control",
  "safety",
  "panel",
  "appliance",
  "sanitary",
  "furniture",
];

export function Toolbar() {
  const tool = useProjectStore((s) => s.ui.tool);
  const mode = useProjectStore((s) => s.ui.mode);
  const selectedKind = useProjectStore((s) => s.ui.selectedSymbolKind);
  const recentKinds = useProjectStore((s) => s.ui.recentSymbolKinds ?? []);
  const setTool = useProjectStore((s) => s.setTool);
  const setSelectedSymbolKind = useProjectStore((s) => s.setSelectedSymbolKind);
  const setBackground = useProjectStore((s) => s.setBackground);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const hasBackground = useProjectStore((s) =>
    Boolean(s.floors.find((f) => f.id === s.activeFloorId)?.background)
  );
  const symbolColorDefaults = useProjectStore((s) => s.symbolColorDefaults);
  const printBlackSymbols = useProjectStore((s) => s.ui.printBlackSymbols);
  const fileRef = useRef<HTMLInputElement>(null);
  /** null = Kategorie-Liste, sonst geöffnete Kategorie */
  const [openCat, setOpenCat] = useState<SymbolCategory | null>(null);
  const [query, setQuery] = useState("");

  const categories = CATEGORY_ORDER.filter((cat) =>
    SYMBOL_CATALOG.some((s) => s.category === cat)
  );

  const searchHits =
    query.trim().length >= 2
      ? SYMBOL_CATALOG.filter((s) => {
          const q = query.trim().toLowerCase();
          return (
            s.label.toLowerCase().includes(q) ||
            s.labelPro.toLowerCase().includes(q) ||
            s.kind.toLowerCase().includes(q) ||
            CATEGORY_LABELS[s.category].toLowerCase().includes(q)
          );
        }).slice(0, 24)
      : [];

  return (
    <aside className="flex w-[72px] shrink-0 flex-col border-r border-line bg-panel sm:w-[220px] lg:w-[240px]">
      <div className="border-b border-line p-1.5 sm:p-2">
        <div className="mb-1 hidden px-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted sm:block">
          Zeichnen
        </div>
        <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
          {TOOLS.map((t) => {
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                title={t.tip}
                onClick={() => {
                  if (t.id === "calibrate" && !hasBackground) {
                    useFeedbackStore
                      .getState()
                      .showToast("Zuerst Grundriss laden");
                    fileRef.current?.click();
                    return;
                  }
                  setTool(t.id);
                }}
                className={`flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[11px] font-semibold transition ${
                  active ? "bg-ink text-panel" : "text-ink hover:bg-surface"
                }`}
              >
                <t.Icon className="h-4 w-4 shrink-0" />
                <span className="hidden truncate sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden border-b border-line p-2 sm:block">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const bg = await loadBackgroundFile(file);
              setBackground(activeFloorId, bg);
              setTool("calibrate");
              useFeedbackStore
                .getState()
                .showToast("Grundriss geladen · 2 Punkte für Maßstab setzen");
            } catch {
              useFeedbackStore
                .getState()
                .showToast("Datei konnte nicht geladen werden");
            }
            e.target.value = "";
          }}
        />
        <button
          type="button"
          title="PDF/Bild laden, danach Maßstab mit 2 Punkten setzen"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-md border border-dashed border-line bg-surface px-2 py-1.5 text-[11px] font-semibold hover:border-accent"
        >
          Grundriss laden
        </button>
      </div>

      {/* Symbolbibliothek: Kategorien untereinander → Klick öffnet Vollansicht */}
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden sm:flex">
        <div className="border-b border-line px-2 py-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Symbolbibliothek
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="mt-1.5 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent"
          />
        </div>
        {searchHits.length > 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-3 gap-1.5">
              {searchHits.map((s) => {
                const active = selectedKind === s.kind && tool === "symbol";
                const label = mode === "pro" ? s.labelPro : s.label;
                return (
                  <button
                    key={s.kind}
                    type="button"
                    title={label}
                    onClick={() => {
                      setSelectedSymbolKind(s.kind as SymbolKind);
                      setQuery("");
                    }}
                    className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 transition ${
                      active
                        ? "border-accent bg-accent-soft ring-1 ring-accent"
                        : "border-line bg-surface hover:border-ink/25"
                    }`}
                  >
                    <SymbolGlyph
                      kind={s.kind}
                      size={32}
                      color={resolveSymbolColor(s.kind, {
                        projectDefaults: symbolColorDefaults,
                        printBlack: printBlackSymbols,
                      })}
                    />
                    <span className="line-clamp-2 w-full text-center text-[9px] font-medium leading-tight">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : openCat == null ? (
          <>
            {recentKinds.length > 0 && (
              <div className="border-b border-line px-2 py-1.5">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Zuletzt
                </div>
                <div className="flex flex-wrap gap-1">
                  {recentKinds.map((kind) => {
                    const def = SYMBOL_CATALOG.find((s) => s.kind === kind);
                    if (!def) return null;
                    const active = selectedKind === kind && tool === "symbol";
                    return (
                      <button
                        key={kind}
                        type="button"
                        title={mode === "pro" ? def.labelPro : def.label}
                        onClick={() => setSelectedSymbolKind(kind)}
                        className={`rounded-md border p-1 ${
                          active
                            ? "border-accent bg-accent-soft"
                            : "border-line bg-surface hover:border-ink/25"
                        }`}
                      >
                        <SymbolGlyph
                          kind={kind}
                          size={26}
                          color={resolveSymbolColor(kind, {
                            projectDefaults: symbolColorDefaults,
                            printBlack: printBlackSymbols,
                          })}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-1">
              {categories.map((cat) => {
                const count = SYMBOL_CATALOG.filter(
                  (s) => s.category === cat
                ).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setOpenCat(cat)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs font-semibold text-ink hover:bg-surface"
                  >
                    <span>{CATEGORY_LABELS[cat]}</span>
                    <span className="text-[10px] font-medium text-muted">
                      {count} ›
                    </span>
                  </button>
                );
              })}
              <p className="mt-2 px-2 text-[10px] leading-snug text-muted">
                Kategorie öffnen → Symbol wählen → auf den Plan klicken.
                Farben = Kategorie (gleich in 2D &amp; 3D). Esc beendet.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 border-b border-line px-1 py-1">
              <button
                type="button"
                onClick={() => setOpenCat(null)}
                className="rounded-md px-2 py-1.5 text-xs font-semibold text-muted hover:bg-surface hover:text-ink"
                title="Zurück zur Kategorie-Liste"
              >
                ‹ zurück
              </button>
              <div className="min-w-0 flex-1 truncate text-xs font-semibold">
                {CATEGORY_LABELS[openCat]}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-3 gap-1.5">
                {SYMBOL_CATALOG.filter((s) => s.category === openCat).map(
                  (s) => {
                    const active =
                      selectedKind === s.kind && tool === "symbol";
                    const label = mode === "pro" ? s.labelPro : s.label;
                    return (
                      <button
                        key={s.kind}
                        type="button"
                        title={
                          s.sizeM
                            ? `${label} · ${s.sizeM.w.toFixed(2)}×${s.sizeM.d.toFixed(2)} m · H ${Math.round(s.sizeM.h * 100)} cm`
                            : `${label} · Einbauhöhe ${Math.round(s.defaultHeight * 100)} cm · Klick zum Platzieren`
                        }
                        onClick={() =>
                          setSelectedSymbolKind(s.kind as SymbolKind)
                        }
                        className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 transition ${
                          active
                            ? "border-accent bg-accent-soft ring-1 ring-accent"
                            : "border-line bg-surface hover:border-ink/25"
                        }`}
                      >
                        <SymbolGlyph
                          kind={s.kind}
                          size={32}
                          color={resolveSymbolColor(s.kind, {
                            projectDefaults: symbolColorDefaults,
                            printBlack: printBlackSymbols,
                          })}
                        />
                        <span className="line-clamp-2 w-full text-center text-[9px] font-medium leading-tight">
                          {label}
                        </span>
                        {s.sizeM && (
                          <span className="text-[8px] tabular-nums text-muted">
                            {s.sizeM.w.toFixed(1)}×{s.sizeM.d.toFixed(1)} m
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
