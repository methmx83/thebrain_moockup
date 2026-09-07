import { useEffect, useRef } from "react";
import type { Memory, Synapse } from "../lib/engine";
import { TYPE_COLOR, TYPE_LABEL, strengthNow, statusOf, STATUS_COLOR } from "../lib/engine";
import { IconSpark, IconX } from "./Icons";

interface NodeSim {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

interface Pulse {
  a: string;
  b: string;
  t: number;
  speed: number;
}

interface Props {
  memories: Memory[];
  synapses: Synapse[];
  now: number;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onRecall: (id: string) => void;
}

export default function NeuralCanvas({
  memories,
  synapses,
  now,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onRecall,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Map<string, NodeSim>>(new Map());
  const pulsesRef = useRef<Pulse[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  // Loop liest immer die aktuellen Props, ohne neu zu starten
  const propsRef = useRef({ memories, synapses, now, selectedId, hoveredId });
  propsRef.current = { memories, synapses, now, selectedId, hoveredId };
  const cbRef = useRef({ onSelect, onHover });
  cbRef.current = { onSelect, onHover };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let lastSpawn = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      const { memories: mems, synapses: syns, now: n, selectedId: sel, hoveredId: hov } = propsRef.current;
      const sim = simRef.current;

      // --- Knoten abgleichen ---
      const ids = new Set(mems.map((m) => m.id));
      for (const id of [...sim.keys()]) if (!ids.has(id)) sim.delete(id);
      mems.forEach((m, i) => {
        if (!sim.has(m.id)) {
          const ang = (i / Math.max(1, mems.length)) * Math.PI * 2 + Math.random() * 0.6;
          const r = 60 + Math.random() * 90;
          sim.set(m.id, {
            x: w / 2 + Math.cos(ang) * r,
            y: h / 2 + Math.sin(ang) * r,
            vx: 0,
            vy: 0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      });

      // --- Physik ---
      const nodes = mems.map((m) => ({ m, s: sim.get(m.id)! }));
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i].s;
          const b = nodes[j].s;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            d2 = 1;
          }
          const d = Math.sqrt(d2);
          const f = Math.min(3.2, 2600 / d2);
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      const byId = new Map(nodes.map((x) => [x.m.id, x.s]));
      for (const syn of syns) {
        const a = byId.get(syn.a);
        const b = byId.get(syn.b);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const rest = 175 - 75 * syn.weight;
        const f = (d - rest) * 0.0055 * (0.4 + syn.weight);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
      for (const { s } of nodes) {
        s.vx += (w / 2 - s.x) * 0.0017;
        s.vy += (h / 2 - s.y) * 0.0021;
        s.vx += Math.sin(time * 0.00045 + s.phase) * 0.03;
        s.vy += Math.cos(time * 0.00038 + s.phase) * 0.03;
        s.vx *= 0.86;
        s.vy *= 0.86;
        const sp = Math.hypot(s.vx, s.vy);
        if (sp > 2.6) {
          s.vx = (s.vx / sp) * 2.6;
          s.vy = (s.vy / sp) * 2.6;
        }
        s.x += s.vx;
        s.y += s.vy;
        const pad = 34;
        if (s.x < pad) s.vx += 0.5;
        if (s.x > w - pad) s.vx -= 0.5;
        if (s.y < pad) s.vy += 0.5;
        if (s.y > h - pad) s.vy -= 0.5;
      }

      // --- Synapsen-Pulse erzeugen ---
      if (time - lastSpawn > 420 && syns.length > 0) {
        lastSpawn = time;
        const syn = syns[Math.floor(Math.random() * syns.length)];
        pulsesRef.current.push({ a: syn.a, b: syn.b, t: 0, speed: 0.012 + Math.random() * 0.014 });
        if (pulsesRef.current.length > 26) pulsesRef.current.shift();
      }

      // --- Zeichnen ---
      ctx.clearRect(0, 0, w, h);

      // weiche Hintergrund-Gluten
      const g1 = ctx.createRadialGradient(w * 0.28, h * 0.3, 0, w * 0.28, h * 0.3, w * 0.5);
      g1.addColorStop(0, "rgba(38,92,96,0.16)");
      g1.addColorStop(1, "rgba(38,92,96,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createRadialGradient(w * 0.78, h * 0.72, 0, w * 0.78, h * 0.72, w * 0.45);
      g2.addColorStop(0, "rgba(146,106,40,0.10)");
      g2.addColorStop(1, "rgba(146,106,40,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      const focusId = sel ?? hov;
      const focusNeighbors = new Set<string>();
      if (focusId) {
        focusNeighbors.add(focusId);
        for (const syn of syns) {
          if (syn.a === focusId) focusNeighbors.add(syn.b);
          if (syn.b === focusId) focusNeighbors.add(syn.a);
        }
      }

      // Kanten
      for (const syn of syns) {
        const a = byId.get(syn.a);
        const b = byId.get(syn.b);
        if (!a || !b) continue;
        const involved = focusId ? syn.a === focusId || syn.b === focusId : false;
        const dim = focusId && !involved;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = involved
          ? `rgba(65,208,184,${0.35 + syn.weight * 0.4})`
          : dim
            ? `rgba(107,143,153,0.07)`
            : `rgba(107,143,153,${0.1 + syn.weight * 0.28})`;
        ctx.lineWidth = involved ? 1.6 + syn.weight * 1.4 : 0.7 + syn.weight * 1.1;
        ctx.stroke();
      }

      // Pulse entlang der Kanten
      for (const p of [...pulsesRef.current]) {
        p.t += p.speed;
        if (p.t >= 1) {
          pulsesRef.current = pulsesRef.current.filter((x) => x !== p);
          continue;
        }
        const a = byId.get(p.a);
        const b = byId.get(p.b);
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const alpha = Math.sin(p.t * Math.PI) * 0.85;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 7);
        grad.addColorStop(0, `rgba(190,240,230,${alpha})`);
        grad.addColorStop(1, "rgba(190,240,230,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Knoten
      const radiusOf = (m: Memory) => 5.5 + 12.5 * strengthNow(m, n);
      for (const { m, s } of nodes) {
        const r = radiusOf(m);
        const color = TYPE_COLOR[m.type];
        const st = strengthNow(m, n);
        const status = statusOf(m, n);
        const dim = focusId && !focusNeighbors.has(m.id);
        const isFocus = m.id === focusId;
        const alpha = dim ? 0.18 : 0.55 + st * 0.45;

        // Glow
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.1);
        glow.addColorStop(0, hexA(color, (isFocus ? 0.5 : 0.22) * (dim ? 0.3 : 1) * (0.4 + st)));
        glow.addColorStop(1, hexA(color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3.1, 0, Math.PI * 2);
        ctx.fill();

        // Amygdala-Ring für hohe emotionale Gewichtung
        if (m.importance >= 4 && !dim) {
          const breathe = 0.5 + 0.5 * Math.sin(time * 0.0022 + s.phase);
          ctx.beginPath();
          ctx.arc(s.x, s.y, r + 4.5 + breathe * 2.2, 0, Math.PI * 2);
          ctx.strokeStyle = hexA("#E2708A", 0.16 + breathe * 0.2);
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }

        // Körper
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = hexA(color, alpha * 0.85);
        ctx.fill();
        ctx.strokeStyle = hexA("#0A1219", 0.9);
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // kritischer Zustand: Warnring
        if (status === "kritisch" && !dim) {
          const blink = 0.5 + 0.5 * Math.sin(time * 0.006);
          ctx.beginPath();
          ctx.arc(s.x, s.y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = hexA("#E2708A", 0.25 + blink * 0.4);
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (isFocus) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, r + 7, 0, Math.PI * 2);
          ctx.strokeStyle = hexA(color, 0.85);
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        // Label bei Fokus
        if (isFocus && !dim) {
          const label = m.content.length > 34 ? m.content.slice(0, 33) + "…" : m.content;
          ctx.font = "500 11px 'Instrument Sans', sans-serif";
          const tw = ctx.measureText(label).width;
          const lx = Math.min(Math.max(s.x - tw / 2 - 8, 6), w - tw - 22);
          const ly = Math.min(s.y + r + 12, h - 30);
          ctx.fillStyle = "rgba(7,13,18,0.88)";
          roundRect(ctx, lx, ly, tw + 16, 22, 7);
          ctx.fill();
          ctx.strokeStyle = hexA(color, 0.5);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = "#E8F1EE";
          ctx.fillText(label, lx + 8, ly + 15);
        }
      }
    };

    raf = requestAnimationFrame(frame);

    // --- Interaktion ---
    const hitTest = (mx: number, my: number): string | null => {
      const { memories: mems, now: n } = propsRef.current;
      let best: string | null = null;
      let bestD = Infinity;
      for (const m of mems) {
        const s = simRef.current.get(m.id);
        if (!s) continue;
        const r = 5.5 + 12.5 * strengthNow(m, n) + 7;
        const d = Math.hypot(mx - s.x, my - s.y);
        if (d < r && d < bestD) {
          best = m.id;
          bestD = d;
        }
      }
      return best;
    };

    const toLocal = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMove = (e: MouseEvent) => {
      const { x, y } = toLocal(e);
      mouseRef.current = { x, y };
      const id = hitTest(x, y);
      canvas.style.cursor = id ? "pointer" : "default";
      cbRef.current.onHover(id);
    };
    const onLeave = () => {
      mouseRef.current = null;
      cbRef.current.onHover(null);
    };
    const onClick = (e: MouseEvent) => {
      const { x, y } = toLocal(e);
      const id = hitTest(x, y);
      cbRef.current.onSelect(id);
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  const selected = memories.find((m) => m.id === selectedId) ?? null;
  const selStrength = selected ? strengthNow(selected, now) : 0;
  const selStatus = selected ? statusOf(selected, now) : "stabil";

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {memories.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <p className="font-display text-lg font-bold text-mist">Leerer Cortex</p>
          <p className="max-w-[260px] text-sm text-dim">
            Codiere deine erste Erinnerung links — sie erscheint hier als Neuron im Netzwerk.
          </p>
        </div>
      )}

      {/* Legende */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-line/70 bg-ink/70 px-3 py-2 backdrop-blur-sm">
        {(Object.keys(TYPE_COLOR) as Array<keyof typeof TYPE_COLOR>).map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-[11px] text-mist">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR[t], boxShadow: `0 0 8px ${TYPE_COLOR[t]}66` }} />
            {TYPE_LABEL[t]}
          </span>
        ))}
        <span className="hidden text-[11px] text-dim sm:inline">· Knotengröße = Retention</span>
      </div>

      {/* Detail-Chip des gewählten Neurons */}
      {selected && (
        <div className="absolute right-3 top-3 w-[260px] rounded-xl border border-line bg-ink/85 p-3 shadow-xl shadow-black/40 backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <span className="mono-chip" style={{ color: TYPE_COLOR[selected.type] }}>
              {TYPE_LABEL[selected.type]} · {selected.project}
            </span>
            <button
              onClick={() => onSelect(null)}
              className="btn-press -mr-1 -mt-1 rounded-md p-1 text-dim hover:bg-raise hover:text-fog"
              aria-label="Schließen"
            >
              <IconX size={14} />
            </button>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-fog">{selected.content}</p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="font-mono text-mist">R = {(selStrength * 100).toFixed(0)} %</span>
            <span className="mono-chip" style={{ color: STATUS_COLOR[selStatus] }}>
              {selStatus}
            </span>
          </div>
          <button
            onClick={() => onRecall(selected.id)}
            className="btn-press mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal/15 px-3 py-2 text-[12.5px] font-semibold text-teal ring-1 ring-teal/30 hover:bg-teal/25"
          >
            <IconSpark size={14} /> Reaktivieren (Synapse stärken)
          </button>
        </div>
      )}
    </div>
  );
}

function hexA(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
