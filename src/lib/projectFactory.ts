import type { Floor, ProjectData } from "@/types/project";
import { id } from "@/lib/id";

export function createDefaultFloor(overrides?: Partial<Floor>): Floor {
  return {
    id: id(),
    name: "EG",
    height: 2.5,
    slabThickness: 0.2,
    order: 0,
    ...overrides,
  };
}

export function createEmptyProject(name = "Neues Projekt"): ProjectData {
  const floor = createDefaultFloor();
  const now = new Date().toISOString();
  return {
    meta: {
      id: id(),
      name,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    floors: [floor],
    activeFloorId: floor.id,
    walls: [],
    openings: [],
    symbols: [],
    rooms: [],
    connections: [],
    symbolColorDefaults: {},
  };
}

/** Alte Projekte ohne neue Felder nachziehen */
export function normalizeProjectData(data: ProjectData): ProjectData {
  return {
    ...data,
    symbolColorDefaults: data.symbolColorDefaults ?? {},
    symbols: (data.symbols ?? []).map((s) => ({ ...s })),
  };
}
