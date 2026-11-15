import { create } from "zustand";
import type { LayoutId } from "@/lib/typing/keys";
import type { Mode } from "@/lib/typing/content";
import type { UiLang } from "@/lib/typing/i18n";
import { dayKey, mergeKeys, pruneDaily, prunePairs, type Daily, type KeyMap } from "@/lib/typing/analysis";

const KEY = "klavir-v1";
const MAX_SESSIONS = 200;

export type LessonStat = { bestCpm: number; bestAcc: number; clears: number };
export type Best = { cpm: number; acc: number; t: number };
export type Theme = "auto" | "dark" | "light";
export const TEMPO_CHOICES = [15, 30, 60, 120] as const;
export type TempoSec = (typeof TEMPO_CHOICES)[number];

export type Session = {
  t: number;
  mode: Mode;
  layout: LayoutId;
  cpm: number;
  acc: number;
  lessonId?: string;
  /** Speed counting every key press, characters per minute. */
  raw?: number;
  /** Evenness of rhythm, 0–100. */
  cons?: number;
  /** Seconds spent typing. */
  sec?: number;
};

type Persisted = {
  layout: LayoutId;
  ui: UiLang;
  sound: boolean;
  lessonId: string;
  lessons: Record<string, LessonStat>;
  sessions: Session[];
  keys: KeyMap;
  /** Statistics for pairs of letters typed one after another, e.g. "ть". */
  pairs: KeyMap;
  daily: Daily;
  bests: Record<string, Best>;
  /** The level check was taken (or skipped on purpose). */
  diagnosed: boolean;
  theme: Theme;
  /** Text size: 0 small, 1 medium, 2 large. */
  scale: 0 | 1 | 2;
  /** true: the cursor waits for the right key. false: a mistake is counted and typing goes on. */
  strict: boolean;
  showKeys: boolean;
  fingerColors: boolean;
  /** Slowly fade the on-screen keyboard as the person gets more practice. */
  fadeHints: boolean;
  /** Break exercises into lines, so Enter has to be pressed. */
  lines: boolean;
  tempoSec: TempoSec;
  punct: boolean;
  nums: boolean;
  goalMin: number;
};

export type Settings = Pick<
  Persisted,
  "theme" | "scale" | "strict" | "showKeys" | "fingerColors" | "fadeHints" | "lines" | "tempoSec" | "punct" | "nums" | "goalMin"
>;

export type RecordExtra = {
  keys: KeyMap;
  pairs: KeyMap;
  sec: number;
  chars: number;
  /** Where the personal best for this kind of run is kept. */
  pbKey: string;
};

const defaults: Persisted = {
  layout: "ru-pc",
  ui: "ru",
  sound: false,
  lessonId: "ru-l",
  lessons: {},
  sessions: [],
  keys: {},
  pairs: {},
  daily: {},
  bests: {},
  diagnosed: false,
  theme: "auto",
  scale: 1,
  strict: true,
  showKeys: true,
  fingerColors: false,
  fadeHints: false,
  lines: true,
  tempoSec: 60,
  punct: false,
  nums: false,
  goalMin: 10,
};

type State = Persisted & {
  hydrated: boolean;
  hydrate: () => void;
  setLayout: (layout: LayoutId, lessonId: string) => void;
  setUi: (ui: UiLang) => void;
  setSound: (sound: boolean) => void;
  setLesson: (lessonId: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  /** Applies the level check: lessons before `startId` count as known. */
  applyDiagnostic: (clearIds: string[], startId: string) => void;
  dismissDiagnostic: () => void;
  /** Marks a lesson as cleared (used when its letters are mastered in practice). */
  markCleared: (id: string) => void;
  /** Saves a finished run. Returns true when it beat an earlier personal best. */
  record: (session: Session, lessonId: string | null, passed: boolean, extra: RecordExtra) => boolean;
  exportData: () => string;
  importData: (text: string) => boolean;
  reset: () => void;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Turns whatever was stored (or imported) into a complete, valid state. */
function normalize(raw: unknown): Persisted {
  if (!isObject(raw)) return defaults;
  const parsed = raw as Partial<Persisted>;
  const merged: Persisted = { ...defaults, ...parsed };
  merged.lessons = isObject(parsed.lessons) ? (parsed.lessons as Persisted["lessons"]) : {};
  merged.sessions = Array.isArray(parsed.sessions) ? parsed.sessions.slice(-MAX_SESSIONS) : [];
  merged.keys = isObject(parsed.keys) ? (parsed.keys as KeyMap) : {};
  merged.pairs = isObject(parsed.pairs) ? (parsed.pairs as KeyMap) : {};
  merged.daily = isObject(parsed.daily) ? (parsed.daily as Daily) : {};
  merged.bests = isObject(parsed.bests) ? (parsed.bests as Persisted["bests"]) : {};
  if (!TEMPO_CHOICES.includes(merged.tempoSec)) merged.tempoSec = 60;
  if (![0, 1, 2].includes(merged.scale)) merged.scale = 1;
  if (!["auto", "dark", "light"].includes(merged.theme)) merged.theme = "auto";
  if (typeof merged.goalMin !== "number" || merged.goalMin < 1 || merged.goalMin > 240) merged.goalMin = 10;
  for (const flag of ["strict", "showKeys", "fingerColors", "fadeHints", "lines", "punct", "nums", "sound", "diagnosed"] as const) {
    if (typeof merged[flag] !== "boolean") merged[flag] = defaults[flag];
  }
  if (merged.ui !== "ru" && merged.ui !== "en") merged.ui = "ru";
  return merged;
}

function read(): Persisted {
  if (typeof localStorage === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : defaults;
  } catch {
    return defaults;
  }
}

function write(data: Persisted) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage can be full or blocked; typing must keep working.
  }
}

