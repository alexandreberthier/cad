"use client";

import { Arc, Circle, Group, Line, Rect, Text } from "react-konva";
import type { SymbolKind } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { formatSize2, resolveSymbolSize, type Size3 } from "@/lib/symbols/size";
import { FurnitureKonva } from "./FurnitureShapes";

/** Plan-Glyphen in Kategorie-Farbe (gleich wie Sidebar & 3D) */
export function KonvaSymbol({
  kind,
  selected,
  showHeight,
  mountHeightCm,
  circuitId,
  showCircuit,
  color,
  sizeOverride,
  /** Meter pro Pixel – Fußabdruck von Möbeln/Sanitär maßstäblich */
  metersPerPixel = 0.02,
}: {
  kind: SymbolKind;
  selected?: boolean;
  showHeight?: boolean;
  mountHeightCm?: number;
  circuitId?: string;
  showCircuit?: boolean;
  /** Aufgelöste Farbe (Override / Default / Katalog) */
  color?: string;
  sizeOverride?: Partial<Size3> | null;
  metersPerPixel?: number;
}) {
  const def = getSymbolDef(kind);
  const ink = color ?? def.color;
  const sw = 1.7;
  const size = resolveSymbolSize(kind, sizeOverride);
  const useFootprint =
    Boolean(size) &&
    (def.isFurniture ||
      def.category === "sanitary" ||
      def.category === "appliance" ||
      def.category === "panel" ||
      kind === "speaker");
  const footprint =
    useFootprint && size
      ? {
          w: Math.max(8, size.w / metersPerPixel),
          d: Math.max(8, size.d / metersPerPixel),
        }
      : null;
  const selectR = footprint
    ? Math.max(footprint.w, footprint.d) * 0.55 + 4
    : 16;

  return (
    <Group>
      {/* Größere Touch-Hitbox (Tablet) */}
      <Circle radius={Math.max(selectR, 22)} fill="transparent" />
      {selected && (
        <Circle radius={selectR} stroke="#e08a1e" strokeWidth={2} dash={[4, 3]} />
      )}
      <Glyph
        kind={kind}
        stroke={ink}
        fillTint={ink}
        sw={sw}
        footprint={footprint}
      />
      {showHeight && mountHeightCm != null && !def.isFurniture && (
        <Text
          x={-16}
          y={15}
          width={32}
          align="center"
          text={`${mountHeightCm}`}
          fontSize={9}
          fill="#5b6b7c"
        />
      )}
      {footprint && size && (
        <Text
          x={-footprint.w / 2}
          y={footprint.d / 2 + 2}
          width={footprint.w}
          align="center"
          text={formatSize2(size)}
          fontSize={9}
          fill="#64748b"
        />
      )}
      {showCircuit &&
        !def.isFurniture &&
        def.category !== "sanitary" &&
        def.category !== "panel" &&
        !(def.category === "safety" && kind !== "alarm_siren") && (
          <Text
            x={-20}
            y={-(footprint ? footprint.d / 2 + 14 : 22)}
            width={40}
            align="center"
            text={circuitId?.trim() || "!"}
            fontSize={9}
            fontStyle="bold"
            fill={circuitId?.trim() ? "#1a2332" : "#b42318"}
          />
        )}
    </Group>
  );
}

