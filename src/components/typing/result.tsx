import { Button } from "@/components/ui/button";
import type { Series } from "@/lib/typing/analysis";
import type { Mode } from "@/lib/typing/content";
import { COPY, type UiLang } from "@/lib/typing/i18n";

type Props = {
  ui: UiLang;
  mode: Mode;
  /** Correct characters per minute. */
  cpm: number;
  /** Characters per minute counting every key press. */
  raw: number;
  acc: number;
  /** 0–100, 0 when there was too little data. */
  cons: number;
  errors: number;
  seconds: number;
  series: Series | null;
  misses: Record<string, number>;
  message: string;
  newBest: boolean;
  canNext: boolean;
  onAgain: () => void;
  onDrill: () => void;
  onNext: () => void;
  /** An extra button, e.g. "To practice" after the level check. */
  extra?: { label: string; onClick: () => void };
};

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted">{label}</dt>
      <dd className="font-mono text-lg tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

export function Result({
  ui,
  mode,
  cpm,
  raw,
  acc,
  cons,
  errors,
  seconds,
  series,
  misses,
  message,
  newBest,
  canNext,
  onAgain,
  onDrill,
  onNext,
  extra,
}: Props) {
  const copy = COPY[ui];
  const weak = Object.entries(misses)
    .filter(([ch]) => ch.trim())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <div className="result-well" aria-live="polite">
      <p className="flex flex-wrap items-center gap-2 font-sans text-sm text-muted">
        <span>{message}</span>
        {newBest ? (
          <span className="rounded-md bg-good px-2 py-0.5 text-xs font-semibold text-background">{copy.newBest}</span>
        ) : null}
      </p>
      <p className="font-sans text-4xl font-semibold tracking-tight tabular-nums">
        {cpm || "—"} <span className="text-base font-medium text-muted">{copy.cpm}</span>
        {cpm ? (
          <span className="ml-3 text-base font-medium text-muted">
            {Math.round(cpm / 5)} {copy.wpm}
          </span>
        ) : null}
      </p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Cell label={copy.acc} value={`${acc}%`} />
        <Cell label={copy.errors} value={String(errors)} />
        <Cell label={copy.raw} value={raw ? `${raw}` : "—"} />
        <Cell label={copy.cons} value={cons ? `${cons}%` : "—"} />
        <Cell label={copy.time} value={formatTime(seconds)} />
      </dl>
      {series && series.seconds >= 4 ? <SeriesChart series={series} ui={ui} /> : null}
      {weak.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{copy.weak}</span>
          {weak.map(([ch, count]) => (
            <span
              key={ch}
              className="rounded-md bg-accent px-2 py-0.5 font-mono text-sm text-accent-foreground tabular-nums"
            >
              {ch} · {count}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={onAgain}>
          {copy.again}
        </Button>
        {weak.length ? (
          <Button variant="outline" onClick={onDrill}>
            {copy.drill}
          </Button>
        ) : null}
        {mode === "basics" ? (
          <Button variant="outline" disabled={!canNext} onClick={onNext}>
            {copy.next}
          </Button>
        ) : null}
        {extra ? (
          <Button variant="outline" onClick={extra.onClick}>
            {extra.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Speed through the run: running average, speed inside each second, and where mistakes happened. */
function SeriesChart({ series, ui }: { series: Series; ui: UiLang }) {
  const copy = COPY[ui];
  const n = series.seconds;
  const W = 600;
  const H = 120;
  const left = 30;
  const right = 8;
  const top = 10;
  const bottom = 18;
  const max = Math.max(10, ...series.net, ...series.burst);
  const x = (i: number) => left + (i / (n - 1)) * (W - left - right);
  const y = (v: number) => top + (1 - v / max) * (H - top - bottom);
  const line = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <figure className="w-full">
      <figcaption className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>{copy.speedChart} ({copy.wpm})</span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-0.5 w-4 bg-accent" /> {copy.legendNet}
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-0.5 w-4 bg-faint" /> {copy.legendBurst}
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block size-1.5 rounded-full bg-bad" /> {copy.legendMiss}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={copy.speedChart}>
        <line x1={left} x2={W - right} y1={H - bottom} y2={H - bottom} stroke="var(--color-border)" />
        <line x1={left} x2={W - right} y1={top} y2={top} stroke="var(--color-border)" strokeDasharray="3 4" />
        <text x={left - 4} y={top + 4} textAnchor="end" fontSize="7.5" fill="var(--color-faint)">
          {Math.round(max)}
        </text>
        <text x={left - 4} y={H - bottom + 4} textAnchor="end" fontSize="7.5" fill="var(--color-faint)">
          0
        </text>
        <text x={left} y={H - 3} fontSize="7.5" fill="var(--color-faint)">
          0 {copy.secShort}
        </text>
        <text x={W - right} y={H - 3} textAnchor="end" fontSize="7.5" fill="var(--color-faint)">
          {n} {copy.secShort}
        </text>
        <path d={line(series.burst)} fill="none" stroke="var(--color-faint)" strokeWidth="1.25" strokeLinejoin="round" />
        <path d={line(series.net)} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
        {series.errs.map((count, i) =>
          count > 0 ? (
            <circle key={i} cx={x(i)} cy={H - bottom - 5} r={Math.min(5, 2 + count)} fill="var(--color-bad)" opacity="0.85" />
          ) : null,
        )}
      </svg>
    </figure>
  );
}
