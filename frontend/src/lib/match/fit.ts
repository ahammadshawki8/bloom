import { deltaE2000, describeDeltaE } from "@/lib/color";
import { wornLab } from "./index";
import type { FaceShape, Passport, Style, Variant } from "@/lib/types";

// Fit metrics shown after a try-on. Every number says where it came from:
// measured on this phone, measured by a YouCam API, or a stated styling rule.

// --- Face shape (YouCam Face Analyzer) x style, using common wig-fitter guidance ---

interface FaceRule {
  base: number;
  score: (s: Style) => number;
  why: string;
}

const isLongish = (s: Style) => s.length === "medium" || s.length === "long";

const RULES: Record<FaceShape, FaceRule> = {
  Oval: { base: 88, score: () => 0, why: "Balanced proportions suit most lengths and textures." },
  Round: {
    base: 60,
    score: (s) => (isLongish(s) ? 18 : -5) + (s.bangs ? 6 : 0),
    why: "Length below the chin and side-swept bangs draw the face gently longer.",
  },
  Square: {
    base: 60,
    score: (s) => (s.texture === "wavy" ? 18 : 0) + (s.bangs ? 8 : 0) + (isLongish(s) ? 6 : -6),
    why: "Soft waves and bangs soften a strong jawline.",
  },
  Heart: {
    base: 64,
    score: (s) => (s.length === "medium" ? 18 : s.length === "long" ? 4 : -4) + (s.bangs ? 6 : 0),
    why: "Chin-to-shoulder lengths add fullness near the jaw to balance a wider brow.",
  },
  InvTriangle: {
    base: 64,
    score: (s) => (s.length === "medium" ? 18 : 0) + (s.bangs ? 6 : 0),
    why: "Fullness around the jaw balances wider cheekbones and brow.",
  },
  Oblong: {
    base: 58,
    score: (s) => (s.bangs ? 18 : 0) + (s.texture === "wavy" ? 10 : 0) + (s.length === "long" && s.texture !== "wavy" ? -12 : 0),
    why: "Bangs and side volume shorten a longer face.",
  },
  Diamond: { base: 62, score: (s) => (s.bangs ? 14 : 0) + (s.length === "medium" ? 10 : 0), why: "Bangs and chin-length softness balance high cheekbones." },
  Triangle: {
    base: 60,
    score: (s) => (s.texture === "wavy" ? 14 : 0) + (s.length === "short" || s.length === "medium" ? 8 : -8),
    why: "Volume on top balances a wider jaw.",
  },
};

export function faceFit(shape: FaceShape | undefined, style: Style): { score: number; why: string } {
  if (!shape || !(shape in RULES)) return { score: 70, why: "Add a face analysis to your passport to see how this shape frames your face." };
  const rule = RULES[shape];
  return { score: Math.max(0, Math.min(98, rule.base + rule.score(style))), why: rule.why };
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
