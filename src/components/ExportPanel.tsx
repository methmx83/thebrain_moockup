import { useMemo, useState } from "react";
import type { Memory } from "../lib/engine";
import { buildClaudeMemory, estimateTokens, strengthNow } from "../lib/engine";
import { IconCheck, IconCopy, IconDownload, IconFile } from "./Icons";

interface Props {
  memories: Memory[];
  now: number;
  onToast: (msg: string, kind?: "ok" | "warn") => void;
}

export default function ExportPanel({ memories, now, onToast }: Props) {
  const [maxEntries, setMaxEntries] = useState(25);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [filename, setFilename] = useState<"CLAUDE.md" | "memory.md">("CLAUDE.md");
  const [copied, setCopied] = useState(false);

  const active = useMemo(() => memories.filter((m) => !m.archived), [memories]);

  const markdown = useMemo(
    () => buildClaudeMemory(memories, now, { maxEntries, includeArchived, filename }),
    [memories, now, maxEntries, includeArchived, filename]
  );

  const tokens = estimateTokens(markdown);
  const includedCount = useMemo(
    () =>
      memories
        .filter((m) => includeArchived || !m.archived)
        .map((m) => ({ m, s: strengthNow(m, now) }))
        .sort((a, b) => b.m.importance - a.m.importance || b.s - a.s)
        .slice(0, maxEntries).length,
    [memories, now, maxEntries, includeArchived]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = markdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    onToast(`${filename} in die Zwischenablage kopiert`);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onToast(`${filename} heruntergeladen — ab ins Projektverzeichnis`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Steuerung */}
      <div className="space-y-4">
        <div className="panel p-4">
          <p className="text-[13px] leading-snug text-mist">
            Der Export kuratiert die <b className="text-fog">stärksten Spuren</b> nach Gewichtung &amp; Retention — genau das, was Claude Code bei jedem Start lesen soll.
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="max-entries" className="mono-chip text-mist">Max. Einträge</label>
              <span className="font-mono text-[12px] font-semibold text-amber">{maxEntries}</span>
            </div>
            <input
              id="max-entries"
              type="range"
              min={5}
              max={50}
              value={maxEntries}
              onChange={(e) => setMaxEntries(Number(e.target.value))}
              className="mt-2 w-full accent-[#F2B24C]"
            />
          </div>
          <label className="mt-3.5 flex cursor-pointer items-center gap-2.5 text-[12.5px] text-mist">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="h-4 w-4 accent-[#F2B24C]"
            />
            Verblasste Spuren aufnehmen
          </label>
          <div className="mt-3.5">
            <span className="mono-chip mb-1.5 block text-mist">Zieldatei</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["CLAUDE.md", "memory.md"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilename(f)}
                  className={`btn-press rounded-lg border px-2 py-2 font-mono text-[11.5px] font-semibold ${
                    filename === f
                      ? "border-amber/50 bg-amber/12 text-amber"
                      : "border-line text-mist hover:border-signal/50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] leading-snug text-dim">
              {filename === "CLAUDE.md"
                ? "Legt sie ins Projekt-Root — Claude Code liest sie automatisch."
                : "Für ~/.claude/memory.md oder eigene Loader-Skripte."}
            </p>
          </div>
        </div>

        <div className="panel flex items-center justify-between p-4">
          <div>
            <p className="font-mono text-[12px] text-mist">
              <b className="text-fog">{includedCount}</b> Spuren · ~<b className="text-amber">{tokens.toLocaleString("de-DE")}</b> Tokens
            </p>
            <p className="text-[10.5px] text-dim">von {active.length} aktiven im Cortex</p>
          </div>
          <IconFile size={26} className="text-amber/70" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={copy}
            className={`btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-bold ${
              copied ? "bg-moss/20 text-moss ring-1 ring-moss/40" : "bg-amber text-ink hover:bg-[#f7c266]"
            }`}
          >
            {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
            {copied ? "Kopiert" : "Kopieren"}
          </button>
          <button
            onClick={download}
            className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-raise/60 px-3 py-2.5 text-[13px] font-bold text-fog hover:border-signal/60"
          >
            <IconDownload size={15} /> Download
          </button>
        </div>
      </div>

      {/* Vorschau */}
      <div className="panel relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="font-mono text-[11.5px] text-mist">~/{filename}</span>
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-moss/60" />
          </span>
        </div>
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[11.5px] leading-relaxed text-[#b9cdc9]">
          {markdown}
        </pre>
      </div>
    </div>
  );
}
