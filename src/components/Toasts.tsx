import { IconArchive, IconCheck, IconSpark } from "./Icons";

export interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "info" | "warn";
}

const STYLE: Record<Toast["kind"], { color: string; ring: string }> = {
  ok: { color: "#41D0B8", ring: "rgba(65,208,184,0.35)" },
  info: { color: "#F2B24C", ring: "rgba(242,178,76,0.35)" },
  warn: { color: "#E2708A", ring: "rgba(226,112,138,0.35)" },
};

export default function Toasts({ items, onDismiss }: { items: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(340px,calc(100vw-2rem))] flex-col gap-2">
      {items.map((t) => {
        const s = STYLE[t.kind];
        return (
          <button
            key={t.id}
            onClick={() => onDismiss(t.id)}
            className="animate-toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl border border-line bg-abyss/95 px-3.5 py-3 text-left shadow-xl shadow-black/40 backdrop-blur-md"
            style={{ boxShadow: `0 8px 28px rgba(0,0,0,0.45), inset 0 0 0 1px ${s.ring}` }}
          >
            <span className="shrink-0" style={{ color: s.color }}>
              {t.kind === "ok" ? <IconCheck size={16} /> : t.kind === "warn" ? <IconArchive size={16} /> : <IconSpark size={16} />}
            </span>
            <span className="text-[12.5px] leading-snug text-fog">{t.msg}</span>
          </button>
        );
      })}
    </div>
  );
}
