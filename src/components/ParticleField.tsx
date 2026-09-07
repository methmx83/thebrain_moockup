import { useEffect, useRef } from "react";

interface Mote {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  hue: string;
  tw: number;
  phase: number;
}

const COLORS = ["65,208,184", "242,178,76", "155,196,107", "107,143,153", "226,112,138"];

/** Neurotransmitter-Staub: langsam driftende, glimmernde Partikel hinter der UI */
export default function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const motes: Mote[] = [];

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(85, Math.floor((window.innerWidth * window.innerHeight) / 22000));
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.7,
        vy: -(0.05 + Math.random() * 0.16),
        vx: (Math.random() - 0.5) * 0.06,
        hue: COLORS[Math.floor(Math.random() * COLORS.length)],
        tw: 0.5 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y += m.vy;
        m.x += m.vx + Math.sin(t * 0.0003 + m.phase) * 0.05;
        if (m.y < -6) {
          m.y = h + 6;
          m.x = Math.random() * w;
        }
        if (m.x < -6) m.x = w + 6;
        if (m.x > w + 6) m.x = -6;
        const a = 0.05 + 0.11 * (0.5 + 0.5 * Math.sin(t * 0.001 * m.tw + m.phase));
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${m.hue},${a})`;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />;
}
