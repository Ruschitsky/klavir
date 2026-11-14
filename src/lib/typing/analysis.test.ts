import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bump,
  buildSeries,
  consistency,
  dayKey,
  lastDays,
  mergeKeys,
  meanLatency,
  rankWeak,
  streak,
  pairWeakness,
  prunePairs,
  weakPairs,
  weakness,
  type KeyMap,
} from "./analysis.ts";

test("a key with more mistakes and slower hits ranks weaker", () => {
  const run: KeyMap = {};
  for (let i = 0; i < 40; i++) bump(run, "а", true, 200);
  for (let i = 0; i < 10; i++) bump(run, "к", true, 600);
  for (let i = 0; i < 6; i++) bump(run, "к", false, 0);
  const keys = mergeKeys({}, run);
  assert.ok(weakness(keys["к"], meanLatency(keys)) > weakness(keys["а"], meanLatency(keys)));
  assert.equal(rankWeak("ак", keys)[0], "к");
  assert.equal(weakness(undefined, 0), 0.45);
});

test("old history fades so stats follow recent habits", () => {
  const big: KeyMap = { х: { hit: 700, miss: 0, lat: 0, ms: 0 } };
  assert.ok(mergeKeys(big, { х: { hit: 10, miss: 0, lat: 0, ms: 0 } })["х"].hit < 400);
});

test("speed series and consistency", () => {
  const ticks = Array.from({ length: 50 }, (_, i) => ({ t: i * 100, ok: i % 10 !== 0 }));
  const series = buildSeries(ticks, 5000);
  assert.equal(series.seconds, 5);
  assert.equal(series.errs.reduce((a, b) => a + b, 0), 5);
  assert.equal(consistency([100, 100, 100, 100]), 100);
  assert.ok(consistency([20, 160, 30, 150]) < 60);
  assert.equal(consistency([50, 60]), 0);
});

test("streak counts consecutive practice days", () => {
  const now = new Date(2026, 10, 13, 15, 0).getTime();
  const day = (n: number) => dayKey(new Date(2026, 10, 13 - n, 10).getTime());
  const daily = {
    [day(0)]: { sec: 120, chars: 1 },
    [day(1)]: { sec: 90, chars: 1 },
    [day(2)]: { sec: 30, chars: 1 },
  };
  assert.equal(streak(daily, now), 2);
  assert.equal(streak({ [day(1)]: { sec: 70, chars: 1 } }, now), 1);
  assert.equal(streak({}, now), 0);
  assert.equal(lastDays(daily, now, 14).length, 14);
});

test("letter pairs: weak ones rank first, rare ones are not judged", () => {
  const pairs: KeyMap = {};
  for (let i = 0; i < 20; i++) bump(pairs, "ст", true, 150);
  for (let i = 0; i < 10; i++) bump(pairs, "ть", true, 700);
  for (let i = 0; i < 8; i++) bump(pairs, "ть", false, 0);
  for (let i = 0; i < 3; i++) bump(pairs, "жю", false, 0);
  const worst = weakPairs(pairs, 5);
  assert.equal(worst[0].pair, "ть");
  assert.ok(!worst.some((item) => item.pair === "жю"));
  assert.equal(pairWeakness(pairs, "жю", 100), null);
});

test("pair storage is capped", () => {
  const many: KeyMap = {};
  for (let i = 0; i < 1200; i++) many["a" + i] = { hit: i % 50, miss: 0, lat: 0, ms: 0 };
  assert.equal(Object.keys(prunePairs(many)).length, 900);
});
