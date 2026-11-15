export type LayoutId = "en" | "ru" | "ru-pc";

export type Finger =
  | "lp"
  | "lr"
  | "lm"
  | "li"
  | "ri"
  | "rm"
  | "rr"
  | "rp"
  | "thumb";

export type KeySpec = {
  code: string;
  span: number;
  finger?: Finger;
  label?: string;
  ghost?: boolean;
};

type Legend = { base: string; shift: string };

export const FINGER_ORDER: Finger[] = ["lp", "lr", "lm", "li", "thumb", "ri", "rm", "rr", "rp"];

export const FINGER_META: Record<
  Finger,
  { hand: { ru: string; en: string }; name: { ru: string; en: string } }
> = {
  lp: { hand: { ru: "Левая", en: "Left" }, name: { ru: "мизинец", en: "pinky" } },
  lr: { hand: { ru: "Левая", en: "Left" }, name: { ru: "безымянный", en: "ring" } },
  lm: { hand: { ru: "Левая", en: "Left" }, name: { ru: "средний", en: "middle" } },
  li: { hand: { ru: "Левая", en: "Left" }, name: { ru: "указательный", en: "index" } },
  ri: { hand: { ru: "Правая", en: "Right" }, name: { ru: "указательный", en: "index" } },
  rm: { hand: { ru: "Правая", en: "Right" }, name: { ru: "средний", en: "middle" } },
  rr: { hand: { ru: "Правая", en: "Right" }, name: { ru: "безымянный", en: "ring" } },
  rp: { hand: { ru: "Правая", en: "Right" }, name: { ru: "мизинец", en: "pinky" } },
  thumb: { hand: { ru: "Любая", en: "Either" }, name: { ru: "большой", en: "thumb" } },
};

const letter = (base: string): Legend => ({
  base,
  shift: base.toLocaleUpperCase("ru"),
});

const EN: Record<string, Legend> = {
  Backquote: { base: "`", shift: "~" },
  Digit1: { base: "1", shift: "!" },
  Digit2: { base: "2", shift: "@" },
  Digit3: { base: "3", shift: "#" },
  Digit4: { base: "4", shift: "$" },
  Digit5: { base: "5", shift: "%" },
  Digit6: { base: "6", shift: "^" },
  Digit7: { base: "7", shift: "&" },
  Digit8: { base: "8", shift: "*" },
  Digit9: { base: "9", shift: "(" },
  Digit0: { base: "0", shift: ")" },
  Minus: { base: "-", shift: "_" },
  Equal: { base: "=", shift: "+" },
  KeyQ: letter("q"),
  KeyW: letter("w"),
  KeyE: letter("e"),
  KeyR: letter("r"),
  KeyT: letter("t"),
  KeyY: letter("y"),
  KeyU: letter("u"),
  KeyI: letter("i"),
  KeyO: letter("o"),
  KeyP: letter("p"),
  BracketLeft: { base: "[", shift: "{" },
  BracketRight: { base: "]", shift: "}" },
  Backslash: { base: "\\", shift: "|" },
  KeyA: letter("a"),
  KeyS: letter("s"),
  KeyD: letter("d"),
  KeyF: letter("f"),
  KeyG: letter("g"),
  KeyH: letter("h"),
  KeyJ: letter("j"),
  KeyK: letter("k"),
  KeyL: letter("l"),
  Semicolon: { base: ";", shift: ":" },
  Quote: { base: "'", shift: '"' },
  KeyZ: letter("z"),
  KeyX: letter("x"),
  KeyC: letter("c"),
  KeyV: letter("v"),
  KeyB: letter("b"),
  KeyN: letter("n"),
  KeyM: letter("m"),
  Comma: { base: ",", shift: "<" },
  Period: { base: ".", shift: ">" },
  Slash: { base: "/", shift: "?" },
  Space: { base: " ", shift: " " },
};

