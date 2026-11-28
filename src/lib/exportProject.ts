import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import type { ProjectData } from "@/types/project";
import {
  bomCsv,
  bomForSymbols,
  circuitDetailCsv,
  circuitForest,
  kindSummary,
} from "@/lib/bom";
import { analyzePlanHealth } from "@/lib/planHealth";
import { CATEGORY_LABELS } from "@/lib/symbols/catalog";
import { normalizeProjectData } from "@/lib/projectFactory";

export function downloadProjectJson(data: ProjectData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  saveAs(blob, `${safeName(data.meta.name)}.elektro-cad.json`);
}

export function downloadBomCsv(data: ProjectData) {
  const blob = new Blob(["\uFEFF" + bomCsv(data)], {
    type: "text/csv;charset=utf-8",
  });
  saveAs(blob, `${safeName(data.meta.name)}-stueckliste.csv`);
}

export function downloadCircuitCsv(data: ProjectData) {
  const blob = new Blob(["\uFEFF" + circuitDetailCsv(data)], {
    type: "text/csv;charset=utf-8",
  });
  saveAs(blob, `${safeName(data.meta.name)}-stromkreise.csv`);
}

export function downloadReportPdf(data: ProjectData, planPng?: string | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  let y = 18;
  const pageH = doc.internal.pageSize.getHeight();

  const line = (text: string, size = 10, gap = 5) => {
    doc.setFontSize(size);
    const rows = doc.splitTextToSize(text, 180) as string[];
    for (const row of rows) {
      if (y > pageH - 16) {
        doc.addPage();
        y = 18;
      }
      doc.text(row, margin, y);
      y += gap;
    }
  };

  doc.setFont("helvetica", "bold");
  line(data.meta.name || "ElektroCAD", 16, 8);
  doc.setFont("helvetica", "normal");
  line(`Stand ${new Date(data.meta.updatedAt).toLocaleString("de-DE")}`, 9, 6);
  line(
    "Stückliste und Stromkreise. Farben im Plan sind Bildschirmhilfe, Norm-Druck ist schwarz.",
    9,
    8
  );

  const anyBg = data.floors.some((f) => f.background);
  const unscaled = data.floors.some(
    (f) => f.background && f.background.metersPerPixel == null
  );
  const health = analyzePlanHealth(data.symbols, {
    hasBackground: anyBg,
    metersPerPixel: unscaled ? null : 0.02,
  });
  const healthWarns = health.filter((i) => i.level === "warn");
  if (healthWarns.length) {
    doc.setFont("helvetica", "bold");
    line("Plan-Check (Hinweise)", 12, 6);
    doc.setFont("helvetica", "normal");
    for (const h of healthWarns.slice(0, 8)) {
      line(`• ${h.title}${h.detail ? ` – ${h.detail}` : ""}`, 9, 4.5);
    }
    y += 2;
  }

  const legend = bomForSymbols(data.symbols);
  if (legend.length) {
    doc.setFont("helvetica", "bold");
    line("Legende (verwendete Symbole)", 12, 6);
    doc.setFont("helvetica", "normal");
    for (const r of legend.slice(0, 40)) {
      line(
        `${r.labelPro}  ·  ${CATEGORY_LABELS[r.category]}  ·  ${r.count}×`,
        9,
        4.2
      );
    }
    if (legend.length > 40) {
      line(`… und ${legend.length - 40} weitere`, 8, 4);
    }
    y += 2;
  }

  for (const floor of [...data.floors].sort((a, b) => a.order - b.order)) {
    doc.setFont("helvetica", "bold");
    line(`Etage ${floor.name}`, 13, 7);
    doc.setFont("helvetica", "normal");
    const rows = bomForSymbols(
      data.symbols.filter((s) => s.floorId === floor.id)
    );
    if (!rows.length) {
      line("Keine Elektro-Symbole.", 10, 6);
      continue;
    }
    const total = rows.reduce((n, r) => n + r.count, 0);
    line(`${total} Positionen`, 10, 6);
    for (const r of rows) {
      const cat = CATEGORY_LABELS[r.category];
      const circles = r.circuits.length ? ` · ${r.circuits.join(", ")}` : "";
      line(`${r.count}×  ${r.label} (${r.labelPro})  · ${cat}${circles}`, 10, 5);
    }

    const forest = circuitForest(
      data.symbols.filter((s) => s.floorId === floor.id)
    );
    if (forest.deviceCount) {
      y += 2;
      doc.setFont("helvetica", "bold");
      line("Stromkreise", 12, 6);
      doc.setFont("helvetica", "normal");
      for (const panel of forest.panels) {
        line(`UV  ${panel.title}  (${panel.count})`, 11, 5.5);
        for (const rcd of panel.rcds) {
          line(`   ${rcd.title}  (${rcd.count})`, 10, 5);
          for (const c of rcd.circuits) {
            const meta = [c.breakerRating, c.cableType]
              .filter(Boolean)
              .join(" · ");
            line(
              `      ${c.title}  (${c.devices.length})${meta ? `  ${meta}` : ""}`,
              9,
              4.6
            );
            line(`         ${kindSummary(c.devices, true)}`, 8, 4.2);
          }
        }
      }
    }

    const floorWires = data.connections.filter((c) => c.floorId === floor.id);
    if (floorWires.length) {
      const meters = floorWires.reduce(
        (n, c) => n + (c.estimatedLengthM ?? 0),
        0
      );
      line(
        `Verbindungslinien: ${floorWires.length} · ca. ${meters.toFixed(1)} m (Luftlinie ×1,15)`,
        9,
        5
      );
    }
    y += 4;
  }

  if (planPng) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text("2D-Plan (aktuelle Ansicht)", margin, 16);
    doc.addImage(planPng, "PNG", margin, 22, 180, 110);
  }

  doc.save(`${safeName(data.meta.name)}-bericht.pdf`);
}

export function parseProjectFile(text: string): ProjectData {
  const data = JSON.parse(text) as ProjectData;
  if (!data?.meta?.id || !Array.isArray(data.floors) || !Array.isArray(data.symbols)) {
    throw new Error("Keine ElektroCAD-Projektdatei");
  }
  return normalizeProjectData(data);
}

function safeName(name: string): string {
  const cleaned = name.trim().replace(/[^\wäöüÄÖÜß\- ]+/g, "").replace(/\s+/g, "-");
  return cleaned || "elektro-cad";
}
