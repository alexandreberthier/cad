"use client";

import type { SymbolKind } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";

/** Kompakte DIN-nahe SVG-Glyphen in Kategorie-Farbe */
export function SymbolGlyph({
  kind,
  size = 22,
  className,
  color: colorProp,
}: {
  kind: SymbolKind;
  size?: number;
  className?: string;
  color?: string;
}) {
  const color = colorProp ?? getSymbolDef(kind).color;
  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <GlyphPaths kind={kind} color={color} />
      </svg>
    </span>
  );
}

function strokeProps(color: string) {
  return {
    fill: "none" as const,
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function GlyphPaths({ kind, color }: { kind: SymbolKind; color: string }) {
  const S = strokeProps(color);
  const fillSoft = { fill: `${color}33`, stroke: color, strokeWidth: 1.5 };

  // Möbel-Draufsicht (Sidebar) – erkennbar, nicht nur Kasten
  switch (kind) {
    case "furniture_bed":
    case "furniture_bed_single":
      return (
        <g>
          <rect x="6" y="8" width="20" height={kind === "furniture_bed" ? 18 : 14} rx="1.5" {...fillSoft} />
          <rect x="7" y="9" width="4" height={kind === "furniture_bed" ? 16 : 12} fill={`${color}55`} stroke={color} strokeWidth="1" />
          <rect x="12" y="10" width="6" height="5" fill="#f8fafc" stroke={color} strokeWidth="1" />
          {kind === "furniture_bed" && (
            <rect x="19" y="10" width="6" height="5" fill="#f8fafc" stroke={color} strokeWidth="1" />
          )}
        </g>
      );
    case "furniture_sofa":
      return (
        <g>
          <rect x="5" y="14" width="22" height="10" rx="2" {...fillSoft} />
          <rect x="5" y="8" width="22" height="7" rx="2" fill={`${color}55`} stroke={color} strokeWidth="1.5" />
          <rect x="5" y="14" width="3" height="10" fill={`${color}44`} stroke={color} strokeWidth="1" />
          <rect x="24" y="14" width="3" height="10" fill={`${color}44`} stroke={color} strokeWidth="1" />
        </g>
      );
    case "furniture_armchair":
      return (
        <g>
          <rect x="8" y="14" width="16" height="10" rx="2" {...fillSoft} />
          <rect x="8" y="8" width="16" height="7" rx="2" fill={`${color}55`} stroke={color} strokeWidth="1.5" />
        </g>
      );
    case "furniture_dining_chair":
      return (
        <g>
          <rect x="10" y="14" width="12" height="10" rx="1" {...fillSoft} />
          <rect x="10" y="8" width="12" height="5" stroke={color} strokeWidth="1.5" fill="none" />
        </g>
      );
    case "furniture_table":
    case "furniture_desk":
    case "furniture_coffee_table":
      return (
        <g>
          <rect
            x={kind === "furniture_coffee_table" ? 8 : 6}
            y={kind === "furniture_coffee_table" ? 11 : 10}
            width={kind === "furniture_coffee_table" ? 16 : 20}
            height={kind === "furniture_coffee_table" ? 10 : 12}
            rx={kind === "furniture_coffee_table" ? 3 : 1}
            {...fillSoft}
          />
          <circle cx="10" cy="12" r="1.2" fill={color} />
          <circle cx="22" cy="12" r="1.2" fill={color} />
          <circle cx="10" cy="20" r="1.2" fill={color} />
          <circle cx="22" cy="20" r="1.2" fill={color} />
        </g>
      );
    case "furniture_tv":
      return (
        <g>
          <rect x="6" y="18" width="20" height="8" rx="1" {...fillSoft} />
          <rect x="9" y="8" width="14" height="9" fill="#1e293b" stroke={color} strokeWidth="1.5" />
        </g>
      );
    case "furniture_bookshelf":
    case "furniture_wardrobe":
    case "furniture_dresser":
    case "furniture_nightstand":
      return (
        <g>
          <rect x="8" y="6" width="16" height="20" rx="1" {...fillSoft} />
          <line x1="16" y1="8" x2="16" y2="24" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
        </g>
      );
    case "furniture_kitchen":
      return (
        <g>
          <rect x="4" y="12" width="24" height="10" {...fillSoft} />
          <line x1="12" y1="12" x2="12" y2="22" stroke={color} strokeWidth="1" />
          <line x1="20" y1="12" x2="20" y2="22" stroke={color} strokeWidth="1" />
          <circle cx="16" cy="17" r="2.5" stroke={color} strokeWidth="1" fill="none" />
        </g>
      );
    case "furniture_fridge":
      return (
        <g>
          <rect x="10" y="5" width="12" height="22" rx="1" {...fillSoft} />
          <line x1="10" y1="14" x2="22" y2="14" stroke={color} strokeWidth="1" />
          <line x1="20" y1="8" x2="20" y2="12" stroke={color} strokeWidth="1.5" />
        </g>
      );
    case "furniture_plant":
      return (
        <g>
          <circle cx="16" cy="14" r="7" fill={`${color}44`} stroke={color} strokeWidth="1.5" />
          <circle cx="16" cy="14" r="3" fill={color} />
          <rect x="14" y="22" width="4" height="5" fill="#a16207" stroke={color} strokeWidth="1" />
        </g>
      );
    case "furniture_rug":
      return (
        <g>
          <rect x="5" y="10" width="22" height="14" rx="1" fill={`${color}33`} stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
        </g>
      );
    default:
      break;
  }

  switch (kind) {
    case "outlet_1":
    case "outlet_counter":
    case "outlet_switched":
    case "outlet_usb":
      return (
        <g>
          {/* Halbkreis zur Raumseite – DIN-Stil */}
          <path d="M8 18a8 8 0 0116 0" {...S} />
          <line x1="16" y1="10" x2="16" y2="18" {...S} />
          <line x1="13" y1="18" x2="19" y2="18" {...S} />
          {kind === "outlet_switched" && (
            <line x1="16" y1="10" x2="21" y2="7" {...S} />
          )}
          {kind === "outlet_usb" && (
            <text x="16" y="26" textAnchor="middle" fontSize="5" fill={color}>
              USB
            </text>
          )}
        </g>
      );
    case "outlet_2":
      return (
        <g>
          <path d="M6 18a7 7 0 0110 0" {...S} />
          <path d="M16 18a7 7 0 0110 0" {...S} />
          <line x1="11" y1="11" x2="11" y2="18" {...S} />
          <line x1="21" y1="11" x2="21" y2="18" {...S} />
        </g>
      );
    case "outlet_3":
      return (
        <g>
          <rect x="5" y="10" width="22" height="12" rx="2" {...S} />
          <line x1="10" y1="13" x2="10" y2="19" {...S} />
          <line x1="16" y1="13" x2="16" y2="19" {...S} />
          <line x1="22" y1="13" x2="22" y2="19" {...S} />
        </g>
      );
    case "outlet_wet":
      return (
        <g>
          <path d="M8 18a8 8 0 0116 0" {...S} />
          <line x1="16" y1="10" x2="16" y2="18" {...S} />
          <line x1="22" y1="14" x2="26" y2="14" {...S} />
        </g>
      );
    case "outlet_cee":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <circle cx="16" cy="16" r="3" fill={color} />
        </g>
      );
    case "outlet_floor":
      return (
        <g>
          <rect x="8" y="8" width="16" height="16" rx="1" {...S} />
          <path d="M11 20a5 5 0 0110 0" {...S} />
        </g>
      );
    case "switch_off":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <line x1="16" y1="8" x2="16" y2="16" {...S} />
          <line x1="16" y1="16" x2="22" y2="12" {...S} />
        </g>
      );
    case "switch_changeover":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <line x1="10" y1="20" x2="16" y2="11" {...S} />
          <line x1="16" y1="11" x2="22" y2="20" {...S} />
        </g>
      );
    case "switch_cross":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <line x1="10" y1="10" x2="22" y2="22" {...S} />
          <line x1="22" y1="10" x2="10" y2="22" {...S} />
        </g>
      );
    case "switch_series":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <path d="M11 20L16 12L21 20" {...S} />
        </g>
      );
    case "switch_push":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <circle cx="16" cy="16" r="3.5" {...S} />
        </g>
      );
    case "switch_dimmer":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <path d="M11 20c2-7 8-7 10 0" {...S} />
        </g>
      );
    case "shutter_switch":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <path d="M16 9v6M13 12l3-3 3 3M13 20l3 3 3-3M16 17v6" {...S} />
        </g>
      );
    case "ceiling_outlet":
      return (
        <g>
          <line x1="10" y1="10" x2="22" y2="22" {...S} />
          <line x1="22" y1="10" x2="10" y2="22" {...S} />
        </g>
      );
    case "wall_outlet":
      return (
        <g>
          <line x1="10" y1="10" x2="22" y2="22" {...S} />
          <line x1="22" y1="10" x2="10" y2="22" {...S} />
          <line x1="8" y1="24" x2="24" y2="24" {...S} />
        </g>
      );
    case "recessed_spot":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <line x1="11" y1="11" x2="21" y2="21" {...S} />
          <line x1="21" y1="11" x2="11" y2="21" {...S} />
        </g>
      );
    case "rj45":
    case "phone":
      return (
        <g>
          <path d="M10 12h12v10H10z" {...S} />
          <path d="M10 12c0-4 12-4 12 0" {...S} />
          {kind === "rj45" && (
            <text x="16" y="20" textAnchor="middle" fontSize="6" fill={color}>
              RJ
            </text>
          )}
        </g>
      );
    case "tv_sat":
      return (
        <g>
          <path d="M10 12h12v10H10z" {...S} />
          <path d="M10 12c0-4 12-4 12 0" {...S} />
          <path d="M10 12c0-2 12-2 12 0" {...S} />
        </g>
      );
    case "wireless_actor":
      return (
        <g>
          <rect x="9" y="12" width="14" height="10" rx="1" {...S} />
          <path d="M12 11c2-2 6-2 8 0" {...S} />
        </g>
      );
    case "doorbell":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <circle cx="16" cy="16" r="3" {...S} />
          <line x1="16" y1="6" x2="16" y2="4" {...S} />
        </g>
      );
    case "intercom":
      return (
        <g>
          <rect x="10" y="7" width="12" height="18" rx="1" {...S} />
          <circle cx="16" cy="14" r="2.5" {...S} />
          <line x1="13" y1="20" x2="19" y2="20" {...S} />
        </g>
      );
    case "motion_sensor":
      return (
        <g>
          <circle cx="16" cy="16" r="5" {...S} />
          <path d="M8 16c2-6 14-6 16 0M10 20c1.5 3 10.5 3 12 0" {...S} />
        </g>
      );
    case "smoke_detector":
      return (
        <g>
          <rect x="9" y="9" width="14" height="14" {...S} />
          <path d="M12 14l4 6 4-6" {...S} />
        </g>
      );
    case "distribution_board":
      return (
        <g>
          <rect x="8" y="6" width="16" height="20" {...S} />
          <path d="M8 6l16 20" {...S} />
          <rect x="8" y="6" width="8" height="10" fill={color} opacity="0.2" />
        </g>
      );
    case "junction_box":
      return (
        <g>
          <circle cx="16" cy="16" r="6" {...S} />
          <circle cx="16" cy="16" r="2" fill={color} />
        </g>
      );
    case "stove_outlet":
      return (
        <g>
          <rect x="8" y="8" width="16" height="16" {...S} />
          <circle cx="12" cy="14" r="1.5" fill={color} />
          <circle cx="16" cy="18" r="1.5" fill={color} />
          <circle cx="20" cy="14" r="1.5" fill={color} />
        </g>
      );
    case "water_heater":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <circle cx="16" cy="16" r="2" fill={color} />
          <line x1="16" y1="8" x2="16" y2="4" {...S} />
        </g>
      );
    case "washing_machine":
    case "dryer":
      return (
        <g>
          <rect x="8" y="7" width="16" height="18" rx="1" {...S} />
          <circle cx="16" cy="17" r="5" {...S} />
          {kind === "dryer" && <path d="M14 15c2-1 4 1 2 3" {...S} />}
        </g>
      );
    case "dishwasher":
      return (
        <g>
          <rect x="8" y="8" width="16" height="16" {...S} />
          <line x1="8" y1="12" x2="24" y2="12" {...S} />
          <path d="M12 16h8M12 19h8" {...S} />
        </g>
      );
    case "extractor_hood":
      return (
        <g>
          <path d="M6 20h20l-4-8H10z" {...S} />
          <rect x="13" y="8" width="6" height="4" {...S} />
        </g>
      );
    case "san_toilet":
      return (
        <g>
          <ellipse cx="16" cy="20" rx="7" ry="5" {...S} />
          <rect x="12" y="7" width="8" height="10" rx="1" {...S} />
        </g>
      );
    case "san_sink":
      return (
        <g>
          <ellipse cx="16" cy="16" rx="9" ry="6" {...S} />
          <circle cx="16" cy="16" r="2" {...S} />
        </g>
      );
    case "san_bathtub":
      return (
        <g>
          <rect x="5" y="12" width="22" height="10" rx="4" {...S} />
          <line x1="5" y1="12" x2="5" y2="8" {...S} />
        </g>
      );
    case "san_shower":
      return (
        <g>
          <rect x="8" y="8" width="16" height="16" {...S} />
          <path d="M16 8v4M12 14c2 2 6 2 8 0" {...S} />
        </g>
      );
    case "san_bidet":
      return (
        <g>
          <ellipse cx="16" cy="18" rx="6" ry="5" {...S} />
          <rect x="13" y="8" width="6" height="8" {...S} />
        </g>
      );
    case "san_kitchen_sink":
      return (
        <g>
          <rect x="6" y="10" width="20" height="12" rx="1" {...S} />
          <line x1="16" y1="10" x2="16" y2="22" {...S} />
        </g>
      );
    case "san_radiator":
    case "san_towel_radiator":
      return (
        <g>
          <rect x="7" y="8" width="18" height={kind === "san_towel_radiator" ? 16 : 12} {...S} />
          <line x1="10" y1="12" x2="22" y2="12" {...S} />
          <line x1="10" y1="16" x2="22" y2="16" {...S} />
        </g>
      );
    case "san_floor_drain":
      return (
        <g>
          <circle cx="16" cy="16" r="7" {...S} />
          <line x1="16" y1="9" x2="16" y2="23" {...S} />
          <line x1="9" y1="16" x2="23" y2="16" {...S} />
        </g>
      );
    case "san_washing_connection":
      return (
        <g>
          <circle cx="16" cy="16" r="6" {...S} />
          <path d="M16 10v12M13 13h6" {...S} />
        </g>
      );
    case "light_led_strip":
      return (
        <g>
          <line x1="6" y1="16" x2="26" y2="16" {...S} />
          {[8, 12, 16, 20, 24].map((x) => (
            <circle key={x} cx={x} cy="16" r="1.5" fill={color} />
          ))}
        </g>
      );
    case "light_outdoor":
      return (
        <g>
          <line x1="10" y1="10" x2="22" y2="22" {...S} />
          <line x1="22" y1="10" x2="10" y2="22" {...S} />
          <rect x="8" y="24" width="16" height="3" {...S} />
        </g>
      );
    case "emergency_light":
      return (
        <g>
          <circle cx="16" cy="14" r="7" {...S} />
          <line x1="11" y1="14" x2="21" y2="14" {...S} />
          <line x1="16" y1="9" x2="16" y2="19" {...S} />
          <text x="16" y="28" textAnchor="middle" fontSize="5" fill={color}>
            NL
          </text>
        </g>
      );
    case "fiber":
      return (
        <g>
          <rect x="8" y="12" width="16" height="12" {...S} />
          <path d="M8 12l4-5h8l4 5" {...S} />
          <text x="16" y="21" textAnchor="middle" fontSize="5" fill={color}>
            LWL
          </text>
        </g>
      );
    case "speaker":
      return (
        <g>
          <circle cx="16" cy="16" r="7" {...S} />
          <path d="M12 14a5 5 0 010 4M10 12a8 8 0 010 8" {...S} />
        </g>
      );
    case "thermostat":
      return (
        <g>
          <rect x="10" y="6" width="12" height="20" rx="1" {...S} />
          <circle cx="16" cy="14" r="3" {...S} />
        </g>
      );
    case "camera_cctv":
      return (
        <g>
          <rect x="6" y="12" width="14" height="10" {...S} />
          <circle cx="24" cy="17" r="4" {...S} />
        </g>
      );
    case "ev_charger":
      return (
        <g>
          <rect x="10" y="6" width="12" height="20" {...S} />
          <text x="16" y="19" textAnchor="middle" fontSize="7" fill={color}>
            EV
          </text>
        </g>
      );
    case "pv_inverter":
      return (
        <g>
          <rect x="8" y="8" width="16" height="16" {...S} />
          <text x="16" y="19" textAnchor="middle" fontSize="7" fill={color}>
            WR
          </text>
        </g>
      );
    case "fan_exhaust":
      return (
        <g>
          <circle cx="16" cy="16" r="8" {...S} />
          <line x1="10" y1="16" x2="22" y2="16" {...S} />
          <line x1="16" y1="10" x2="16" y2="22" {...S} />
        </g>
      );
    default:
      return <rect x="8" y="10" width="16" height="12" rx="1" {...S} />;
  }
}