const RU_PC: Record<string, Legend> = {
  Backquote: { base: "ё", shift: "Ё" },
  Digit1: { base: "1", shift: "!" },
  Digit2: { base: "2", shift: '"' },
  Digit3: { base: "3", shift: "№" },
  Digit4: { base: "4", shift: ";" },
  Digit5: { base: "5", shift: "%" },
  Digit6: { base: "6", shift: ":" },
  Digit7: { base: "7", shift: "?" },
  Digit8: { base: "8", shift: "*" },
  Digit9: { base: "9", shift: "(" },
  Digit0: { base: "0", shift: ")" },
  Minus: { base: "-", shift: "_" },
  Equal: { base: "=", shift: "+" },
  KeyQ: letter("й"),
  KeyW: letter("ц"),
  KeyE: letter("у"),
  KeyR: letter("к"),
  KeyT: letter("е"),
  KeyY: letter("н"),
  KeyU: letter("г"),
  KeyI: letter("ш"),
  KeyO: letter("щ"),
  KeyP: letter("з"),
  BracketLeft: letter("х"),
  BracketRight: letter("ъ"),
  Backslash: { base: "\\", shift: "/" },
  KeyA: letter("ф"),
  KeyS: letter("ы"),
  KeyD: letter("в"),
  KeyF: letter("а"),
  KeyG: letter("п"),
  KeyH: letter("р"),
  KeyJ: letter("о"),
  KeyK: letter("л"),
  KeyL: letter("д"),
  Semicolon: letter("ж"),
  Quote: letter("э"),
  KeyZ: letter("я"),
  KeyX: letter("ч"),
  KeyC: letter("с"),
  KeyV: letter("м"),
  KeyB: letter("и"),
  KeyN: letter("т"),
  KeyM: letter("ь"),
  Comma: letter("б"),
  Period: letter("ю"),
  Slash: { base: ".", shift: "," },
  Space: { base: " ", shift: " " },
};

const RU_MAC: Record<string, Legend> = {
  ...RU_PC,
  Backquote: { base: "]", shift: "[" },
  Digit4: { base: "4", shift: "%" },
  Digit5: { base: "5", shift: ":" },
  Digit6: { base: "6", shift: "," },
  Digit7: { base: "7", shift: "." },
  Digit8: { base: "8", shift: ";" },
  Backslash: { base: "ё", shift: "Ё" },
  Slash: { base: "/", shift: "?" },
};

export function legends(layout: LayoutId): Record<string, Legend> {
  if (layout === "en") return EN;
  if (layout === "ru-pc") return RU_PC;
  return RU_MAC;
}

const resolveCache = new Map<LayoutId, Map<string, { code: string; shift: boolean }>>();

export function resolveChar(layout: LayoutId, ch: string): { code: string; shift: boolean } | null {
  // A line break is typed with the Enter key.
  if (ch === "\n") return { code: "Enter", shift: false };
  let map = resolveCache.get(layout);
  if (!map) {
    map = new Map();
    for (const [code, leg] of Object.entries(legends(layout))) {
      if (!map.has(leg.base)) map.set(leg.base, { code, shift: false });
      if (leg.shift !== leg.base && !map.has(leg.shift)) map.set(leg.shift, { code, shift: true });
    }
    resolveCache.set(layout, map);
  }
  return map.get(ch) ?? null;
}

/** macOS «Русская — ПК» on ANSI types Latin Ë instead of Cyrillic Ё. */
export function equivalents(ch: string): string[] {
  if (ch === "Ё" || ch === "Ë") return ["Ё", "Ë"];
  if (ch === "ё") return ["ё"];
  return [ch];
}

export function accepts(expected: string, typed: string): boolean {
  return equivalents(expected).includes(typed);
}

const HARDWARE: Record<string, string> = {
  Backquote: "`",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
  Digit0: "0",
  Minus: "-",
  Equal: "=",
  KeyQ: "Q",
  KeyW: "W",
  KeyE: "E",
  KeyR: "R",
  KeyT: "T",
  KeyY: "Y",
  KeyU: "U",
  KeyI: "I",
  KeyO: "O",
  KeyP: "P",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  KeyA: "A",
  KeyS: "S",
  KeyD: "D",
  KeyF: "F",
  KeyG: "G",
  KeyH: "H",
  KeyJ: "J",
  KeyK: "K",
  KeyL: "L",
  Semicolon: ";",
  Quote: "'",
  KeyZ: "Z",
  KeyX: "X",
  KeyC: "C",
  KeyV: "V",
  KeyB: "B",
  KeyN: "N",
  KeyM: "M",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Space: "space",
  Enter: "Enter",
};

export function hardwareName(code: string): string {
  return HARDWARE[code] ?? code;
}

