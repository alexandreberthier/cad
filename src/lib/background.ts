import type { BackgroundImage } from "@/types/project";

async function pdfFirstPageToDataUrl(file: File): Promise<{
  src: string;
  width: number;
  height: number;
}> {
  const pdfjs = await import("pdfjs-dist");
  // Lokaler Worker (public/), damit Turbopack den pdf.js-Worker findet
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context missing");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return {
    src: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

function loadImageFile(file: File): Promise<{
  src: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () =>
        resolve({ src, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export async function loadBackgroundFile(file: File): Promise<BackgroundImage> {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const loaded = isPdf
    ? await pdfFirstPageToDataUrl(file)
    : await loadImageFile(file);

  return {
    src: loaded.src,
    mimeType: isPdf ? "application/pdf" : file.type || "image/png",
    opacity: 0.65,
    locked: true,
    widthPx: loaded.width,
    heightPx: loaded.height,
    offsetX: 40,
    offsetY: 40,
    metersPerPixel: null,
  };
}