function Glyph({
  kind,
  stroke,
  fillTint,
  sw,
  footprint,
}: {
  kind: SymbolKind;
  stroke: string;
  fillTint: string;
  sw: number;
  footprint: { w: number; d: number } | null;
}) {
  const def = getSymbolDef(kind);

  if (def.isFurniture && footprint) {
    return (
      <FurnitureKonva
        kind={kind}
        stroke={stroke}
        fill={fillTint}
        sw={sw}
        wPx={footprint.w}
        dPx={footprint.d}
      />
    );
  }

  // Sanitär / große Geräte: echter Fußabdruck
  if (footprint && (def.category === "sanitary" || def.category === "appliance")) {
    return (
      <Rect
        x={-footprint.w / 2}
        y={-footprint.d / 2}
        width={footprint.w}
        height={footprint.d}
        stroke={stroke}
        strokeWidth={sw}
        fill={`${fillTint}22`}
        cornerRadius={2}
      />
    );
  }

  switch (kind) {
    case "outlet_1":
    case "outlet_counter":
    case "outlet_switched":
    case "outlet_usb":
    case "outlet_16a":
    case "outlet_outdoor":
    case "outlet_child_safe":
      return (
        <Group>
          <Arc
            innerRadius={0}
            outerRadius={11}
            angle={180}
            rotation={0}
            stroke={stroke}
            strokeWidth={sw}
          />
          <Line points={[0, -10, 0, 0]} stroke={stroke} strokeWidth={sw} />
          <Line points={[-4, 0, 4, 0]} stroke={stroke} strokeWidth={sw} />
          {kind === "outlet_switched" && (
            <Line points={[0, -10, 6, -14]} stroke={stroke} strokeWidth={sw} />
          )}
          {kind === "outlet_usb" && (
            <Text x={-6} y={2} text="USB" fontSize={6} fill={stroke} />
          )}
          {kind === "outlet_16a" && (
            <Text x={-5} y={2} text="16" fontSize={6} fill={stroke} />
          )}
          {kind === "outlet_child_safe" && (
            <Text x={-5} y={2} text="KS" fontSize={6} fill={stroke} />
          )}
        </Group>
      );
    case "outlet_2":
      return (
        <Group>
          <Arc x={-6} innerRadius={0} outerRadius={8} angle={180} stroke={stroke} strokeWidth={sw} />
          <Arc x={6} innerRadius={0} outerRadius={8} angle={180} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "outlet_3":
      return (
        <Group>
          <Rect x={-12} y={-7} width={24} height={14} cornerRadius={2} stroke={stroke} strokeWidth={sw} />
          {[-6, 0, 6].map((x) => (
            <Line key={x} points={[x, -4, x, 4]} stroke={stroke} strokeWidth={sw} />
          ))}
        </Group>
      );
    case "outlet_wet":
      return (
        <Group>
          <Arc innerRadius={0} outerRadius={11} angle={180} stroke={stroke} strokeWidth={sw} />
          <Line points={[0, -10, 0, 0]} stroke={stroke} strokeWidth={sw} />
          <Line points={[8, -4, 12, -4]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "outlet_cee":
      return (
        <Group>
          <Circle radius={11} stroke={stroke} strokeWidth={sw} />
          <Circle radius={3.5} fill={stroke} />
        </Group>
      );
    case "outlet_floor":
    case "outlet_underfloor":
      return (
        <Group>
          <Rect x={-9} y={-9} width={18} height={18} stroke={stroke} strokeWidth={sw} />
          <Arc y={4} innerRadius={0} outerRadius={6} angle={180} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "switch_off":
    case "switch_hotel":
    case "switch_pilot":
      return (
        <Group>
          <Circle radius={11} stroke={stroke} strokeWidth={sw} />
          <Line points={[0, -8, 0, 0]} stroke={stroke} strokeWidth={sw} />
          <Line points={[0, 0, 7, -4]} stroke={stroke} strokeWidth={sw} />
          {kind === "switch_pilot" && (
            <Circle x={-5} y={5} radius={2.2} fill={stroke} />
          )}
        </Group>
      );
    case "switch_changeover":
      return (
        <Group>
          <Circle radius={11} stroke={stroke} strokeWidth={sw} />
          <Line points={[-6, 6, 0, -5]} stroke={stroke} strokeWidth={sw} />
          <Line points={[0, -5, 6, 6]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "switch_cross":
      return (
        <Group>
          <Circle radius={11} stroke={stroke} strokeWidth={sw} />
          <Line points={[-6, -6, 6, 6]} stroke={stroke} strokeWidth={sw} />
          <Line points={[6, -6, -6, 6]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "switch_series":
      return (
        <Group>
          <Circle radius={11} stroke={stroke} strokeWidth={sw} />
          <Line points={[-5, 6, 0, -5, 5, 6]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "switch_push":
    case "switch_double_push":
    case "knx_push":
      return (
        <Group>
          <Circle radius={11} stroke={stroke} strokeWidth={sw} />
          <Circle radius={4} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "switch_dimmer":
      return (
        <Group>
          <Circle radius={11} stroke={stroke} strokeWidth={sw} />
          <Line points={[-6, 5, 0, -4, 6, 5]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "shutter_switch":
      return (
        <Group>
          <Circle radius={11} stroke={stroke} strokeWidth={sw} />
          <Line points={[0, -8, 0, 8]} stroke={stroke} strokeWidth={sw} />
          <Line points={[-4, -4, 0, -8, 4, -4]} stroke={stroke} strokeWidth={sw} />
          <Line points={[-4, 4, 0, 8, 4, 4]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "ceiling_outlet":
    case "light_pendant":
      return (
        <Group>
          <Line points={[-7, -7, 7, 7]} stroke={stroke} strokeWidth={sw} />
          <Line points={[7, -7, -7, 7]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "wall_outlet":
    case "light_wall_sconce":
      return (
        <Group>
          <Line points={[-7, -7, 7, 7]} stroke={stroke} strokeWidth={sw} />
          <Line points={[7, -7, -7, 7]} stroke={stroke} strokeWidth={sw} />
          <Line points={[-9, 10, 9, 10]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "recessed_spot":
    case "emergency_light":
      return (
        <Group>
          <Circle radius={10} stroke={stroke} strokeWidth={sw} />
          <Line points={[-5, -5, 5, 5]} stroke={stroke} strokeWidth={sw} />
          <Line points={[5, -5, -5, 5]} stroke={stroke} strokeWidth={sw} />
          {kind === "emergency_light" && (
            <Text x={-5} y={12} text="NL" fontSize={7} fill={stroke} />
          )}
        </Group>
      );
    case "light_led_strip":
      return (
        <Group>
          <Line points={[-12, 0, 12, 0]} stroke={stroke} strokeWidth={sw} />
          {[-8, -4, 0, 4, 8].map((x) => (
            <Circle key={x} x={x} y={0} radius={1.5} fill={stroke} />
          ))}
        </Group>
      );
    case "light_outdoor":
    case "light_garden":
      return (
        <Group>
          <Line points={[-7, -7, 7, 7]} stroke={stroke} strokeWidth={sw} />
          <Line points={[7, -7, -7, 7]} stroke={stroke} strokeWidth={sw} />
          <Rect x={-10} y={8} width={20} height={4} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "rj45":
    case "rj45_double":
    case "phone":
    case "tv_sat":
    case "fiber":
    case "hdmi_wall":
      return (
        <Group>
          <Rect x={-9} y={-6} width={18} height={14} stroke={stroke} strokeWidth={sw} />
          <Line
            points={[-9, -6, -5, -11, 5, -11, 9, -6]}
            stroke={stroke}
            strokeWidth={sw}
          />
          {kind === "fiber" && (
            <Text x={-5} y={0} text="LWL" fontSize={6} fill={stroke} />
          )}
          {kind === "rj45_double" && (
            <Text x={-4} y={1} text="2×" fontSize={6} fill={stroke} />
          )}
        </Group>
      );
    case "speaker":
      return (
        <Group>
          <Circle radius={9} stroke={stroke} strokeWidth={sw} />
          <Arc innerRadius={4} outerRadius={4} angle={120} rotation={210} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "thermostat":
    case "presence_sensor":
      return (
        <Group>
          <Rect x={-8} y={-10} width={16} height={20} stroke={stroke} strokeWidth={sw} />
          <Circle y={-2} radius={3} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "camera_cctv":
      return (
        <Group>
          <Rect x={-10} y={-5} width={14} height={10} stroke={stroke} strokeWidth={sw} />
          <Circle x={8} y={0} radius={4} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "ev_charger":
      return (
        <Group>
          <Rect x={-8} y={-12} width={16} height={24} stroke={stroke} strokeWidth={sw} />
          <Text x={-6} y={-2} text="EV" fontSize={8} fill={stroke} />
        </Group>
      );
    case "pv_inverter":
    case "heat_pump":
    case "floor_heating":
      return (
        <Group>
          <Rect x={-10} y={-10} width={20} height={20} stroke={stroke} strokeWidth={sw} />
          <Text
            x={-7}
            y={-3}
            text={
              kind === "heat_pump" ? "WP" : kind === "floor_heating" ? "FH" : "WR"
            }
            fontSize={8}
            fill={stroke}
          />
        </Group>
      );
    case "fan_exhaust":
      return (
        <Group>
          <Circle radius={10} stroke={stroke} strokeWidth={sw} />
          <Line points={[-6, 0, 6, 0]} stroke={stroke} strokeWidth={sw} />
          <Line points={[0, -6, 0, 6]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "motion_sensor":
      return (
        <Group>
          <Circle radius={5} stroke={stroke} strokeWidth={sw} />
          <Arc innerRadius={8} outerRadius={8} angle={120} rotation={210} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "smoke_detector":
    case "water_leak":
    case "gas_detector":
    case "co_detector":
    case "alarm_siren":
    case "doorbell_chime":
      return (
        <Group>
          <Rect x={-8} y={-8} width={16} height={16} stroke={stroke} strokeWidth={sw} />
          <Line points={[-4, -2, 0, 5, 4, -2]} stroke={stroke} strokeWidth={sw} />
        </Group>
      );
    case "distribution_board":
    case "main_panel":
    case "meter_cabinet":
    case "data_cabinet":
    case "surge_protector":
      return (
        <Group>
          <Rect x={-10} y={-12} width={20} height={24} stroke={stroke} strokeWidth={sw} />
          <Line points={[-10, -12, 10, 12]} stroke={stroke} strokeWidth={sw} />
          {kind === "main_panel" && (
            <Text x={-5} y={-2} text="HV" fontSize={7} fill={stroke} />
          )}
          {kind === "meter_cabinet" && (
            <Text x={-5} y={-2} text="Z" fontSize={8} fill={stroke} />
          )}
        </Group>
      );
    case "stove_outlet":
      return (
        <Group>
          <Rect x={-10} y={-10} width={20} height={20} stroke={stroke} strokeWidth={sw} />
          <Circle x={-4} y={-2} radius={1.5} fill={stroke} />
          <Circle x={4} y={-2} radius={1.5} fill={stroke} />
          <Circle y={4} radius={1.5} fill={stroke} />
        </Group>
      );
    default:
      return <Circle radius={9} stroke={stroke} strokeWidth={sw} />;
  }
}
