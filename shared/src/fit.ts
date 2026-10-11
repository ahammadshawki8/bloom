import { deltaE2000, describeDeltaE } from "./color";
import { wornLab } from "./match";
import type { FaceShape, Passport, Style, Variant } from "./types";

// Fit metrics shown after a try-on. Every number says where it came from:
// measured on this phone, measured by a YouCam API, or a stated styling rule.

// --- Face shape (YouCam Face Analyzer) x style, using common wig-fitter guidance ---

interface Helper {
  applies: (s: Style) => boolean;
  points: number;
  says: string;
}
interface FaceRule {
  base: number;
  helpers: Helper[];
  /** What a fitter would suggest when none of the helpers apply. */
  advice: string;
}

const isLongish = (s: Style) => s.length === "medium" || s.length === "long";
const wavy = (s: Style) => s.texture === "wavy";
const bangs = (s: Style) => !!s.bangs;

const RULES: Record<FaceShape, FaceRule> = {
  Oval: { base: 88, helpers: [], advice: "balanced proportions suit most lengths and textures" },
  Round: {
    base: 55,
    helpers: [
      { applies: isLongish, points: 18, says: "length below the chin draws the face gently longer" },
      { applies: bangs, points: 6, says: "side-swept bangs add angles" },
    ],
    advice: "styles past the chin tend to flatter a round face more",
  },
  Square: {
    base: 54,
    helpers: [
      { applies: wavy, points: 18, says: "soft waves soften the jawline" },
      { applies: bangs, points: 8, says: "bangs soften the brow line" },
      { applies: isLongish, points: 6, says: "length past the jaw balances its width" },
    ],
    advice: "soft waves or bangs would soften a square jaw",
  },
  Heart: {
    base: 60,
    helpers: [
      { applies: (s) => s.length === "medium", points: 18, says: "chin-to-shoulder length adds fullness near the jaw" },
      { applies: bangs, points: 6, says: "bangs balance a wider brow" },
    ],
    advice: "chin-to-shoulder lengths usually balance a heart shape",
  },
  InvTriangle: {
    base: 60,
    helpers: [
      { applies: (s) => s.length === "medium", points: 18, says: "fullness around the jaw balances wider cheekbones" },
      { applies: bangs, points: 6, says: "bangs soften the brow" },
    ],
    advice: "fullness around the jaw usually balances this shape",
  },
  Oblong: {
    base: 58,
    helpers: [
      { applies: bangs, points: 18, says: "bangs shorten a longer face" },
      { applies: wavy, points: 10, says: "waves add width at the sides" },
    ],
    advice: "bangs or side volume usually flatter a longer face",
  },
  Diamond: {
    base: 60,
    helpers: [
      { applies: bangs, points: 14, says: "bangs widen the brow line" },
      { applies: (s) => s.length === "medium", points: 10, says: "chin-length softness balances high cheekbones" },
    ],
    advice: "bangs and chin-length softness suit a diamond shape",
  },
  Triangle: {
    base: 58,
    helpers: [
      { applies: wavy, points: 14, says: "volume on top balances a wider jaw" },
      { applies: (s) => s.length === "short" || s.length === "medium", points: 8, says: "a shorter length keeps the eye upward" },
    ],
    advice: "volume on top usually balances a wider jaw",
  },
};

const sentence = (parts: string[]) => {
  const t = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
  return t[0].toUpperCase() + t.slice(1) + ".";
};

/** Face-shape fit, explained only with features this style actually has. */
export function faceFit(shape: FaceShape | undefined, style: Style): { score: number; why: string } {
  if (!shape || !(shape in RULES)) return { score: 70, why: "Add a face analysis to your passport to see how this shape frames your face." };
  const rule = RULES[shape];
  const hits = rule.helpers.filter((h) => h.applies(style));
  const score = Math.max(0, Math.min(98, rule.base + hits.reduce((n, h) => n + h.points, 0)));
  return { score, why: sentence(hits.length ? hits.map((h) => h.says) : [rule.advice]) };
}

// --- Length (YouCam Hair Length Detection) ---

