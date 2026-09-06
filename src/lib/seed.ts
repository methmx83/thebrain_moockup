import type { Memory, MemoryType, RecallEvent } from "./engine";
import { DAY, HOUR, strengthAt } from "./engine";

let counter = 0;
function mk(
  content: string,
  project: string,
  type: MemoryType,
  importance: number,
  tags: string[],
  ageMs: number,
  recallAges: number[] = []
): Memory {
  counter++;
  const now = Date.now();
  const createdAt = now - ageMs;
  // Abruf-Historie: Stärke zum jeweiligen Zeitpunkt rekonstruieren
  const base: Memory = {
    id: `seed-${counter}`,
    content,
    project,
    type,
    importance,
    tags,
    createdAt,
    lastRecalledAt: createdAt,
    recallCount: 0,
    stabilityFactor: 1,
    consolidated: type !== "episodisch",
    archived: false,
    history: [{ t: createdAt, s: 1 }],
  };
  let m = base;
  for (const age of recallAges) {
    const t = now - age;
    if (t <= createdAt) continue;
    const s = strengthAt(m, t);
    m = {
      ...m,
      recallCount: m.recallCount + 1,
      stabilityFactor: m.stabilityFactor * (s > 0.6 ? 1.35 : s > 0.3 ? 1.8 : 2.4),
      lastRecalledAt: t,
      history: [...m.history, { t, s }],
    };
  }
  return m;
}

export function seedMemories(): Memory[] {
  counter = 0;
  return [
    // ---- Nova-Shop ----
    mk(
      "Nutzer bevorzugt deutsche UI-Texte mit englischen Fachbegriffen, Anrede „du“.",
      "Nova-Shop",
      "semantisch",
      4,
      ["ui", "sprache"],
      12 * DAY,
      [9 * DAY, 4 * DAY, 26 * HOUR]
    ),
    mk(
      "Build bricht bei zirkulären Imports zwischen /cart und /checkout — immer Alias-Imports nutzen.",
      "Nova-Shop",
      "prozedural",
      5,
      ["build", "imports"],
      21 * DAY,
      [15 * DAY, 6 * DAY]
    ),
    mk(
      "Entscheidung vom Kickoff: Stripe statt PayPal wegen Abo-Modell und SEPA-Lastschrift.",
      "Nova-Shop",
      "episodisch",
      4,
      ["zahlung", "entscheidung"],
      3 * DAY,
      [30 * HOUR]
    ),
    mk(
      "Warenkorb-State lebt in Zustand-Store /store/cart, nie in lokalen Komponenten-State duplizieren.",
      "Nova-Shop",
      "semantisch",
      3,
      ["state", "architektur"],
      8 * DAY,
      [5 * DAY]
    ),

    // ---- Orbit-Dashboard ----
    mk(
      "Deploy nie freitags — letzter Freitags-Release brauchte einen Hotfix am Wochenende.",
      "Orbit-Dashboard",
      "episodisch",
      5,
      ["deploy", "entscheidung"],
      2 * DAY,
      [20 * HOUR]
    ),
    mk(
      "D3-Charts: Tooltips mit absoluten Werten, nicht Prozent — Nutzerfeedback aus Review #41.",
      "Orbit-Dashboard",
      "semantisch",
      3,
      ["charts", "ui"],
      16 * DAY,
      [11 * DAY, 5 * DAY]
    ),
    mk(
      "pnpm-Workspace-Monorepo: geteilte Logik nach /packages/shared, nicht kopieren.",
      "Orbit-Dashboard",
      "semantisch",
      4,
      ["setup", "architektur"],
      26 * DAY,
      [18 * DAY, 9 * DAY, 2 * DAY]
    ),
    mk(
      "Feature-Flags über /config/flags.ts — neue Features immer default-off starten.",
      "Orbit-Dashboard",
      "prozedural",
      4,
      ["setup", "release"],
      34 * DAY,
      [22 * DAY]
    ),

    // ---- Kolibri-API ----
    mk(
      "Auth-Tokens laufen nach 15 Min. ab — vor jedem Batch-Request Refresh einbauen.",
      "Kolibri-API",
      "prozedural",
      5,
      ["auth", "api"],
      19 * DAY,
      [12 * DAY, 3 * DAY]
    ),
    mk(
      "Sprint-Planning 12.02.: Roadmap-Priorität von Exporten auf Rate-Limiting verschoben.",
      "Kolibri-API",
      "episodisch",
      3,
      ["planung"],
      40 * HOUR
    ),
    mk(
      "API-Doku gehört nach /docs (AsciiDoc), nie direkt ins README schreiben.",
      "Kolibri-API",
      "semantisch",
      2,
      ["doku"],
      30 * DAY,
      [25 * DAY]
    ),
    mk(
      "Legacy-CSS-Hack für Safari 15 in der Login-Maske — seit Update obsolet.",
      "Nova-Shop",
      "episodisch",
      1,
      ["css"],
      42 * DAY
    ),
    mk(
      "Tests: Vitest mit --pool=forks, sonst Timeout-Fehler im CI-Container.",
      "Kolibri-API",
      "prozedural",
      3,
      ["tests", "ci"],
      14 * DAY,
      [7 * DAY]
    ),
  ];
}
