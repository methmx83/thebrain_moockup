import { useMemo } from "react";
import type { Memory } from "../lib/engine";
import {
  TYPE_COLOR,
  TYPE_LABEL,
  DAY,
  HOUR,
  fmtDuration,
  halfLifeOf,
  nextRefreshIn,
  stabilityOf,
  strengthAt,
  strengthNow,
} from "../lib/engine";

interface Props {
  memories: Memory[];
  now: number;
  selectedId: string | null;
}

const W = 660;
const H = 250;
const PAD = { l: 42, r: 18, t: 18, b: 30 };

/** Vergessenskurve — Ebbinghaus live: Einzelansicht einer Spur oder Gehirn-Durchschnitt */
export default function RetentionChart({ memories, now, selectedId }: Props) {
  const selected = memories.find((m) => m.id === selectedId && !m.archived) ?? null;

  if (selected) return <SingleCurve m={selected} now={now} />;
  return <AggregateCurve memories={memories.filter((m) => !m.archived)} now={now} />;
}

/* ---------- Einzel-Spur: Sägezahn-Kurve der Abrufe + Prognose ---------- */
function SingleCurve({ m, now }: { m: Memory; now: number }) {
  const color = TYPE_COLOR[m.type];

  const { path, area, events, x0, x1 } = useMemo(() => {
    const S = stabilityOf(m);
    const hist = [...m.history].sort((a, b) => a.t - b.t);
    let t0 = hist[0]?.t ?? m.createdAt;
    let tEnd = m.lastRecalledAt + 2.2 * S;
    if (now + 0.3 * S > tEnd) tEnd = now + 0.6 * S;
    t0 = Math.min(t0, m.createdAt);
    const span = Math.max(1, tEnd - t0);

    const X = (t: number) => PAD.l + ((t - t0) / span) * (W - PAD.l - PAD.r);
    const Y = (s: number) => PAD.t + (1 - s) * (H - PAD.t - PAD.b);

    const pts: Array<{ x: number; y: number }> = [];
    const evts: Array<{ x: number; y: number; s: number }> = [];

    for (let i = 0; i < hist.length; i++) {
      const e = hist[i];
      const nextT = i + 1 < hist.length ? hist[i + 1].t : null;
      if (i === 0) {
        pts.push({ x: X(e.t), y: Y(1) });
        evts.push({ x: X(e.t), y: Y(1), s: 1 });
        if (!nextT) {
          // keine Abrufe: Zerfall ab Codierung
          for (let k = 1; k <= 40; k++) {
            const t = e.t + (span * k) / 40;
            pts.push({ x: X(t), y: Y(Math.exp(-(t - e.t) / S)) });
          }
        }
        continue;
      }
      // Segment davor zerfällt von 1 (nach vorherigem Abruf) auf e.s
      const prevT = hist[i - 1].t;
      const dur = Math.max(1, e.t - prevT);
      for (let k = 1; k <= 14; k++) {
        const t = prevT + (dur * k) / 14;
        const s = Math.exp((-(t - prevT) / dur) * Math.log(1 / Math.max(0.02, e.s)));
        pts.push({ x: X(t), y: Y(s) });
      }
      evts.push({ x: X(e.t), y: Y(e.s), s: e.s });
      // Abruf-Sprung zurück auf 1
      pts.push({ x: X(e.t), y: Y(e.s) });
      pts.push({ x: X(e.t), y: Y(1) });
      evts.push({ x: X(e.t), y: Y(1), s: 1 });
      if (!nextT) {
        for (let k = 1; k <= 26; k++) {
          const t = e.t + ((tEnd - e.t) * k) / 26;
          pts.push({ x: X(t), y: Y(Math.exp(-(t - e.t) / S)) });
        }
      }
    }

    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const a = `${d} L${X(tEnd).toFixed(1)},${Y(0).toFixed(1)} L${X(t0).toFixed(1)},${Y(0).toFixed(1)} Z`;
    return { path: d, area: a, events: evts, x0: t0, x1: tEnd };
  }, [m, now]);

  const span = x1 - x0;
  const X = (t: number) => PAD.l + ((t - x0) / span) * (W - PAD.l - PAD.r);
  const nowX = Math.min(W - PAD.r, Math.max(PAD.l, X(now)));

  const ticks = useMemo(() => {
    const out: Array<{ x: number; label: string }> = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const t = x0 + (span * i) / steps;
      const rel = t - now;
      const label =
        Math.abs(rel) < HOUR / 2
          ? "jetzt"
          : rel < 0
            ? `−${fmtDuration(-rel)}`
            : `+${fmtDuration(rel)}`;
      out.push({ x: X(t), label });
    }
    return out;
  }, [x0, span, now]);

  const hl = halfLifeOf(m);
  const refresh = nextRefreshIn(m, now);
  const sNow = strengthNow(m, now);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-[60%] truncate text-[13px] text-mist">
          <span className="mono-chip mr-2" style={{ color }}>{TYPE_LABEL[m.type]}</span>
          {m.content}
        </p>
        <div className="flex gap-4 font-mono text-[11px] text-mist">
          <span>
            R(jetzt) <b style={{ color }}>{(sNow * 100).toFixed(0)} %</b>
          </span>
          <span>
            T½ <b className="text-fog">{fmtDuration(hl)}</b>
          </span>
          <span>
            Auffrischung <b className="text-fog">in {fmtDuration(refresh)}</b>
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Vergessenskurve der Erinnerung">
        <defs>
          <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={PAD.t + (1 - g) * (H - PAD.t - PAD.b)}
              y2={PAD.t + (1 - g) * (H - PAD.t - PAD.b)}
              stroke="#1E2E39"
              strokeWidth="1"
              strokeDasharray={g === 0 ? "" : "3 5"}
            />
            <text x={PAD.l - 8} y={PAD.t + (1 - g) * (H - PAD.t - PAD.b) + 3.5} textAnchor="end" fontSize="9.5" fill="#5D747C" fontFamily="IBM Plex Mono, monospace">
              {g * 100}%
            </text>
          </g>
        ))}
        {/* Jetzt-Marker */}
        <line x1={nowX} x2={nowX} y1={PAD.t - 6} y2={H - PAD.b} stroke="#E8F1EE" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 4" />
        <text x={nowX} y={PAD.t - 8} textAnchor="middle" fontSize="9" fill="#8FA6AB" fontFamily="IBM Plex Mono, monospace">
          JETZT
        </text>

        <path d={area} fill="url(#curve-fill)" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

        {events.map((e, i) => (
          <circle key={i} cx={e.x} cy={e.y} r={i === 0 ? 3.2 : 3} fill={i % 2 === 0 ? color : "#0A1219"} stroke={color} strokeWidth="1.4" />
        ))}

        {ticks.map((t, i) => (
          <text key={i} x={t.x} y={H - 10} textAnchor="middle" fontSize="9.5" fill="#5D747C" fontFamily="IBM Plex Mono, monospace">
            {t.label}
          </text>
        ))}
      </svg>
      <p className="mt-1 text-[11px] leading-snug text-dim">
        Jeder Zacken nach oben = ein Abruf, der die Synapse potentiert hat (Retrieval Practice). Rechts der Prognose-Zerfall nach Ebbinghaus: R(t) = e<sup>−t/S</sup>.
      </p>
    </div>
  );
}

