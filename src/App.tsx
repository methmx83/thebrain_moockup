import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConsolidationReport, Memory } from "./lib/engine";
import { DAY, HOUR, computeSynapses, consolidate, fmtClockOffset, strengthNow } from "./lib/engine";
import { useMemoryStore } from "./lib/store";
import CapturePanel from "./components/CapturePanel";
import ExportPanel from "./components/ExportPanel";
import Manual from "./components/Manual";
import MemoryList from "./components/MemoryList";
import NeuralCanvas from "./components/NeuralCanvas";
import ParticleField from "./components/ParticleField";
import RetentionChart from "./components/RetentionChart";
import Reveal from "./components/Reveal";
import SleepOverlay from "./components/SleepOverlay";
import Toasts from "./components/Toasts";
import type { Toast } from "./components/Toasts";
import {
  IconBolt,
  IconBook,
  IconBrainWave,
  IconChart,
  IconDownload,
  IconFastForward,
  IconFile,
  IconMoon,
  IconNeuron,
  IconReset,
  IconSpark,
  LogoMark,
} from "./components/Icons";

type Tab = "spuren" | "kurve" | "export";

export default function App() {
  const store = useMemoryStore();
  const { memories, linkBoosts } = store.state;

  const [tab, setTab] = useState<Tab>("spuren");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [sleepReport, setSleepReport] = useState<ConsolidationReport | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const pendingSleep = useRef<{ memories: Memory[]; boosts: Record<string, number> } | null>(null);
  const flashTimer = useRef<number | null>(null);
  const wipeTimer = useRef<number | null>(null);
  const toastId = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((msg: string, kind: Toast["kind"] = "ok") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-3), { id, msg, kind }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const synapses = useMemo(() => computeSynapses(memories, linkBoosts), [memories, linkBoosts]);
  const active = useMemo(() => memories.filter((m) => !m.archived), [memories]);
  const avgRetention = useMemo(
    () => (active.length ? active.reduce((a, m) => a + strengthNow(m, store.virtualNow), 0) / active.length : 0),
    [active, store.virtualNow]
  );

  /* ---- Aktionen ---- */

  const handleCapture = useCallback(
    (input: Parameters<typeof store.capture>[0]) => {
      store.capture(input);
      addToast("Im Hippocampus codiert — die Spur ist jetzt Teil des Netzwerks.", "ok");
    },
    [store, addToast]
  );

  const handleRecall = useCallback(
    (id: string) => {
      store.recall(id);
      setFlashId(id);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlashId(null), 1150);
      addToast("Abruf gelungen — Synapse potentiert, Stabilität wächst.", "info");
    },
    [store, addToast]
  );

  const handleDelete = useCallback(
    (id: string) => {
      store.remove(id);
      setSelectedId((s) => (s === id ? null : s));
      addToast("Spur endgültig gelöscht — aus dem Cortex entfernt.", "warn");
    },
    [store, addToast]
  );

  const handleRevive = useCallback(
    (id: string) => {
      store.revive(id);
      addToast("Reaktiviert! Relearning wirkt stärker als Erstlernen.", "ok");
    },
    [store, addToast]
  );

  const startSleep = useCallback(() => {
    const result = consolidate(memories, linkBoosts, store.virtualNow);
    pendingSleep.current = { memories: result.memories, boosts: result.boosts };
    setSleepReport(result.report);
  }, [memories, linkBoosts, store.virtualNow]);

  const finishSleep = useCallback(() => {
    if (pendingSleep.current) {
      store.applyConsolidation(pendingSleep.current.memories, pendingSleep.current.boosts);
      pendingSleep.current = null;
    }
    const r = sleepReport;
    setSleepReport(null);
    if (r) {
      addToast(
        `Schlafzyklus #${store.state.sleepCycles + 1}: ${r.consolidated} konsolidiert · ${r.faded} verblasst · ${r.strengthenedSynapses} Synapsen gestärkt.`,
        "ok"
      );
    }
  }, [store, sleepReport, addToast]);

  const handleWarp = useCallback(
    (delta: number) => {
      store.timeWarp(delta);
      addToast(`Zeitraffer: ${fmtClockOffset(store.state.clockOffset + delta)} — der Zerfall nagt sichtbar.`, "info");
    },
    [store, addToast]
  );

  const handleWipe = useCallback(() => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      if (wipeTimer.current) window.clearTimeout(wipeTimer.current);
      wipeTimer.current = window.setTimeout(() => setConfirmWipe(false), 3000);
      return;
    }
    store.wipe();
    setSelectedId(null);
    setConfirmWipe(false);
    addToast("Cortex geleert. Tabula rasa — wie nach einem sehr tiefen Schlaf.", "warn");
  }, [confirmWipe, store, addToast]);

  /* ---- Gehirn sichern & wiederherstellen (JSON) ---- */
  const exportBackup = useCallback(() => {
    const payload = {
      app: "engramm",
      version: 1,
      exportedAt: new Date().toISOString(),
      ...store.state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engramm-gehirn-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Gehirn gesichert — die JSON-Datei ist unterwegs in deinen Downloads.", "ok");
  }, [store.state, addToast]);

  const importBackup = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (store.restore(parsed)) {
            setSelectedId(null);
            addToast("Gehirn wiederhergestellt — alle Spuren sind zurück.", "ok");
          } else {
            addToast("Diese Datei ist keine gültige Engramm-Sicherung.", "warn");
          }
        } catch {
          addToast("Datei nicht lesbar — beschädigtes JSON?", "warn");
        }
      };
      reader.readAsText(file);
    },
    [store, addToast]
  );

  /* ---- Hotkeys: / fokussiert die Suche, ? öffnet das Handbuch ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" && e.key !== "?") return;
      const el = document.activeElement;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      e.preventDefault();
      if (e.key === "?") {
        setManualOpen((v) => !v);
        return;
      }
      setTab("spuren");
      window.setTimeout(() => searchRef.current?.focus(), 30);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const offset = store.state.clockOffset;

  return (
    <div className="brain-bg relative min-h-screen font-body text-fog">
      <ParticleField />
      <div className="noise-veil" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 pb-14 pt-6 sm:px-6">
        {/* ================= Kopf ================= */}
        <header>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex items-center gap-3.5">
              <span className="animate-ring-breathe flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-line bg-raise/70">
                <LogoMark size={32} />
              </span>
              <div>
                <h1 className="font-display text-[27px] font-extrabold leading-none tracking-tight text-fog">
                  ENGRAMM
                </h1>
                <p className="mt-1.5 text-[12px] text-mist">
                  Hippocampus → Neocortex · <span className="font-semibold text-amber">Langzeitgedächtnis für Claude Code</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Stat label="Aktive Spuren" value={String(active.length)} color="#E8F1EE" />
              <Stat label="Synapsen" value={String(synapses.length)} color="#41D0B8" />
              <Stat label="Ø Retention" value={`${(avgRetention * 100).toFixed(0)} %`} color={avgRetention > 0.5 ? "#9BC46B" : avgRetention > 0.25 ? "#F2B24C" : "#E2708A"} />
              <Stat label="Schlafzyklen" value={String(store.state.sleepCycles)} color="#41D0B8" />
            </div>
          </div>

          {/* Aktionsleiste */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-abyss/60 px-4 py-3 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono-chip flex items-center gap-1.5 text-mist">
                <IconFastForward size={13} /> Zeitraffer
              </span>
              {[
                { label: "+1 Std", v: HOUR },
                { label: "+1 Tag", v: DAY },
                { label: "+7 Tage", v: 7 * DAY },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => handleWarp(b.v)}
                  className="btn-press rounded-lg border border-line bg-ink/50 px-2.5 py-1.5 font-mono text-[11.5px] font-semibold text-mist hover:border-amber/50 hover:text-amber"
                >
                  {b.label}
                </button>
              ))}
              {offset > 0 && (
                <>
                  <span className="mono-chip rounded-lg border border-amber/40 bg-amber/10 px-2.5 py-1.5 text-amber">
                    Simulation: {fmtClockOffset(offset)}
                  </span>
                  <button
                    onClick={() => {
                      store.resetClock();
                      addToast("Zurück in der Echtzeit.", "info");
                    }}
                    className="btn-press flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 font-mono text-[11.5px] text-mist hover:border-rose/50 hover:text-rose"
                  >
                    <IconReset size={12} /> Echtzeit
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setManualOpen(true)}
                title="Funktions- & Betriebsanleitung (Taste ?)"
                className="btn-press flex items-center gap-2 rounded-xl border border-line bg-ink/50 px-4 py-2.5 font-display text-[13.5px] font-bold text-mist hover:border-amber/50 hover:text-amber"
              >
                <IconBook size={16} /> Anleitung
              </button>
              <button
                onClick={startSleep}
                disabled={sleepReport !== null}
                className="btn-press flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 font-display text-[13.5px] font-bold text-ink shadow-lg shadow-teal/20 hover:bg-[#63e0ca] disabled:opacity-60"
              >
                <IconMoon size={16} /> Schlafzyklus starten
              </button>
            </div>
          </div>
        </header>

        {/* ================= Hauptfläche ================= */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Linke Spalte: Codierung + Erklärung */}
          <aside className="space-y-5">
            <Reveal>
              <CapturePanel projects={memories.map((m) => m.project)} onCapture={handleCapture} />
            </Reveal>

            <Reveal delay={90}>
              <section className="panel p-4 sm:p-5">
                <h2 className="font-display text-[15px] font-bold text-fog">Der Kreislauf der Erinnerung</h2>
                <ul className="mt-3 space-y-3">
                  {[
                    { icon: <IconBolt size={15} />, c: "#F2B24C", t: "Codieren", d: "Jede Spur startet frisch im Hippocampus — R = 100 %." },
                    { icon: <IconBrainWave size={15} />, c: "#E2708A", t: "Zerfall", d: "Ebbinghaus nagt: R(t) = e^(−t/S). Unwichtiges verblasst zuerst." },
                    { icon: <IconSpark size={15} />, c: "#41D0B8", t: "Abruf", d: "Erinnern ist Training — jeder Abruf potentiert die Synapse." },
                    { icon: <IconMoon size={15} />, c: "#9BC46B", t: "Schlaf", d: "Konsolidierung brennt bewährte Episoden in den Neocortex." },
                  ].map((s) => (
                    <li key={s.t} className="flex gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${s.c}1a`, color: s.c, boxShadow: `inset 0 0 0 1px ${s.c}40` }}>
                        {s.icon}
                      </span>
                      <p className="text-[12px] leading-snug text-mist">
                        <b className="text-fog">{s.t}</b> — {s.d}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          </aside>

          {/* Rechte Spalte: Cortex + Tabs */}
          <main className="min-w-0 space-y-5">
            <Reveal delay={60}>
              <section className="panel overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal" />
                    </span>
                    <h2 className="font-display text-[15px] font-bold text-fog">Cortex — assoziatives Netzwerk</h2>
                  </div>
                  <p className="hidden text-[11px] text-dim md:block">
                    {synapses.length} Synapsen · Knoten anklicken fokussiert, Hover zeigt Assoziationen
                  </p>
                </div>
                <div className="h-[400px] sm:h-[470px]">
                  <NeuralCanvas
                    memories={active}
                    synapses={synapses}
                    now={store.virtualNow}
                    selectedId={selectedId}
                    hoveredId={hoveredId}
                    onSelect={setSelectedId}
                    onHover={setHoveredId}
                    onRecall={handleRecall}
                  />
                </div>
              </section>
            </Reveal>

            <Reveal delay={120}>
              <section className="panel p-4 sm:p-5">
                <nav className="flex flex-wrap gap-1.5 border-b border-line pb-3">
                  {(
                    [
                      { id: "spuren", label: "Gedächtnisspuren", icon: <IconNeuron size={15} /> },
                      { id: "kurve", label: "Vergessenskurve", icon: <IconChart size={15} /> },
                      { id: "export", label: "CLAUDE.md", icon: <IconFile size={15} /> },
                    ] as Array<{ id: Tab; label: string; icon: React.ReactNode }>
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`btn-press flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold ${
                        tab === t.id ? "bg-amber/14 text-amber ring-1 ring-amber/35" : "text-mist hover:bg-fog/6 hover:text-fog"
                      }`}
                    >
                      {t.icon} {t.label}
                      {t.id === "spuren" && <span className="font-mono text-[10.5px] opacity-70">{active.length}</span>}
                    </button>
                  ))}
                </nav>

                <div className="pt-4">
                  {tab === "spuren" && (
                    <MemoryList
                      memories={memories}
                      now={store.virtualNow}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onHover={setHoveredId}
                      onRecall={handleRecall}
                      onDelete={handleDelete}
                      onRevive={handleRevive}
                      searchRef={searchRef}
                      flashId={flashId}
                    />
                  )}
                  {tab === "kurve" && (
                    <RetentionChart memories={memories} now={store.virtualNow} selectedId={selectedId} />
                  )}
                  {tab === "export" && <ExportPanel memories={memories} now={store.virtualNow} onToast={addToast} />}
                </div>
              </section>
            </Reveal>
          </main>
        </div>

        {/* ================= Fuß ================= */}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="max-w-[560px] text-[11px] leading-relaxed text-dim">
            ENGRAMM · Alle Spuren bleiben lokal in deinem Browser — kein Server, kein Context-Reset.
            Kuratierte Erinnerung: Was du hier stärkst, landet als <span className="font-mono text-mist">CLAUDE.md</span> in deinem Projekt.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportBackup}
              title="Komplettes Gehirn als JSON-Datei sichern"
              className="btn-press flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-semibold text-mist hover:border-teal/50 hover:text-teal"
            >
              <IconDownload size={13} /> Gehirn sichern
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              title="Gehirn aus einer JSON-Sicherung wiederherstellen"
              className="btn-press flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-semibold text-mist hover:border-teal/50 hover:text-teal"
            >
              <IconReset size={13} /> Wiederherstellen
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importBackup(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => {
                store.loadSeeds();
                setSelectedId(null);
                addToast("Beispiel-Erinnerungen neu geladen.", "ok");
              }}
              className="btn-press rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-semibold text-mist hover:border-signal/60 hover:text-fog"
            >
              Beispiele laden
            </button>
            <button
              onClick={handleWipe}
              className={`btn-press rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold ${
                confirmWipe ? "border-rose/50 bg-rose/15 text-rose" : "border-line text-dim hover:border-rose/40 hover:text-rose"
              }`}
            >
              {confirmWipe ? "Wirklich alles löschen?" : "Cortex leeren"}
            </button>
          </div>
        </footer>
      </div>

      {sleepReport && <SleepOverlay report={sleepReport} onDone={finishSleep} />}
      <Manual open={manualOpen} onClose={() => setManualOpen(false)} />
      <Toasts items={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-line bg-abyss/60 px-3.5 py-2 backdrop-blur-sm">
      <p className="mono-chip text-dim">{label}</p>
      <p className="mt-0.5 font-mono text-[19px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
