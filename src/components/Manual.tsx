import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  IconArchive,
  IconBolt,
  IconBrainWave,
  IconChart,
  IconFastForward,
  IconFile,
  IconHippo,
  IconLink,
  IconMoon,
  IconNeuron,
  IconSpark,
  IconX,
  LogoMark,
} from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TOC = [
  { id: "vorwort", nr: "01", label: "Vorwort & Konzept", color: "#F2B24C" },
  { id: "schnellstart", nr: "02", label: "Schnellstart", color: "#41D0B8" },
  { id: "oberflaeche", nr: "03", label: "Oberfläche im Überblick", color: "#9BC46B" },
  { id: "erfassen", nr: "04", label: "Erfassen: der Hippocampus", color: "#F2B24C" },
  { id: "systeme", nr: "05", label: "Die drei Speichersysteme", color: "#41D0B8" },
  { id: "zerfall", nr: "06", label: "Zerfall, Retention & Status", color: "#E2708A" },
  { id: "abruf", nr: "07", label: "Abruf & Potenzierung", color: "#41D0B8" },
  { id: "netzwerk", nr: "08", label: "Das assoziative Netzwerk", color: "#9BC46B" },
  { id: "schlaf", nr: "09", label: "Schlafzyklus & Konsolidierung", color: "#41D0B8" },
  { id: "zeitraffer", nr: "10", label: "Zeitraffer-Simulation", color: "#F2B24C" },
  { id: "kurve", nr: "11", label: "Die Vergessenskurve lesen", color: "#E2708A" },
  { id: "export", nr: "12", label: "Export nach CLAUDE.md", color: "#9BC46B" },
  { id: "daten", nr: "13", label: "Datenhaltung & Privatsphäre", color: "#F2B24C" },
  { id: "befehle", nr: "14", label: "Befehle & Arbeitsrhythmus", color: "#41D0B8" },
  { id: "faq", nr: "15", label: "Fragen & Fehlerbehebung", color: "#E2708A" },
];

