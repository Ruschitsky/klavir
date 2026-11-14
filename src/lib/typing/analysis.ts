/**
 * Pure helpers for per-key statistics, speed charts and daily practice.
 * No React and no browser APIs, so everything here can be tested in Node.
 */

export type KeyStat = {
  hit: number;
  miss: number;
  /** Number of valid latency samples. */
  lat: number;
  /** Sum of those latencies, milliseconds. */
  ms: number;
};
export type KeyMap = Record<string, KeyStat>;
export type Tick = { t: number; ok: boolean };
export type Daily = Record<string, { sec: number; chars: number }>;

const LAT_MIN = 25;
const LAT_MAX = 2500;

export const emptyStat = (): KeyStat => ({ hit: 0, miss: 0, lat: 0, ms: 0 });

/** Record one key press into `map`. `latency` is the gap since the previous correct key. */
export function bump(map: KeyMap, ch: string, ok: boolean, latency: number) {
  const stat = (map[ch] ??= emptyStat());
  if (ok) {
    stat.hit += 1;
    if (latency >= LAT_MIN && latency <= LAT_MAX) {
      stat.lat += 1;
      stat.ms += latency;
    }
  } else {
    stat.miss += 1;
  }
}

/** Add `delta` to `base`. Old habits fade: past ~600 presses a key's history is halved. */
export function mergeKeys(base: KeyMap, delta: KeyMap): KeyMap {
  const out: KeyMap = {};
  for (const [ch, stat] of Object.entries(base)) out[ch] = { ...stat };
  for (const [ch, add] of Object.entries(delta)) {
    const stat = (out[ch] ??= emptyStat());
    stat.hit += add.hit;
    stat.miss += add.miss;
    stat.lat += add.lat;
    stat.ms += add.ms;
    if (stat.hit + stat.miss > 600) {
      stat.hit = Math.round(stat.hit / 2);
      stat.miss = Math.round(stat.miss / 2);
      stat.lat = Math.round(stat.lat / 2);
      stat.ms = Math.round(stat.ms / 2);
    }
  }
  return out;
}

/** Average latency over every key that has samples, milliseconds (0 if none). */
export function meanLatency(map: KeyMap): number {
  let sum = 0;
  let n = 0;
  for (const stat of Object.values(map)) {
    sum += stat.ms;
    n += stat.lat;
  }
  return n > 0 ? sum / n : 0;
}

export function samples(stat: KeyStat | undefined): number {
  return stat ? stat.hit + stat.miss : 0;
}

/** 0 = solid key, 1 = needs work. Keys with almost no data get moderate attention. */
export function weakness(stat: KeyStat | undefined, mean: number): number {
  const total = samples(stat);
  if (!stat || total < 3) return 0.45;
  const err = Math.min(1, ((stat.miss + 0.5) / (total + 5)) * 5);
  const slow =
    stat.lat >= 3 && mean > 0
      ? Math.max(0, Math.min(1, (stat.ms / stat.lat / mean - 0.9) / 1.1))
      : 0.3;
  return Math.min(1, err * 0.7 + slow * 0.3);
}

/** Weakness of a letter pair, or null while there are too few presses to judge. */
export function pairWeakness(pairs: KeyMap, pair: string, mean: number): number | null {
  const stat = pairs[pair];
  if (samples(stat) < 5) return null;
  return weakness(stat, mean);
}

/** The pairs of letters that cost the most time or mistakes. */
export function weakPairs(pairs: KeyMap, limit: number) {
  const mean = meanLatency(pairs);
  const out: { pair: string; w: number; stat: KeyStat }[] = [];
  for (const [pair, stat] of Object.entries(pairs)) {
    const w = pairWeakness(pairs, pair, mean);
    if (w !== null) out.push({ pair, w, stat });
  }
  return out.sort((a, b) => b.w - a.w).slice(0, limit);
}

/** Keep the most-practised pairs so storage stays small. */
export function prunePairs(pairs: KeyMap, limit = 900): KeyMap {
  const entries = Object.entries(pairs);
  if (entries.length <= limit) return pairs;
  entries.sort((a, b) => samples(b[1]) - samples(a[1]));
  return Object.fromEntries(entries.slice(0, limit));
}

/** Letters sorted from weakest to strongest. */
export function rankWeak(letters: string, keys: KeyMap): string[] {
  const mean = meanLatency(keys);
  return [...new Set([...letters])]
    .map((ch) => ({ ch, w: weakness(keys[ch], mean) }))
    .sort((a, b) => b.w - a.w)
    .map((item) => item.ch);
}

export type Series = {
  seconds: number;
  /** Average net speed so far, words per minute. */
  net: number[];
  /** Speed inside each single second, words per minute (all key presses). */
  burst: number[];
  /** Number of mistakes in each second. */
  errs: number[];
};

export function buildSeries(ticks: Tick[], durationMs: number): Series {
  const seconds = Math.max(1, Math.ceil(durationMs / 1000));
  const okPer = new Array<number>(seconds).fill(0);
  const allPer = new Array<number>(seconds).fill(0);
  const errs = new Array<number>(seconds).fill(0);
  for (const tick of ticks) {
    const s = Math.min(seconds - 1, Math.max(0, Math.floor(tick.t / 1000)));
    allPer[s] += 1;
    if (tick.ok) okPer[s] += 1;
    else errs[s] += 1;
  }
  const net: number[] = [];
  const burst: number[] = [];
  let okSum = 0;
  for (let s = 0; s < seconds; s++) {
    okSum += okPer[s];
    net.push(Math.round(okSum / 5 / ((s + 1) / 60)));
    burst.push(Math.round((allPer[s] / 5) * 60));
  }
  return { seconds, net, burst, errs };
}

/**
 * How even the rhythm was, 0–100. Same idea as Monkeytype: the coefficient of
 * variation of per-second speed, squashed onto a 0–100 scale. Returns 0 when there
 * are too few seconds to say anything.
 */
export function consistency(values: number[]): number {
  if (values.length < 3) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean <= 0) return 0;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const cov = Math.sqrt(variance) / mean;
  const score = 100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5));
  return Math.max(0, Math.min(100, Math.round(score)));
}

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Consecutive days with at least `minSec` of practice. Today may still be empty. */
export function streak(daily: Daily, nowMs: number, minSec = 60): number {
  const d = new Date(nowMs);
  d.setHours(12, 0, 0, 0);
  const today = daily[dayKey(d.getTime())];
  if (!today || today.sec < minSec) d.setDate(d.getDate() - 1);
  let count = 0;
  for (;;) {
    const row = daily[dayKey(d.getTime())];
    if (!row || row.sec < minSec) break;
    count += 1;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

/** The last `n` days, oldest first. */
export function lastDays(daily: Daily, nowMs: number, n: number) {
  const d = new Date(nowMs);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  const out: { key: string; sec: number; chars: number }[] = [];
  for (let i = 0; i < n; i++) {
    const key = dayKey(d.getTime());
    out.push({ key, sec: daily[key]?.sec ?? 0, chars: daily[key]?.chars ?? 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Keep only the newest `limit` days so storage stays small. */
export function pruneDaily(daily: Daily, limit = 400): Daily {
  const keys = Object.keys(daily).sort();
  if (keys.length <= limit) return daily;
  const out: Daily = {};
  for (const key of keys.slice(keys.length - limit)) out[key] = daily[key];
  return out;
}
