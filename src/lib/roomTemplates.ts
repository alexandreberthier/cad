import type { Point2, SymbolKind } from "@/types/project";

export interface RoomTemplateItem {
  kind: SymbolKind;
  /** 0–1 in Raumbounding-Box */
  u: number;
  v: number;
  label?: string;
  circuitId?: string;
  rcdGroup?: string;
  cableType?: string;
  breakerRating?: string;
}

export interface RoomTemplate {
  id: string;
  label: string;
  tip: string;
  items: RoomTemplateItem[];
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: "kitchen",
    label: "Küche",
    tip: "Arbeitsplatten-SD, Herd, Spüle, Dunstabzug, Deckenauslass",
    items: [
      { kind: "outlet_counter", u: 0.12, v: 0.08, circuitId: "F1.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×2,5" },
      { kind: "outlet_counter", u: 0.35, v: 0.08, circuitId: "F1.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×2,5" },
      { kind: "outlet_counter", u: 0.58, v: 0.08, circuitId: "F1.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×2,5" },
      { kind: "stove_outlet", u: 0.78, v: 0.08, circuitId: "F1.2", rcdGroup: "FI2", breakerRating: "B16 3P", cableType: "NYM-J 5×2,5", label: "Herd" },
      { kind: "dishwasher", u: 0.22, v: 0.18, circuitId: "F1.3", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×2,5" },
      { kind: "extractor_hood", u: 0.78, v: 0.2, circuitId: "F1.2", rcdGroup: "FI2", breakerRating: "B16 3P", cableType: "NYM-J 5×2,5" },
      { kind: "san_kitchen_sink", u: 0.45, v: 0.22 },
      { kind: "furniture_kitchen", u: 0.45, v: 0.14 },
      { kind: "furniture_fridge", u: 0.08, v: 0.2 },
      { kind: "ceiling_outlet", u: 0.5, v: 0.55, circuitId: "F2.1", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_off", u: 0.08, v: 0.92, circuitId: "F2.1", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "rj45", u: 0.9, v: 0.9, rcdGroup: "FI3", circuitId: "F2.2", cableType: "Cat.6A / LWL" },
    ],
  },
  {
    id: "bath",
    label: "Bad",
    tip: "Feuchtraum-SD, Licht, Lüfter, Waschtisch, WC, optional Dusche",
    items: [
      { kind: "san_toilet", u: 0.2, v: 0.25 },
      { kind: "san_sink", u: 0.55, v: 0.18 },
      { kind: "san_shower", u: 0.78, v: 0.55 },
      { kind: "outlet_wet", u: 0.55, v: 0.08, circuitId: "F3.1", rcdGroup: "FI Bad", breakerRating: "B16", cableType: "NYM-J 3×2,5" },
      { kind: "light_wall_sconce", u: 0.55, v: 0.05, circuitId: "F3.2", rcdGroup: "FI Bad", breakerRating: "B10", cableType: "NYM-J 3×1,5", label: "Spiegel" },
      { kind: "ceiling_outlet", u: 0.5, v: 0.5, circuitId: "F3.2", rcdGroup: "FI Bad", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "fan_exhaust", u: 0.88, v: 0.12, circuitId: "F3.2", rcdGroup: "FI Bad", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_off", u: 0.08, v: 0.92, circuitId: "F3.2", rcdGroup: "FI Bad", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "san_towel_radiator", u: 0.12, v: 0.55 },
    ],
  },
  {
    id: "living",
    label: "Wohnen",
    tip: "Steckdosen, Deckenlicht, TV/Daten, Sofa-Platzhalter",
    items: [
      { kind: "outlet_2", u: 0.1, v: 0.08, circuitId: "F4.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "outlet_2", u: 0.9, v: 0.08, circuitId: "F4.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "outlet_2", u: 0.1, v: 0.9, circuitId: "F4.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "outlet_2", u: 0.9, v: 0.9, circuitId: "F4.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "tv_sat", u: 0.5, v: 0.08, circuitId: "F4.3", rcdGroup: "FI3", cableType: "Cat.6A / LWL" },
      { kind: "rj45", u: 0.58, v: 0.08, circuitId: "F4.3", rcdGroup: "FI3", cableType: "Cat.6A / LWL" },
      { kind: "ceiling_outlet", u: 0.5, v: 0.5, circuitId: "F4.2", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_changeover", u: 0.08, v: 0.5, circuitId: "F4.2", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "furniture_sofa", u: 0.5, v: 0.72 },
      { kind: "furniture_tv", u: 0.5, v: 0.18 },
    ],
  },
  {
    id: "bedroom",
    label: "Schlafzimmer",
    tip: "Bett, Nacht-SD, Deckenlicht, Daten",
    items: [
      { kind: "furniture_bed", u: 0.5, v: 0.35 },
      { kind: "outlet_1", u: 0.28, v: 0.12, circuitId: "F5.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "outlet_1", u: 0.72, v: 0.12, circuitId: "F5.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "outlet_2", u: 0.9, v: 0.9, circuitId: "F5.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "ceiling_outlet", u: 0.5, v: 0.55, circuitId: "F5.2", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_off", u: 0.08, v: 0.92, circuitId: "F5.2", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "rj45", u: 0.85, v: 0.12, circuitId: "F5.3", rcdGroup: "FI3", cableType: "Cat.6A / LWL" },
      { kind: "smoke_detector", u: 0.5, v: 0.55, label: "RmM" },
      { kind: "furniture_nightstand", u: 0.22, v: 0.28 },
      { kind: "furniture_nightstand", u: 0.78, v: 0.28 },
    ],
  },
  {
    id: "hallway",
    label: "Flur",
    tip: "Deckenlicht Wechselschaltung, SD, optional UV",
    items: [
      { kind: "ceiling_outlet", u: 0.35, v: 0.5, circuitId: "F6.1", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "ceiling_outlet", u: 0.7, v: 0.5, circuitId: "F6.1", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_changeover", u: 0.08, v: 0.5, circuitId: "F6.1", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_changeover", u: 0.92, v: 0.5, circuitId: "F6.1", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "outlet_2", u: 0.5, v: 0.12, circuitId: "F6.2", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "smoke_detector", u: 0.5, v: 0.5, label: "RmM" },
    ],
  },
  {
    id: "office",
    label: "Büro / Arbeitszimmer",
    tip: "Doppel-SD, Daten, Deckenlicht",
    items: [
      { kind: "outlet_2", u: 0.15, v: 0.12, circuitId: "F7.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "outlet_2", u: 0.35, v: 0.12, circuitId: "F7.1", rcdGroup: "FI2", breakerRating: "B16", cableType: "NYM-J 3×1,5" },
      { kind: "rj45", u: 0.55, v: 0.12, circuitId: "F7.2", rcdGroup: "FI3", cableType: "Cat.6A / LWL" },
      { kind: "rj45", u: 0.7, v: 0.12, circuitId: "F7.2", rcdGroup: "FI3", cableType: "Cat.6A / LWL" },
      { kind: "ceiling_outlet", u: 0.5, v: 0.5, circuitId: "F7.3", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_off", u: 0.08, v: 0.92, circuitId: "F7.3", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "furniture_desk", u: 0.5, v: 0.35 },
    ],
  },
  {
    id: "laundry",
    label: "Hauswirtschaft",
    tip: "WM, TR, Feuchtraum-SD, Licht – eigene Kreise",
    items: [
      { kind: "washing_machine", u: 0.25, v: 0.25, circuitId: "F8.1", rcdGroup: "FI Bad", breakerRating: "B16", cableType: "NYM-J 3×2,5", label: "WM" },
      { kind: "dryer", u: 0.55, v: 0.25, circuitId: "F8.2", rcdGroup: "FI Bad", breakerRating: "B16", cableType: "NYM-J 3×2,5", label: "TR" },
      { kind: "outlet_wet", u: 0.8, v: 0.12, circuitId: "F8.3", rcdGroup: "FI Bad", breakerRating: "B16", cableType: "NYM-J 3×2,5" },
      { kind: "san_washing_connection", u: 0.25, v: 0.4 },
      { kind: "ceiling_outlet", u: 0.5, v: 0.55, circuitId: "F8.4", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_off", u: 0.08, v: 0.92, circuitId: "F8.4", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
    ],
  },
  {
    id: "outdoor",
    label: "Außen / Terrasse",
    tip: "Außen-SD, Außenlicht, optional Wallbox-Hinweis",
    items: [
      { kind: "outlet_outdoor", u: 0.2, v: 0.15, circuitId: "F9.1", rcdGroup: "FI Bad", breakerRating: "B16", cableType: "NYM-J 3×2,5" },
      { kind: "outlet_outdoor", u: 0.8, v: 0.15, circuitId: "F9.1", rcdGroup: "FI Bad", breakerRating: "B16", cableType: "NYM-J 3×2,5" },
      { kind: "light_outdoor", u: 0.15, v: 0.5, circuitId: "F9.2", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "light_garden", u: 0.5, v: 0.75, circuitId: "F9.2", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "switch_off", u: 0.08, v: 0.92, circuitId: "F9.2", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
      { kind: "motion_sensor", u: 0.85, v: 0.5, circuitId: "F9.2", rcdGroup: "FI1", breakerRating: "B10", cableType: "NYM-J 3×1,5" },
    ],
  },
];

export function roomBBox(points: Point2[]): {
  minX: number;
  minY: number;
  w: number;
  h: number;
} {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

export function templatePoint(
  points: Point2[],
  u: number,
  v: number
): Point2 {
  const b = roomBBox(points);
  return { x: b.minX + u * b.w, y: b.minY + v * b.h };
}