export default function Manual({ open, onClose }: Props) {
  const [active, setActive] = useState("vorwort");
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Scroll-Spy + Körper-Scrollsperre + Esc */
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root, rootMargin: "-12% 0px -70% 0px", threshold: 0 }
    );
    TOC.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [open]);

  if (!open) return null;

  const jump = (id: string) => {
    const el = document.getElementById(id);
    const root = scrollRef.current;
    if (el && root) {
      const target = root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - 14;
      root.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Funktions- und Betriebsanleitung">
      <div className="mx-auto flex h-full max-w-[1200px] flex-col">
        {/* Kopfzeile des Handbuchs */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-abyss/80 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raise/70">
              <LogoMark size={26} />
            </span>
            <div>
              <p className="mono-chip text-amber">ENGRAMM · Dokumentation</p>
              <h2 className="font-display text-[19px] font-extrabold leading-tight text-fog">
                Funktions- &amp; Betriebsanleitung
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono-chip hidden rounded-md border border-line px-2 py-1 text-mist sm:block">Version 1.0 · de-DE</span>
            <button
              onClick={onClose}
              className="btn-press flex h-10 w-10 items-center justify-center rounded-xl border border-line text-mist hover:border-rose/50 hover:text-rose"
              aria-label="Anleitung schließen (Esc)"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Inhaltsverzeichnis */}
          <nav className="hidden w-[264px] shrink-0 overflow-y-auto border-r border-line bg-abyss/60 px-3 py-4 md:block">
            <p className="mono-chip px-2 text-dim">Inhalt</p>
            <ul className="mt-2 space-y-0.5">
              {TOC.map((t) => {
                const isActive = active === t.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => jump(t.id)}
                      className={`btn-press flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-semibold transition-colors ${
                        isActive ? "bg-fog/8 text-fog" : "text-mist hover:bg-fog/5 hover:text-fog"
                      }`}
                    >
                      <span className="font-mono text-[10.5px] font-bold" style={{ color: isActive ? t.color : "#5D747C" }}>
                        {t.nr}
                      </span>
                      <span className="flex-1 leading-tight">{t.label}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 rounded-xl border border-line bg-ink/50 p-3">
              <p className="text-[11px] leading-relaxed text-dim">
                <b className="text-mist">Tipp:</b> In der App springst du mit{" "}
                <Kbd>/</Kbd> direkt zur Suche und mit <Kbd>?</Kbd> hierher zurück.
              </p>
            </div>
          </nav>

          {/* Kapitelbereich */}
          <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
            {/* mobile Kapitel-Navigation */}
            <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
              {TOC.map((t) => (
                <button
                  key={t.id}
                  onClick={() => jump(t.id)}
                  className={`btn-press shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold ${
                    active === t.id ? "border-fog/30 bg-fog/10 text-fog" : "border-line text-mist"
                  }`}
                >
                  {t.nr}
                </button>
              ))}
            </div>

            <div className="mx-auto max-w-[760px]">
              <Chapter id="vorwort" nr="01" title="Vorwort & Konzept" color="#F2B24C" icon={<IconHippo size={18} />}>
                <p>
                  <b>ENGRAMM</b> ist ein Langzeitgedächtnis für deine Arbeit mit Claude Code — modelliert nach dem
                  menschlichen Gehirn statt nach einer Notizliste. Das Problem, das es löst: Claude-Code-Sitzungen
                  verlieren zwischen Projekten und Context-Resets alles, was du mühsam erarbeitet hast. Notizen
                  stapeln sich, wuchern und werden nie wieder gelesen.
                </p>
                <p>
                  ENGRAMM behandelt Wissen wie ein Gehirn: Jede Erinnerung wird <b>codiert</b>, unterliegt der{" "}
                  <b>Ebbinghaus'schen Vergessenskurve</b>, wird durch <b>Abruf stärker</b> (Retrieval Practice) und in
                  nächtlichen <b>Schlafphasen konsolidiert</b> — bewährte Episoden werden zu dauerhaftem Wissen,
                  Unwichtiges verblasst. Was übrig bleibt, exportierst du als kuratierte{" "}
                  <code className="code">CLAUDE.md</code> in dein Projekt.
                </p>
                <div className="callout">
                  <p className="mono-chip mb-1 text-amber">Die biologische Analogie</p>
                  <p>
                    <b>Hippocampus</b> = Erfassen neuer Spuren · <b>Amygdala</b> = emotionale Gewichtung (1–5) ·{" "}
                    <b>Neocortex</b> = konsolidiertes Langzeitwissen · <b>Synapsen</b> = Assoziationen zwischen Spuren ·{" "}
                    <b>LTP</b> = Potenzierung durch Abruf.
                  </p>
                </div>
              </Chapter>

              <Chapter id="schnellstart" nr="02" title="Schnellstart — in vier Schritten" color="#41D0B8" icon={<IconBolt size={18} />}>
                <ol className="steps">
                  <li>
                    <b>App öffnen.</b> Beim ersten Start sind 12 realistische Beispiel-Erinnerungen vorcodiert — über
                    mehrere Projekte, Altersstufen und Speichersysteme verteilt. So siehst du sofort Zerfall, Kurven
                    und Netzwerk in Aktion.
                  </li>
                  <li>
                    <b>Eigene Spur erfassen.</b> Links im Hippocampus-Panel: Text (mind. 4 Zeichen), Projekt,
                    Speichersystem, Gewichtung, Tags — dann <em>„Ins Gedächtnis brennen"</em>. Die Spur startet mit
                    R&nbsp;=&nbsp;100&nbsp;%.
                  </li>
                  <li>
                    <b>Zerfall beobachten &amp; trainieren.</b> Mit <em>+1 Tag</em> im Zeitraffer altert das Gehirn in
                    Sekunden. Sobald eine Spur „Auffrischung in …" anzeigt: <em>Abrufen</em> — das potentiert die
                    Synapse und verlangsamt den weiteren Zerfall.
                  </li>
                  <li>
                    <b>Exportieren.</b> Tab <em>CLAUDE.md</em> → max. Einträge wählen → <em>Kopieren</em> oder{" "}
                    <em>Herunterladen</em> → Datei ins Projekt-Root legen. Claude Code liest sie bei jedem Start.
                  </li>
                </ol>
              </Chapter>

              <Chapter id="oberflaeche" nr="03" title="Oberfläche im Überblick" color="#9BC46B" icon={<IconNeuron size={18} />}>
                <p>Die App gliedert sich in vier Zonen:</p>
                <ul className="bullets">
                  <li>
                    <b>Kopf mit Vitalwerten:</b> Aktive Spuren, Synapsen, Ø&nbsp;Retention (Farbe wechselt: grün &gt;&nbsp;50&nbsp;%,
                    gelb &gt;&nbsp;25&nbsp;%, darunter rot) und absolvierte Schlafzyklen.
                  </li>
                  <li>
                    <b>Aktionsleiste:</b> Zeitraffer-Knöpfe (<em>+1 Std · +1 Tag · +7 Tage</em>), Anzeige des
                    Simulations-Offsets, <em>Echtzeit</em> zum Zurücksetzen — und rechts der{" "}
                    <em>Schlafzyklus</em>-Knopf.
                  </li>
                  <li>
                    <b>Linke Spalte:</b> der Hippocampus (Erfassungs-Formular) plus eine Kurzfassung des
                    Erinnerungskreislaufs.
                  </li>
                  <li>
                    <b>Rechte Spalte:</b> oben der <em>Cortex</em> (interaktives Netzwerk), darunter drei Tabs —{" "}
                    <em>Gedächtnisspuren</em>, <em>Vergessenskurve</em>, <em>CLAUDE.md</em>. Im Fußbereich:{" "}
                    <em>Beispiele laden</em> und <em>Cortex leeren</em>.
                  </li>
                </ul>
              </Chapter>

              <Chapter id="erfassen" nr="04" title="Erfassen: der Hippocampus" color="#F2B24C" icon={<IconHippo size={18} />}>
                <p>Jede neue Erinnerung durchläuft das Formular links. Die Felder im Einzelnen:</p>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr><th>Feld</th><th>Regel</th><th>Wirkung</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>Gedächtnisspur</b></td>
                        <td>Mind. 4 Zeichen — sonst warnt das Formular.</td>
                        <td>Der Inhalt selbst. Je konkreter, desto nützlicher im späteren Export.</td>
                      </tr>
                      <tr>
                        <td><b>Projekt</b></td>
                        <td>Freitext mit Vorschlägen bestehender Projekte; leer = „Allgemein".</td>
                        <td>Gruppiert Spuren und erzeugt Synapsen zwischen Spuren desselben Projekts.</td>
                      </tr>
                      <tr>
                        <td><b>Assoziationen</b></td>
                        <td>Tags per Komma, Semikolon oder Leerzeichen; max. 6, automatisch klein­geschrieben.</td>
                        <td>Geteilte Tags verknüpfen Spuren im Netzwerk — assoziatives Erinnern.</td>
                      </tr>
                      <tr>
                        <td><b>Speichersystem</b></td>
                        <td>Episodisch, semantisch oder prozedural (siehe Kapitel 05).</td>
                        <td>Bestimmt die Basis-Stabilität — also wie schnell die Spur zerfällt.</td>
                      </tr>
                      <tr>
                        <td><b>Emotionale Gewichtung</b></td>
                        <td>1 (nebensächlich) bis 5 (brandkritisch).</td>
                        <td>
                          Die Amygdala-Formel: <code className="code">S × (1 + 0,55 × (Gewichtung − 1))</code>. Stufe 5
                          zerfällt 3,2-mal langsamer als Stufe 1.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  Der Knopf <em>„Ins Gedächtnis brennen"</em> nimmt sich eine kurze Codier-Latenz — wie ein echter
                  synaptischer Vorgang — und bestätigt per Toast. Die Spur erscheint sofort im Netzwerk und in der
                  Spurenliste mit R&nbsp;=&nbsp;100&nbsp;% und Status <em>frisch</em>.
                </p>
              </Chapter>

              <Chapter id="systeme" nr="05" title="Die drei Speichersysteme" color="#41D0B8" icon={<IconBrainWave size={18} />}>
                <p>
                  Wie das Gehirn unterscheidet ENGRAMM drei Gedächtnistypen mit sehr unterschiedlicher Haltbarkeit.
                  Die Basis-Stabilität S₀ (bei Gewichtung&nbsp;1):
                </p>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr><th>System</th><th>Farbe</th><th>Basis-Stabilität</th><th>Halbwertszeit*</th><th>Typischer Inhalt</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b style={{ color: "#F2B24C" }}>Episodisch</b></td>
                        <td><span className="dot" style={{ background: "#F2B24C" }} /></td>
                        <td>10 Stunden</td>
                        <td>≈ 14,6 Std.</td>
                        <td>Erlebnisse &amp; Entscheidungen: „Heute mit Claude den Auth-Bug getriggert — lag am Token-Refresh."</td>
                      </tr>
                      <tr>
                        <td><b style={{ color: "#41D0B8" }}>Semantisch</b></td>
                        <td><span className="dot" style={{ background: "#41D0B8" }} /></td>
                        <td>8 Tage</td>
                        <td>≈ 11,6 Tage</td>
                        <td>Fakten &amp; Wissen: „Die Pipeline erwartet Node 20."</td>
                      </tr>
                      <tr>
                        <td><b style={{ color: "#9BC46B" }}>Prozedural</b></td>
                        <td><span className="dot" style={{ background: "#9BC46B" }} /></td>
                        <td>30 Tage</td>
                        <td>≈ 43,7 Tage</td>
                        <td>Abläufe &amp; Skills: „Release: erst Changelog, dann Tag, dann Deploy."</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="caption">* bei emotionaler Gewichtung 3 (Amygdala-Faktor 2,1) · T½ = S · ln 2</p>
                <div className="callout teal">
                  <p>
                    <b>Faustregel:</b> Einmal-Erlebnisse bleiben episodisch und dürfen ruhig verblassen — dafür gibt es
                    den Schlafzyklus. Alles, was Claude bei <em>jeder</em> Sitzung wissen soll, gehört semantisch oder
                    prozedural codiert.
                  </p>
                </div>
              </Chapter>

              <Chapter id="zerfall" nr="06" title="Zerfall, Retention & Status" color="#E2708A" icon={<IconChart size={18} />}>
                <p>
                  Jede aktive Spur verliert kontinuierlich Erinnerungsstärke — live, sekündlich, nach Hermann Ebbinghaus:
                </p>
                <div className="formula">
                  <p className="mono">R(t) = e^(−t/S)</p>
                  <p className="text">
                    R = Retention (0…1) · t = Zeit seit dem letzten Abruf · S = Stabilität ={" "}
                    <span className="mono">S₀ × Amygdala × Stabilitätsfaktor</span>
                  </p>
                </div>
                <p>Daraus leiten sich die fünf Zustände ab, die du als farbcodierte Chips siehst:</p>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr><th>Status</th><th>Retention</th><th>Bedeutung</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><span className="chip" style={{ color: "#41D0B8" }}>frisch</span></td><td>≥ 75 %</td><td>Gerade codiert oder abgerufen — sofort abrufbar.</td></tr>
                      <tr><td><span className="chip" style={{ color: "#9BC46B" }}>stabil</span></td><td>45 – 75 %</td><td>Gesunde Spur, kein Handlungsbedarf.</td></tr>
                      <tr><td><span className="chip" style={{ color: "#F2B24C" }}>schwächer</span></td><td>18 – 45 %</td><td>Bald auffrischen — hier liegt der Lern-Sweet-Spot.</td></tr>
                      <tr><td><span className="chip" style={{ color: "#E2708A" }}>kritisch</span></td><td>&lt; 18 %</td><td>Kurz vor dem Verblassen — jetzt abrufen oder verlieren.</td></tr>
                      <tr><td><span className="chip" style={{ color: "#5D747C" }}>verblasst</span></td><td>Archiv</td><td>Im Schlafzyklus bei R&nbsp;&lt;&nbsp;12&nbsp;% entlassen; reaktivierbar.</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  Der Hinweis <em>„Auffrischung in …"</em> in jeder Spurenkarte zeigt, wann die Retention unter
                  40&nbsp;% fällt — der empfohlene Zeitpunkt für den nächsten Abruf. Im Netzwerk erkennst du Zerfall
                  daran, dass Neuronen schrumpfen und dunkler werden; kritische Spuren pulsieren.
                </p>
              </Chapter>

              <Chapter id="abruf" nr="07" title="Abruf & synaptische Potenzierung" color="#41D0B8" icon={<IconSpark size={18} />}>
                <p>
                  Erinnern ist kein passives Lesen, sondern Training: Jeder Abruf setzt die Retention zurück auf
                  100&nbsp;% <b>und</b> erhöht den Stabilitätsfaktor multiplikativ — die Spur zerfällt danach langsamer.
                  Wie stark der Zuwachs ausfällt, hängt davon ab, <em>wie schwierig</em> der Abruf war
                  (Desirable-Difficulty-Effekt):
                </p>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr><th>Retention beim Abruf</th><th>Zuwachs Stabilitätsfaktor</th><th>Einordnung</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>&gt; 60 %</td><td className="mono">× 1,35</td><td>Zu früh — geringe Wirkung.</td></tr>
                      <tr><td>30 – 60 %</td><td className="mono">× 1,80</td><td>Gutes Timing.</td></tr>
                      <tr><td>&lt; 30 %</td><td className="mono">× 2,40</td><td><b>Sweet Spot</b> — maximale Potenzierung.</td></tr>
                      <tr><td>Aus dem Archiv</td><td className="mono">× 2,40 × 1,6</td><td>Relearning: Reaktivierung wirkt besonders stark.</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  Du rufst ab über den <em>Abrufen</em>-Knopf in der Spurenkarte oder über das Detail-Chip im Netzwerk.
                  Erfolgreiche Abrufe werden in der Historie der Spur protokolliert — die Vergessenskurve zeichnet sie
                  als Zacken nach oben. Strategie: Nicht sofort auffrischen, sondern warten, bis der Status auf{" "}
                  <em>schwächer</em> oder <em>kritisch</em> fällt.
                </p>
              </Chapter>

              <Chapter id="netzwerk" nr="08" title="Das assoziative Netzwerk" color="#9BC46B" icon={<IconLink size={18} />}>
                <p>
                  Der Cortex oben rechts ist kein Bild, sondern eine lebende Simulation: Jede aktive Spur ist ein
                  Neuron (Farbe = Speichersystem, Größe &amp; Leuchten = aktuelle Retention), jede Assoziation eine
                  Synapse mit wandernden Signalpulsen.
                </p>
                <ul className="bullets">
                  <li><b>Verknüpfung entsteht</b> durch gemeinsames Projekt (+0,24 Gewicht) und geteilte Tags (+0,22 je Tag), Startgewicht 0,16.</li>
                  <li><b>Schlafzyklen stärken</b> bestehende Synapsen um +0,12 (Obergrenze 0,8) — das Netz wird dichter.</li>
                  <li><b>Hover</b> über ein Neuron zeigt seine Assoziationspartner und gemeinsamen Anker.</li>
                  <li><b>Klick</b> fokussiert das Neuron, wählt die zugehörige Spur aus und blendet ein Detail-Chip mit <em>Abrufen</em>-Knopf ein.</li>
                  <li><b>Verblasste Spuren</b> verschwinden aus dem Netz — bis zur Reaktivierung.</li>
                </ul>
                <div className="callout">
                  <p>
                    <b>Warum das nützt:</b> Claude-Code-Wissen ist selten isoliert — „Deploy bricht" hängt an „Node
                    20" hängt an „CI-Cache". Wer Tags und Projekte konsistent pflegt, baut ein Assoziationsnetz, das
                    zusammenhängende Wissenscluster exportiert statt lose Notizen.
                  </p>
                </div>
              </Chapter>

              <Chapter id="schlaf" nr="09" title="Schlafzyklus & Konsolidierung" color="#41D0B8" icon={<IconMoon size={18} />}>
                <p>
                  Der Knopf <em>„Schlafzyklus starten"</em> löst die nächtliche Systems Consolidation aus. Zuerst läuft
                  eine Replay-Phase (bis zu acht Spuren werden „wiederholt"), dann gelten drei Regeln:
                </p>
                <ol className="steps">
                  <li>
                    <b>Konsolidierung:</b> Episodische Spuren mit mindestens 2 Abrufen und R&nbsp;&gt;&nbsp;30&nbsp;% wandern in den
                    Neocortex — sie werden <em>semantisch</em>, erhalten den Badge <em>konsolidiert</em> und
                    ×&nbsp;1,5 Stabilität.
                  </li>
                  <li>
                    <b>Verblassen:</b> Spuren unter R&nbsp;=&nbsp;12&nbsp;% werden ins Archiv entlassen (Status{" "}
                    <em>verblasst</em>). Sie sind nicht gelöscht — über den Filter <em>Verblasste</em> findest du sie
                    und kannst sie reaktivieren.
                  </li>
                  <li>
                    <b>Synapsen-Potentierung:</b> Alle verknüpften Spuren-Paare gewinnen +0,12 Synapsengewicht.
                  </li>
                </ol>
                <p>
                  Danach erscheint der <b>Bericht der Nacht</b>: wie viele Spuren konsolidiert, wie viele verblasst und
                  wie viele Synapsen gestärkt wurden. Der Zähler <em>Schlafzyklen</em> im Kopf zählt mit. Empfehlung:
                  ein Zyklus am Ende eines Arbeitstags — oder nach einem Zeitraffer-Sprung.
                </p>
              </Chapter>

              <Chapter id="zeitraffer" nr="10" title="Zeitraffer-Simulation" color="#F2B24C" icon={<IconFastForward size={18} />}>
                <p>
                  Echter Zerfall dauert Tage — die Zeitraffer-Knöpfe in der Aktionsleiste komprimieren ihn auf
                  Sekunden. <em>+1 Std</em>, <em>+1 Tag</em> und <em>+7 Tage</em> addieren sich; der amberfarbene Chip
                  zeigt den aktuellen Offset (z.&nbsp;B. <span className="mono">+8,0 Tage</span>), <em>Echtzeit</em>{" "}
                  setzt ihn zurück.
                </p>
                <ul className="bullets">
                  <li>Alle Anzeigen — Balken, Status, Kurven, Netzwerk, Ø&nbsp;Retention — reagieren sofort.</li>
                  <li>
                    <b>Achtung:</b> Spuren, die du <em>während</em> der Simulation erfasst, erhalten den virtuellen
                    Zeitstempel. Sie altern also aus Sicht der Echtzeit sofort — gewollt, aber gut zu wissen.
                  </li>
                  <li>Ideal, um die Vergessenskurve zu studieren oder Spuren gezielt in den Abruf-Sweet-Spot altern zu lassen.</li>
                </ul>
              </Chapter>

              <Chapter id="kurve" nr="11" title="Die Vergessenskurve lesen" color="#E2708A" icon={<IconChart size={18} />}>
                <p>Der Tab <em>Vergessenskurve</em> hat zwei Ansichten:</p>
                <ul className="bullets">
                  <li>
                    <b>Ohne Auswahl:</b> die durchschnittliche Retention aller aktiven Spuren, getrennt nach den drei
                    Speichersystemen — Vergangenheit links, Prognose rechts der <em>JETZT</em>-Linie. Episodische
                    Kurven knicken ohne Abrufe sichtbar schneller ab.
                  </li>
                  <li>
                    <b>Mit Auswahl</b> (Spur anklicken): die individuelle Sägezahn-Kurve. Jeder Zacken nach oben ist ein
                    Abruf, dazwischen siehst du den Zerfall. Rechts der letzte Abruf: die Ebbinghaus-Prognose.
                  </li>
                </ul>
                <p>
                  Über dem Diagramm stehen drei Kennzahlen: <b>R (jetzt)</b>, die <b>Halbwertszeit T½</b> und der
                  Zeitpunkt der nächsten <b>Auffrischung</b> (R fällt unter 40&nbsp;%).
                </p>
              </Chapter>

              <Chapter id="export" nr="12" title="Export nach CLAUDE.md" color="#9BC46B" icon={<IconFile size={18} />}>
                <p>
                  Der Tab <em>CLAUDE.md</em> ist der eigentliche Zweck der App: Er verwandelt die überlebenden Spuren
                  in eine Datei, die Claude Code bei jedem Start automatisch liest.
                </p>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr><th>Option</th><th>Wirkung</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><b>Max. Einträge</b> (5–50)</td><td>Begrenzt die Kuratierung; gewählt wird nach Gewichtung, dann Retention — das Wichtigste überlebt immer.</td></tr>
                      <tr><td><b>Verblasste Spuren aufnehmen</b></td><td>Nimmt Archiv-Spuren in den Pool auf (für Vollständigkeit statt Frische).</td></tr>
                      <tr><td><b>CLAUDE.md</b></td><td>Fürs Projekt-Root — Claude Code liest sie automatisch beim Start.</td></tr>
                      <tr><td><b>memory.md</b></td><td>Für <span className="mono">~/.claude/memory.md</span> oder eigene Loader-Skripte.</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>Das erzeugte Format — gruppiert nach Projekt, absteigend nach Bedeutung:</p>
                <pre className="pre">
{`- [Semantisch · R 0,84 · ★★★★★] Deploy erwartet Node 20 #build #deploy
- [Prozedural · R 0,71 · ★★★★☆] Release: Changelog → Tag → Deploy #release`}
                </pre>
                <p>
                  Jeder Eintrag trägt Typ, aktuelle Retention und Gewichtung als Sterne — Claude sieht also, wie
                  verlässlich eine Erinnerung noch ist. Die <b>Token-Schätzung</b> (≈ Zeichen ÷ 3,6) hilft, das
                  Context-Budget zu planen. <em>Kopieren</em> legt das Markdown in die Zwischenablage,{" "}
                  <em>Herunterladen</em> speichert die Datei direkt.
                </p>
                <div className="callout teal">
                  <p>
                    <b>Arbeitsfluss:</b> Unter der Woche Spuren erfassen und abrufen → freitags Schlafzyklus + Export →
                    neue <span className="mono">CLAUDE.md</span> ins Projekt. Claude startet montags mit deinem
                    kondensierten Wissen statt mit Null.
                  </p>
                </div>
              </Chapter>

              <Chapter id="daten" nr="13" title="Datenhaltung & Privatsphäre" color="#F2B24C" icon={<IconArchive size={18} />}>
                <ul className="bullets">
                  <li>
                    <b>Lokal &amp; serverlos:</b> Alles liegt im <span className="mono">localStorage</span> deines
                    Browsers unter dem Schlüssel <span className="mono">engramm:v1</span>. Kein Konto, kein Upload, kein
                    Tracking — deine Projektnotizen verlassen den Rechner nicht.
                  </li>
                  <li><b>Persistenz:</b> Jede Änderung wird sofort gespeichert; ein Neuladen stellt den Zustand wieder her — inklusive Zeitraffer-Offset und Schlafzyklen.</li>
                  <li><b>Privatmodus:</b> Dort lebt der Speicher nur für die Sitzung; danach ist das Gedächtnis leer (wie nach tiefer Narkose).</li>
                  <li>
                    <b>Sichern &amp; Umziehen:</b> <em>Gehirn sichern</em> (Fußbereich) lädt das komplette Gehirn als
                    JSON-Datei (Spuren, Synapsen, Zeitraffer, Schlafzyklen). <em>Wiederherstellen</em> liest sie wieder
                    ein — ideal für Rechnerwechsel, Browserwechsel oder ein zweites Gehirn in einem anderen Browser.
                  </li>
                  <li>
                    <b>Beispiele laden:</b> Setzt <em>alles</em> zurück und lädt die 12 Beispiel-Erinnerungen neu —
                    inklusive Nullsetzen von Schlafzyklen und Zeitraffer.
                  </li>
                  <li>
                    <b>Cortex leeren:</b> Zweistufige Sicherheitsabfrage („Wirklich alles löschen?" bleibt 3 Sekunden
                    scharf). Danach: Tabula rasa.
                  </li>
                </ul>
              </Chapter>

              <Chapter id="befehle" nr="14" title="Befehle & empfohlener Arbeitsrhythmus" color="#41D0B8" icon={<IconSpark size={18} />}>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr><th>Taste</th><th>Funktion</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><Kbd>/</Kbd></td><td>Springt zur Suche in den Gedächtnisspuren (außerhalb von Eingabefeldern).</td></tr>
                      <tr><td><Kbd>?</Kbd></td><td>Öffnet diese Anleitung.</td></tr>
                      <tr><td><Kbd>Esc</Kbd></td><td>Schließt die Anleitung.</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4"><b>Empfohlener Rhythmus — wie ein echtes Gedächtnis gepflegt wird:</b></p>
                <ul className="bullets">
                  <li><b>Laufend:</b> Jede Erkenntnis sofort erfassen — korrekt gewichtet, mit Tags.</li>
                  <li><b>Täglich:</b> Kurzer Blick auf <em>schwächer/kritisch</em>; nur dort abrufen (Sweet Spot!).</li>
                  <li><b>Abends:</b> Ein Schlafzyklus — Episoden konsolidieren, Ballast verblasst.</li>
                  <li><b>Wöchentlich:</b> Export der <span className="mono">CLAUDE.md</span> ins aktive Projekt.</li>
                  <li><b>Bei Bedarf:</b> Zeitraffer, um Kurven und Konsolidierung zu demonstrieren oder zu testen.</li>
                </ul>
              </Chapter>

              <Chapter id="faq" nr="15" title="Fragen & Fehlerbehebung" color="#E2708A" icon={<IconBrainWave size={18} />}>
                <Faq q="Meine Spur ist verschwunden — wo ist sie?">
                  Wahrscheinlich ist sie im letzten Schlafzyklus verblasst (R&nbsp;&lt;&nbsp;12&nbsp;%). Aktiviere in der
                  Spurenliste den Filter <em>Verblasste</em> — dort liegt sie und lässt sich per{" "}
                  <em>Reaktivieren</em> zurückholen. Relearning wirkt sogar stärker als Erstlernen (×&nbsp;1,6 Bonus).
                </Faq>
                <Faq q="Warum ist meine episodische Spur plötzlich semantisch?">
                  Das war die Konsolidierung: episodische Spuren mit mindestens zwei Abrufen und R&nbsp;&gt;&nbsp;30&nbsp;%
                  werden im Schlaf in den Neocortex überführt. Der Badge <em>konsolidiert</em> markiert sie. Genau so
                  soll es sein — aus Erlebnis wurde Wissen.
                </Faq>
                <Faq q="Kann ich eine Spur nachträglich bearbeiten?">
                  Bewusst nein — Gehirne editieren nicht, sie codieren neu. Lösche die Spur und erfasse sie korrigiert
                  neu; das zählt als frischer Lernvorgang.
                </Faq>
                <Faq q="Der Export wird zu lang — was tun?">
                  Regler <em>Max. Einträge</em> nach unten (10–15 reichen oft), Haken <em>Verblasste Spuren</em> aus.
                  Die Kuratierung behält dann nur die höchstgewichtetsten, stärksten Spuren — die Token-Schätzung
                  unten zeigt die Wirkung sofort.
                </Faq>
                <Faq q="Das Netzwerk zeigt keine Linien zwischen meinen Spuren.">
                  Synapsen entstehen nur durch gemeinsames Projekt oder geteilte Tags. Pflege beides konsistent — nach
                  einem Schlafzyklus werden die Verbindungen zusätzlich gestärkt und sichtbarer.
                </Faq>
                <Faq q="Was bedeutet die Ø Retention im Kopf?">
                  Der Durchschnitt der aktuellen Erinnerungsstärke aller aktiven Spuren. Die Farbe codiert die
                  Gehirn-Gesundheit: grün &gt;&nbsp;50&nbsp;%, gelb &gt;&nbsp;25&nbsp;%, rot darunter. Sinkt sie stetig, ist es Zeit
                  für Abrufe — oder einen Schlafzyklus, um Ballast abzuwerfen.
                </Faq>
                <Faq q="Funktioniert ENGRAMM mit anderen Claude-Setups?">
                  Ja. <span className="mono">memory.md</span> passt zu eigenen Loader-Skripten oder{" "}
                  <span className="mono">~/.claude/memory.md</span>; das Markdown-Format ist bewusst einfach gehalten,
                  damit jeder Agent es lesen kann.
                </Faq>
              </Chapter>

              {/* Kolophon */}
              <footer className="mt-10 border-t border-line pb-4 pt-6 text-center">
                <p className="mono-chip text-dim">
                  ENGRAMM · Funktions- &amp; Betriebsanleitung v1.0 · Hippocampus → Neocortex · lokal, serverlos, dein Gehirn
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Bausteine ---------- */

function Chapter({
  id,
  nr,
  title,
  color,
  icon,
  children,
}: {
  id: string;
  nr: string;
  title: string;
  color: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-11 scroll-mt-4">
      <div className="mb-3.5 flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}1a`, color, boxShadow: `inset 0 0 0 1px ${color}45` }}
        >
          {icon}
        </span>
        <div>
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em]" style={{ color }}>
            KAPITEL {nr}
          </p>
          <h3 className="font-display text-[19px] font-extrabold leading-tight text-fog">{title}</h3>
        </div>
      </div>
      <div className="manual-body space-y-3 text-[13.5px] leading-relaxed text-mist">{children}</div>
    </section>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-line bg-ink/80 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-fog shadow-[0_2px_0_rgba(0,0,0,0.4)]">
      {children}
    </kbd>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`panel overflow-hidden ${open ? "border-signal/50" : ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-press flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-[13px] font-semibold text-fog">{q}</span>
        <span
          className={`shrink-0 font-mono text-[15px] leading-none text-amber transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-3.5 text-[12.5px] leading-relaxed text-mist">{children}</p>
        </div>
      </div>
    </div>
  );
}
