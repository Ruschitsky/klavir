import { useEffect, useMemo, useRef, useState } from "react";
import { Settings, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DailyBar } from "@/components/typing/daily-bar";
import { Keyboard } from "@/components/typing/keyboard";
import { Result } from "@/components/typing/result";
import { SettingsPanel } from "@/components/typing/settings-panel";
import { StatsPanel } from "@/components/typing/stats-panel";
import { buildSeries, bump, consistency, rankWeak, samples, type KeyMap, type Tick } from "@/lib/typing/analysis";
import {
  autoAdvance,
  exerciseText,
  grade,
  isUnlocked,
  lessonTarget,
  lessonsFor,
  passagesFor,
  placeLessons,
  sanitize,
  unlockedLetters,
  weakDrill,
  type Mode,
} from "@/lib/typing/content";
import { COPY, type UiLang } from "@/lib/typing/i18n";
import {
  FINGER_META,
  hardwareName,
  resolveChar,
  ROWS,
  scriptOf,
  type Finger,
  type LayoutId,
} from "@/lib/typing/keys";
import { cn } from "@/lib/cn";
import { playTick } from "@/lib/typing/sound";
import { TEMPO_CHOICES, useKlavir } from "@/lib/typing/store";

const MODES: Mode[] = ["smart", "basics", "words", "flow", "tempo", "stats"];
const LAYOUTS: LayoutId[] = ["ru-pc", "ru", "en"];
const FINGER_BY_CODE = new Map(ROWS.flat().map((key) => [key.code, key.finger]));
const NO_WRONG: ReadonlySet<number> = new Set();

const stars = (acc: number) => (acc >= 98 ? 3 : acc >= 95 ? 2 : acc >= 90 ? 1 : 0);

