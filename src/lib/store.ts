import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Memory, RecallEvent } from "./engine";
import { recallMemory, pairKey } from "./engine";
import { seedMemories } from "./seed";

const STORAGE_KEY = "engramm:v1";

export interface PersistState {
  memories: Memory[];
  linkBoosts: Record<string, number>;
  clockOffset: number;
  sleepCycles: number;
}

function load(): PersistState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistState;
      if (Array.isArray(parsed.memories)) {
        return {
          memories: parsed.memories,
          linkBoosts: parsed.linkBoosts ?? {},
          clockOffset: parsed.clockOffset ?? 0,
          sleepCycles: parsed.sleepCycles ?? 0,
        };
      }
    }
  } catch {
    /* beschädigter Storage → Seed */
  }
  return { memories: seedMemories(), linkBoosts: {}, clockOffset: 0, sleepCycles: 0 };
}

export interface CaptureInput {
  content: string;
  project: string;
  type: Memory["type"];
  importance: number;
  tags: string[];
}

export function useMemoryStore() {
  const [state, setState] = useState<PersistState>(load);
  const [now, setNow] = useState(() => Date.now());
  const firstRun = useRef(true);

  // Persistenz
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Quota — ignorieren */
    }
  }, [state]);

  // Echtzeit-Tick (1 s) — Decodierung läuft kontinuierlich
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const virtualNow = now + state.clockOffset;

  const capture = useCallback((input: CaptureInput): Memory => {
    const t = Date.now() + state.clockOffset; // Codierung in virtueller Zeit
    const history: RecallEvent[] = [{ t, s: 1 }];
    const mem: Memory = {
      id: `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      content: input.content.trim(),
      project: input.project.trim() || "Allgemein",
      type: input.type,
      importance: input.importance,
      tags: input.tags.map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 6),
      createdAt: t,
      lastRecalledAt: t,
      recallCount: 0,
      stabilityFactor: 1,
      consolidated: false,
      archived: false,
      history,
    };
    setState((prev) => ({ ...prev, memories: [mem, ...prev.memories] }));
    return mem;
  }, [state.clockOffset]);

  const recall = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      memories: prev.memories.map((m) => (m.id === id ? recallMemory(m, prev.clockOffset + Date.now()) : m)),
    }));
  }, []);

  const remove = useCallback((id: string) => {
    setState((prev) => {
      const linkBoosts: Record<string, number> = {};
      for (const [key, v] of Object.entries(prev.linkBoosts)) {
        if (!key.includes(id)) linkBoosts[key] = v;
      }
      return { ...prev, memories: prev.memories.filter((m) => m.id !== id), linkBoosts };
    });
  }, []);

  const revive = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      memories: prev.memories.map((m) =>
        m.id === id && m.archived ? recallMemory({ ...m }, prev.clockOffset + Date.now()) : m
      ),
    }));
  }, []);

  const applyConsolidation = useCallback((memories: Memory[], linkBoosts: Record<string, number>) => {
    setState((prev) => ({
      ...prev,
      memories,
      linkBoosts,
      sleepCycles: prev.sleepCycles + 1,
    }));
  }, []);

  const timeWarp = useCallback((deltaMs: number) => {
    setState((prev) => ({ ...prev, clockOffset: Math.max(0, prev.clockOffset + deltaMs) }));
  }, []);

  const resetClock = useCallback(() => {
    setState((prev) => ({ ...prev, clockOffset: 0 }));
  }, []);

  const loadSeeds = useCallback(() => {
    setState({ memories: seedMemories(), linkBoosts: {}, clockOffset: 0, sleepCycles: 0 });
  }, []);

  const wipe = useCallback(() => {
    setState({ memories: [], linkBoosts: {}, clockOffset: 0, sleepCycles: 0 });
  }, []);

  /** Komplettes Gehirn aus einer Sicherungsdatei wiederherstellen */
  const restore = useCallback((data: PersistState): boolean => {
    if (!data || !Array.isArray(data.memories)) return false;
    const valid = data.memories.every(
      (m) => m && typeof m.id === "string" && typeof m.content === "string" && typeof m.createdAt === "number"
    );
    if (!valid) return false;
    setState({
      memories: data.memories,
      linkBoosts: data.linkBoosts ?? {},
      clockOffset: data.clockOffset ?? 0,
      sleepCycles: data.sleepCycles ?? 0,
    });
    return true;
  }, []);

  const boostSynapse = useCallback((a: string, b: string) => {
    const key = pairKey(a, b);
    setState((prev) => ({
      ...prev,
      linkBoosts: { ...prev.linkBoosts, [key]: Math.min(0.8, (prev.linkBoosts[key] ?? 0) + 0.1) },
    }));
  }, []);

  const stats = useMemo(() => {
    const active = state.memories.filter((m) => !m.archived);
    return {
      total: state.memories.length,
      active: active.length,
      archived: state.memories.length - active.length,
      sleepCycles: state.sleepCycles,
    };
  }, [state.memories, state.sleepCycles]);

  return {
    state,
    now,
    virtualNow,
    stats,
    capture,
    recall,
    remove,
    revive,
    applyConsolidation,
    timeWarp,
    resetClock,
    loadSeeds,
    wipe,
    restore,
    boostSynapse,
  };
}

export type MemoryStore = ReturnType<typeof useMemoryStore>;
