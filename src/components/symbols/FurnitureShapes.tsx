"use client";

import { Circle, Group, Line, Rect } from "react-konva";
import type { SymbolKind } from "@/types/project";

/** Sims-/Grundriss-ähnliche Möbel-Draufsichten – w/d bereits in Canvas-Pixeln */
export function FurnitureKonva({
  kind,
  stroke,
  fill,
  sw,
  wPx,
  dPx,
}: {
  kind: SymbolKind;
  stroke: string;
  fill: string;
  sw: number;
  wPx: number;
  dPx: number;
}) {
  const W = wPx;
  const D = dPx;
  const x = -W / 2;
  const y = -D / 2;
  const soft = `${fill}55`;

  switch (kind) {
    case "furniture_bed":
    case "furniture_bed_single":
      return (
        <Group>
          <Rect x={x} y={y} width={W} height={D} fill={soft} stroke={stroke} strokeWidth={sw} cornerRadius={3} />
          <Rect x={x + 2} y={y + 2} width={W * 0.18} height={D - 4} fill={`${stroke}33`} stroke={stroke} strokeWidth={1} cornerRadius={2} />
          <Rect x={x + W * 0.22} y={y + 4} width={W * 0.35} height={D * 0.28} fill="#f8fafc" stroke={stroke} strokeWidth={1} cornerRadius={2} />
          {kind === "furniture_bed" && (
            <Rect x={x + W * 0.58} y={y + 4} width={W * 0.35} height={D * 0.28} fill="#f8fafc" stroke={stroke} strokeWidth={1} cornerRadius={2} />
          )}
        </Group>
      );
    case "furniture_sofa":
      return (
        <Group>
          <Rect x={x} y={y + D * 0.15} width={W} height={D * 0.7} fill={soft} stroke={stroke} strokeWidth={sw} cornerRadius={4} />
          <Rect x={x} y={y} width={W} height={D * 0.22} fill={`${stroke}44`} stroke={stroke} strokeWidth={sw} cornerRadius={3} />
          <Rect x={x} y={y + D * 0.15} width={W * 0.12} height={D * 0.7} fill={`${stroke}33`} stroke={stroke} strokeWidth={1} />
          <Rect x={x + W * 0.88} y={y + D * 0.15} width={W * 0.12} height={D * 0.7} fill={`${stroke}33`} stroke={stroke} strokeWidth={1} />
        </Group>
      );
    case "furniture_armchair":
      return (
        <Group>
          <Rect x={x} y={y + D * 0.2} width={W} height={D * 0.65} fill={soft} stroke={stroke} strokeWidth={sw} cornerRadius={4} />
          <Rect x={x} y={y} width={W} height={D * 0.28} fill={`${stroke}44`} stroke={stroke} strokeWidth={sw} cornerRadius={3} />
        </Group>
      );
    case "furniture_dining_chair":
      return (
        <Group>
          <Rect x={x} y={y + D * 0.25} width={W} height={D * 0.55} fill={soft} stroke={stroke} strokeWidth={sw} cornerRadius={2} />
          <Rect x={x} y={y} width={W} height={D * 0.2} fill={`${stroke}44`} stroke={stroke} strokeWidth={1} />
        </Group>
      );
    case "furniture_table":
    case "furniture_desk":
    case "furniture_coffee_table":
      return (
        <Group>
          <Rect x={x} y={y} width={W} height={D} fill={soft} stroke={stroke} strokeWidth={sw} cornerRadius={kind === "furniture_coffee_table" ? 6 : 2} />
          <Circle x={-W * 0.35} y={-D * 0.3} radius={2} fill={stroke} />
          <Circle x={W * 0.35} y={-D * 0.3} radius={2} fill={stroke} />
          <Circle x={-W * 0.35} y={D * 0.3} radius={2} fill={stroke} />
          <Circle x={W * 0.35} y={D * 0.3} radius={2} fill={stroke} />
        </Group>
      );
    case "furniture_tv":
      return (
        <Group>
          <Rect x={x} y={y} width={W} height={D} fill={soft} stroke={stroke} strokeWidth={sw} cornerRadius={2} />
          <Rect x={x + W * 0.15} y={y - D * 0.55} width={W * 0.7} height={D * 0.45} fill="#1e293b" stroke={stroke} strokeWidth={sw} cornerRadius={1} />
        </Group>
      );
    case "furniture_bookshelf":
    case "furniture_wardrobe":
    case "furniture_dresser":
    case "furniture_nightstand":
    case "furniture_fridge":
      return (
        <Group>
          <Rect x={x} y={y} width={W} height={D} fill={soft} stroke={stroke} strokeWidth={sw} cornerRadius={2} />
          <Line points={[0, y + 2, 0, y + D - 2]} stroke={stroke} strokeWidth={1} dash={[3, 2]} />
        </Group>
      );
    case "furniture_kitchen":
      return (
        <Group>
          <Rect x={x} y={y} width={W} height={D} fill="#f5f5f4" stroke={stroke} strokeWidth={sw} cornerRadius={1} />
          {[0.2, 0.45, 0.7].map((t) => (
            <Line
              key={t}
              points={[x + W * t, y, x + W * t, y + D]}
              stroke={stroke}
              strokeWidth={1}
            />
          ))}
          <Circle x={x + W * 0.55} y={y + D * 0.5} radius={D * 0.22} stroke={stroke} strokeWidth={1} />
        </Group>
      );
    case "furniture_plant":
      return (
        <Group>
          <Circle radius={Math.min(W, D) / 2} fill={`${fill}66`} stroke={stroke} strokeWidth={sw} />
          <Circle radius={Math.min(W, D) / 4} fill={fill} />
        </Group>
      );
    case "furniture_rug":
      return (
        <Rect
          x={x}
          y={y}
          width={W}
          height={D}
          fill={`${fill}44`}
          stroke={stroke}
          strokeWidth={sw}
          dash={[4, 3]}
          cornerRadius={2}
        />
      );
    default:
      return (
        <Rect x={x} y={y} width={W} height={D} fill={soft} stroke={stroke} strokeWidth={sw} cornerRadius={2} />
      );
  }
}
