import { useEffect, useState } from "react";
import type { ConsolidationReport } from "../lib/engine";
import { IconCheck, IconMoon } from "./Icons";

interface Props {
  report: ConsolidationReport;
  onDone: () => void;
}

/** Schlafphase: Offline-Replay der Spuren, dann Konsolidierungs-Bericht */
export default function SleepOverlay({ report, onDone }: Props) {
  const [replayIdx, setReplayIdx] = useState(0);
  const [phase, setPhase] = useState<"sleep" | "report">("sleep");
  const replay = report.replay.length > 0 ? report.replay : ["… der Cortex ruht …"];

  useEffect(() => {
    if (phase !== "sleep") return;
    const total = Math.max(2600, replay.length * 520);
    const iv = window.setInterval(() => {
      setReplayIdx((i) => (i + 1) % replay.length);
    }, 520);
    const done = window.setTimeout(() => setPhase("report"), total);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(done);
    };
  }, [phase, replay.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md">
      {/* Pulsierende Schlaf-Ringe */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute h-64 w-64 rounded-full border border-teal/20"
            style={{ animation: `sleep-ring 3.2s ease-out ${i * 1.05}s infinite` }}
          />
        ))}
      </div>

      <div className="panel relative w-full max-w-md p-6 text-center shadow-2xl shadow-black/60">
        {phase === "sleep" ? (
          <>
            <div className="animate-drift mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/12 text-teal ring-1 ring-teal/30">
              <IconMoon size={26} />
            </div>
            <h3 className="mt-3 font-display text-xl font-bold text-fog">Schlafphase läuft</h3>
            <p className="mt-1 text-[12.5px] text-mist">
              Systems Consolidation — der Hippocampus spielt die Spuren des Tages in den Neocortex über.
            </p>
            <div className="mt-5 rounded-xl border border-line bg-ink/70 px-4 py-3.5">
              <p className="mono-chip mb-1.5 text-teal">Replay · Spur {Math.min(replayIdx + 1, replay.length)}/{replay.length}</p>
              <p
                key={replayIdx}
                className="animate-toast-in min-h-[38px] text-[13px] leading-snug text-fog"
              >
                „{replay[replayIdx]}“
              </p>
            </div>
            <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-raise">
              <div className="h-full w-1/3 rounded-full bg-teal/80" style={{ animation: "bar-shimmer 1.4s linear infinite", backgroundImage: "linear-gradient(90deg, transparent, rgba(65,208,184,0.9), transparent)", backgroundSize: "120px 100%", backgroundColor: "rgba(65,208,184,0.25)" }} />
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-moss/12 text-moss ring-1 ring-moss/30">
              <IconCheck size={26} />
            </div>
            <h3 className="mt-3 font-display text-xl font-bold text-fog">Guten Morgen.</h3>
            <p className="mt-1 text-[12.5px] text-mist">Konsolidierung abgeschlossen — Bericht der Nacht:</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-lg border border-line bg-ink/60 p-3">
                <dt className="mono-chip text-dim">→ Neocortex</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-teal">{report.consolidated}</dd>
                <dd className="text-[10.5px] text-dim">Episoden zu Wissen gebrannt</dd>
              </div>
              <div className="rounded-lg border border-line bg-ink/60 p-3">
                <dt className="mono-chip text-dim">Verblasst</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-rose">{report.faded}</dd>
                <dd className="text-[10.5px] text-dim">R &lt; 12 % — ins Archiv entlassen</dd>
              </div>
              <div className="col-span-2 rounded-lg border border-line bg-ink/60 p-3">
                <dt className="mono-chip text-dim">Synapsen potentiert</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-amber">{report.strengthenedSynapses}</dd>
                <dd className="text-[10.5px] text-dim">Assoziative Verknüpfungen gestärkt — Netz dichter geworden</dd>
              </div>
            </dl>
            <button
              onClick={onDone}
              className="btn-press mt-5 w-full rounded-xl bg-teal px-4 py-3 font-display text-[14px] font-bold text-ink hover:bg-[#63e0ca]"
            >
              Erwachen
            </button>
          </>
        )}
      </div>
    </div>
  );
}