/* ---------- Gehirn-Durchschnitt je Speichersystem ---------- */
function AggregateCurve({ memories, now }: { memories: Memory[]; now: number }) {
  const data = useMemo(() => {
    if (memories.length === 0) return null;
    const t0 = Math.min(...memories.map((m) => m.createdAt));
    const sMedian = [...memories].sort((a, b) => stabilityOf(a) - stabilityOf(b))[Math.floor(memories.length / 2)];
    const t1 = now + Math.min(30 * DAY, stabilityOf(sMedian) * 1.1);
    const span = Math.max(1, t1 - t0);
    const X = (t: number) => PAD.l + ((t - t0) / span) * (W - PAD.l - PAD.r);
    const Y = (s: number) => PAD.t + (1 - s) * (H - PAD.t - PAD.b);

    const types = ["episodisch", "semantisch", "prozedural"] as const;
    const lines = types.map((type) => {
      const pool = memories.filter((m) => m.type === type);
      if (pool.length === 0) return null;
      const pts: string[] = [];
      const N = 56;
      for (let i = 0; i <= N; i++) {
        const t = t0 + (span * i) / N;
        const avg = pool.reduce((acc, m) => acc + strengthAt(m, t), 0) / pool.length;
        pts.push(`${i === 0 ? "M" : "L"}${X(t).toFixed(1)},${Y(avg).toFixed(1)}`);
      }
      const cur = pool.reduce((acc, m) => acc + strengthAt(m, now), 0) / pool.length;
      return { type, d: pts.join(" "), current: cur };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    const ticks: Array<{ x: number; label: string }> = [];
    for (let i = 0; i <= 5; i++) {
      const t = t0 + (span * i) / 5;
      const rel = t - now;
      ticks.push({
        x: X(t),
        label: Math.abs(rel) < HOUR / 2 ? "jetzt" : rel < 0 ? `−${fmtDuration(-rel)}` : `+${fmtDuration(rel)}`,
      });
    }
    return { lines, ticks, nowX: X(now), avg: memories.reduce((a, m) => a + strengthAt(m, now), 0) / memories.length };
  }, [memories, now]);

  if (!data) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-dim">Keine aktiven Spuren — keine Kurve, kein Zerfall. Friedlich.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-mist">
          Ø Retention des Cortex: <b className="font-mono text-fog">{(data.avg * 100).toFixed(0)} %</b>
        </p>
        <div className="flex flex-wrap gap-3">
          {data.lines.map((l) => (
            <span key={l.type} className="flex items-center gap-1.5 text-[11px] text-mist">
              <span className="h-[3px] w-4 rounded-full" style={{ background: TYPE_COLOR[l.type] }} />
              {TYPE_LABEL[l.type]} <b className="font-mono" style={{ color: TYPE_COLOR[l.type] }}>{(l.current * 100).toFixed(0)} %</b>
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Vergessenskurve des gesamten Gedächtnisses">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={PAD.t + (1 - g) * (H - PAD.t - PAD.b)}
              y2={PAD.t + (1 - g) * (H - PAD.t - PAD.b)}
              stroke="#1E2E39"
              strokeDasharray={g === 0 ? "" : "3 5"}
            />
            <text x={PAD.l - 8} y={PAD.t + (1 - g) * (H - PAD.t - PAD.b) + 3.5} textAnchor="end" fontSize="9.5" fill="#5D747C" fontFamily="IBM Plex Mono, monospace">
              {g * 100}%
            </text>
          </g>
        ))}
        <line x1={data.nowX} x2={data.nowX} y1={PAD.t - 6} y2={H - PAD.b} stroke="#E8F1EE" strokeOpacity="0.35" strokeDasharray="2 4" />
        <text x={data.nowX} y={PAD.t - 8} textAnchor="middle" fontSize="9" fill="#8FA6AB" fontFamily="IBM Plex Mono, monospace">
          JETZT
        </text>
        {data.lines.map((l) => (
          <path key={l.type} d={l.d} fill="none" stroke={TYPE_COLOR[l.type]} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        ))}
        {data.ticks.map((t, i) => (
          <text key={i} x={t.x} y={H - 10} textAnchor="middle" fontSize="9.5" fill="#5D747C" fontFamily="IBM Plex Mono, monospace">
            {t.label}
          </text>
        ))}
      </svg>
      <p className="mt-1 text-[11px] text-dim">
        Durchschnittliche Erinnerungsstärke je Speichersystem — links Vergangenheit, rechts Prognose. Episoden zerfallen ohne Abruf am schnellsten.
      </p>
    </div>
  );
}
