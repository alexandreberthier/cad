/**
 * ElektroCAD – Kern-Datenmodell
 * Alle Maße intern in Metern (m). Canvas arbeitet in px; Umrechnung via metersPerPixel.
 */

export type AppMode = "homeowner" | "pro";
export type ViewMode = "2d" | "3d" | "split";
export type Tool =
  | "select"
  | "pan"
  | "wall"
  | "door"
  | "window"
  | "room"
  | "symbol"
  | "calibrate"
  | "connection";

export type Point2 = { x: number; y: number };

export type FloorId = string;
export type WallId = string;
export type OpeningId = string;
export type SymbolId = string;
export type RoomId = string;
export type ConnectionId = string;

export interface Floor {
  id: FloorId;
  name: string;
  /** Geschosshöhe in m (Standard 2.5) */
  height: number;
  /** Deckenstärke in m */
  slabThickness: number;
  /** Reihenfolge von unten nach oben */
  order: number;
  background?: BackgroundImage;
}

export interface BackgroundImage {
  src: string;
  mimeType: string;
  opacity: number;
  locked: boolean;
  widthPx: number;
  heightPx: number;
  offsetX: number;
  offsetY: number;
  /**
   * Meter pro Canvas-Pixel. null = noch nicht kalibriert.
   * Nach freier 2-Punkt-Kalibrierung gesetzt (beliebige Strecke).
   */
  metersPerPixel: number | null;
  calibration?: {
    pointA: Point2 | null;
    pointB: Point2 | null;
  };
}

export interface Wall {
  id: WallId;
  floorId: FloorId;
  start: Point2;
  end: Point2;
  /** Wandstärke in m (z.B. 0.12, 0.24) */
  thickness: number;
}

export type OpeningKind = "door" | "window";

export interface Opening {
  id: OpeningId;
  floorId: FloorId;
  wallId: WallId;
  kind: OpeningKind;
  t: number;
  width: number;
  height: number;
  sillHeight: number;
  hingeLeft: boolean;
  opensInward: boolean;
}

export type SymbolCategory =
  | "outlet"
  | "switch"
  | "light"
  | "data"
  | "av"
  | "control"
  | "panel"
  | "safety"
  | "appliance"
  | "sanitary"
  | "furniture";

export type SymbolKind =
  // Steckdosen (DIN EN 60617-11 angelehnt)
  | "outlet_1"
  | "outlet_2"
  | "outlet_3"
  | "outlet_wet"
  | "outlet_cee"
  | "outlet_counter"
  | "outlet_floor"
  | "outlet_switched"
  // Schalter
  | "switch_off"
  | "switch_changeover"
  | "switch_cross"
  | "switch_series"
  | "switch_push"
  | "switch_dimmer"
  | "shutter_switch"
  // Licht
  | "ceiling_outlet"
  | "wall_outlet"
  | "recessed_spot"
  | "light_led_strip"
  | "light_outdoor"
  | "emergency_light"
  // Daten / AV
  | "rj45"
  | "tv_sat"
  | "phone"
  | "fiber"
  | "speaker"
  // Steuerung / Smart
  | "wireless_actor"
  | "doorbell"
  | "intercom"
  | "thermostat"
  // Sicherheit
  | "motion_sensor"
  | "smoke_detector"
  | "camera_cctv"
  // Verteiler / Festanschluss
  | "distribution_board"
  | "junction_box"
  | "stove_outlet"
  | "water_heater"
  | "ev_charger"
  | "pv_inverter"
  // Geräte (Elektro)
  | "washing_machine"
  | "dryer"
  | "dishwasher"
  | "extractor_hood"
  | "fan_exhaust"
  | "outlet_usb"
  // Sanitär (DIN 1356 / ISO 4067 angelehnt)
  | "san_toilet"
  | "san_sink"
  | "san_bathtub"
  | "san_shower"
  | "san_bidet"
  | "san_kitchen_sink"
  | "san_radiator"
  | "san_towel_radiator"
  | "san_floor_drain"
  | "san_washing_connection"
  // Möbel (Grundriss / Einrichten)
  | "furniture_bed"
  | "furniture_bed_single"
  | "furniture_sofa"
  | "furniture_armchair"
  | "furniture_dining_chair"
  | "furniture_table"
  | "furniture_coffee_table"
  | "furniture_desk"
  | "furniture_tv"
  | "furniture_bookshelf"
  | "furniture_wardrobe"
  | "furniture_nightstand"
  | "furniture_dresser"
  | "furniture_kitchen"
  | "furniture_fridge"
  | "furniture_plant"
  | "furniture_rug";

export type ComboOrientation = "horizontal" | "vertical";

export interface ComboFrame {
  slots: number;
  orientation: ComboOrientation;
  inserts: SymbolKind[];
}

export interface PlanSymbol {
  id: SymbolId;
  floorId: FloorId;
  kind: SymbolKind;
  position: Point2;
  rotation: number;
  mountHeight: number;
  wallId?: WallId;
  wallT?: number;
  wallSide?: 1 | -1;
  combo?: ComboFrame;
  circuitId?: string;
  rcdGroup?: string;
  /** Zugeordnete Unterverteilung (distribution_board-Symbol) */
  panelId?: string;
  cableType?: string;
  note?: string;
  roomId?: RoomId;
  label?: string;
  /** Individuelle Farbe (überschreibt Default) */
  color?: string;
  /** Individuelle Maße in m (überschreibt Katalog-sizeM) */
  sizeM?: { w?: number; d?: number; h?: number };
}

export interface Room {
  id: RoomId;
  floorId: FloorId;
  name: string;
  points: Point2[];
  note?: string;
}

export interface Connection {
  id: ConnectionId;
  floorId: FloorId;
  fromSymbolId: SymbolId;
  toSymbolId: SymbolId;
  path?: Point2[];
  estimatedLengthM?: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: 1;
}

export interface ProjectData {
  meta: ProjectMeta;
  floors: Floor[];
  activeFloorId: FloorId;
  walls: Wall[];
  openings: Opening[];
  symbols: PlanSymbol[];
  rooms: Room[];
  connections: Connection[];
  /**
   * Projektweite Default-Farben je Symbolart (überschreibbar).
   * Norm-Druck ist üblicherweise schwarz – Farben sind Bildschirm-/Layer-Hilfe.
   */
  symbolColorDefaults: Partial<Record<SymbolKind, string>>;
}

export interface UiState {
  mode: AppMode;
  viewMode: ViewMode;
  tool: Tool;
  selectedSymbolKind: SymbolKind | null;
  selectedIds: string[];
  wallThickness: number;
  /** Standard-Geschosshöhe für neue Etagen (m) */
  defaultFloorHeight: number;
  angleSnapEnabled: boolean;
  /** Winkelschritt für Snap (Shift = Freizeichnen) */
  angleSnapDegrees: 15 | 45 | 90;
  showFurniture: boolean;
  showSanitary: boolean;
  showHeights: boolean;
  spacePanning: boolean;
  /** Shift gedrückt → kein Winkel-Snap */
  shiftFreehand: boolean;
  /** Alle Symbole schwarz (wie DIN-Druck) */
  printBlackSymbols: boolean;
}
