import type Konva from "konva";

let stage: Konva.Stage | null = null;

export function registerPlanStage(next: Konva.Stage | null) {
  stage = next;
}

/** PNG der aktuellen 2D-Ansicht. null, wenn der Plan nicht gemountet ist. */
export function capturePlanPng(): string | null {
  if (!stage) return null;
  return stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
}
