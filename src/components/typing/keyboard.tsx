import { keyFace, ROWS, type KeySpec, type LayoutId } from "@/lib/typing/keys";

const COLS = 60;
const GAP = 5;
const GRID_W = 864;
const MICRO = (GRID_W - (COLS - 1) * GAP) / COLS;
const ORIGIN_X = 18;
const ORIGIN_Y = 20;
const ROW_H = 52;
const ROW_GAP = 6;
const VB_W = 900;
const VB_H = 336;

function xOf(col: number) {
  return ORIGIN_X + col * (MICRO + GAP);
}

function wOf(span: number) {
  return span * MICRO + (span - 1) * GAP;
}

/** Solid keys get a soft green, weak keys a red that deepens with the score. */
const IS_MAC = typeof navigator === "undefined" || /Mac|iPhone|iPad/i.test(navigator.platform || "");

/** The drawn keyboard is a MacBook; on other systems the modifier keys get PC names. */
const PC_LABELS: Record<string, string> = {
  Backspace: "Backspace",
  Enter: "Enter",
  Fn: "Fn",
  ControlLeft: "Ctrl",
  AltLeft: "Win",
  MetaLeft: "Alt",
  MetaRight: "Alt",
  AltRight: "Ctrl",
};

function heatStyle(value: number) {
  const fill =
    value < 0.2
      ? "color-mix(in oklab, var(--color-good) 30%, var(--color-key))"
      : `color-mix(in oklab, var(--color-bad) ${Math.round(value * 80)}%, var(--color-key))`;
  return { fill };
}

const CHEVRON: Record<string, string> = {
  up: "M-5 2.5 L0 -2.5 L5 2.5",
  down: "M-5 -2.5 L0 2.5 L5 -2.5",
  left: "M2.5 -5 L-2.5 0 L2.5 5",
  right: "M-2.5 -5 L2.5 0 L-2.5 5",
};

type Props = {
  layout: LayoutId;
  target: string | null;
  shift: boolean;
  targetCode: string | null;
  bad: boolean;
  fresh: ReadonlySet<string>;
  /** Key code -> 0 (solid) … 1 (weak). Paints the keys instead of showing the next target. */
  heat?: Readonly<Record<string, number>> | null;
  /** Tint keys by the finger that presses them. */
  fingerColors?: boolean;
};

export function Keyboard({ layout, target, shift, targetCode, bad, fresh, heat, fingerColors }: Props) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={`mt-5 block h-auto w-full min-w-0 max-w-full${fingerColors ? " fc" : ""}`}
      aria-hidden="true"
    >
      <rect className="deck" width={VB_W} height={VB_H} rx="24" />
      <rect className="well" x="10" y="10" width={VB_W - 20} height={VB_H - 20} rx="14" />
      {ROWS.map((row, rowIndex) => {
        let col = 0;
        const y = ORIGIN_Y + rowIndex * (ROW_H + ROW_GAP);
        return row.map((spec) => {
          const x = xOf(col);
          const w = wOf(spec.span);
          col += spec.span;
          return (
            <Key
              key={spec.code}
              spec={spec}
              x={x}
              y={y}
              w={w}
              h={ROW_H}
              layout={layout}
              target={target}
              active={spec.code === targetCode}
              shifted={shift && (spec.code === "ShiftLeft" || spec.code === "ShiftRight")}
              bad={bad && spec.code === targetCode}
              fresh={fresh.has(spec.code) && spec.code !== targetCode}
              heat={heat?.[spec.code]}
            />
          );
        });
      })}
    </svg>
  );
}

function Key({
  spec,
  x,
  y,
  w,
  h,
  layout,
  target,
  active,
  shifted,
  bad,
  fresh,
  heat,
}: {
  spec: KeySpec;
  x: number;
  y: number;
  w: number;
  h: number;
  layout: LayoutId;
  target: string | null;
  active: boolean;
  shifted: boolean;
  bad: boolean;
  fresh: boolean;
  heat?: number;
}) {
  const baseFace = keyFace(layout, spec, active ? target : null);
  const face = !IS_MAC && baseFace === spec.label ? (PC_LABELS[spec.code] ?? baseFace) : baseFace;
  const chevron = CHEVRON[spec.label ?? ""];
  const state = [
    bad ? "is-bad" : "",
    active && !bad ? "is-next" : "",
    shifted && !active ? "is-shift" : "",
    fresh && !active ? "is-fresh" : "",
    spec.ghost ? "ghost" : "",
    spec.finger ? `f-${spec.finger}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const long = face.length > 1;
  return (
    <g className={state} transform={`translate(${x} ${y})`}>
      <rect className="keycap" width={w} height={h} rx="6" style={heat === undefined ? undefined : heatStyle(heat)} />
      {spec.code === "KeyF" || spec.code === "KeyJ" ? (
        <rect className="bump" x={w / 2 - 7} y={h - 11} width="14" height="3" rx="1.5" />
      ) : null}
      {chevron ? (
        <path className="chev" d={chevron} transform={`translate(${w / 2} ${h / 2})`} />
      ) : face ? (
        <text
          className="key-label"
          x={w / 2}
          y={h / 2 + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={long ? 12 : 16}
          fontWeight={long ? 500 : 600}
        >
          {face}
        </text>
      ) : null}
    </g>
  );
}
