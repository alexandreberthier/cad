"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/projectStore";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { resolvePlanSymbolColor } from "@/lib/symbols/colors";
import { dist, polygonAreaM2 } from "@/lib/geometry/math";

/** Klickbare Liste aller Objekte der Etage – Auswahl wie im Plan. */
export function ObjectList() {
  const walls = useProjectStore((s) => s.walls);
  const openings = useProjectStore((s) => s.openings);
  const symbols = useProjectStore((s) => s.symbols);
  const rooms = useProjectStore((s) => s.rooms);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const floors = useProjectStore((s) => s.floors);
  const selectedIds = useProjectStore((s) => s.ui.selectedIds);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const setTool = useProjectStore((s) => s.setTool);
  const mode = useProjectStore((s) => s.ui.mode);
  const defaults = useProjectStore((s) => s.symbolColorDefaults);
  const printBlack = useProjectStore((s) => s.ui.printBlackSymbols);

  const floor = floors.find((f) => f.id === activeFloorId);
  const showFurniture = useProjectStore((s) => s.ui.showFurniture);
  const showSanitary = useProjectStore((s) => s.ui.showSanitary);
  const mpp = floor?.background?.metersPerPixel ?? 0.02;

  const groups = useMemo(() => {
    const fw = walls.filter((w) => w.floorId === activeFloorId);
    const fo = openings.filter((o) => o.floorId === activeFloorId);
    const fr = rooms.filter((r) => r.floorId === activeFloorId);
    const fs = symbols
      .filter((s) => s.floorId === activeFloorId)
      .filter((s) => {
        const d = getSymbolDef(s.kind);
        if (!showFurniture && d.isFurniture) return false;
        if (!showSanitary && d.category === "sanitary") return false;
        return true;
      })
      .sort((a, b) => {
        const ca = getSymbolDef(a.kind).category;
        const cb = getSymbolDef(b.kind).category;
        return ca.localeCompare(cb, "de");
      });
    return { walls: fw, openings: fo, rooms: fr, symbols: fs };
  }, [
    walls,
    openings,
    rooms,
    symbols,
    activeFloorId,
    showFurniture,
    showSanitary,
  ]);

  const pick = (id: string) => {
    setTool("select");
    setSelectedIds([id]);
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent("elektrocad:fit-selection"));
    });
  };

  return (
    <div className="space-y-3 text-xs">
      {groups.rooms.length > 0 && (
        <Group title={`Räume (${groups.rooms.length})`}>
          {groups.rooms.map((r) => (
            <Row
              key={r.id}
              active={selectedIds.includes(r.id)}
              onClick={() => pick(r.id)}
              label={r.name || "Raum"}
              meta={`${polygonAreaM2(r.points, mpp).toFixed(1)} m²`}
            />
          ))}
        </Group>
      )}

      {groups.walls.length > 0 && (
        <Group title={`Wände (${groups.walls.length})`}>
          {groups.walls.map((w, i) => (
            <Row
              key={w.id}
              active={selectedIds.includes(w.id)}
              onClick={() => pick(w.id)}
              label={`Wand ${i + 1}`}
              meta={`${(dist(w.start, w.end) * mpp).toFixed(2)} m`}
            />
          ))}
        </Group>
      )}

      {groups.openings.length > 0 && (
        <Group title={`Türen / Fenster (${groups.openings.length})`}>
          {groups.openings.map((o) => (
            <Row
              key={o.id}
              active={selectedIds.includes(o.id)}
              onClick={() => pick(o.id)}
              label={o.kind === "door" ? "Tür" : "Fenster"}
              meta={`${o.width.toFixed(2)} m`}
            />
          ))}
        </Group>
      )}

      {groups.symbols.length > 0 && (
        <Group title={`Symbole (${groups.symbols.length})`}>
          {groups.symbols.map((s) => {
            const def = getSymbolDef(s.kind);
            const color = resolvePlanSymbolColor(s, defaults, printBlack);
            return (
              <Row
                key={s.id}
                active={selectedIds.includes(s.id)}
                onClick={() => pick(s.id)}
                swatch={color}
                label={
                  s.label || (mode === "pro" ? def.labelPro : def.label)
                }
                meta={s.circuitId || def.category}
              />
            );
          })}
        </Group>
      )}

      {!groups.walls.length &&
        !groups.symbols.length &&
        !groups.rooms.length && (
          <p className="text-[11px] text-muted">
            Noch nichts auf dieser Etage – links zeichnen oder Vorlage auf einen
            Raum anwenden.
          </p>
        )}
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {title}
      </div>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function Row({
  label,
  meta,
  active,
  onClick,
  swatch,
}: {
  label: string;
  meta?: string;
  active: boolean;
  onClick: () => void;
  swatch?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left ${
          active ? "bg-accent-soft text-accent-ink" : "hover:bg-surface"
        }`}
      >
        {swatch ? (
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: swatch }}
          />
        ) : (
          <span className="inline-block h-2 w-2 shrink-0 rounded-sm bg-line" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        {meta && (
          <span className="shrink-0 text-[10px] text-muted">{meta}</span>
        )}
      </button>
    </li>
  );
}
