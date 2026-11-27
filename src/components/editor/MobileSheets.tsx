"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import type { SymbolCategory, SymbolKind } from "@/types/project";
import {
  CATEGORY_LABELS,
  SYMBOL_CATALOG,
} from "@/lib/symbols/catalog";
import { resolveSymbolColor } from "@/lib/symbols/colors";
import { SymbolGlyph } from "@/components/symbols/SymbolGlyph";
import { PropertiesPanel } from "./PropertiesPanel";

type Sheet = "symbols" | "props" | null;

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

/** iPad/Phone: Symbole & Eigenschaften als Bottom-Sheets */
export function MobileSheets() {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [openCat, setOpenCat] = useState<SymbolCategory | null>(null);
  const tool = useProjectStore((s) => s.ui.tool);
  const mode = useProjectStore((s) => s.ui.mode);
  const selectedKind = useProjectStore((s) => s.ui.selectedSymbolKind);
  const selectedIds = useProjectStore((s) => s.ui.selectedIds);
  const setTool = useProjectStore((s) => s.setTool);
  const setSelectedSymbolKind = useProjectStore((s) => s.setSelectedSymbolKind);
  const symbolColorDefaults = useProjectStore((s) => s.symbolColorDefaults);
  const printBlackSymbols = useProjectStore((s) => s.ui.printBlackSymbols);

  // Bei Auswahl auf Tablet Eigenschaften öffnen
  useEffect(() => {
    if (selectedIds.length > 0 && window.matchMedia("(max-width: 767px)").matches) {
      setSheet("props");
    }
  }, [selectedIds.join("|")]);

  const categories = CATEGORY_ORDER.filter((cat) =>
    SYMBOL_CATALOG.some((s) => s.category === cat)
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 md:hidden">
      <div className="pointer-events-auto flex justify-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <SheetTab
          active={sheet === "symbols"}
          label="Symbole"
          onClick={() =>
            setSheet((s) => (s === "symbols" ? null : "symbols"))
          }
        />
        <SheetTab
          active={tool === "pan"}
          label="Verschieben"
          onClick={() => setTool(tool === "pan" ? "select" : "pan")}
        />
        <SheetTab
          active={sheet === "props"}
          label="Eigenschaften"
          onClick={() => setSheet((s) => (s === "props" ? null : "props"))}
        />
      </div>

      {sheet && (
        <div
          className="pointer-events-auto fixed inset-0 z-40 bg-ink/35"
          onClick={() => setSheet(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col rounded-t-2xl border border-line bg-panel shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <div className="text-sm font-semibold">
                {sheet === "symbols" ? "Symbolbibliothek" : "Eigenschaften"}
              </div>
              <button
                type="button"
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface"
                onClick={() => setSheet(null)}
              >
                Fertig
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {sheet === "props" ? (
                <PropertiesPanel className="flex h-full max-h-[70dvh] w-full flex-col overflow-y-auto border-0" />
              ) : openCat == null ? (
                <div className="h-full overflow-y-auto p-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setOpenCat(cat)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold hover:bg-surface"
                    >
                      <span>{CATEGORY_LABELS[cat]}</span>
                      <span className="text-xs text-muted">
                        {
                          SYMBOL_CATALOG.filter((s) => s.category === cat)
                            .length
                        }{" "}
                        ›
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <button
                    type="button"
                    onClick={() => setOpenCat(null)}
                    className="border-b border-line px-3 py-2 text-left text-xs font-semibold text-muted"
                  >
                    ‹ {CATEGORY_LABELS[openCat]}
                  </button>
                  <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {SYMBOL_CATALOG.filter((s) => s.category === openCat).map(
                        (s) => {
                          const active =
                            selectedKind === s.kind && tool === "symbol";
                          const label =
                            mode === "pro" ? s.labelPro : s.label;
                          return (
                            <button
                              key={s.kind}
                              type="button"
                              onClick={() => {
                                setSelectedSymbolKind(s.kind as SymbolKind);
                                setSheet(null);
                              }}
                              className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2.5 ${
                                active
                                  ? "border-accent bg-accent-soft"
                                  : "border-line bg-surface"
                              }`}
                            >
                              <SymbolGlyph
                                kind={s.kind}
                                size={36}
                                color={resolveSymbolColor(s.kind, {
                                  projectDefaults: symbolColorDefaults,
                                  printBlack: printBlackSymbols,
                                })}
                              />
                              <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight">
                                {label}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SheetTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-xs font-semibold shadow-md ${
        active ? "bg-ink text-panel" : "bg-panel text-ink"
      }`}
    >
      {label}
    </button>
  );
}
