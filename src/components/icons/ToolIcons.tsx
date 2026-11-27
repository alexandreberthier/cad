import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function I({ children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSelect = (p: IconProps) => (
  <I {...p}>
    <path d="M5 3l5.5 16 2-5.5L18 11z" />
  </I>
);

export const IconPan = (p: IconProps) => (
  <I {...p}>
    <path d="M8 11V7a1.5 1.5 0 013 0v4" />
    <path d="M11 11V6a1.5 1.5 0 013 0v5" />
    <path d="M14 11.5V8a1.5 1.5 0 013 0v6.5a4.5 4.5 0 01-4.5 4.5H12a5 5 0 01-5-5V12a1.5 1.5 0 013 0v-.5" />
  </I>
);

/** Wand als Doppelstrich / Mauerwerk */
export const IconWall = (p: IconProps) => (
  <I {...p}>
    <path d="M3 8h18v3H3z" />
    <path d="M3 13h18v3H3z" />
    <path d="M8 8v8M14 8v8" />
  </I>
);

/** Tür mit Swing */
export const IconDoor = (p: IconProps) => (
  <I {...p}>
    <path d="M7 20V5h8v15" />
    <path d="M15 5a9 9 0 010 15" strokeDasharray="2.5 2" />
    <circle cx="13.2" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
  </I>
);

export const IconWindow = (p: IconProps) => (
  <I {...p}>
    <rect x="4" y="5" width="16" height="14" rx="1" />
    <path d="M12 5v14M4 12h16" />
  </I>
);

export const IconRoom = (p: IconProps) => (
  <I {...p}>
    <path d="M4 19V8l6-4 10 5v10H4z" />
    <path d="M10 4v15" />
  </I>
);

export const IconCalibrate = (p: IconProps) => (
  <I {...p}>
    <path d="M4 17l5-5 3 3 7-7" />
    <path d="M15 7h5v5" />
    <path d="M3 20h10" />
    <path d="M3 20l2-2M13 20l-2-2" />
  </I>
);

export const IconWire = (p: IconProps) => (
  <I {...p}>
    <circle cx="5" cy="7" r="2" />
    <circle cx="19" cy="17" r="2" />
    <path d="M7 8c4 1 6 7 10 8" strokeDasharray="3 2" />
  </I>
);

export const IconUndo = (p: IconProps) => (
  <I {...p}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h9a6 6 0 010 12h-3" />
  </I>
);

export const IconRedo = (p: IconProps) => (
  <I {...p}>
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H11a6 6 0 000 12h3" />
  </I>
);
