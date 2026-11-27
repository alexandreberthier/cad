"use client";

import { COLOR_PRESETS } from "@/lib/symbols/colors";

export function ColorField({
  value,
  onChange,
  onReset,
  onSaveDefault,
  onClearDefault,
  hasDefault,
  label = "Farbe",
}: {
  value: string;
  onChange: (hex: string) => void;
  onReset?: () => void;
  onSaveDefault?: () => void;
  onClearDefault?: () => void;
  hasDefault?: boolean;
  label?: string;
}) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center gap-1 text-xs font-medium">
        <span className="mr-auto">{label}</span>
        {onSaveDefault && (
          <button
            type="button"
            title="Als Standard für diesen Symboltyp"
            onClick={onSaveDefault}
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:bg-surface hover:text-ink"
          >
            ★
          </button>
        )}
        {hasDefault && onClearDefault && (
          <button
            type="button"
            title="Typ-Standard löschen"
            onClick={onClearDefault}
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:bg-surface hover:text-ink"
          >
            ✕
          </button>
        )}
        {onReset && (
          <button
            type="button"
            title="Einzelne Farbe zurücksetzen"
            onClick={onReset}
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:bg-surface hover:text-ink"
          >
            ↺
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-line bg-surface p-0.5"
          aria-label={label}
        />
        <input
          type="text"
          defaultValue={value}
          key={value}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
          }}
          className="w-full rounded-md border border-line bg-surface px-2 py-1.5 font-mono text-xs"
          spellCheck={false}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={`h-5 w-5 rounded-sm border ${
              value.toLowerCase() === c.toLowerCase()
                ? "border-ink ring-1 ring-ink/30"
                : "border-line"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

function normalizeHex(v: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  return "#1a2332";
}