export function Trainer() {
  const store = useKlavir();
  const record = useKlavir((state) => state.record);
  const {
    layout,
    ui,
    sound,
    lessonId,
    lessons: lessonStats,
    hydrated,
    strict,
    showKeys,
    fingerColors,
    scale,
    tempoSec,
    punct,
    nums,
    theme,
    keys,
    pairs,
    diagnosed,
    fadeHints,
    sessions,
    daily,
  } = store;
  const copy = COPY[ui];
  const lessons = lessonsFor(layout);
  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0];
  const passages = passagesFor(layout);
  const letters = unlockedLetters(lessons, lessonStats);
  const frontier = lessons.find((item) => (lessonStats[item.id]?.clears ?? 0) === 0);
  const freshLetters = frontier?.fresh ?? "";

  const [mode, setMode] = useState<Mode>("smart");
  const [seed, setSeed] = useState(1);
  const [runId, setRunId] = useState(0);
  const [passage, setPassage] = useState(0);
  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [bad, setBad] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [misses, setMisses] = useState<Record<string, number>>({});
  const [wrong, setWrong] = useState<number[]>([]);
  const [newBest, setNewBest] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [drill, setDrill] = useState<string | null>(null);
  const [ownDraft, setOwnDraft] = useState("");
  const [own, setOwn] = useState<string | null>(null);
  const [ownHint, setOwnHint] = useState<string | null>(null);
  const [caps, setCaps] = useState(false);
  const [now, setNow] = useState(0);
  const [armReset, setArmReset] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const saved = useRef(false);
  const fromDrill = useRef(false);
  const mismatch = useRef(0);
  const badTimer = useRef(0);
  const startRef = useRef(0);
  const lastHit = useRef(0);
  const ticks = useRef<Tick[]>([]);
  const runKeys = useRef<KeyMap>({});
  const runPairs = useRef<KeyMap>({});
  const prevChar = useRef("");
  const run = useRef({
    text: "",
    index: 0,
    endedAt: null as number | null,
    mode: "basics" as Mode,
    sound: false,
    strict: true,
    backspace: "",
    mismatchCyr: "",
    mismatchLat: "",
    slow: "",
    actions: { tab: () => {}, esc: () => {}, enter: () => {} },
  });
  // The adaptive mode reads the latest stats through a ref: finishing a run updates the
  // stats, and that must not rewrite the text the person is looking at.
  const smartIn = useRef({ letters, fresh: freshLetters, keys, pairs });
  smartIn.current = { letters, fresh: freshLetters, keys, pairs };

  useEffect(() => {
    store.hydrate();
  }, [store]);

  useEffect(() => {
    const apply = () => {
      const light = theme === "light" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: light)").matches);
      document.documentElement.dataset.theme = light ? "light" : "dark";
    };
    apply();
    if (theme !== "auto") return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = ui;
  }, [ui]);

  const text = useMemo(() => {
    if (drill) return drill;
    if (mode === "flow" && own) return own;
    if (mode === "stats") return "";
    return exerciseText({
      mode,
      layout,
      lesson,
      seed,
      passage,
      seconds: tempoSec,
      punct,
      nums,
      smart: mode === "smart" ? smartIn.current : undefined,
    });
  }, [drill, own, mode, layout, lesson, seed, passage, tempoSec, punct, nums]);

  // A run starts over whenever the text changes or "restart" is pressed, even if the text is the same.
  const trackKey = `${runId}\u0000${text}`;
  const [track, setTrack] = useState(trackKey);
  const resetting = track !== trackKey;
  if (resetting) {
    setTrack(trackKey);
    setIndex(0);
    setHits(0);
    setErrors(0);
    setStartedAt(null);
    setEndedAt(null);
    setBad(false);
    setHint(null);
    setMisses({});
    setWrong([]);
    setNewBest(false);
    setNote(null);
    saved.current = false;
    mismatch.current = 0;
    startRef.current = 0;
    lastHit.current = 0;
    ticks.current = [];
    runKeys.current = {};
    runPairs.current = {};
    prevChar.current = "";
  }

  const indexNow = resetting ? 0 : index;
  const hitsNow = resetting ? 0 : hits;
  const errorsNow = resetting ? 0 : errors;
  const startedNow = resetting ? null : startedAt;
  const endedNow = resetting ? null : endedAt;
  const tempoMs = tempoSec * 1000;

  useEffect(() => {
    if (!startedNow || endedNow) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [startedNow, endedNow]);

  useEffect(() => {
    if (mode !== "tempo" || !startedNow || endedNow) return;
    const left = tempoMs - (Date.now() - startedNow);
    if (left <= 0) {
      setEndedAt(Date.now());
      return;
    }
    const id = window.setTimeout(() => setEndedAt(Date.now()), left);
    return () => window.clearTimeout(id);
  }, [mode, startedNow, endedNow, tempoMs]);

  run.current = {
    text,
    index: indexNow,
    endedAt: endedNow,
    mode,
    sound,
    strict,
    backspace: copy.backspace,
    mismatchCyr: copy.mismatchCyr,
    mismatchLat: copy.mismatchLat,
    slow: copy.slowDown,
    actions: run.current.actions,
  };

  const restart = (fresh: boolean) => {
    fromDrill.current = false;
    setDrill(null);
    if (fresh) setSeed((value) => value + 1);
    setRunId((value) => value + 1);
  };

  const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
  const nextLesson = lessons[lessonIndex + 1];

  const chooseLesson = (id: string) => {
    if (!isUnlocked(lessons, lessonStats, id)) return;
    setDrill(null);
    fromDrill.current = false;
    store.setLesson(id);
    setSeed(1);
    setMode("basics");
    setRunId((value) => value + 1);
  };

  const elapsedEnd = endedNow ?? now;
  const spanMs = startedNow ? Math.max(elapsedEnd - startedNow, 400) : 0;
  const measured = Boolean(startedNow) && elapsedEnd - (startedNow ?? 0) >= 800;
  const cpm = measured ? Math.round(hitsNow / (spanMs / 60_000)) : 0;
  const rawCpm = measured ? Math.round((hitsNow + errorsNow) / (spanMs / 60_000)) : 0;
  const acc = hitsNow + errorsNow === 0 ? 100 : Math.round((hitsNow / (hitsNow + errorsNow)) * 100);
  const finished = text.length > 0 && indexNow >= text.length;
  const speedGoal = lessonTarget(lessonIndex);
  const passedNow =
    mode === "basics" && !fromDrill.current && endedNow !== null && finished && acc >= 90 && cpm >= speedGoal;
  const canNext = Boolean(nextLesson) && (passedNow || (lessonStats[lesson.id]?.clears ?? 0) > 0);

  // Latest handlers, read by the keyboard listener below (which is attached once).
  run.current.actions = {
    tab: () => restart(true),
    esc: () => (showSettings ? setShowSettings(false) : restart(false)),
    enter: () => (mode === "basics" && canNext && nextLesson ? chooseLesson(nextLesson.id) : restart(true)),
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const node = event.target instanceof HTMLElement ? event.target : null;
      setCaps(event.getModifierState("CapsLock"));
      if (node?.closest("textarea, input")) return;
      const key = event.key;
      const snap = run.current;
      if (key === "Backspace") {
        event.preventDefault();
        if (snap.mode !== "stats" && !snap.endedAt) setHint(snap.backspace);
        return;
      }
      if (key === "Tab" || key === "Escape" || key === "Enter") {
        if (snap.mode === "stats") return;
        if (key === "Escape") {
          event.preventDefault();
          snap.actions.esc();
          return;
        }
        // On a focused button or link these keys keep their normal meaning.
        if (node?.closest("button, a, select, [role='button']")) return;
        if (key === "Tab" && !event.shiftKey) {
          event.preventDefault();
          snap.actions.tab();
        } else if (key === "Enter" && snap.endedAt) {
          event.preventDefault();
          snap.actions.enter();
        }
        return;
      }
      if (key.length !== 1) return;
      if (snap.mode === "stats" || snap.endedAt || !snap.text) {
        const onButton = node?.closest("button");
        if (key === " " && !onButton) event.preventDefault();
        return;
      }
      const expected = snap.text[snap.index];
      if (!expected) return;
      event.preventDefault();
      const stamp = Date.now();
      if (!startRef.current) startRef.current = stamp;
      const mark = expected.toLocaleLowerCase();
      if (grade(expected, key)) {
        ticks.current.push({ t: stamp - startRef.current, ok: true });
        const latency = lastHit.current ? stamp - lastHit.current : 0;
        if (expected !== " ") {
          bump(runKeys.current, mark, true, latency);
          if (prevChar.current) bump(runPairs.current, prevChar.current + mark, true, latency);
        }
        prevChar.current = expected === " " ? "" : mark;
        lastHit.current = stamp;
        mismatch.current = 0;
        setHint(null);
        setBad(false);
        const next = snap.index + 1;
        snap.index = next;
        setIndex(next);
        setHits((value) => value + 1);
        setStartedAt((value) => value ?? stamp);
        if (next >= snap.text.length) {
          snap.endedAt = stamp;
          setEndedAt(stamp);
        }
        if (snap.sound) playTick(true);
        return;
      }
      ticks.current.push({ t: stamp - startRef.current, ok: false });
      if (expected !== " ") {
        bump(runKeys.current, mark, false, 0);
        if (prevChar.current) bump(runPairs.current, prevChar.current + mark, false, 0);
      }
      prevChar.current = "";
      lastHit.current = 0;
      const expectedScript = scriptOf(expected);
      const typedScript = scriptOf(key);
      if (expectedScript && typedScript && expectedScript !== typedScript) {
        mismatch.current += 1;
        if (mismatch.current >= 2) {
          setHint(expectedScript === "cyr" ? snap.mismatchCyr : snap.mismatchLat);
        }
      }
      const recent = ticks.current.slice(-10);
      if (recent.length >= 6 && recent.filter((tick) => !tick.ok).length >= 4) setHint(snap.slow);
      setErrors((value) => value + 1);
      if (expected !== " ") setMisses((prev) => ({ ...prev, [mark]: (prev[mark] ?? 0) + 1 }));
      setStartedAt((value) => value ?? stamp);
      if (!snap.strict) {
        // Free mode: the mistake is counted and typing moves on.
        const at = snap.index;
        setWrong((prev) => [...prev, at]);
        const next = at + 1;
        snap.index = next;
        setIndex(next);
        if (next >= snap.text.length) {
          snap.endedAt = stamp;
          setEndedAt(stamp);
        }
      }
      setBad(true);
      window.clearTimeout(badTimer.current);
      badTimer.current = window.setTimeout(() => setBad(false), 180);
      if (snap.sound) playTick(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const sync = (event: KeyboardEvent) => setCaps(event.getModifierState("CapsLock"));
    window.addEventListener("keydown", sync);
    window.addEventListener("keyup", sync);
    return () => {
      window.removeEventListener("keydown", sync);
      window.removeEventListener("keyup", sync);
    };
  }, []);

  const series = useMemo(() => {
    if (!endedNow || !startedNow) return null;
    return buildSeries(ticks.current, Math.max(endedNow - startedNow, 400));
  }, [endedNow, startedNow]);

  useEffect(() => {
    if (!endedNow || !startedNow || saved.current || mode === "stats") return;
    saved.current = true;
    if (hitsNow < 5) return;
    const ms = Math.max(endedNow - startedNow, 400);
    const minutes = ms / 60_000;
    const total = hitsNow + errorsNow;
    const finalCpm = Math.round(hitsNow / minutes);
    const finalAcc = total === 0 ? 100 : Math.round((hitsNow / total) * 100);
    const finalPassed =
      mode === "basics" &&
      !fromDrill.current &&
      indexNow >= text.length &&
      finalAcc >= 90 &&
      finalCpm >= lessonTarget(lessonIndex);
    const sec = Math.round(ms / 1000);
    const part = fromDrill.current
      ? "drill"
      : mode === "tempo"
        ? String(tempoSec)
        : mode === "basics"
          ? lesson.id
          : mode === "flow"
            ? own
              ? "own"
              : String(passage)
            : "";
    const beat = record(
      {
        t: Date.now(),
        mode,
        layout,
        cpm: finalCpm,
        acc: finalAcc,
        raw: Math.round(total / minutes),
        cons: consistency(buildSeries(ticks.current, ms).burst),
        sec,
        lessonId: mode === "basics" ? lesson.id : undefined,
      },
      mode === "basics" ? lesson.id : null,
      finalPassed,
      { keys: runKeys.current, pairs: runPairs.current, sec, chars: hitsNow, pbKey: [mode, layout, part].join(":") },
    );
    setNewBest(beat);

    // What the run changes about the person's path: placement after the level check,
    // or a newly unlocked lesson once its letters are fast and clean.
    const state = useKlavir.getState();
    let message: string | null = null;
    if (mode === "check") {
      const known = placeLessons(lessons, runKeys.current);
      const start = lessons[Math.min(known, lessons.length - 1)];
      state.applyDiagnostic(
        lessons.slice(0, known).map((item) => item.id),
        start.id,
      );
      message = known === 0 ? copy.placedZero : copy.placedAt.replace("{title}", start.title[ui]);
    } else if (!fromDrill.current) {
      const next = autoAdvance(lessons, state.lessons, state.keys);
      if (next) {
        state.markCleared(next.id);
        message = copy.opened.replace("{title}", next.title[ui]);
      }
    }
    if (message) setNote(message);
  }, [
    copy,
    endedNow,
    errorsNow,
    hitsNow,
    indexNow,
    layout,
    lesson.id,
    lessonIndex,
    lessons,
    mode,
    ui,
    own,
    passage,
    record,
    startedNow,
    tempoSec,
    text.length,
  ]);

  const target = !endedNow && text ? (text[indexNow] ?? null) : null;
  const resolved = target ? resolveChar(layout, target) : null;
  const finger = resolved ? FINGER_BY_CODE.get(resolved.code) : undefined;
  const fresh = useMemo(() => {
    const codes = new Set<string>();
    if (mode !== "basics") return codes;
    for (const ch of lesson.fresh) {
      const hit = resolveChar(layout, ch === " " ? " " : ch);
      if (hit) codes.add(hit.code);
    }
    return codes;
  }, [layout, lesson.fresh, mode]);

  const focus = useMemo(() => {
    if (mode !== "smart") return [];
    return rankWeak(letters, keys)
      .filter((ch) => samples(keys[ch]) >= 5)
      .slice(0, 3);
  }, [mode, letters, keys]);

  const wrongSet = useMemo(() => (resetting || wrong.length === 0 ? NO_WRONG : new Set(wrong)), [resetting, wrong]);

  const chooseLayout = (next: LayoutId) => {
    const first = lessonsFor(next)[0];
    setDrill(null);
    fromDrill.current = false;
    store.setLayout(next, first.id);
    setSeed(1);
    setPassage(0);
    setMode("basics");
    setRunId((value) => value + 1);
  };

  const chooseMode = (next: Mode) => {
    setDrill(null);
    fromDrill.current = false;
    setMode(next);
    // Lessons and fixed passages stay the same; the other modes start from a fresh text.
    setSeed(next === "basics" || next === "flow" ? 1 : 1 + Math.floor(Math.random() * 9000));
    setRunId((value) => value + 1);
    setArmReset(false);
  };

  const leftSec =
    mode === "tempo"
      ? startedNow
        ? Math.max(0, Math.ceil((tempoMs - (elapsedEnd - startedNow)) / 1000))
        : tempoSec
      : null;

  const typing = Boolean(startedNow) && !endedNow && mode !== "stats";
  const totalChars = Object.values(daily).reduce((sum, row) => sum + row.chars, 0);
  const keyboardOpacity = fadeHints && !bad ? Math.max(0.25, 1 - totalChars / 20000) : 1;
  const lead =
    mode === "basics"
      ? lesson.blurb[ui]
      : mode === "check"
        ? copy.checkLead
        : mode === "smart"
        ? copy.smartLead
        : mode === "words"
          ? copy.wordsLead
          : mode === "flow"
            ? own
              ? copy.ownLead
              : copy.flowLead
            : copy.tempoLead;

  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full min-w-0 max-w-6xl flex-col gap-5 overflow-x-clip px-4 py-5 sm:px-6 sm:py-8",
        typing && "typing-focus",
      )}
      onMouseDown={(event) => {
        const node = event.target instanceof HTMLElement ? event.target : null;
        if (node?.closest("button, a, input, textarea, select, label")) return;
        event.preventDefault();
      }}
      onClick={(event) => {
        // After a mouse click let go of the button, so Tab and Enter keep working as shortcuts.
        if (event.detail === 0) return;
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.tagName === "BUTTON") active.blur();
      }}
    >
      <header className="chrome flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted uppercase">{copy.kicker}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Клавир</h1>
          <p className="text-sm text-muted">{copy.sub}</p>
          <DailyBar ui={ui} />
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full border border-border bg-background p-1">
            {LAYOUTS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={layout === id}
                className={cn(
                  "tap h-10 rounded-full px-3 text-sm sm:h-11",
                  layout === id ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground",
                )}
                onClick={() => chooseLayout(id)}
              >
                {copy.layouts[id]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tap h-11 rounded-full border border-border px-3 text-sm text-foreground"
            onClick={() => store.setUi(ui === "ru" ? "en" : ("ru" as UiLang))}
          >
            {copy.ui}
          </button>
          <button
            type="button"
            className="tap inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground"
            aria-pressed={sound}
            aria-label={sound ? copy.soundOn : copy.soundOff}
            onClick={() => store.setSound(!sound)}
          >
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <button
            type="button"
            className={cn(
              "tap inline-flex h-11 w-11 items-center justify-center rounded-full border border-border",
              showSettings ? "bg-accent text-accent-foreground" : "text-foreground",
            )}
            aria-pressed={showSettings}
            aria-label={copy.settings}
            title={copy.settings}
            onClick={() => setShowSettings((value) => !value)}
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      {showSettings ? (
        <SettingsPanel
          ui={ui}
          onCheck={() => {
            setShowSettings(false);
            chooseMode("check");
          }}
        />
      ) : null}

      <div className="chrome flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-background p-1">
        {MODES.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            className={cn(
              "tap h-11 shrink-0 rounded-full px-4 text-sm",
              mode === id ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground",
            )}
            onClick={() => chooseMode(id)}
          >
            {copy.modes[id]}
          </button>
        ))}
      </div>

      <p className="chrome text-sm text-pretty text-muted">{copy.layoutNote[layout]}</p>

      {hydrated && !diagnosed && sessions.length === 0 && mode !== "check" && mode !== "stats" ? (
        <section className="chrome stage flex flex-col gap-3" aria-label={copy.checkTitle}>
          <h2 className="text-lg font-semibold tracking-tight">{copy.checkTitle}</h2>
          <p className="text-sm text-pretty text-muted">{copy.checkText}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => chooseMode("check")}>
              {copy.checkStart}
            </Button>
            <Button variant="outline" onClick={() => store.dismissDiagnostic()}>
              {copy.checkSkip}
            </Button>
          </div>
        </section>
      ) : null}

      {mode === "stats" ? (
        <StatsPanel
          ui={ui}
          layout={layout}
          armReset={armReset}
          setArmReset={setArmReset}
          onReset={() => {
            store.reset();
            setArmReset(false);
            setSeed(1);
            setRunId((value) => value + 1);
          }}
        />
      ) : (
        <div className={cn("grid min-w-0 gap-4", mode === "basics" && "lg:grid-cols-[240px_minmax(0,1fr)]")}>
          {mode === "basics" ? (
            <nav
              className="chrome flex min-w-0 gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
              aria-label={copy.lessons}
            >
              {lessons.map((item, itemIndex) => {
                const open = isUnlocked(lessons, lessonStats, item.id);
                const active = item.id === lesson.id;
                const row = lessonStats[item.id];
                const cleared = (row?.clears ?? 0) > 0;
                const count = cleared ? Math.max(1, stars(row?.bestAcc ?? 0)) : 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!open}
                    onClick={() => chooseLesson(item.id)}
                    className={cn(
                      "tap flex h-11 shrink-0 items-center gap-3 rounded-2xl border px-3 text-left text-sm lg:w-full",
                      active ? "border-transparent bg-accent text-accent-foreground" : "border-border bg-card text-foreground",
                      !open && "opacity-40",
                    )}
                  >
                    <span className="w-6 font-mono text-xs tabular-nums opacity-70">
                      {String(itemIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{item.title[ui]}</span>
                    {count > 0 ? (
                      <span
                        className={cn("ml-auto shrink-0 font-mono text-xs tracking-tighter", !active && "text-good")}
                        aria-label={`${count}/3`}
                      >
                        {"★".repeat(count)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          ) : null}

          <section
            className="stage min-w-0"
            data-index={indexNow}
            data-expected={target ?? ""}
            data-done={endedNow ? "1" : "0"}
            data-scale={scale}
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                {mode === "basics" ? lesson.title[ui] : copy.modes[mode]}
              </h2>
              <p className="font-mono text-sm text-muted tabular-nums">
                {leftSec !== null ? `${leftSec}${copy.secShort}` : `${Math.min(indexNow, text.length)}/${text.length}`}
              </p>
            </div>

            {(mode === "tempo" || mode === "words" || mode === "smart") && !endedNow ? (
              <div className="chrome mb-3 flex flex-wrap items-center gap-2">
                {mode === "tempo"
                  ? TEMPO_CHOICES.map((choice) => (
                      <Chip
                        key={choice}
                        active={tempoSec === choice}
                        onClick={() => store.setSettings({ tempoSec: choice })}
                      >
                        {choice} {copy.secShort}
                      </Chip>
                    ))
                  : null}
                <Chip active={punct} onClick={() => store.setSettings({ punct: !punct })}>
                  {copy.punct}
                </Chip>
                <Chip active={nums} onClick={() => store.setSettings({ nums: !nums })}>
                  {copy.nums}
                </Chip>
              </div>
            ) : null}

            {mode === "flow" && !endedNow ? (
              <div className="chrome mb-3 flex gap-2 overflow-x-auto">
                {passages.map((item, itemIndex) => (
                  <Chip
                    key={item.body.slice(0, 12)}
                    active={passage === itemIndex && !own}
                    onClick={() => {
                      setOwn(null);
                      setPassage(itemIndex);
                      setSeed(1);
                      setRunId((value) => value + 1);
                    }}
                  >
                    {item.title[ui]}
                  </Chip>
                ))}
              </div>
            ) : null}

            {mode === "flow" && !endedNow ? (
              <form
                className="chrome mb-4 flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const next = sanitize(ownDraft, layout);
                  if (!next) {
                    setOwnHint(copy.ownEmpty);
                    return;
                  }
                  setOwnHint(null);
                  setDrill(null);
                  fromDrill.current = false;
                  setOwn(next);
                  setRunId((value) => value + 1);
                }}
              >
                <label className="text-sm text-muted" htmlFor="own-text">
                  {copy.ownLabel}
                </label>
                <textarea
                  id="own-text"
                  value={ownDraft}
                  onChange={(event) => setOwnDraft(event.target.value)}
                  placeholder={copy.ownPlaceholder}
                  rows={4}
                  className="w-full resize-y rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="primary">
                    {copy.ownStart}
                  </Button>
                  {own ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOwn(null);
                        setRunId((value) => value + 1);
                      }}
                    >
                      {copy.ownClear}
                    </Button>
                  ) : null}
                </div>
                {ownHint ? <p className="text-sm text-bad">{ownHint}</p> : null}
              </form>
            ) : null}

            {endedNow ? (
              <Result
                ui={ui}
                mode={mode}
                cpm={cpm}
                raw={rawCpm}
                acc={acc}
                cons={series ? consistency(series.burst) : 0}
                errors={errorsNow}
                seconds={Math.round(spanMs / 1000)}
                series={series}
                misses={resetting ? {} : misses}
                message={
                  note ??
                  (mode !== "basics"
                    ? copy.done
                    : canNext
                      ? copy.passed
                      : acc >= 90 && cpm < speedGoal
                        ? copy.needSpeed.replace("{n}", String(speedGoal))
                        : copy.need)
                }
                extra={mode === "check" ? { label: copy.toPractice, onClick: () => chooseMode("smart") } : undefined}
                newBest={newBest}
                canNext={canNext && Boolean(nextLesson)}
                onAgain={() => restart(true)}
                onDrill={() => {
                  const ranked = Object.entries(misses)
                    .sort((a, b) => b[1] - a[1])
                    .map(([ch]) => ch);
                  const next = weakDrill(ranked, layout);
                  if (!next) return;
                  fromDrill.current = true;
                  setDrill(next);
                  setRunId((value) => value + 1);
                }}
                onNext={() => nextLesson && chooseLesson(nextLesson.id)}
              />
            ) : (
              <Prompt
                text={text}
                index={indexNow}
                bad={bad}
                windowed={mode === "tempo" || mode === "words" || mode === "smart"}
                wrong={wrongSet}
              />
            )}

            {caps && !endedNow ? <p className="mt-3 text-sm text-pretty text-bad">{copy.caps}</p> : null}
            {hint ? <p className="mt-3 text-sm text-pretty text-bad">{hint}</p> : null}
            {!hint && !endedNow ? (
              <p className="chrome mt-3 text-sm text-pretty text-muted">
                {lead}
                {mode === "smart" && focus.length ? (
                  <span className="ml-2 font-mono text-foreground">
                    {copy.focus}: {focus.join(" ").toLocaleUpperCase(ui === "ru" ? "ru" : "en")}
                  </span>
                ) : null}
              </p>
            ) : null}

            <div className="mt-4 h-px w-full bg-border">
              <div
                className="h-px bg-accent"
                style={{ width: `${text.length ? Math.min(100, (indexNow / text.length) * 100) : 0}%` }}
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={copy.cpm} value={cpm ? String(cpm) : "—"} />
              <Stat label={copy.wpm} value={cpm ? String(Math.round(cpm / 5)) : "—"} />
              <Stat label={copy.acc} value={hitsNow + errorsNow ? `${acc}%` : "—"} />
              <Stat label={copy.errors} value={String(errorsNow)} />
            </dl>

            {showKeys ? (
              <div className="transition-opacity duration-300" style={{ opacity: keyboardOpacity }}>
                <Keyboard
                  layout={layout}
                  target={target}
                  shift={Boolean(resolved?.shift)}
                  targetCode={resolved?.code ?? null}
                  bad={bad}
                  fresh={fresh}
                  fingerColors={fingerColors}
                />
              </div>
            ) : null}
            <p className="mt-3 text-sm text-muted">
              {coachLine(ui, target, resolved?.code ?? null, finger, Boolean(resolved?.shift), Boolean(endedNow), hydrated)}
            </p>
            <p className="chrome mt-1 text-xs text-faint">{copy.hotkeys}</p>
          </section>
        </div>
      )}
    </div>
  );
}

