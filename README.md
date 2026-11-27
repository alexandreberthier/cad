# ElektroCAD

Local-First Progressive Web App für 2D/3D Elektro- und Raumplanung.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Zustand + Zundo (Undo/Redo)
- react-konva (2D), three / R3F / drei (3D)
- Dexie (IndexedDB), next-pwa (Offline)

## Start

```bash
npm install
npm run dev
```

App: http://localhost:3000

## Stufe 1 (aktuell)

- Stockwerke, Grundriss-Import (PDF/PNG/JPG), 2-Punkt-Maßstab
- Wände mit Endpoint- & Winkel-Snap, Türen/Fenster
- Elektrosymbole inkl. Wand-Binding, Räume, Leitungs-Zuordnung
- Bauherren- / Profi-Modus
- Live-3D-Vorschau (Split-View)
- Auto-Speichern in IndexedDB + Undo/Redo (Strg+Z)

## Bedienung

| Aktion | Kurzbefehl |
|--------|------------|
| Auswahl | V |
| Wand | W |
| Tür | T |
| Fenster | F |
| Raum | R |
| Pan | H / Leertaste |
| Undo / Redo | Strg+Z / Strg+Y |
| Löschen | Entf |
