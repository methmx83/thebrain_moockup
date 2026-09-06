/* ============================================================
   ENGRAMM · Speicher-Engine
   Modelliert Gedächtnis nach biologischem Vorbild:
   - Hippocampus: frische episodische Spuren, schnelle Decodierung
   - Neocortex: konsolidierte semantische/prozedurale Spuren
   - Ebbinghaus: R(t) = e^(−t/S), Stabilität S wächst durch Abruf
   - Amygdala: emotionale Gewichtung (importance) verlangsamt Zerfall
   ============================================================ */

export type MemoryType = "episodisch" | "semantisch" | "prozedural";

export interface RecallEvent {
  t: number; // Zeitstempel
  s: number; // Stärke zum Abrufzeitpunkt (vor Potentierung)
}

export interface Memory {
  id: string;
  content: string;
  project: string;
  type: MemoryType;
  importance: number; // 1..5 (Amygdala-Markierung)
  tags: string[];
  createdAt: number;
  lastRecalledAt: number;
  recallCount: number;
  stabilityFactor: number; // multiplikativer Zuwachs durch Abrufe (LTP)
  consolidated: boolean; // hat Schlafphase durchlaufen
  archived: boolean; // verblasst / aus dem Cortex entlassen
  history: RecallEvent[];
}

export interface Synapse {
  a: string;
  b: string;
  weight: number; // 0..1
  shared: string[]; // gemeinsame Assoziationsanker
}

export interface ConsolidationReport {
  consolidated: number; // Hippocampus → Neocortex
  faded: number; // verblasst
  revived: number;
  strengthenedSynapses: number;
  replay: string[]; // während des Schlafs replizierte Spuren
}

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Basis-Stabilität je Speichersystem (in ms) */
export const BASE_STABILITY: Record<MemoryType, number> = {
  episodisch: 10 * HOUR,
  semantisch: 8 * DAY,
  prozedural: 30 * DAY,
};

export const TYPE_COLOR: Record<MemoryType, string> = {
  episodisch: "#F2B24C",
  semantisch: "#41D0B8",
  prozedural: "#9BC46B",
};

export const TYPE_LABEL: Record<MemoryType, string> = {
  episodisch: "Episodisch",
  semantisch: "Semantisch",
  prozedural: "Prozedural",
};

export const TYPE_DESC: Record<MemoryType, string> = {
  episodisch: "Erlebnisse & Entscheidungen — zerfallen schnell",
  semantisch: "Fakten & Wissen — stabil im Neocortex",
  prozedural: "Abläufe & Skills — fast unvergesslich",
};

/** Effektive Stabilität S: Basis × Amygdala × gelernter Zuwachs */
export function stabilityOf(m: Memory): number {
  const amygdala = 1 + 0.55 * (m.importance - 1);
  return BASE_STABILITY[m.type] * amygdala * m.stabilityFactor;
}

/** Ebbinghaus: Retention zum Zeitpunkt t */
export function strengthAt(m: Memory, t: number): number {
  if (m.archived) return 0;
  const S = stabilityOf(m);
  const elapsed = Math.max(0, t - m.lastRecalledAt);
  return Math.exp(-elapsed / S);
}

export function strengthNow(m: Memory, now: number): number {
  return strengthAt(m, now);
}

export type TraceStatus = "frisch" | "stabil" | "schwächer" | "kritisch" | "verblasst";

export function statusOf(m: Memory, now: number): TraceStatus {
  if (m.archived) return "verblasst";
  const s = strengthNow(m, now);
  if (s >= 0.75) return "frisch";
  if (s >= 0.45) return "stabil";
  if (s >= 0.18) return "schwächer";
  return "kritisch";
}

export const STATUS_COLOR: Record<TraceStatus, string> = {
  frisch: "#41D0B8",
  stabil: "#9BC46B",
  "schwächer": "#F2B24C",
  kritisch: "#E2708A",
  verblasst: "#5D747C",
};

/**
 * Abruf = Retrieval Practice: erfolgreicher Abruf potentiert die Synapse.
 * Abruf im "sweet spot" (mittlere Stärke) bringt den größten Zuwachs —
 * wie beim spaced-repetition-Desirability-of-Difficulty-Effekt.
 */
export function recallMemory(m: Memory, now: number): Memory {
  const s = strengthNow(m, now);
  const gain = s > 0.6 ? 1.35 : s > 0.3 ? 1.8 : 2.4;
  const wasArchived = m.archived;
  return {
    ...m,
    archived: false,
    recallCount: m.recallCount + 1,
    stabilityFactor: m.stabilityFactor * gain * (wasArchived ? 1.6 : 1),
    lastRecalledAt: now,
    history: [...m.history, { t: now, s: wasArchived ? 0.05 : s }],
  };
}

/** Assoziative Verknüpfungen: gemeinsame Projekte & Tags = gemeinsame Neuronengruppen */
export function computeSynapses(memories: Memory[], boosts: Record<string, number>): Synapse[] {
  const active = memories.filter((m) => !m.archived);
  const out: Synapse[] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const sharedTags = a.tags.filter((t) => b.tags.includes(t));
      const sameProject = a.project === b.project;
      if (sharedTags.length === 0 && !sameProject) continue;
      const key = pairKey(a.id, b.id);
      const boost = boosts[key] ?? 0;
      const weight = Math.min(1, 0.16 + sharedTags.length * 0.22 + (sameProject ? 0.24 : 0) + boost);
      const shared = sameProject ? [a.project, ...sharedTags] : sharedTags;
      out.push({ a: a.id, b: b.id, weight, shared });
    }
  }
  return out;
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