function snapshot(state: State): Persisted {
  return {
    layout: state.layout,
    ui: state.ui,
    sound: state.sound,
    lessonId: state.lessonId,
    lessons: state.lessons,
    sessions: state.sessions,
    keys: state.keys,
    pairs: state.pairs,
    daily: state.daily,
    bests: state.bests,
    diagnosed: state.diagnosed,
    theme: state.theme,
    scale: state.scale,
    strict: state.strict,
    showKeys: state.showKeys,
    fingerColors: state.fingerColors,
    fadeHints: state.fadeHints,
    lines: state.lines,
    tempoSec: state.tempoSec,
    punct: state.punct,
    nums: state.nums,
    goalMin: state.goalMin,
  };
}

export const useKlavir = create<State>((set, get) => {
  const commit = (next: Persisted) => {
    write(next);
    set(next);
  };
  return {
    ...defaults,
    hydrated: false,
    hydrate: () => {
      if (get().hydrated) return;
      set({ ...read(), hydrated: true });
    },
    setLayout: (layout, lessonId) => commit({ ...snapshot(get()), layout, lessonId }),
    setUi: (ui) => commit({ ...snapshot(get()), ui }),
    setSound: (sound) => commit({ ...snapshot(get()), sound }),
    setLesson: (lessonId) => commit({ ...snapshot(get()), lessonId }),
    setSettings: (patch) => commit({ ...snapshot(get()), ...patch }),
    applyDiagnostic: (clearIds, startId) => {
      const curr = snapshot(get());
      const lessons = { ...curr.lessons };
      for (const id of clearIds) {
        const prev = lessons[id] ?? { bestCpm: 0, bestAcc: 0, clears: 0 };
        lessons[id] = { ...prev, clears: Math.max(1, prev.clears) };
      }
      commit({ ...curr, lessons, lessonId: startId, diagnosed: true });
    },
    dismissDiagnostic: () => commit({ ...snapshot(get()), diagnosed: true }),
    markCleared: (id) => {
      const curr = snapshot(get());
      const prev = curr.lessons[id] ?? { bestCpm: 0, bestAcc: 0, clears: 0 };
      commit({ ...curr, lessons: { ...curr.lessons, [id]: { ...prev, clears: prev.clears + 1 } } });
    },
    record: (session, lessonId, passed, extra) => {
      const curr = snapshot(get());
      const lessons = { ...curr.lessons };
      if (lessonId) {
        const prev = lessons[lessonId] ?? { bestCpm: 0, bestAcc: 0, clears: 0 };
        lessons[lessonId] = {
          bestCpm: Math.max(prev.bestCpm, session.cpm),
          bestAcc: Math.max(prev.bestAcc, session.acc),
          clears: prev.clears + (passed ? 1 : 0),
        };
      }
      const day = dayKey(session.t);
      const today = curr.daily[day] ?? { sec: 0, chars: 0 };
      const daily = pruneDaily({
        ...curr.daily,
        [day]: { sec: today.sec + extra.sec, chars: today.chars + extra.chars },
      });
      const prevBest = curr.bests[extra.pbKey];
      const counts = session.acc >= 90 && session.cpm > 0;
      const beat = counts && Boolean(prevBest) && session.cpm > prevBest.cpm;
      const bests =
        counts && (!prevBest || session.cpm > prevBest.cpm)
          ? { ...curr.bests, [extra.pbKey]: { cpm: session.cpm, acc: session.acc, t: session.t } }
          : curr.bests;
      commit({
        ...curr,
        lessons,
        daily,
        bests,
        keys: mergeKeys(curr.keys, extra.keys),
        pairs: prunePairs(mergeKeys(curr.pairs, extra.pairs)),
        sessions: [...curr.sessions, session].slice(-MAX_SESSIONS),
      });
      return beat;
    },
    exportData: () =>
      JSON.stringify({ app: "klavir", version: 2, exportedAt: Date.now(), data: snapshot(get()) }, null, 2),
    importData: (text) => {
      try {
        const parsed: unknown = JSON.parse(text);
        if (!isObject(parsed) || parsed.app !== "klavir" || !isObject(parsed.data)) return false;
        commit(normalize(parsed.data));
        return true;
      } catch {
        return false;
      }
    },
    reset: () => {
      const keep = snapshot(get());
      // Progress goes; the person's preferences stay.
      commit({
        ...defaults,
        layout: keep.layout,
        ui: keep.ui,
        sound: keep.sound,
        theme: keep.theme,
        scale: keep.scale,
        strict: keep.strict,
        showKeys: keep.showKeys,
        fingerColors: keep.fingerColors,
        fadeHints: keep.fadeHints,
        lines: keep.lines,
        goalMin: keep.goalMin,
        lessonId: lessonIdFor(keep.layout),
      });
    },
  };
});

function lessonIdFor(layout: LayoutId) {
  return layout === "en" ? "en-l" : "ru-l";
}