export const ROWS: KeySpec[][] = [
  [
    { code: "Backquote", span: 4, finger: "lp" },
    { code: "Digit1", span: 4, finger: "lp" },
    { code: "Digit2", span: 4, finger: "lr" },
    { code: "Digit3", span: 4, finger: "lm" },
    { code: "Digit4", span: 4, finger: "li" },
    { code: "Digit5", span: 4, finger: "li" },
    { code: "Digit6", span: 4, finger: "ri" },
    { code: "Digit7", span: 4, finger: "ri" },
    { code: "Digit8", span: 4, finger: "rm" },
    { code: "Digit9", span: 4, finger: "rr" },
    { code: "Digit0", span: 4, finger: "rp" },
    { code: "Minus", span: 4, finger: "rp" },
    { code: "Equal", span: 4, finger: "rp" },
    { code: "Backspace", span: 8, finger: "rp", label: "delete" },
  ],
  [
    { code: "Tab", span: 6, finger: "lp", label: "tab", ghost: true },
    { code: "KeyQ", span: 4, finger: "lp" },
    { code: "KeyW", span: 4, finger: "lr" },
    { code: "KeyE", span: 4, finger: "lm" },
    { code: "KeyR", span: 4, finger: "li" },
    { code: "KeyT", span: 4, finger: "li" },
    { code: "KeyY", span: 4, finger: "ri" },
    { code: "KeyU", span: 4, finger: "ri" },
    { code: "KeyI", span: 4, finger: "rm" },
    { code: "KeyO", span: 4, finger: "rr" },
    { code: "KeyP", span: 4, finger: "rp" },
    { code: "BracketLeft", span: 4, finger: "rp" },
    { code: "BracketRight", span: 4, finger: "rp" },
    { code: "Backslash", span: 6, finger: "rp" },
  ],
  [
    { code: "CapsLock", span: 7, finger: "lp", label: "caps", ghost: true },
    { code: "KeyA", span: 4, finger: "lp" },
    { code: "KeyS", span: 4, finger: "lr" },
    { code: "KeyD", span: 4, finger: "lm" },
    { code: "KeyF", span: 4, finger: "li" },
    { code: "KeyG", span: 4, finger: "li" },
    { code: "KeyH", span: 4, finger: "ri" },
    { code: "KeyJ", span: 4, finger: "ri" },
    { code: "KeyK", span: 4, finger: "rm" },
    { code: "KeyL", span: 4, finger: "rr" },
    { code: "Semicolon", span: 4, finger: "rp" },
    { code: "Quote", span: 4, finger: "rp" },
    { code: "Enter", span: 9, finger: "rp", label: "return" },
  ],
  [
    { code: "ShiftLeft", span: 9, finger: "lp", label: "shift" },
    { code: "KeyZ", span: 4, finger: "lp" },
    { code: "KeyX", span: 4, finger: "lr" },
    { code: "KeyC", span: 4, finger: "lm" },
    { code: "KeyV", span: 4, finger: "li" },
    { code: "KeyB", span: 4, finger: "li" },
    { code: "KeyN", span: 4, finger: "ri" },
    { code: "KeyM", span: 4, finger: "ri" },
    { code: "Comma", span: 4, finger: "rm" },
    { code: "Period", span: 4, finger: "rr" },
    { code: "Slash", span: 4, finger: "rp" },
    { code: "ShiftRight", span: 7, finger: "rp", label: "shift" },
    { code: "ArrowUp", span: 4, label: "up", ghost: true },
  ],
  [
    { code: "Fn", span: 5, label: "fn", ghost: true },
    { code: "ControlLeft", span: 5, label: "ctrl", ghost: true },
    { code: "AltLeft", span: 5, label: "opt", ghost: true },
    { code: "MetaLeft", span: 6, label: "cmd", ghost: true },
    { code: "Space", span: 14, finger: "thumb" },
    { code: "MetaRight", span: 6, label: "cmd", ghost: true },
    { code: "AltRight", span: 5, label: "opt", ghost: true },
    { code: "ArrowLeft", span: 4, label: "left", ghost: true },
    { code: "ArrowDown", span: 5, label: "down", ghost: true },
    { code: "ArrowRight", span: 5, label: "right", ghost: true },
  ],
];

export function scriptOf(ch: string): "cyr" | "lat" | null {
  if (/^[a-zA-Z]$/.test(ch)) return "lat";
  if (/^[а-яА-ЯёЁË]$/.test(ch)) return "cyr";
  return null;
}

export function keyFace(layout: LayoutId, spec: KeySpec, target: string | null): string {
  const hit = target ? resolveChar(layout, target) : null;
  if (hit && hit.code === spec.code && target && target !== " " && target !== "\n") {
    return target;
  }
  if (spec.label) return spec.label;
  const leg = legends(layout)[spec.code];
  if (!leg || leg.base === " ") return "";
  if (/^[a-zа-яё]$/i.test(leg.base)) return leg.base.toLocaleUpperCase("ru");
  return leg.base;
}
