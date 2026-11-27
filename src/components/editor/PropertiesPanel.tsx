"use client";

import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { resolveSymbolColor } from "@/lib/symbols/colors";
import { resolveSymbolSize } from "@/lib/symbols/size";
import { dist, polygonAreaM2 } from "@/lib/geometry/math";
import { symbolsInDoorSwing } from "@/lib/geometry/doorClearance";
import { ROOM_TEMPLATES } from "@/lib/roomTemplates";
import { CircuitTree } from "./CircuitTree";
import { ColorField } from "./ColorField";
import { ObjectList } from "./ObjectList";
import { QuantityList } from "./QuantityList";

type SideTab = "edit" | "list" | "plan";

export function PropertiesPanel() {
  const ui = useProjectStore((s) => s.ui);
  const walls = useProjectStore((s) => s.walls);
  const openings = useProjectStore((s) => s.openings);
  const symbols = useProjectStore((s) => s.symbols);
  const rooms = useProjectStore((s) => s.rooms);
  const connections = useProjectStore((s) => s.connections);
  const symbolColorDefaults = useProjectStore((s) => s.symbolColorDefaults);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const floors = useProjectStore((s) => s.floors);
  const floor = useMemo(
    () => floors.find((f) => f.id === activeFloorId),
    [floors, activeFloorId]
  );
  const mpp = floor?.background?.metersPerPixel ?? 0.02;
  const setWallThickness = useProjectStore((s) => s.setWallThickness);
  const toggleAngleSnap = useProjectStore((s) => s.toggleAngleSnap);
  const setAngleSnapDegrees = useProjectStore((s) => s.setAngleSnapDegrees);
  const setPrintBlackSymbols = useProjectStore((s) => s.setPrintBlackSymbols);
  const setSymbolColorDefault = useProjectStore((s) => s.setSymbolColorDefault);
  const updateWall = useProjectStore((s) => s.updateWall);
  const updateOpening = useProjectStore((s) => s.updateOpening);
  const updateSymbol = useProjectStore((s) => s.updateSymbol);
  const updateRoom = useProjectStore((s) => s.updateRoom);
  const updateFloor = useProjectStore((s) => s.updateFloor);
  const removeWall = useProjectStore((s) => s.removeWall);
  const removeOpening = useProjectStore((s) => s.removeOpening);
  const removeSymbol = useProjectStore((s) => s.removeSymbol);
  const removeRoom = useProjectStore((s) => s.removeRoom);
  const removeConnection = useProjectStore((s) => s.removeConnection);
  const setBackgroundOpacity = useProjectStore((s) => s.setBackgroundOpacity);
  const setBackgroundLocked = useProjectStore((s) => s.setBackgroundLocked);
  const finishCalibration = useProjectStore((s) => s.finishCalibration);
  const clearCalibration = useProjectStore((s) => s.clearCalibration);
  const applyRoomTemplate = useProjectStore((s) => s.applyRoomTemplate);
  const createWallsFromRoom = useProjectStore((s) => s.createWallsFromRoom);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const rotateSelected = useProjectStore((s) => s.rotateSelected);

  const [calLength, setCalLength] = useState("5");
  const [tab, setTab] = useState<SideTab>("list");

  const selectedId = ui.selectedIds[0];
  const multi = ui.selectedIds.length > 1;
  const wall = walls.find((w) => w.id === selectedId);
  const opening = openings.find((o) => o.id === selectedId);
  const symbol = symbols.find((s) => s.id === selectedId);
  const room = rooms.find((r) => r.id === selectedId);
  const connection = connections.find((c) => c.id === selectedId);
  const hasSelection = Boolean(wall || opening || symbol || room || connection);

  useEffect(() => {
    if (hasSelection || multi) setTab("edit");
  }, [selectedId, multi, hasSelection]);

  const floorStats = useMemo(() => {
    const fw = walls.filter((w) => w.floorId === activeFloorId);
    const fs = symbols.filter((s) => s.floorId === activeFloorId);
    const outlets = fs.filter((s) => s.kind.startsWith("outlet")).length;
    return {
      walls: fw.length,
      symbols: fs.length,
      outlets,
      wallLengthM: fw.reduce((acc, w) => acc + dist(w.start, w.end) * mpp, 0),
    };
  }, [walls, symbols, activeFloorId, mpp]);

  const cal = floor?.background?.calibration;
  const calReady = Boolean(cal?.pointA && cal?.pointB);

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-line bg-panel">
      <div className="border-b border-line p-3 pb-2">
        <div className="font-[family-name:var(--font-display)] text-sm font-semibold">
          Eigenschaften
        </div>
        <div className="text-[11px] text-muted">
          {floor?.name ?? "—"} · {floorStats.walls} Wände · {floorStats.symbols}{" "}
          Symbole
          {ui.selectedIds.length > 0 && ` · ${ui.selectedIds.length} gewählt`}
        </div>
        <div className="mt-2 flex rounded-lg bg-surface p-0.5">
          {(
            [
              ["edit", "Auswahl"],
              ["list", "Liste"],
              ["plan", "Plan"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                tab === id ? "bg-panel text-ink shadow-sm" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {tab === "list" && (
          <>
            <ObjectList />
            <QuantityList />
            <CircuitTree />
          </>
        )}

        {tab === "plan" && (
          <>
            <Section title="Darstellung">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={ui.printBlackSymbols}
              onChange={(e) => setPrintBlackSymbols(e.target.checked)}
            />
            Norm-Druck (schwarz)
          </label>
          <p className="mt-1.5 text-[10px] leading-snug text-muted">
            DIN-Installationspläne werden üblicherweise schwarz geplottet.
            Farben sind Bildschirm-/Layer-Hilfe (wie in Profi-CAD), keine
            Normpflicht.
          </p>
        </Section>
        {(ui.tool === "calibrate" ||
          (floor?.background &&
            floor.background.calibration?.pointA)) && (
          <Section title="Maßstab – was macht das?">
            <p className="text-xs leading-relaxed text-muted">
              Der Maßstab sagt der App, wie viele Pixel einem Meter entsprechen.
              Ohne ihn sind Längen nur Schätzungen. Du setzt{" "}
              <strong>zwei freie Punkte</strong> auf einer Strecke, deren echte
              Länge du kennst (z.&nbsp;B. 5&nbsp;m Außenwand). Die orangene
              Messlinie erscheint sofort und bleibt, bis du übernimmst.
            </p>
            {!floor?.background && (
              <p className="mt-2 text-xs text-accent-ink">
                Zuerst „Grundriss laden“, dann Maßstab setzen.
              </p>
            )}
            <div className="mt-2 text-xs">
              Punkt 1: {cal?.pointA ? "gesetzt" : "offen"} · Punkt 2:{" "}
              {cal?.pointB ? "gesetzt" : "offen"}
            </div>
            <label className="mt-2 block text-xs font-medium">
              Reale Länge (m)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={calLength}
                onChange={(e) => setCalLength(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={!calReady}
                onClick={() => finishCalibration(Number(calLength))}
                className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-panel disabled:opacity-40"
              >
                Übernehmen
              </button>
              <button
                type="button"
                onClick={() => clearCalibration()}
                className="rounded-md bg-surface px-3 py-1.5 text-xs font-medium"
              >
                Reset
              </button>
            </div>
            {floor?.background?.metersPerPixel != null && (
              <p className="mt-2 text-[11px] text-ok">
                Aktuell:{" "}
                {(floor.background.metersPerPixel * 100).toFixed(2)} cm/px
              </p>
            )}
          </Section>
        )}

        {floor?.background && (
          <Section title="Hintergrund">
            <label className="block text-xs font-medium">
              Deckkraft {Math.round(floor.background.opacity * 100)}%
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={floor.background.opacity}
                onChange={(e) =>
                  setBackgroundOpacity(Number(e.target.value))
                }
                className="mt-1 w-full"
              />
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={floor.background.locked}
                onChange={(e) => setBackgroundLocked(e.target.checked)}
              />
              Hintergrund sperren
            </label>
          </Section>
        )}

        {floor && (
          <Section title="Geschoss & Wandhöhe">
            <p className="mb-2 text-[11px] leading-snug text-muted">
              Lichte Höhe über Fußboden – steuert die 3D-Wände. Auch oben in der
              Leiste neben den Etagen. Default für neue Etagen unter „Plan“.
            </p>
            <label className="block text-xs font-medium">
              Wandhöhe diese Etage (m)
              <input
                type="number"
                step="0.05"
                min="1.5"
                value={floor.height}
                onChange={(e) =>
                  updateFloor(floor.id, { height: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <div className="mt-1 text-[11px] text-ok">
              Aktuell: {(floor.height * 100).toFixed(0)} cm
            </div>
            <label className="mt-2 block text-xs font-medium">
              Deckenstärke (m)
              <input
                type="number"
                step="0.01"
                min="0.05"
                value={floor.slabThickness}
                onChange={(e) =>
                  updateFloor(floor.id, {
                    slabThickness: Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
          </Section>
        )}

        <Section title="Zeichnen">
          <label className="block text-xs font-medium">
            Neue Wandstärke
            <select
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              value={ui.wallThickness}
              onChange={(e) => setWallThickness(Number(e.target.value))}
            >
              <option value={0.1}>10 cm</option>
              <option value={0.115}>11,5 cm</option>
              <option value={0.12}>12 cm (Standard)</option>
              <option value={0.175}>17,5 cm</option>
              <option value={0.24}>24 cm</option>
              {/* default store: 12 cm */}
              <option value={0.365}>36,5 cm</option>
            </select>
          </label>
          <label className="mt-2 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={ui.angleSnapEnabled}
              onChange={() => toggleAngleSnap()}
            />
            Winkel-Snap (Hilfslinien)
          </label>
          {ui.angleSnapEnabled && (
            <select
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-xs"
              value={ui.angleSnapDegrees}
              onChange={(e) =>
                setAngleSnapDegrees(Number(e.target.value) as 15 | 45 | 90)
              }
            >
              <option value={15}>alle 15°</option>
              <option value={45}>alle 45°</option>
              <option value={90}>nur 90°</option>
            </select>
          )}
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Beim Zeichnen werden Winkel-Guides angezeigt.{" "}
            <strong>Shift halten = freier Winkel</strong>. Längen in 5-cm-Schritten.
            Wände kettenweise.
          </p>
        </Section>

        <Section title={ui.mode === "pro" ? "Profi-Modus" : "Bauherren-Modus"}>
          <p className="text-[11px] leading-snug text-muted">
            {ui.mode === "pro"
              ? "Fachkürzel, Stromkreis/FI/Leitungstyp, Höhen am Plan, Warnung bei vielen Steckdosen."
              : "Einfache Namen, Möbel, Tipps und Notizen – ohne Elektro-Fachfelder."}
          </p>
        </Section>
          </>
        )}

        {tab === "edit" && (
          <>
        {multi && !wall && !opening && !symbol && !room && !connection && (
          <Section title={`${ui.selectedIds.length} Objekte`}>
            <p className="text-[11px] text-muted">
              Mehrfachauswahl – in „Liste“ tippen oder im Plan klicken für
              Einzeldetails.
            </p>
            <button
              type="button"
              className="mt-2 text-[11px] text-muted underline-offset-2 hover:underline"
              onClick={() => setSelectedIds([])}
            >
              Auswahl leeren
            </button>
          </Section>
        )}

        {!hasSelection && !multi && (
          <Section title="Nichts ausgewählt">
            <p className="text-[11px] leading-snug text-muted">
              Objekt im Plan anklicken oder unter „Liste“ wählen. Raum markieren
              → Vorlagen Bad/Küche.
            </p>
          </Section>
        )}

        {wall && (
          <Section title="Ausgewählte Wand">
            <div className="space-y-1 text-xs">
              <div>
                Länge:{" "}
                <strong>{(dist(wall.start, wall.end) * mpp).toFixed(2)} m</strong>
              </div>
              <div>
                Höhe (Geschoss):{" "}
                <strong>{(floor?.height ?? 2.5).toFixed(2)} m</strong>
              </div>
              <div>
                Stärke: <strong>{(wall.thickness * 100).toFixed(1)} cm</strong>
              </div>
            </div>
            <label className="mt-2 block text-xs font-medium">
              Stärke (m)
              <input
                type="number"
                step="0.005"
                value={wall.thickness}
                onChange={(e) =>
                  updateWall(wall.id, { thickness: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <button
              type="button"
              onClick={() => removeWall(wall.id)}
              className="mt-3 rounded-md bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger"
            >
              Wand löschen
            </button>
          </Section>
        )}

        {opening && (
          <Section title={opening.kind === "door" ? "Tür" : "Fenster"}>
            <label className="block text-xs font-medium">
              Breite (m)
              <input
                type="number"
                step="0.01"
                value={opening.width}
                onChange={(e) =>
                  updateOpening(opening.id, { width: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <label className="mt-2 block text-xs font-medium">
              Höhe (m)
              <input
                type="number"
                step="0.01"
                value={opening.height}
                onChange={(e) =>
                  updateOpening(opening.id, { height: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            {opening.kind === "door" && (
              <>
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={opening.hingeLeft}
                    onChange={(e) =>
                      updateOpening(opening.id, {
                        hingeLeft: e.target.checked,
                      })
                    }
                  />
                  Anschlag links
                </label>
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={opening.opensInward}
                    onChange={(e) =>
                      updateOpening(opening.id, {
                        opensInward: e.target.checked,
                      })
                    }
                  />
                  Öffnet nach innen
                </label>
              </>
            )}
            <button
              type="button"
              onClick={() => removeOpening(opening.id)}
              className="mt-3 rounded-md bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger"
            >
              Löschen
            </button>
          </Section>
        )}

        {symbol && (
          <Section title={getSymbolDef(symbol.kind).label}>
            {(() => {
              const clashes = symbolsInDoorSwing(
                [symbol],
                openings.filter((o) => o.floorId === activeFloorId),
                walls.filter((w) => w.floorId === activeFloorId),
                mpp
              );
              if (!clashes.length) return null;
              return (
                <div className="mb-2 rounded-md border border-accent/40 bg-accent-soft px-2 py-1.5 text-[11px] text-accent-ink">
                  Liegt im Türschwenk – ggf. verschieben.
                </div>
              );
            })()}
            {(() => {
              const size = resolveSymbolSize(symbol.kind, symbol.sizeM);
              if (!size) return null;
              const catalog = getSymbolDef(symbol.kind).sizeM;
              const patchSize = (key: "w" | "d" | "h", value: number) => {
                updateSymbol(symbol.id, {
                  sizeM: { ...symbol.sizeM, [key]: value },
                });
              };
              return (
                <div className="mb-2">
                  <div className="mb-1 flex items-center justify-between text-xs font-medium">
                    <span>Maße (m)</span>
                    {symbol.sizeM && (
                      <button
                        type="button"
                        className="text-[10px] font-normal text-muted hover:underline"
                        onClick={() =>
                          updateSymbol(symbol.id, { sizeM: undefined })
                        }
                      >
                        Katalog
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ["w", "B", size.w],
                        ["d", "T", size.d],
                        ["h", "H", size.h],
                      ] as const
                    ).map(([key, lab, val]) => (
                      <label key={key} className="text-[10px] text-muted">
                        {lab}
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          value={Number(val.toFixed(2))}
                          onChange={(e) =>
                            patchSize(key, Number(e.target.value))
                          }
                          className="mt-0.5 w-full rounded-md border border-line bg-surface px-1.5 py-1 text-xs font-semibold text-ink"
                        />
                      </label>
                    ))}
                  </div>
                  {catalog && (
                    <p className="mt-1 text-[10px] text-muted">
                      Katalog {catalog.w.toFixed(2)}×{catalog.d.toFixed(2)}×
                      {catalog.h.toFixed(2)} m
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="mb-2 flex gap-1">
              <button
                type="button"
                title="15° gegen Uhrzeigersinn (Q)"
                onClick={() => rotateSelected(-Math.PI / 12)}
                className="flex-1 rounded-md border border-line bg-surface px-2 py-1.5 text-xs font-semibold hover:border-ink/30"
              >
                ↺ 15°
              </button>
              <button
                type="button"
                title="15° im Uhrzeigersinn (E)"
                onClick={() => rotateSelected(Math.PI / 12)}
                className="flex-1 rounded-md border border-line bg-surface px-2 py-1.5 text-xs font-semibold hover:border-ink/30"
              >
                ↻ 15°
              </button>
              <button
                type="button"
                title="90° (Shift+E)"
                onClick={() => rotateSelected(Math.PI / 2)}
                className="rounded-md border border-line bg-surface px-2 py-1.5 text-xs font-semibold hover:border-ink/30"
              >
                90°
              </button>
            </div>
            <label className="block text-xs font-medium">
              Bezeichnung
              <input
                value={symbol.label ?? ""}
                onChange={(e) =>
                  updateSymbol(symbol.id, { label: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <label className="mt-2 block text-xs font-medium">
              Einbauhöhe (m)
              <input
                type="number"
                step="0.01"
                value={symbol.mountHeight}
                onChange={(e) =>
                  updateSymbol(symbol.id, {
                    mountHeight: Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <ColorField
              label="Symbolfarbe"
              value={resolveSymbolColor(symbol.kind, {
                symbolColor: symbol.color,
                projectDefaults: symbolColorDefaults,
                printBlack: false,
              })}
              onChange={(hex) => updateSymbol(symbol.id, { color: hex })}
              onReset={
                symbol.color
                  ? () => updateSymbol(symbol.id, { color: undefined })
                  : undefined
              }
              onSaveDefault={() => {
                const hex = resolveSymbolColor(symbol.kind, {
                  symbolColor: symbol.color,
                  projectDefaults: symbolColorDefaults,
                  printBlack: false,
                });
                setSymbolColorDefault(symbol.kind, hex);
              }}
              hasDefault={Boolean(symbolColorDefaults[symbol.kind])}
              onClearDefault={() => setSymbolColorDefault(symbol.kind, null)}
            />
            {(() => {
              const panels = symbols.filter(
                (s) =>
                  s.floorId === activeFloorId &&
                  s.kind === "distribution_board" &&
                  s.id !== symbol.id
              );
              if (!panels.length || symbol.kind === "distribution_board") {
                return null;
              }
              return (
                <label className="mt-2 block text-xs font-medium">
                  Verteiler
                  <select
                    value={symbol.panelId ?? ""}
                    onChange={(e) =>
                      updateSymbol(symbol.id, {
                        panelId: e.target.value || undefined,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
                  >
                    <option value="">
                      {panels.length === 1
                        ? "automatisch (einzige UV)"
                        : "nicht zugeordnet"}
                    </option>
                    {panels.map((p, i) => (
                      <option key={p.id} value={p.id}>
                        {p.label || `UV ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })()}
            {ui.mode === "pro" && (
              <>
                <label className="mt-2 block text-xs font-medium">
                  Stromkreis
                  <input
                    value={symbol.circuitId ?? ""}
                    placeholder="z. B. F1.1"
                    onChange={(e) =>
                      updateSymbol(symbol.id, { circuitId: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
                  />
                </label>
                <label className="mt-2 block text-xs font-medium">
                  FI-Gruppe
                  <input
                    value={symbol.rcdGroup ?? ""}
                    onChange={(e) =>
                      updateSymbol(symbol.id, { rcdGroup: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
                  />
                </label>
                <label className="mt-2 block text-xs font-medium">
                  Leitungstyp
                  <input
                    value={symbol.cableType ?? ""}
                    placeholder="NYM-J 3x1,5"
                    onChange={(e) =>
                      updateSymbol(symbol.id, { cableType: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
                  />
                </label>
              </>
            )}
            <label className="mt-2 block text-xs font-medium">
              Notiz
              <textarea
                value={symbol.note ?? ""}
                onChange={(e) =>
                  updateSymbol(symbol.id, { note: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <button
              type="button"
              onClick={() => removeSymbol(symbol.id)}
              className="mt-3 rounded-md bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger"
            >
              Symbol löschen
            </button>
          </Section>
        )}

        {connection && (
          <Section title="Zuordnung">
            {(() => {
              const a = symbols.find((s) => s.id === connection.fromSymbolId);
              const b = symbols.find((s) => s.id === connection.toSymbolId);
              return (
                <div className="space-y-1 text-xs">
                  <div>
                    Von:{" "}
                    <button
                      type="button"
                      className="font-semibold underline-offset-2 hover:underline"
                      onClick={() => setSelectedIds([connection.fromSymbolId])}
                    >
                      {a
                        ? a.label || getSymbolDef(a.kind).label
                        : "—"}
                    </button>
                  </div>
                  <div>
                    Nach:{" "}
                    <button
                      type="button"
                      className="font-semibold underline-offset-2 hover:underline"
                      onClick={() => setSelectedIds([connection.toSymbolId])}
                    >
                      {b
                        ? b.label || getSymbolDef(b.kind).label
                        : "—"}
                    </button>
                  </div>
                  <div>
                    Länge ca.:{" "}
                    <strong>
                      {(connection.estimatedLengthM ?? 0).toFixed(1)} m
                    </strong>
                  </div>
                </div>
              );
            })()}
            <button
              type="button"
              onClick={() => removeConnection(connection.id)}
              className="mt-3 rounded-md bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger"
            >
              Zuordnung löschen
            </button>
          </Section>
        )}

        {room && (
          <Section title="Raum">
            <div className="mb-2 text-xs">
              Fläche:{" "}
              <strong>{polygonAreaM2(room.points, mpp).toFixed(2)} m²</strong>
            </div>
            <p className="mb-2 text-[10px] leading-snug text-muted">
              Raum = Fläche/Zone. Wände sind die Konstruktion. Neue Räume erzeugen
              fehlende Umrisswände automatisch.
            </p>
            <button
              type="button"
              onClick={() => createWallsFromRoom(room.id)}
              className="mb-3 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-xs font-semibold hover:border-ink/30"
            >
              Fehlende Wände aus Umriss erzeugen
            </button>
            <label className="block text-xs font-medium">
              Name
              <input
                value={room.name}
                onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <div className="mt-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Vorlage einfügen
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {ROOM_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    title={t.tip}
                    onClick={() => applyRoomTemplate(room.id, t.id)}
                    className="rounded-md border border-line bg-surface px-2 py-2 text-left text-[11px] font-semibold hover:border-ink/30"
                  >
                    {t.label}
                    <span className="mt-0.5 block text-[10px] font-normal text-muted">
                      {t.items.length} Teile
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-muted">
                Platziert typische Symbole im Raum (anpassbar). Undo: Strg+Z.
              </p>
            </div>
            <label className="mt-2 block text-xs font-medium">
              Notiz
              <textarea
                value={room.note ?? ""}
                onChange={(e) => updateRoom(room.id, { note: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5"
              />
            </label>
            <button
              type="button"
              onClick={() => removeRoom(room.id)}
              className="mt-3 rounded-md bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger"
            >
              Raum löschen
            </button>
          </Section>
        )}

        {ui.tool === "connection" && (
          <Section title="Zuordnung (Leitung)">
            <p className="text-xs leading-relaxed text-muted">
              Schalter → Lampe: erstes Symbol, dann zweites. Linie = Schalt-
              Zuordnung inkl. Längenschätzung – keine Kabeltrasse.
            </p>
          </Section>
        )}

        {ui.mode === "pro" && floorStats.outlets > 10 && (
          <div className="rounded-md border border-accent/40 bg-accent-soft p-3 text-xs text-accent-ink">
            Hinweis: {floorStats.outlets} Steckdosen auf dieser Etage – prüfe
            Stromkreis-Aufteilung (&gt;10 pro Kreis vermeiden).
          </div>
        )}
          </>
        )}
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}
