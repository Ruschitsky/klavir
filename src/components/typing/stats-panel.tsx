import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Keyboard } from "@/components/typing/keyboard";
import { lastDays, meanLatency, samples, weakPairs, weakness } from "@/lib/typing/analysis";
import { lessonsFor } from "@/lib/typing/content";
import { COPY, type UiLang } from "@/lib/typing/i18n";
import { resolveChar, type LayoutId } from "@/lib/typing/keys";
import { cn } from "@/lib/cn";
import { TEMPO_CHOICES, useKlavir } from "@/lib/typing/store";

const NO_FRESH: ReadonlySet<string> = new Set();
const BAR_PX = 72;

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted">{label}</dt>
      <dd className="font-mono text-lg tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function hoursMinutes(sec: number, minShort: string) {
  const min = Math.round(sec / 60);
  return min >= 60 ? `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}` : `${min} ${minShort}`;
}

export function StatsPanel({
  ui,
  layout,
  armReset,
  setArmReset,
  onReset,
}: {
  ui: UiLang;
  layout: LayoutId;
  armReset: boolean;
  setArmReset: (value: boolean) => void;
  onReset: () => void;
}) {
  const copy = COPY[ui];
  const lessons = lessonsFor(layout);
  const stats = useKlavir((state) => state.lessons);
  const allSessions = useKlavir((state) => state.sessions);
  const keys = useKlavir((state) => state.keys);
  const pairs = useKlavir((state) => state.pairs);
  const daily = useKlavir((state) => state.daily);
  const bests = useKlavir((state) => state.bests);
  const goalMin = useKlavir((state) => state.goalMin);

  const sessions = useMemo(() => allSessions.filter((item) => item.layout === layout), [allSessions, layout]);
  const values = sessions.map((session) => session.cpm);
  const last10 = values.slice(-10);
  const avg10 = last10.length ? Math.round(last10.reduce((a, b) => a + b, 0) / last10.length) : 0;
  const bestEver = values.length ? Math.max(...values) : 0;
  const totals = Object.values(daily).reduce(
    (acc, row) => ({ sec: acc.sec + row.sec, chars: acc.chars + row.chars }),
    { sec: 0, chars: 0 },
  );
  const days = lastDays(daily, Date.now(), 14);
  const goalSec = goalMin * 60;
  const barTop = Math.max(goalSec, ...days.map((day) => day.sec), 1);

  const { heat, weakList } = useMemo(() => {
    const mean = meanLatency(keys);
    const heatMap: Record<string, number> = {};
    const list: { ch: string; w: number; errPct: number; avgMs: number }[] = [];
    for (const [ch, stat] of Object.entries(keys)) {
      const total = samples(stat);
      if (total < 5) continue;
      const hit = resolveChar(layout, ch);
      if (!hit) continue;
      const w = weakness(stat, mean);
      heatMap[hit.code] = Math.max(heatMap[hit.code] ?? 0, w);
      list.push({
        ch,
        w,
        errPct: Math.round((100 * stat.miss) / total),
        avgMs: stat.lat ? Math.round(stat.ms / stat.lat) : 0,
      });
    }
    list.sort((a, b) => b.w - a.w);
    return { heat: heatMap, weakList: list };
  }, [keys, layout]);

  const worstPairs = useMemo(() => weakPairs(pairs, 6), [pairs]);

  const records = [
    ...TEMPO_CHOICES.map((n) => ({
      label: `${copy.modes.tempo} ${n} ${copy.secShort}`,
      best: bests[`tempo:${layout}:${n}`],
    })),
    { label: copy.modes.words, best: bests[`words:${layout}:`] },
    { label: copy.modes.smart, best: bests[`smart:${layout}:`] },
  ].filter((row) => row.best);

  const max = Math.max(1, ...lessons.map((lesson) => stats[lesson.id]?.bestCpm ?? 0));

  return (
    <section className="stage">
      <h2 className="text-lg font-semibold tracking-tight">{copy.modes.stats}</h2>
      <p className="mt-1 text-sm text-muted">{copy.statsLead}</p>

      {values.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{copy.emptyStats}</p>
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Cell label={copy.avg10} value={`${avg10} ${copy.cpm}`} />
            <Cell label={copy.bestEver} value={`${bestEver} ${copy.cpm}`} />
            <Cell label={copy.totalTime} value={hoursMinutes(totals.sec, copy.minShort)} />
            <Cell label={copy.totalChars} value={totals.chars.toLocaleString(ui === "ru" ? "ru" : "en")} />
          </dl>
          <Trend values={values} label={copy.cpm} />
        </>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-medium">{copy.last14}</h3>
        <div className="mt-2 flex items-end gap-1" role="img" aria-label={copy.last14}>
          {days.map((day) => (
            <div
              key={day.key}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${day.key}: ${Math.round(day.sec / 60)} ${copy.minShort}`}
            >
              <div
                className={cn("w-full rounded-sm", day.sec >= goalSec ? "bg-good" : "bg-accent/60")}
                style={{ height: Math.max(day.sec > 0 ? 4 : 1, Math.round((day.sec / barTop) * BAR_PX)) }}
              />
              <span className="font-mono text-[10px] text-faint">{day.key.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium">{copy.keysTitle}</h3>
        {weakList.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{copy.keysEmpty}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">{copy.keysLead}</p>
            <Keyboard
              layout={layout}
              target={null}
              shift={false}
              targetCode={null}
              bad={false}
              fresh={NO_FRESH}
              heat={heat}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">{copy.weakKeys}</span>
              {weakList.slice(0, 6).map((item) => (
                <span
                  key={item.ch}
                  className="rounded-md bg-accent px-2 py-0.5 font-mono text-sm text-accent-foreground tabular-nums"
                >
                  {item.ch === "\n" ? "↵" : item.ch.toLocaleUpperCase(ui === "ru" ? "ru" : "en")} · {item.errPct}%
                  {item.avgMs ? ` · ${item.avgMs} ${copy.ms}` : ""}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {worstPairs.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-medium">{copy.weakPairs}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {worstPairs.map((item) => {
              const total = samples(item.stat);
              return (
                <span
                  key={item.pair}
                  className="rounded-md bg-accent px-2 py-0.5 font-mono text-sm text-accent-foreground tabular-nums"
                >
                  {item.pair.toLocaleUpperCase(ui === "ru" ? "ru" : "en")} · {Math.round((100 * item.stat.miss) / total)}%
                  {item.stat.lat ? ` · ${Math.round(item.stat.ms / item.stat.lat)} ${copy.ms}` : ""}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="text-sm font-medium">{copy.records}</h3>
        {records.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{copy.noRecords}</p>
        ) : (
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {records.map((row) => (
              <li key={row.label} className="flex justify-between gap-3 font-mono text-xs text-muted tabular-nums">
                <span>{row.label}</span>
                <span>
                  {row.best?.cpm} {copy.cpm} · {row.best?.acc}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {lessons.map((lesson) => {
          const row = stats[lesson.id];
          const width = row ? Math.max(4, Math.round((row.bestCpm / max) * 100)) : 0;
          return (
            <li key={lesson.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
              <div className="min-w-0">
                <div className="truncate">{lesson.title[ui]}</div>
                <div className="mt-1 h-1 rounded-full bg-background">
                  <div className="h-1 rounded-full bg-accent" style={{ width: `${width}%` }} />
                </div>
              </div>
              <div className="text-right font-mono text-xs text-muted tabular-nums">
                {row ? `${row.bestCpm} ${copy.cpm} · ${row.bestAcc}%` : "—"}
              </div>
            </li>
          );
        })}
      </ul>

      {sessions.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-medium">{copy.sessions}</h3>
          <ul className="mt-2 flex flex-col gap-1">
            {sessions
              .slice(-8)
              .reverse()
              .map((session) => (
                <li key={session.t} className="flex justify-between gap-3 font-mono text-xs text-muted tabular-nums">
                  <span className="truncate">
                    {new Date(session.t).toLocaleString(ui === "ru" ? "ru" : "en")} · {copy.modes[session.mode]}
                  </span>
                  <span className="shrink-0">
                    {session.cpm} {copy.cpm} · {session.acc}%
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() => {
            if (!armReset) {
              setArmReset(true);
              return;
            }
            onReset();
          }}
        >
          {armReset ? copy.resetConfirm : copy.reset}
        </Button>
      </div>
    </section>
  );
}

/** Speed of recent runs as a small line chart. */
function Trend({ values, label }: { values: number[]; label: string }) {
  const W = 600;
  const H = 120;
  const pad = 10;
  const min = Math.min(...values) - 8;
  const max = Math.max(...values) + 8;
  const x = (i: number) =>
    values.length === 1 ? W / 2 : pad + (i / (values.length - 1)) * (W - 2 * pad);
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (H - 2 * pad);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-36 w-full" role="img" aria-label={label} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="1.75" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {values.length < 3
        ? values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="var(--color-accent)" />)
        : null}
    </svg>
  );
}