const LENGTH_TERMS = [
  ["above the ears", "Above the ears"],
  ["ear length", "Around the ears"],
  ["ear length or longer", "Ear length or longer"],
  ["short hair", "Short, above the shoulders"],
  ["short hair or longer", "Shoulder length or longer"],
  ["above chest", "Down to the collarbone"],
  ["above chest or longer", "Collarbone or longer"],
  ["long hair", "Long, past the chest"],
] as const;
const RANK: Record<string, number> = {
  "above the ears": 0,
  "ear length": 1,
  "ear length or longer": 1.5,
  "short hair": 2,
  "short hair or longer": 3,
  "above chest": 4,
  "above chest or longer": 4.5,
  "long hair": 5,
};

export const lengthWords = (term: string) => LENGTH_TERMS.find(([t]) => t === term)?.[1] ?? term;

export function compareLength(render: string, hers: string): "shorter" | "same" | "longer" {
  const a = RANK[render] ?? 3;
  const b = RANK[hers] ?? 3;
  return Math.abs(a - b) < 0.75 ? "same" : a < b ? "shorter" : "longer";
}

// --- Brows (YouCam Face Analyzer brow shape -> makeup VTO preset) ---

export function browPresetFor(shape: string | undefined): string {
  switch (shape) {
    case "Soft Angled":
      return "brow--soft-arch";
    case "Hard Angled":
      return "brow--high-arch";
    case "Straight":
      return "brow--straight";
    case "Rounded":
      return "brow--curved";
    default:
      return "brow--soft-arch";
  }
}

// --- The report ---

export interface FitMetric {
  key: "colour" | "face" | "length";
  label: string;
  value: number; // 0..100, higher = better fit
  display: string;
  detail: string;
  source: string;
}

export interface FitReport {
  overall: number;
  metrics: FitMetric[];
}

export function fitReport(passport: Passport, style: Style, variant: Variant, renderedDeltaE?: number | null): FitReport {
  const dE = renderedDeltaE ?? deltaE2000(passport.hair.lab, wornLab(variant));
  const words = describeDeltaE(dE);
  const colour: FitMetric = {
    key: "colour",
    label: "Colour",
    value: Math.max(0, Math.round(100 - dE * 4)),
    display: words.label,
    detail: `ΔE ${dE.toFixed(1)} from your natural colour`,
    source: renderedDeltaE != null ? "Measured on the try-on, on this phone" : "From the product's measured colour",
  };

  const ff = faceFit(passport.face?.shape, style);
  const face: FitMetric = {
    key: "face",
    label: "Face shape",
    value: ff.score,
    display: passport.face
      ? `${ff.score >= 80 ? "Flattering" : ff.score >= 65 ? "Works well" : "A bolder choice"} for ${passport.face.shape.toLowerCase()}`
      : "Not analysed yet",
    detail: ff.why,
    source: passport.face ? "YouCam Face Analyzer + fitter guidance" : "Needs a face analysis",
  };

  let lengthValue = 70;
  let lengthDisplay = "Not measured";
  let lengthDetail = "Hair length is read by YouCam on the try-on.";
  if (variant.renderLength) {
    lengthDisplay = lengthWords(variant.renderLength);
    if (passport.hairLengthTerm) {
      const cmp = compareLength(variant.renderLength, passport.hairLengthTerm);
      lengthValue = cmp === "same" ? 92 : 68;
      lengthDetail = cmp === "same" ? "About the same length as your own hair." : `${cmp === "shorter" ? "Shorter" : "Longer"} than your own hair.`;
    } else {
      lengthDetail = "Measured on the try-on.";
    }
  } else if (style.kind === "wig") {
    lengthDetail = "YouCam couldn't read the length on this render (lighting).";
  }
  const length: FitMetric = {
    key: "length",
    label: "Length on you",
    value: lengthValue,
    display: lengthDisplay,
    detail: lengthDetail,
    source: "YouCam Hair Length Detection, on the try-on",
  };

  const overall = Math.round(colour.value * 0.45 + face.value * 0.35 + length.value * 0.2);
  return { overall, metrics: [colour, face, length] };
}
