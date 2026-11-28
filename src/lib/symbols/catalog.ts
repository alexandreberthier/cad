import type { SymbolCategory, SymbolKind } from "@/types/project";

export interface SymbolDef {
  kind: SymbolKind;
  category: SymbolCategory;
  label: string;
  labelPro: string;
  defaultHeight: number;
  wallBound: boolean;
  /** Kategorie-/Symbolfarbe – gleich in Sidebar, 2D-Plan und 3D */
  color: string;
  isFurniture?: boolean;
  sizeM?: { w: number; d: number; h: number };
}

export const DEFAULT_HEIGHTS = {
  outlet: 0.3,
  switch: 1.05,
  countertop: 1.15,
  wallOutlet: 1.8,
  ceiling: 2.5,
} as const;

export const SYMBOL_CATALOG: SymbolDef[] = [
  // —— Steckdosen (Blau) ——
  { kind: "outlet_1", category: "outlet", label: "Steckdose", labelPro: "SCHUKO 1×", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#1d4ed8" },
  { kind: "outlet_2", category: "outlet", label: "Doppel-SD", labelPro: "SCHUKO 2×", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#1d4ed8" },
  { kind: "outlet_3", category: "outlet", label: "3-fach SD", labelPro: "SCHUKO 3×", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#1d4ed8" },
  { kind: "outlet_wet", category: "outlet", label: "Feuchtraum", labelPro: "IP44", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#0369a1" },
  { kind: "outlet_cee", category: "outlet", label: "CEE", labelPro: "CEE 16A", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#b91c1c" },
  { kind: "outlet_counter", category: "outlet", label: "Arbeitsplatte", labelPro: "SD 115 cm", defaultHeight: DEFAULT_HEIGHTS.countertop, wallBound: true, color: "#1d4ed8" },
  { kind: "outlet_floor", category: "outlet", label: "Boden-SD", labelPro: "Bodendose", defaultHeight: 0, wallBound: false, color: "#1e40af" },
  { kind: "outlet_switched", category: "outlet", label: "schaltbar", labelPro: "SD schaltbar", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#1d4ed8" },
  { kind: "outlet_usb", category: "outlet", label: "USB-SD", labelPro: "SCHUKO+USB", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#1d4ed8" },
  { kind: "outlet_16a", category: "outlet", label: "16A SD", labelPro: "SCHUKO 16A", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#1d4ed8" },
  { kind: "outlet_underfloor", category: "outlet", label: "Fußboden-SD", labelPro: "Unterflurdose", defaultHeight: 0, wallBound: false, color: "#1e40af" },
  { kind: "outlet_outdoor", category: "outlet", label: "Außen-SD", labelPro: "SCHUKO IP44 außen", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#0369a1" },
  { kind: "outlet_child_safe", category: "outlet", label: "Kinderschutz", labelPro: "SCHUKO Kinderschutz", defaultHeight: DEFAULT_HEIGHTS.outlet, wallBound: true, color: "#1d4ed8" },

  // —— Schalter (Orange/Braun) ——
  { kind: "switch_off", category: "switch", label: "Aus", labelPro: "Ausschalter", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#c2410c" },
  { kind: "switch_changeover", category: "switch", label: "Wechsel", labelPro: "Wechselschalter", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#c2410c" },
  { kind: "switch_cross", category: "switch", label: "Kreuz", labelPro: "Kreuzschalter", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#c2410c" },
  { kind: "switch_series", category: "switch", label: "Serien", labelPro: "Serienschalter", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#c2410c" },
  { kind: "switch_push", category: "switch", label: "Taster", labelPro: "Taster", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#ea580c" },
  { kind: "switch_dimmer", category: "switch", label: "Dimmer", labelPro: "Dimmer", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#a16207" },
  { kind: "shutter_switch", category: "switch", label: "Jalousie", labelPro: "Jalousieschalter", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#57534e" },
  { kind: "switch_hotel", category: "switch", label: "Hotelschalter", labelPro: "Kartenschalter", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#c2410c" },
  { kind: "switch_double_push", category: "switch", label: "Doppeltaster", labelPro: "Doppeltaster", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#ea580c" },
  { kind: "switch_pilot", category: "switch", label: "mit Lampe", labelPro: "Schalter mit Kontrolllampe", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#c2410c" },
  { kind: "knx_push", category: "switch", label: "KNX-Taster", labelPro: "KNX / Bus-Taster", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#0f766e" },

  // —— Licht (Gold) ——
  { kind: "ceiling_outlet", category: "light", label: "Deckenauslass", labelPro: "LA Decke", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#ca8a04" },
  { kind: "wall_outlet", category: "light", label: "Wandauslass", labelPro: "LA Wand", defaultHeight: DEFAULT_HEIGHTS.wallOutlet, wallBound: true, color: "#ca8a04" },
  { kind: "recessed_spot", category: "light", label: "Spot", labelPro: "Einbauspot", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#eab308" },
  { kind: "light_led_strip", category: "light", label: "LED-Strip", labelPro: "LED-Band", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#eab308" },
  { kind: "light_outdoor", category: "light", label: "Außenleuchte", labelPro: "LA außen IP44", defaultHeight: DEFAULT_HEIGHTS.wallOutlet, wallBound: true, color: "#ca8a04" },
  { kind: "emergency_light", category: "light", label: "Notlicht", labelPro: "Sicherheitsleuchte", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#b45309" },
  { kind: "light_pendant", category: "light", label: "Pendelleuchte", labelPro: "Pendel / Hänge-LA", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#ca8a04" },
  { kind: "light_wall_sconce", category: "light", label: "Wandleuchte", labelPro: "Wandlampe", defaultHeight: DEFAULT_HEIGHTS.wallOutlet, wallBound: true, color: "#ca8a04" },
  { kind: "light_garden", category: "light", label: "Gartenleuchte", labelPro: "Poller / Garten IP65", defaultHeight: 0.8, wallBound: false, color: "#a16207" },

  // —— Daten / AV ——
  { kind: "rj45", category: "data", label: "RJ45", labelPro: "Daten Cat.6A", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#15803d" },
  { kind: "rj45_double", category: "data", label: "RJ45 2×", labelPro: "Daten 2× Cat.6A", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#15803d" },
  { kind: "tv_sat", category: "av", label: "TV/SAT", labelPro: "Antenne", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#7c3aed", sizeM: { w: 0.08, d: 0.06, h: 0.08 } },
  { kind: "phone", category: "data", label: "Telefon", labelPro: "Multimedia", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#15803d" },
  { kind: "fiber", category: "data", label: "Glasfaser", labelPro: "LWL / FTTH", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#166534" },
  { kind: "speaker", category: "av", label: "Lautsprecher", labelPro: "Multiroom / LS", defaultHeight: DEFAULT_HEIGHTS.wallOutlet, wallBound: true, color: "#7c3aed", sizeM: { w: 0.22, d: 0.14, h: 0.3 } },
  { kind: "hdmi_wall", category: "av", label: "HDMI", labelPro: "HDMI-Wanddose", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#7c3aed" },

  // —— Steuerung ——
  { kind: "wireless_actor", category: "control", label: "Funk-Aktor", labelPro: "Shelly/Eltako/KNX", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#0891b2" },
  { kind: "doorbell", category: "control", label: "Klingel", labelPro: "Klingeltaster", defaultHeight: 1.3, wallBound: true, color: "#0891b2" },
  { kind: "doorbell_outdoor", category: "control", label: "Türklingel", labelPro: "Klingel außen", defaultHeight: 1.3, wallBound: true, color: "#0891b2" },
  { kind: "intercom", category: "control", label: "Sprechanlage", labelPro: "Türstation innen", defaultHeight: 1.45, wallBound: true, color: "#0891b2" },
  { kind: "thermostat", category: "control", label: "Thermostat", labelPro: "Raumthermostat", defaultHeight: DEFAULT_HEIGHTS.switch, wallBound: true, color: "#0e7490" },
  { kind: "presence_sensor", category: "control", label: "Präsenz", labelPro: "Präsenzmelder", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#0e7490" },

  // —— Sicherheit ——
  { kind: "motion_sensor", category: "safety", label: "BWM", labelPro: "Bewegungsmelder", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#be123c" },
  { kind: "smoke_detector", category: "safety", label: "RWM", labelPro: "Rauchwarnmelder", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#be123c" },
  { kind: "co_detector", category: "safety", label: "CO-Melder", labelPro: "Kohlenmonoxidmelder", defaultHeight: 1.5, wallBound: true, color: "#9f1239" },
  { kind: "camera_cctv", category: "safety", label: "Kamera", labelPro: "Überwachung", defaultHeight: DEFAULT_HEIGHTS.wallOutlet, wallBound: true, color: "#9f1239" },
  { kind: "water_leak", category: "safety", label: "Wassermelder", labelPro: "Leckagesensor", defaultHeight: 0.15, wallBound: false, color: "#be123c" },
  { kind: "gas_detector", category: "safety", label: "Gasmelder", labelPro: "Gaswarnmelder", defaultHeight: 1.6, wallBound: true, color: "#9f1239" },
  { kind: "alarm_siren", category: "safety", label: "Sirene", labelPro: "Alarmsirene", defaultHeight: DEFAULT_HEIGHTS.wallOutlet, wallBound: true, color: "#9f1239" },

  // —— Verteiler / Fest ——
  { kind: "distribution_board", category: "panel", label: "UV", labelPro: "Unterverteilung", defaultHeight: 1.4, wallBound: true, color: "#1e293b", sizeM: { w: 0.4, d: 0.15, h: 0.6 } },
  { kind: "main_panel", category: "panel", label: "HV", labelPro: "Hauptverteilung", defaultHeight: 1.4, wallBound: true, color: "#0f172a", sizeM: { w: 0.6, d: 0.2, h: 1.2 } },
  { kind: "meter_cabinet", category: "panel", label: "Zähler", labelPro: "Zählerschrank", defaultHeight: 1.4, wallBound: true, color: "#1e293b", sizeM: { w: 0.55, d: 0.2, h: 1.1 } },
  { kind: "data_cabinet", category: "panel", label: "Daten-UV", labelPro: "Netzwerkverteiler / Patch", defaultHeight: 1.4, wallBound: true, color: "#14532d", sizeM: { w: 0.45, d: 0.2, h: 0.7 } },
  { kind: "junction_box", category: "panel", label: "Abzweigdose", labelPro: "AD", defaultHeight: DEFAULT_HEIGHTS.ceiling, wallBound: false, color: "#1e293b" },
  { kind: "surge_protector", category: "panel", label: "ÜSS", labelPro: "Überspannungsschutz", defaultHeight: 1.4, wallBound: true, color: "#334155" },
  { kind: "doorbell_chime", category: "control", label: "Gong", labelPro: "Türgong / Chime", defaultHeight: 2.1, wallBound: true, color: "#0891b2" },
  { kind: "stove_outlet", category: "appliance", label: "Herd", labelPro: "Herdanschluss 400V", defaultHeight: 0.35, wallBound: true, color: "#dc2626" },
  { kind: "water_heater", category: "appliance", label: "DLE", labelPro: "Durchlauferhitzer", defaultHeight: 1.2, wallBound: true, color: "#dc2626" },
  { kind: "ev_charger", category: "appliance", label: "Wallbox", labelPro: "Ladestation EV", defaultHeight: 1.2, wallBound: true, color: "#dc2626", sizeM: { w: 0.35, d: 0.2, h: 0.5 } },
  { kind: "pv_inverter", category: "appliance", label: "WR/PV", labelPro: "Wechselrichter", defaultHeight: 1.4, wallBound: true, color: "#b91c1c", sizeM: { w: 0.5, d: 0.2, h: 0.7 } },
  { kind: "heat_pump", category: "appliance", label: "Wärmepumpe", labelPro: "WP-Anschluss", defaultHeight: 0.5, wallBound: false, color: "#b91c1c", sizeM: { w: 1.0, d: 0.4, h: 1.2 } },
  { kind: "floor_heating", category: "appliance", label: "FBH", labelPro: "Fußbodenheizung", defaultHeight: 0, wallBound: false, color: "#ea580c", sizeM: { w: 0.3, d: 0.3, h: 0.08 } },
  { kind: "washing_machine", category: "appliance", label: "Waschmaschine", labelPro: "WM-Anschluss", defaultHeight: DEFAULT_HEIGHTS.countertop, wallBound: true, color: "#475569", sizeM: { w: 0.6, d: 0.6, h: 0.85 } },
  { kind: "dryer", category: "appliance", label: "Trockner", labelPro: "TR-Anschluss", defaultHeight: DEFAULT_HEIGHTS.countertop, wallBound: true, color: "#475569", sizeM: { w: 0.6, d: 0.65, h: 0.85 } },
  { kind: "dishwasher", category: "appliance", label: "Spülmaschine", labelPro: "GS-Anschluss", defaultHeight: 0.6, wallBound: true, color: "#475569", sizeM: { w: 0.6, d: 0.6, h: 0.85 } },
  { kind: "extractor_hood", category: "appliance", label: "Dunstabzug", labelPro: "DA-Anschluss", defaultHeight: 2.0, wallBound: true, color: "#475569", sizeM: { w: 0.7, d: 0.45, h: 0.35 } },
  { kind: "fan_exhaust", category: "appliance", label: "Lüfter", labelPro: "Abluftventilator", defaultHeight: DEFAULT_HEIGHTS.wallOutlet, wallBound: true, color: "#475569", sizeM: { w: 0.18, d: 0.12, h: 0.18 } },

  // —— Sanitär ——
  { kind: "san_toilet", category: "sanitary", label: "WC", labelPro: "WC", defaultHeight: 0, wallBound: false, color: "#0284c7", sizeM: { w: 0.4, d: 0.65, h: 0.4 } },
  { kind: "san_sink", category: "sanitary", label: "Waschtisch", labelPro: "WT", defaultHeight: 0, wallBound: false, color: "#0284c7", sizeM: { w: 0.6, d: 0.45, h: 0.85 } },
  { kind: "san_bathtub", category: "sanitary", label: "Badewanne", labelPro: "BW", defaultHeight: 0, wallBound: false, color: "#0284c7", sizeM: { w: 1.7, d: 0.75, h: 0.55 } },
  { kind: "san_shower", category: "sanitary", label: "Dusche", labelPro: "DU", defaultHeight: 0, wallBound: false, color: "#0284c7", sizeM: { w: 0.9, d: 0.9, h: 0.1 } },
  { kind: "san_bidet", category: "sanitary", label: "Bidet", labelPro: "Bidet", defaultHeight: 0, wallBound: false, color: "#0284c7", sizeM: { w: 0.4, d: 0.6, h: 0.4 } },
  { kind: "san_kitchen_sink", category: "sanitary", label: "Spüle", labelPro: "Küchenspüle", defaultHeight: 0, wallBound: false, color: "#0284c7", sizeM: { w: 0.8, d: 0.5, h: 0.9 } },
  { kind: "san_radiator", category: "sanitary", label: "Heizkörper", labelPro: "HK", defaultHeight: 0, wallBound: true, color: "#ea580c", sizeM: { w: 0.8, d: 0.12, h: 0.6 } },
  { kind: "san_towel_radiator", category: "sanitary", label: "Handtuch-HK", labelPro: "HTHK", defaultHeight: 0, wallBound: true, color: "#ea580c", sizeM: { w: 0.5, d: 0.1, h: 1.2 } },
  { kind: "san_floor_drain", category: "sanitary", label: "Bodenablauf", labelPro: "BA", defaultHeight: 0, wallBound: false, color: "#0284c7" },
  { kind: "san_washing_connection", category: "sanitary", label: "WM-Anschluss", labelPro: "Wasser WM", defaultHeight: 0.6, wallBound: true, color: "#0284c7" },

  // —— Möbel (Draufsicht / 3D-Einrichten) ——
  { kind: "furniture_bed", category: "furniture", label: "Doppelbett", labelPro: "Bett 180", defaultHeight: 0, wallBound: false, color: "#64748b", isFurniture: true, sizeM: { w: 2.0, d: 1.8, h: 0.55 } },
  { kind: "furniture_bed_single", category: "furniture", label: "Einzelbett", labelPro: "Bett 90", defaultHeight: 0, wallBound: false, color: "#64748b", isFurniture: true, sizeM: { w: 2.0, d: 0.9, h: 0.55 } },
  { kind: "furniture_sofa", category: "furniture", label: "Sofa", labelPro: "Sofa", defaultHeight: 0, wallBound: false, color: "#78716c", isFurniture: true, sizeM: { w: 2.2, d: 0.9, h: 0.75 } },
  { kind: "furniture_armchair", category: "furniture", label: "Sessel", labelPro: "Sessel", defaultHeight: 0, wallBound: false, color: "#78716c", isFurniture: true, sizeM: { w: 0.85, d: 0.85, h: 0.75 } },
  { kind: "furniture_dining_chair", category: "furniture", label: "Stuhl", labelPro: "Essstuhl", defaultHeight: 0, wallBound: false, color: "#a8a29e", isFurniture: true, sizeM: { w: 0.45, d: 0.5, h: 0.9 } },
  { kind: "furniture_table", category: "furniture", label: "Esstisch", labelPro: "Esstisch", defaultHeight: 0, wallBound: false, color: "#92400e", isFurniture: true, sizeM: { w: 1.8, d: 0.9, h: 0.75 } },
  { kind: "furniture_coffee_table", category: "furniture", label: "Couchtisch", labelPro: "Couchtisch", defaultHeight: 0, wallBound: false, color: "#a16207", isFurniture: true, sizeM: { w: 1.1, d: 0.6, h: 0.4 } },
  { kind: "furniture_desk", category: "furniture", label: "Schreibtisch", labelPro: "Schreibtisch", defaultHeight: 0, wallBound: false, color: "#78350f", isFurniture: true, sizeM: { w: 1.4, d: 0.7, h: 0.75 } },
  { kind: "furniture_tv", category: "furniture", label: "TV-Board", labelPro: "Lowboard", defaultHeight: 0, wallBound: false, color: "#44403c", isFurniture: true, sizeM: { w: 1.6, d: 0.4, h: 0.45 } },
  { kind: "furniture_bookshelf", category: "furniture", label: "Regal", labelPro: "Bücherregal", defaultHeight: 0, wallBound: false, color: "#57534e", isFurniture: true, sizeM: { w: 0.9, d: 0.35, h: 1.8 } },
  { kind: "furniture_wardrobe", category: "furniture", label: "Schrank", labelPro: "Kleiderschrank", defaultHeight: 0, wallBound: false, color: "#44403c", isFurniture: true, sizeM: { w: 1.8, d: 0.6, h: 2.1 } },
  { kind: "furniture_nightstand", category: "furniture", label: "Nachttisch", labelPro: "Nachttisch", defaultHeight: 0, wallBound: false, color: "#a8a29e", isFurniture: true, sizeM: { w: 0.45, d: 0.4, h: 0.5 } },
  { kind: "furniture_dresser", category: "furniture", label: "Kommode", labelPro: "Kommode", defaultHeight: 0, wallBound: false, color: "#78716c", isFurniture: true, sizeM: { w: 1.0, d: 0.45, h: 0.85 } },
  { kind: "furniture_kitchen", category: "furniture", label: "Küchenzeile", labelPro: "Küche", defaultHeight: 0, wallBound: false, color: "#e7e5e4", isFurniture: true, sizeM: { w: 3.0, d: 0.6, h: 0.9 } },
  { kind: "furniture_fridge", category: "furniture", label: "Kühlschrank", labelPro: "Kühlschrank", defaultHeight: 0, wallBound: false, color: "#f8fafc", isFurniture: true, sizeM: { w: 0.6, d: 0.65, h: 1.8 } },
  { kind: "furniture_plant", category: "furniture", label: "Pflanze", labelPro: "Pflanze", defaultHeight: 0, wallBound: false, color: "#16a34a", isFurniture: true, sizeM: { w: 0.4, d: 0.4, h: 1.0 } },
  { kind: "furniture_rug", category: "furniture", label: "Teppich", labelPro: "Teppich", defaultHeight: 0, wallBound: false, color: "#b45309", isFurniture: true, sizeM: { w: 2.0, d: 1.4, h: 0.02 } },
];

export function getSymbolDef(kind: SymbolKind): SymbolDef {
  const def = SYMBOL_CATALOG.find((s) => s.kind === kind);
  if (!def) throw new Error(`Unknown symbol: ${kind}`);
  return def;
}

export const CATEGORY_LABELS: Record<SymbolCategory, string> = {
  outlet: "Steckdosen",
  switch: "Schalter",
  light: "Beleuchtung",
  data: "Netzwerk / Daten",
  av: "TV / Sat",
  control: "Steuerung / Funk",
  panel: "Verteiler",
  safety: "Sicherheit",
  appliance: "Haushaltsgeräte",
  sanitary: "Sanitär (Bad / WC / Heizung)",
  furniture: "Möbel / Einrichten",
};

export const MODE_HELP = {
  homeowner: {
    title: "Bauherren-Modus",
    points: [
      "Einfache Bezeichnungen (Steckdose, Schalter…)",
      "Möbel-Platzhalter & Raum-Tipps",
      "Notizen ohne Fachjargon",
    ],
  },
  pro: {
    title: "Elektriker-Profi-Modus",
    points: [
      "Fachkürzel (SCHUKO, WS, LA…)",
      "Stromkreis, FI-Gruppe, Leitungstyp",
      "Einbauhöhen am Plan + Warnung >10 SD/Kreis",
    ],
  },
} as const;