function coachLine(
  ui: UiLang,
  target: string | null,
  code: string | null,
  finger: Finger | undefined,
  shift: boolean,
  done: boolean,
  hydrated: boolean,
) {
  const copy = COPY[ui];
  if (!hydrated) return copy.start;
  if (done) return copy.done;
  if (!target || !code || !finger) return copy.start;
  const meta = FINGER_META[finger];
  const glyph = target === " " ? (ui === "ru" ? "Пробел" : "Space") : target.toLocaleUpperCase(ui === "ru" ? "ru" : "en");
  const hw = hardwareName(code);
  const same = glyph.toLowerCase() === hw.toLowerCase();
  const where = same ? "" : ` · ${copy.key} ${hw}`;
  const shiftBit = shift ? "Shift · " : "";
  return `${shiftBit}${glyph}${where} · ${meta.hand[ui]} · ${meta.name[ui]}`;
}

function Prompt({
  text,
  index,
  bad,
  windowed,
  wrong,
}: {
  text: string;
  index: number;
  bad: boolean;
  windowed: boolean;
  wrong: ReadonlySet<number>;
}) {
  const start = windowed ? Math.max(0, index - 16) : 0;
  const end = windowed ? Math.min(text.length, index + 64) : text.length;
  const chars = [...text.slice(start, end)];
  return (
    <p className={cn("prompt", bad && "miss")}>
      {start > 0 ? <span className="glyph-done">… </span> : null}
      {chars.map((ch, offset) => {
        const at = start + offset;
        const state = at < index ? (wrong.has(at) ? "wrong" : "done") : at === index ? "now" : "next";
        const shown = ch === " " && state !== "done" ? "·" : ch === " " ? "\u00a0" : ch;
        return (
          <span
            key={`${at}-${ch}`}
            className={cn(
              "inline",
              state === "now"
                ? "glyph-now"
                : state === "wrong"
                  ? "glyph-wrong"
                  : state === "done"
                    ? "glyph-done"
                    : "glyph-next",
            )}
          >
            {shown}
          </span>
        );
      })}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted">{label}</dt>
      <dd className="font-mono text-lg tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
