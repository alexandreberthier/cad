"use client";

import { Billboard, Text } from "@react-three/drei";
import type { PlanSymbol, SymbolKind } from "@/types/project";
import { getSymbolDef } from "@/lib/symbols/catalog";
import { resolveSymbolSize, type Size3 } from "@/lib/symbols/size";

/**
 * Erkennbare 3D-Platzhalter je Kategorie (prozedural).
 * Fußboden-Objekte sitzen auf y=0; Labels immer lesbar (depthTest aus).
 */
export function SymbolMesh3D({
  symbol,
  label,
  color,
}: {
  symbol: PlanSymbol;
  label: string;
  color?: string;
}) {
  const def = getSymbolDef(symbol.kind);
  const ink = color ?? def.color;
  const size = resolveSymbolSize(symbol.kind, symbol.sizeM);
  const x = symbol.position.x;
  const z = symbol.position.y;
  const onFloor =
    def.isFurniture ||
    def.category === "sanitary" ||
    symbol.kind === "washing_machine" ||
    symbol.kind === "dryer" ||
    symbol.kind === "dishwasher";

  const bodyH = size?.h ?? (onFloor ? 0.5 : 0.1);
  const groupY = onFloor ? 0 : Math.max(0.05, symbol.mountHeight);
  const labelY = onFloor ? bodyH + 0.12 : 0.22;

  return (
    <group position={[x, groupY, z]} rotation={[0, -symbol.rotation, 0]}>
      <MeshByKind kind={symbol.kind} color={ink} size={size} />
      <Billboard position={[0, labelY, 0]} follow>
        <Text
          fontSize={0.13}
          color="#0f172a"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#f8fafc"
          maxWidth={1.4}
          renderOrder={20}
          onSync={(troika) => {
            const mat = troika.material as {
              depthTest?: boolean;
              depthWrite?: boolean;
            };
            if (mat) {
              mat.depthTest = false;
              mat.depthWrite = false;
            }
          }}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

function MeshByKind({
  kind,
  color,
  size,
}: {
  kind: SymbolKind;
  color: string;
  size: Size3 | null;
}) {
  const def = getSymbolDef(kind);

  // —— Licht ——
  if (
    kind === "ceiling_outlet" ||
    kind === "recessed_spot" ||
    kind === "emergency_light"
  ) {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshLambertMaterial
            color="#fde68a"
            emissive={color}
            emissiveIntensity={0.35}
          />
        </mesh>
        {(kind === "recessed_spot" || kind === "emergency_light") && (
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.04, 16]} />
            <meshLambertMaterial color="#334155" />
          </mesh>
        )}
      </group>
    );
  }
  if (kind === "wall_outlet") {
    return (
      <group>
        <mesh position={[0, 0, 0.04]}>
          <sphereGeometry args={[0.06, 12, 10]} />
          <meshLambertMaterial
            color="#fde68a"
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[0.12, 0.12, 0.03]} />
          <meshLambertMaterial color="#f8fafc" />
        </mesh>
      </group>
    );
  }
  if (kind === "light_led_strip") {
    return (
      <mesh>
        <boxGeometry args={[0.8, 0.02, 0.03]} />
        <meshLambertMaterial
          color="#fde68a"
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
    );
  }
  if (kind === "light_outdoor") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.16, 0.1, 0.08]} />
          <meshLambertMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, -0.04, 0.05]}>
          <sphereGeometry args={[0.04, 12, 10]} />
          <meshLambertMaterial
            color="#fde68a"
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    );
  }

  // —— Steckdosen ——
  if (kind.startsWith("outlet")) {
    const wide = kind === "outlet_2" || kind === "outlet_3" ? 0.14 : 0.09;
    return (
      <group>
        <mesh>
          <boxGeometry args={[wide, 0.09, 0.025]} />
          <meshLambertMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
          <meshLambertMaterial color={color} />
        </mesh>
        {kind === "outlet_cee" && (
          <mesh position={[0, 0, 0.035]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 6]} />
            <meshLambertMaterial color="#dc2626" />
          </mesh>
        )}
        {kind === "outlet_usb" && (
          <mesh position={[0, -0.04, 0.02]}>
            <boxGeometry args={[0.04, 0.015, 0.01]} />
            <meshLambertMaterial color="#1d4ed8" />
          </mesh>
        )}
      </group>
    );
  }

  // —— Schalter ——
  if (
    kind.startsWith("switch") ||
    kind === "shutter_switch" ||
    kind === "doorbell"
  ) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshLambertMaterial color="#f1f5f9" />
        </mesh>
        <mesh position={[0, 0.01, 0.025]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.025, 0.04, 0.012]} />
          <meshLambertMaterial color={color} />
        </mesh>
      </group>
    );
  }

  // —— Daten / AV ——
  if (kind === "speaker") {
    const s = size ?? { w: 0.22, d: 0.14, h: 0.3 };
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[s.w, s.h, s.d]} />
          <meshLambertMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.02, s.d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
          <meshLambertMaterial color="#94a3b8" />
        </mesh>
      </group>
    );
  }
  if (
    kind === "rj45" ||
    kind === "phone" ||
    kind === "tv_sat" ||
    kind === "fiber"
  ) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.07, 0.07, 0.03]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.01, 0.02]}>
          <boxGeometry args={[0.035, 0.025, 0.02]} />
          <meshLambertMaterial color="#0f172a" />
        </mesh>
      </group>
    );
  }

  if (
    kind === "smoke_detector" ||
    kind === "motion_sensor" ||
    kind === "camera_cctv"
  ) {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
        <meshLambertMaterial color={color} />
      </mesh>
    );
  }

  if (kind === "junction_box") {
    return (
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
        <meshLambertMaterial color={color} />
      </mesh>
    );
  }
  if (kind === "thermostat" || kind === "intercom") {
    return (
      <mesh>
        <boxGeometry args={[0.08, 0.12, 0.025]} />
        <meshLambertMaterial color={color} />
      </mesh>
    );
  }
  if (kind === "ev_charger" || kind === "pv_inverter") {
    const s = size ?? { w: 0.35, d: 0.2, h: 0.5 };
    return (
      <mesh position={[0, s.h / 2, 0]}>
        <boxGeometry args={[s.w, s.h, s.d]} />
        <meshLambertMaterial color={color} />
      </mesh>
    );
  }
  if (kind === "fan_exhaust") {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
        <meshLambertMaterial color={color} />
      </mesh>
    );
  }

  if (kind === "distribution_board") {
    const s = size ?? { w: 0.4, d: 0.15, h: 0.6 };
    return (
      <mesh position={[0, s.h / 2, 0]}>
        <boxGeometry args={[s.w, s.h, s.d]} />
        <meshLambertMaterial color="#1e293b" />
      </mesh>
    );
  }

  // —— Sanitär ——
  if (kind === "san_toilet") {
    return (
      <group>
        <mesh position={[0, 0.2, 0.1]}>
          <boxGeometry args={[0.35, 0.4, 0.2]} />
          <meshLambertMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[0, 0.15, -0.1]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshLambertMaterial color="#f8fafc" />
        </mesh>
      </group>
    );
  }
  if (kind === "san_bathtub") {
    return (
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[1.7, 0.45, 0.7]} />
        <meshLambertMaterial color="#e0f2fe" />
      </mesh>
    );
  }
  if (kind === "san_shower") {
    return (
      <group>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.9, 0.04, 0.9]} />
          <meshLambertMaterial color="#bae6fd" />
        </mesh>
        <mesh position={[0.35, 0.5, 0.35]}>
          <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
          <meshLambertMaterial color="#94a3b8" />
        </mesh>
      </group>
    );
  }
  if (
    kind === "san_sink" ||
    kind === "san_kitchen_sink" ||
    kind === "san_bidet"
  ) {
    const w = size?.w ?? 0.5;
    const d = size?.d ?? 0.4;
    return (
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[w, 0.15, d]} />
        <meshLambertMaterial color="#f0f9ff" />
      </mesh>
    );
  }
  if (kind === "san_radiator" || kind === "san_towel_radiator") {
    const s = size ?? { w: 0.6, d: 0.1, h: 0.6 };
    return (
      <mesh position={[0, s.h / 2, 0]}>
        <boxGeometry args={[s.w, s.h, s.d]} />
        <meshLambertMaterial color={color} />
      </mesh>
    );
  }
  if (kind === "san_floor_drain") {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
        <meshLambertMaterial color="#64748b" />
      </mesh>
    );
  }

  if (def.isFurniture) {
    return <FurnitureMesh3D kind={kind} color={color} size={size} />;
  }

  const s = size ?? { w: 0.12, d: 0.08, h: 0.1 };
  const h = def.category === "appliance" ? s.h : 0.1;
  return (
    <mesh position={[0, def.category === "appliance" ? h / 2 : 0, 0]}>
      <boxGeometry args={[s.w, h, s.d]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function FurnitureMesh3D({
  kind,
  color,
  size,
}: {
  kind: SymbolKind;
  color: string;
  size: Size3 | null;
}) {
  const s = size ?? { w: 0.8, d: 0.6, h: 0.5 };
  const wood = "#92400e";
  const fabric = color || "#78716c";
  const cream = "#f5f5f4";

  if (kind === "furniture_bed" || kind === "furniture_bed_single") {
    return (
      <group>
        <mesh position={[0, s.h * 0.35, 0]}>
          <boxGeometry args={[s.w, s.h * 0.35, s.d]} />
          <meshLambertMaterial color={wood} />
        </mesh>
        <mesh position={[0, s.h * 0.55, 0.05]}>
          <boxGeometry args={[s.w * 0.92, 0.12, s.d * 0.85]} />
          <meshLambertMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[-s.w * 0.28, s.h * 0.62, -s.d * 0.28]}>
          <boxGeometry args={[s.w * 0.28, 0.14, s.d * 0.22]} />
          <meshLambertMaterial color="#f8fafc" />
        </mesh>
        {kind === "furniture_bed" && (
          <mesh position={[s.w * 0.28, s.h * 0.62, -s.d * 0.28]}>
            <boxGeometry args={[s.w * 0.28, 0.14, s.d * 0.22]} />
            <meshLambertMaterial color="#f8fafc" />
          </mesh>
        )}
        <mesh position={[0, s.h * 0.7, -s.d * 0.45]}>
          <boxGeometry args={[s.w, s.h * 0.55, 0.06]} />
          <meshLambertMaterial color={wood} />
        </mesh>
      </group>
    );
  }
  if (kind === "furniture_sofa" || kind === "furniture_armchair") {
    const wide = kind === "furniture_sofa";
    return (
      <group>
        <mesh position={[0, 0.22, 0.05]}>
          <boxGeometry args={[s.w, 0.28, s.d * 0.7]} />
          <meshLambertMaterial color={fabric} />
        </mesh>
        <mesh position={[0, 0.42, -s.d * 0.28]}>
          <boxGeometry args={[s.w, 0.35, 0.12]} />
          <meshLambertMaterial color={fabric} />
        </mesh>
        <mesh position={[-s.w * 0.42, 0.32, 0.05]}>
          <boxGeometry args={[0.12, 0.28, s.d * 0.65]} />
          <meshLambertMaterial color={fabric} />
        </mesh>
        {wide && (
          <mesh position={[s.w * 0.42, 0.32, 0.05]}>
            <boxGeometry args={[0.12, 0.28, s.d * 0.65]} />
            <meshLambertMaterial color={fabric} />
          </mesh>
        )}
      </group>
    );
  }
  if (kind === "furniture_dining_chair") {
    return (
      <group>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[s.w, 0.06, s.d]} />
          <meshLambertMaterial color={wood} />
        </mesh>
        <mesh position={[0, 0.7, -s.d * 0.4]}>
          <boxGeometry args={[s.w, 0.45, 0.05]} />
          <meshLambertMaterial color={wood} />
        </mesh>
      </group>
    );
  }
  if (
    kind === "furniture_table" ||
    kind === "furniture_desk" ||
    kind === "furniture_coffee_table"
  ) {
    return (
      <group>
        <mesh position={[0, s.h - 0.03, 0]}>
          <boxGeometry args={[s.w, 0.05, s.d]} />
          <meshLambertMaterial color={wood} />
        </mesh>
        {(
          [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ] as const
        ).map(([ix, iz]) => (
          <mesh
            key={`${ix}${iz}`}
            position={[ix * s.w * 0.4, (s.h - 0.05) / 2, iz * s.d * 0.35]}
          >
            <boxGeometry args={[0.05, s.h - 0.05, 0.05]} />
            <meshLambertMaterial color={wood} />
          </mesh>
        ))}
      </group>
    );
  }
  if (kind === "furniture_tv") {
    return (
      <group>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[s.w, 0.4, s.d]} />
          <meshLambertMaterial color="#44403c" />
        </mesh>
        <mesh position={[0, 0.72, -0.02]}>
          <boxGeometry args={[s.w * 0.75, 0.45, 0.05]} />
          <meshLambertMaterial color="#0f172a" />
        </mesh>
      </group>
    );
  }
  if (kind === "furniture_plant") {
    return (
      <group>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.24, 12]} />
          <meshLambertMaterial color="#a16207" />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.28, 12, 10]} />
          <meshLambertMaterial color="#16a34a" />
        </mesh>
      </group>
    );
  }
  if (kind === "furniture_rug") {
    return (
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[s.w, s.d]} />
        <meshLambertMaterial color={color} transparent opacity={0.85} />
      </mesh>
    );
  }
  if (kind === "furniture_kitchen") {
    return (
      <group>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[s.w, 0.9, s.d]} />
          <meshLambertMaterial color={cream} />
        </mesh>
        <mesh position={[s.w * 0.15, 0.92, 0]}>
          <boxGeometry args={[s.w * 0.35, 0.04, s.d * 0.9]} />
          <meshLambertMaterial color="#cbd5e1" />
        </mesh>
      </group>
    );
  }
  if (kind === "furniture_fridge") {
    return (
      <group>
        <mesh position={[0, s.h / 2, 0]}>
          <boxGeometry args={[s.w, s.h, s.d]} />
          <meshLambertMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[s.w * 0.42, s.h * 0.55, s.d / 2 + 0.005]}>
          <boxGeometry args={[0.02, 0.25, 0.01]} />
          <meshLambertMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, s.h * 0.55, 0]}>
          <boxGeometry args={[s.w * 0.98, 0.02, s.d * 0.98]} />
          <meshLambertMaterial color="#e2e8f0" />
        </mesh>
      </group>
    );
  }

  return (
    <mesh position={[0, s.h / 2, 0]}>
      <boxGeometry args={[s.w, s.h, s.d]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}
