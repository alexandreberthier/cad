import Dexie, { type Table } from "dexie";
import type { ProjectData } from "@/types/project";

export interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: string;
  data: ProjectData;
}

class ElektroCadDB extends Dexie {
  projects!: Table<ProjectRecord, string>;

  constructor() {
    super("elektro-cad");
    this.version(1).stores({
      projects: "id, name, updatedAt",
    });
  }
}

export const db = new ElektroCadDB();

export async function saveProject(data: ProjectData): Promise<void> {
  await db.projects.put({
    id: data.meta.id,
    name: data.meta.name,
    updatedAt: data.meta.updatedAt,
    data,
  });
}

export async function loadProject(id: string): Promise<ProjectData | undefined> {
  const row = await db.projects.get(id);
  return row?.data;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}
