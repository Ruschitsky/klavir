import { dayKey, streak } from "@/lib/typing/analysis";
import { COPY, type UiLang } from "@/lib/typing/i18n";
import { useKlavir } from "@/lib/typing/store";

/** Today's minutes against the daily goal, plus the current streak of practice days. */
export function DailyBar({ ui }: { ui: UiLang }) {
  const copy = COPY[ui];
  const hydrated = useKlavir((state) => state.hydrated);
  const daily = useKlavir((state) => state.daily);
  const goalMin = useKlavir((state) => state.goalMin);
  if (!hydrated) return null;
  const now = Date.now();
  const sec = daily[dayKey(now)]?.sec ?? 0;
  const pct = Math.min(100, Math.round((sec / (goalMin * 60)) * 100));
  const run = streak(daily, now);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted tabular-nums">
      <span>
        {copy.today} {Math.floor(sec / 60)}/{goalMin} {copy.minShort}
      </span>
      <div
        className="h-1 w-24 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={pct >= 100 ? "h-1 bg-good" : "h-1 bg-accent"} style={{ width: `${pct}%` }} />
      </div>
      {run > 0 ? (
        <span>
          {copy.streak} {run} {copy.days}
        </span>
      ) : null}
    </div>
  );
}
