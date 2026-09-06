import { useMemo, useRef, useState } from "react";
import type { MemoryType } from "../lib/engine";
import { TYPE_COLOR, TYPE_DESC, TYPE_LABEL } from "../lib/engine";
import type { CaptureInput } from "../lib/store";
import { IconBolt, IconHippo } from "./Icons";

interface Props {
  projects: string[];
  onCapture: (input: CaptureInput) => void;
}

const TYPES: MemoryType[] = ["episodisch", "semantisch", "prozedural"];

export default function CapturePanel({ projects, onCapture }: Props) {
  const [content, setContent] = useState("");
  const [project, setProject] = useState("");
  const [type, setType] = useState<MemoryType>("episodisch");
  const [importance, setImportance] = useState(3);
  const [tags, setTags] = useState("");
  const [encoding, setEncoding] = useState(false);
  const [touched, setTouched] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const valid = content.trim().length >= 4;

  const datalist = useMemo(() => [...new Set(projects)].sort(), [projects]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setTouched(true);
      areaRef.current?.focus();
      return;
    }
    setEncoding(true);
    // kurze Codier-Latenz wie ein echter synaptischer Vorgang
    window.setTimeout(() => {
      onCapture({
        content,
        project: project || "Allgemein",
        type,
        importance,
        tags: tags.split(/[,;\s]+/),
      });
      setContent("");
      setTags("");
      setTouched(false);
      setEncoding(false);
      areaRef.current?.focus();
    }, 420);
  };

  return (
    <section className="panel reveal relative overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber/8 blur-2xl" />
      <header className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber ring-1 ring-amber/25">
          <IconHippo size={17} />
        </span>
        <div>
          <h2 className="font-display text-[15px] font-bold leading-tight text-fog">Hippocampus</h2>
          <p className="text-[11.5px] text-dim">Neue Erinnerung codieren</p>
        </div>
      </header>

      <form onSubmit={submit} className="mt-4 space-y-3.5">
        <div>
          <label htmlFor="cap-content" className="mono-chip mb-1.5 block text-mist">
            Gedächtnisspur
          </label>
          <textarea
            id="cap-content"
            ref={areaRef}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="z. B. „Deploy-Pipeline erwartet Node 20 — sonst bricht der Build“"
            className="field resize-none leading-snug"
          />
          <div className="mt-1 flex items-center justify-between">
            <span className={`text-[11px] ${touched && !valid ? "text-rose" : "text-dim"}`}>
              {touched && !valid ? "Mindestens 4 Zeichen — das Gehirn braucht Substanz." : "Je konkreter, desto stärker die Spur."}
            </span>
            <span className="font-mono text-[10.5px] text-dim">{content.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cap-project" className="mono-chip mb-1.5 block text-mist">
              Projekt
            </label>
            <input
              id="cap-project"
              list="engramm-projects"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Allgemein"
              className="field"
            />
            <datalist id="engramm-projects">
              {datalist.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="cap-tags" className="mono-chip mb-1.5 block text-mist">
              Assoziationen
            </label>
            <input
              id="cap-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="build, deploy …"
              className="field"
            />
          </div>
        </div>

        <div>
          <span className="mono-chip mb-1.5 block text-mist">Speichersystem</span>
          <div className="grid grid-cols-3 gap-1.5">
            {TYPES.map((t) => {
              const active = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  title={TYPE_DESC[t]}
                  className={`btn-press rounded-lg border px-1.5 py-2 text-center ${
                    active ? "border-transparent" : "border-line bg-ink/40 hover:border-signal/50"
                  }`}
                  style={active ? { background: `${TYPE_COLOR[t]}1f`, boxShadow: `inset 0 0 0 1px ${TYPE_COLOR[t]}66` } : undefined}
                >
                  <span className="mx-auto mb-1 block h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[t] }} />
                  <span className={`block text-[11px] font-semibold ${active ? "text-fog" : "text-mist"}`}>{TYPE_LABEL[t]}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-dim">{TYPE_DESC[type]}</p>
        </div>

        <div>
          <span className="mono-chip mb-1.5 block text-mist">
            Emotionale Gewichtung <span className="normal-case tracking-normal text-dim">(Amygdala)</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => {
                const active = i <= importance;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImportance(i)}
                    aria-label={`Gewichtung ${i}`}
                    className={`btn-press h-8 w-8 rounded-full border text-[12px] font-bold ${
                      active
                        ? "border-rose/50 bg-rose/15 text-rose"
                        : "border-line bg-ink/40 text-dim hover:border-signal/50"
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-dim">
              {importance >= 5 ? "brandkritisch" : importance >= 4 ? "wichtig" : importance >= 3 ? "relevant" : "nebensächlich"}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={encoding}
          className={`btn-press flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-[14px] font-bold tracking-wide ${
            encoding
              ? "cursor-wait bg-amber/20 text-amber"
              : "bg-amber text-ink shadow-lg shadow-amber/20 hover:bg-[#f7c266]"
          }`}
        >
          <IconBolt size={16} />
          {encoding ? "Codiere Spur …" : "Ins Gedächtnis brennen"}
        </button>
      </form>
    </section>
  );
}