/**
 * Schlafphase / Systems Consolidation:
 * - starke episodische Spuren mit wiederholtem Abruf → Neocortex (semantisch)
 * - kritische Spuren (R < 0.12) → verblassen ins Archiv
 * - gemeinsame Synapsen werden potentiert
 */
export function consolidate(
  memories: Memory[],
  boosts: Record<string, number>,
  now: number
): { memories: Memory[]; boosts: Record<string, number>; report: ConsolidationReport } {
  const report: ConsolidationReport = {
    consolidated: 0,
    faded: 0,
    revived: 0,
    strengthenedSynapses: 0,
    replay: [],
  };

  const next = memories.map((m) => {
    if (m.archived) return m;
    const s = strengthNow(m, now);
    if (s < 0.12) {
      report.faded++;
      report.replay.push(m.content);
      return { ...m, archived: true };
    }
    if (m.type === "episodisch" && m.recallCount >= 2 && s > 0.3) {
      report.consolidated++;
      report.replay.push(m.content);
      return {
        ...m,
        type: "semantisch" as MemoryType,
        consolidated: true,
        stabilityFactor: m.stabilityFactor * 1.5,
      };
    }
    if (s > 0.5) report.replay.push(m.content);
    return m;
  });

  const nextBoosts = { ...boosts };
  const active = next.filter((m) => !m.archived);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const sharedTags = a.tags.some((t) => b.tags.includes(t));
      const sameProject = a.project === b.project;
      if (sharedTags || sameProject) {
        const key = pairKey(a.id, b.id);
        const before = nextBoosts[key] ?? 0;
        nextBoosts[key] = Math.min(0.8, before + 0.12);
        report.strengthenedSynapses++;
      }
    }
  }

  report.replay = report.replay.slice(0, 8);
  return { memories: next, boosts: nextBoosts, report };
}

/** Wann fällt die Spur unter 40 % Retention? → nächste Auffrischung */
export function nextRefreshIn(m: Memory, now: number): number {
  const S = stabilityOf(m);
  const target = Math.log(1 / 0.4) * S; // t mit R=0.4
  const elapsed = now - m.lastRecalledAt;
  return Math.max(0, target - elapsed);
}

export function halfLifeOf(m: Memory): number {
  return stabilityOf(m) * Math.LN2;
}

/* ---------------- Export für Claude Code ---------------- */

export interface ExportOptions {
  maxEntries: number;
  includeArchived: boolean;
  filename: "CLAUDE.md" | "memory.md";
}

export function buildClaudeMemory(
  memories: Memory[],
  now: number,
  opts: ExportOptions
): string {
  const pool = memories
    .filter((m) => opts.includeArchived || !m.archived)
    .map((m) => ({ m, s: strengthNow(m, now) }))
    .sort((x, y) => y.m.importance - x.m.importance || y.s - x.s)
    .slice(0, opts.maxEntries);

  const byProject = new Map<string, typeof pool>();
  for (const entry of pool) {
    const list = byProject.get(entry.m.project) ?? [];
    list.push(entry);
    byProject.set(entry.m.project, list);
  }

  const lines: string[] = [];
  lines.push(`# ${opts.filename === "CLAUDE.md" ? "CLAUDE.md" : "memory.md"} — Engramm-Langzeitgedächtnis`);
  lines.push("");
  lines.push(
    `<!-- Kuratiertes Gedächtnis · erzeugt am ${new Date(now).toLocaleString("de-DE")} · ` +
      `${pool.length} aktive Spuren · Stärke R ∈ [0,1] nach Ebbinghaus -->`
  );
  lines.push("");
  lines.push("> Lies diese Datei vor jeder Antwort. Einträge mit R < 0.4 bitte aktiv beim Nutzer erfragen.");
  lines.push("");

  const projects = [...byProject.keys()].sort();
  for (const project of projects) {
    lines.push(`## Projekt: ${project}`);
    const entries = (byProject.get(project) ?? []).sort(
      (x, y) => y.m.importance - x.m.importance || y.s - x.s
    );
    for (const { m, s } of entries) {
      const stars = "★".repeat(m.importance) + "☆".repeat(5 - m.importance);
      const tags = m.tags.length ? ` ${m.tags.map((t) => `#${t}`).join(" ")}` : "";
      lines.push(`- [${TYPE_LABEL[m.type]} · R ${s.toFixed(2)} · ${stars}] ${m.content}${tags}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("_Gepflegt mit ENGRAMM — hippocampale Codierung, Abruf-Potentierung, nächtliche Konsolidierung._");
  return lines.join("\n");
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.6);
}

/* ---------------- Zeit-Formatierung (de-DE) ---------------- */

export function fmtAgo(t: number, now: number): string {
  const d = Math.max(0, now - t);
  if (d < 60_000) return "gerade eben";
  if (d < HOUR) return `vor ${Math.floor(d / 60_000)} Min.`;
  if (d < DAY) return `vor ${Math.floor(d / HOUR)} Std.`;
  const days = Math.floor(d / DAY);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

export function fmtDuration(ms: number): string {
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / 60_000))} Min.`;
  if (ms < DAY) return `${(ms / HOUR).toFixed(ms < 10 * HOUR ? 1 : 0).replace(".", ",")} Std.`;
  return `${(ms / DAY).toFixed(ms < 14 * DAY ? 1 : 0).replace(".", ",")} Tage`;
}

export function fmtClockOffset(ms: number): string {
  if (ms <= 0) return "Echtzeit";
  if (ms < DAY) return `+${Math.round(ms / HOUR)} Std.`;
  const d = ms / DAY;
  return `+${d >= 10 ? String(Math.round(d)) : d.toFixed(1).replace(".", ",")} Tage`;
}
