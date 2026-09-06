import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

/** Engramm-Logo: Neuronengruppe mit Synapsen */
export function LogoMark({ size = 26, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...rest}>
      <circle cx="9.5" cy="12" r="3.6" fill="#F2B24C" />
      <circle cx="23" cy="8.5" r="2.5" fill="#41D0B8" />
      <circle cx="22" cy="22" r="3.1" fill="#9BC46B" />
      <circle cx="9.5" cy="23.5" r="2.2" fill="#E2708A" />
      <path
        d="M9.5 12L23 8.5M23 8.5L22 22M22 22L9.5 23.5M9.5 23.5L9.5 12M9.5 12L22 22"
        stroke="#6B8F99"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
  </svg>
);

export const IconMoon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    <path d="M17 3.5h.01M20.5 7h.01" strokeWidth="2.4" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.4-4.4" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9.5 7V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3V7M6.5 7l.8 12.2A1.8 1.8 0 0 0 9.1 21h5.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7M10 11v6M14 11v6" />
  </svg>
);

export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v10M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5.5 14.5A1.5 1.5 0 0 1 4 13V5.5A1.5 1.5 0 0 1 5.5 4H13a1.5 1.5 0 0 1 1.5 1.5" />
  </svg>
);

export const IconFastForward = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 6 7 6-7 6V6ZM13 6l7 6-7 6V6Z" />
  </svg>
);

export const IconLink = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 1 0-5.7-5.7l-1.6 1.6" />
    <path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 1 0 5.7 5.7l1.6-1.6" />
  </svg>
);

export const IconArchive = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="17" height="5" rx="1.2" />
    <path d="M5.5 9v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9M10 13h4" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4v16h16" />
    <path d="M7 14c2.5 0 2.5-6 5-6s2.5 4 5 4" />
  </svg>
);

export const IconFile = (p: P) => (
  <svg {...base(p)}>
    <path d="M13.5 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8L13.5 3Z" />
    <path d="M13.5 3v5h5M9 13h6M9 16.5h6" />
  </svg>
);

export const IconReset = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5v5h5" />
    <path d="M4.6 10A8 8 0 1 1 4 14" />
  </svg>
);

export const IconBrainWave = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12h3l2-5 3 10 2.5-7 1.5 2h6" />
  </svg>
);

export const IconNeuron = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5V8M12 16v4.5M3.5 12H8M16 12h4.5M6 6l3.2 3.2M18 6l-3.2 3.2M6 18l3.2-3.2M18 18l-3.2-3.2" />
  </svg>
);

export const IconHippo = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 15.5C4 9 8 5.5 12.5 5.5S20 9.5 20 13.5c0 3-2 5-4.6 5H6a2 2 0 0 1-2-3Z" />
    <path d="M8.5 12.5h.01M13.5 10.5c1.8 0 3 1.2 3 2.8" />
  </svg>
);
