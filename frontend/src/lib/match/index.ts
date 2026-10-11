import { deltaE2000, describeDeltaE } from "@/lib/color";
import type { Passport, Style, Variant } from "@/lib/types";

export type MatchMode = "match" | "new";

/** How a variant reads when worn: measured on a render when we have one, else from the product photo. */
export const wornLab = (v: Variant) => v.renderLab ?? v.lab;

export interface RankedLook {
  style: Style;
  variant: Variant;
  deltaE: number;
  score: number;
  reasons: string[];
}

export function closestVariant(passport: Passport, style: Style): { variant: Variant; deltaE: number } {
  let best = style.variants[0];
  let bestDe = Infinity;
  for (const variant of style.variants) {
    const d = deltaE2000(passport.hair.lab, wornLab(variant));
    if (d < bestDe) {
      best = variant;
      bestDe = d;
    }
  }
  return { variant: best, deltaE: bestDe };
}

function reasonsFor(passport: Passport, style: Style, deltaE: number): string[] {
  const reasons = [`${describeDeltaE(deltaE).label} to your colour`];
  if (passport.length && style.length === passport.length) reasons.push(`Same length as yours`);
  if (passport.texture && style.texture === passport.texture) reasons.push(style.texture === "wavy" ? "Wavy, like yours" : "Straight, like yours");
  if (style.laceFront) reasons.push("Natural-looking hairline");
  return reasons;
}

/**
 * Ranks wig styles for a passport. Deterministic, explainable:
 * match mode = colour distance + small penalties for length/texture mismatch;
 * new mode   = closeness to a "clear but wearable" change (ΔE ≈ 14).
 */
export function rankLooks(passport: Passport, styles: Style[], mode: MatchMode): RankedLook[] {
  const looks: RankedLook[] = [];
  for (const style of styles) {
    if (style.kind !== "wig") continue;
    const lengthPenalty = passport.length && style.length !== passport.length ? 4 : 0;
    const texturePenalty = passport.texture && style.texture !== passport.texture ? 3 : 0;
    let pick: RankedLook | null = null;
    for (const variant of style.variants) {
      const deltaE = deltaE2000(passport.hair.lab, wornLab(variant));
      const score = mode === "match" ? deltaE + lengthPenalty + texturePenalty : Math.abs(deltaE - 14) + (lengthPenalty + texturePenalty) / 3;
      if (!pick || score < pick.score) pick = { style, variant, deltaE, score, reasons: [] };
    }
    if (pick) {
      pick.reasons = reasonsFor(passport, style, pick.deltaE);
      looks.push(pick);
    }
  }
  return looks.sort((a, b) => a.score - b.score);
}
