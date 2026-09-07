import { useEffect, useMemo, useRef, useState } from "react";
import type { Memory, MemoryType } from "../lib/engine";
import {
  TYPE_COLOR,
  TYPE_LABEL,
  fmtAgo,
  fmtDuration,
  nextRefreshIn,
  strengthNow,
  statusOf,
  STATUS_COLOR,
} from "../lib/engine";
import { IconArchive, IconReset, IconSearch, IconSpark, IconTrash } from "./Icons";

interface Props {
  memories: Memory[];
  now: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onRecall: (id: string) => void;
  onDelete: (id: string) => void;
  onRevive: (id: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
  flashId: string | null;
}

type SortKey = "staerke" | "neu" | "gewichtung";

export default function MemoryList({
  memories,
  now,
  selectedId,
  onSelect,
  onHover,
  onRecall,
  onDelete,
  onRevive,
  searchRef,
  flashId,
}: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MemoryType | "alle">("alle");
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState<SortKey>("staerke");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = memories.filter((m) => (showArchived ? true : !m.archived));
    if (typeFilter !== "alle") list = list.filter((m) => m.type === typeFilter);
    if (q) {
      list = list.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.project.toLowerCase().includes(q) ||
          m.tags.some((t) => t.includes(q))
      );
    }
    const s = (m: Memory) => strengthNow(m, now);
    return [...list].sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      if (sort === "neu") return b.createdAt - a.createdAt;
      if (sort === "gewichtung") return b.importance - a.importance || s(b) - s(a);
      return s(b) - s(a);
    });
  }, [memories, search, typeFilter, showArchived, sort, now]);

  return (
    <div>
      {/* Werkzeugzeile */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-[320px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
            <IconSearch size={15} />
          </span>
          <input
            ref={searchRef as React.RefObject<HTMLInputElement>}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Erinnerung abrufen …  ( / )"
            className="field pl-9"
            aria-label="Erinnerungen durchsuchen"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["alle", "episodisch", "semantisch", "prozedural"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`btn-press rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                typeFilter === t
                  ? "border-fog/30 bg-fog/10 text-fog"
                  : "border-line text-mist hover:border-signal/50"
              }`}
            >
              {t === "alle" ? "Alle" : TYPE_LABEL[t]}
            </button>
          ))}
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`btn-press flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
              showArchived ? "border-rose/40 bg-rose/10 text-rose" : "border-line text-mist hover:border-signal/50"
            }`}
          >
            <IconArchive size={12} /> Verblasste
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="field w-auto cursor-pointer py-1 pl-2.5 pr-7 text-[11.5px] font-semibold text-mist"
            aria-label="Sortierung"
          >
            <option value="staerke">Stärkste zuerst</option>
            <option value="neu">Neueste zuerst</option>
            <option value="gewichtung">Wichtigste zuerst</option>
          </select>
        </div>
      </div>

      <p className="mt-2.5 font-mono text-[11px] text-dim">
        {filtered.length} Spur{filtered.length === 1 ? "" : "en"} im Abruf-Puffer
      </p>

      {/* Spuren */}
      <ul className="mt-2.5 space-y-2">
        {filtered.map((m) => (
          <TraceCard
            key={m.id}
            m={m}
            now={now}
            selected={m.id === selectedId}
            flashing={m.id === flashId}
            onSelect={() => onSelect(m.id === selectedId ? null : m.id)}
            onHover={onHover}
            onRecall={() => onRecall(m.id)}
            onDelete={() => onDelete(m.id)}
            onRevive={() => onRevive(m.id)}
          />
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="panel mt-3 flex flex-col items-center gap-2 p-8 text-center">
          <IconSearch size={22} className="text-dim" />
          <p className="text-sm text-mist">Keine Spur gefunden — der Cortex schweigt zu dieser Anfrage.</p>
          {search && (
            <button onClick={() => setSearch("")} className="btn-press text-[12.5px] font-semibold text-amber hover:underline">
              Suche zurücksetzen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TraceCard({
  m,
  now,
  selected,
  flashing,
  onSelect,
  onHover,
  onRecall,
  onDelete,
  onRevive,
}: {
  m: Memory;
  now: number;
  selected: boolean;
  flashing: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  onRecall: () => void;
  onDelete: () => void;
  onRevive: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
  }, []);

  const s = strengthNow(m, now);
  const status = statusOf(m, now);
  const color = TYPE_COLOR[m.type];
  const refreshIn = nextRefreshIn(m, now);

  const askDelete = () => {
    if (confirming) {
      onDelete();
      return;
    }
    setConfirming(true);
    confirmTimer.current = window.setTimeout(() => setConfirming(false), 2600);
  };

  return (
    <li
      onClick={onSelect}
      onMouseEnter={() => onHover(m.id)}
      onMouseLeave={() => onHover(null)}
      className={`panel group relative cursor-pointer overflow-hidden transition-all duration-300 ${
        selected ? "border-fog/25 shadow-lg shadow-black/30" : "hover:border-signal/40"
      } ${m.archived ? "opacity-70" : ""} ${flashing ? "flash-recall" : ""}`}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: m.archived ? "#3a4b52" : color, opacity: m.archived ? 0.5 : 0.9 }} />
      <div className="flex items-start gap-3 py-3 pl-4 pr-3">
        {/* Neuron-Punkt */}
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            background: m.archived ? "#3a4b52" : color,
            boxShadow: m.archived ? "none" : `0 0 ${6 + s * 10}px ${color}88`,
            transform: `scale(${0.7 + s * 0.5})`,
            transition: "transform 1s linear, box-shadow 1s linear",
          }}
        />
        <div className="min-w-0 flex-1">
          <p className={`text-[13.5px] leading-snug ${m.archived ? "text-mist line-through decoration-dim/60" : "text-fog"}`}>
            {m.content}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-dim">
            <span className="mono-chip" style={{ color: m.archived ? "#5D747C" : color }}>
              {TYPE_LABEL[m.type]}
            </span>
            <span className="font-mono">{m.project}</span>
            <span>{fmtAgo(Math.max(m.createdAt, m.lastRecalledAt), now)}</span>
            <span className="flex items-center gap-1">
              <IconSpark size={10} /> {m.recallCount}× abgerufen
            </span>
            {!m.archived && s < 0.9 && (
              <span className="text-mist">Auffrischung in {fmtDuration(refreshIn)}</span>
            )}
            {m.consolidated && <span className="mono-chip text-teal">konsolidiert</span>}
            {m.tags.map((t) => (
              <span key={t} className="rounded-full border border-line px-1.5 py-px font-mono text-[10px] text-mist">
                #{t}
              </span>
            ))}
          </div>

          {/* Retention-Balken */}
          {!m.archived && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-ink/80">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, s * 100)}%`,
                    background: `linear-gradient(90deg, ${STATUS_COLOR[status]}, ${color})`,
                    transition: "width 1s linear",
                  }}
                />
              </div>
              <span className="w-11 text-right font-mono text-[11px] font-semibold" style={{ color: STATUS_COLOR[status] }}>
                {(s * 100).toFixed(0)} %
              </span>
            </div>
          )}
        </div>

        {/* Aktionen */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="mono-chip rounded-md border border-line px-1.5 py-0.5" style={{ color: STATUS_COLOR[status] }}>
            {status}
          </span>
          <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
            {m.archived ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRevive();
                }}
                className="btn-press flex items-center gap-1 rounded-md bg-teal/12 px-2 py-1 text-[11px] font-semibold text-teal ring-1 ring-teal/30 hover:bg-teal/22"
              >
                <IconReset size={12} /> Reaktivieren
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRecall();
                }}
                title="Abrufen stärkt die Synapse (Retrieval Practice)"
                className="btn-press flex items-center gap-1 rounded-md bg-fog/6 px-2 py-1 text-[11px] font-semibold text-fog ring-1 ring-line hover:bg-fog/12"
              >
                <IconSpark size={12} /> Abrufen
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                askDelete();
              }}
              className={`btn-press flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                confirming ? "bg-rose/20 text-rose ring-1 ring-rose/40" : "text-dim ring-1 ring-line hover:text-rose"
              }`}
            >
              <IconTrash size={12} /> {confirming ? "Sicher?" : ""}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
