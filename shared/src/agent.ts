// The Bloom guide's tools. Pure functions over the catalogue and the passport, so
// the same code powers the LLM agent on the server and the rule-based planner
// that runs when no model is available. The model plans; these tools decide the
// facts (colour distance, fit) deterministically.

import { deltaE2000, describeDeltaE } from "./color";
import { wornLab } from "./match";
import { browPresetFor, fitReport, lengthWords } from "./fit";
import { BROW_PRESETS, LASH_PRESETS } from "./presets";
import type { HairLength, HairTexture, Passport, Style, Variant } from "./types";

export type ColourFamily = "match" | "new" | "blonde" | "brown" | "black" | "red" | "grey";

export interface SearchArgs {
  kind?: "wig" | "wrap";
  length?: HairLength;
  texture?: HairTexture;
  bangs?: boolean;
  max_price?: number;
  colour_family?: ColourFamily;
  limit?: number;
}

export interface Candidate {
  variant_id: string;
  style_id: string;
  style: string;
  colour: string;
  kind: "wig" | "wrap";
  length?: HairLength;
  texture?: HairTexture;
  bangs?: boolean;
  price: number;
  delta_e: number | null;
}

function familyScore(v: Variant, family: ColourFamily, passport: Passport): number {
  const [L, a, b] = wornLab(v);
  const C = Math.hypot(a, b);
  const dE = deltaE2000(passport.hair.lab, wornLab(v));
  switch (family) {
    case "match":
      return dE;
    case "new":
      return Math.abs(dE - 14);
    case "blonde":
      return 100 - L + Math.max(0, 14 - b);
    case "black":
      return L;
    case "brown":
      return Math.abs(L - 28) + Math.max(0, a - 14);
    case "red":
      return 60 - a;
    case "grey":
      return C * 3 + Math.max(0, 55 - L);
  }
}

/** Catalogue search with optional filters, ordered by the requested colour family. */
export function searchStyles(styles: Style[], passport: Passport, args: SearchArgs): Candidate[] {
  const family = args.colour_family ?? "match";
  const rows: (Candidate & { score: number })[] = [];
  for (const s of styles) {
    if (args.kind && s.kind !== args.kind) continue;
    if (s.kind === "wig") {
      if (args.length && s.length !== args.length) continue;
      if (args.texture && s.texture !== args.texture) continue;
      // Only filter on bangs when asked for them; models often send false to mean "don't care".
      if (args.bangs === true && !s.bangs) continue;
    }
    for (const v of s.variants) {
      if (typeof args.max_price === "number" && args.max_price > 0 && v.price > args.max_price) continue;
      const isWig = s.kind === "wig";
      rows.push({
        variant_id: v.id,
        style_id: s.id,
        style: s.name,
        colour: v.colorName,
        kind: s.kind,
        length: s.length,
        texture: s.texture,
        bangs: s.bangs,
        price: v.price,
        delta_e: isWig ? Number(deltaE2000(passport.hair.lab, wornLab(v)).toFixed(1)) : null,
        score: isWig ? familyScore(v, family, passport) : 0,
      });
    }
  }
  rows.sort((x, y) => x.score - y.score);
  // one variant per style keeps the shortlist varied
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const { score: _score, ...r } of rows) {
    if (seen.has(r.style_id)) continue;
    seen.add(r.style_id);
    out.push(r);
    if (out.length >= (args.limit ?? 8)) break;
  }
  return out;
}

export function findVariantIn(styles: Style[], variantId: string): { style: Style; variant: Variant } | null {
  for (const style of styles) {
    const variant = style.variants.find((v) => v.id === variantId);
    if (variant) return { style, variant };
  }
  return null;
}

export interface FitSummary {
  variant_id: string;
  overall: number;
  colour: string;
  face_shape: string;
  length_on_her: string;
}

export function fitSummary(styles: Style[], passport: Passport, variantId: string): FitSummary | null {
  const f = findVariantIn(styles, variantId);
  if (!f) return null;
  if (f.style.kind !== "wig") return { variant_id: variantId, overall: 0, colour: "n/a (head wrap)", face_shape: "n/a", length_on_her: "n/a" };
  const r = fitReport(passport, f.style, f.variant);
  const m = Object.fromEntries(r.metrics.map((x) => [x.key, x]));
  return {
    variant_id: variantId,
    overall: r.overall,
    colour: `${m.colour.display} (${m.colour.detail})`,
    face_shape: `${m.face.display}. ${m.face.detail}`,
    length_on_her: f.variant.renderLength ? lengthWords(f.variant.renderLength) : "not measured",
  };
}

export function suggestBrowsAndLashes(passport: Passport) {
  const brow = BROW_PRESETS.find((p) => p.id === browPresetFor(passport.face?.browShape)) ?? BROW_PRESETS[0];
  const lash = passport.face?.eyeShape === "Round" ? LASH_PRESETS[1] : LASH_PRESETS[0];
  return {
    brow_preset: brow.id,
    brow_label: brow.label,
    lash_preset: lash.id,
    lash_label: lash.label,
    why: passport.face
      ? `Her natural brows read as ${passport.face.browShape.toLowerCase()}, so ${brow.label.toLowerCase()} recreates them most faithfully.`
      : "Without a face analysis, a soft arch is the gentlest starting point.",
  };
}

// --- Events the guide streams to the UI ---

export interface GuidePick {
  variant_id: string;
  style_id: string;
  title: string;
  why: string;
  overall?: number;
}

export type GuideEvent =
  | { type: "thinking"; text: string }
  | { type: "tool"; name: string; label: string; detail?: string }
  | { type: "picks"; picks: GuidePick[]; brows?: ReturnType<typeof suggestBrowsAndLashes>; note: string }
  | { type: "error"; text: string }
  | { type: "done"; planner: "llm" | "rules"; model?: string };

/** Turns a free-text request into search filters. Used by the rule-based planner. */
export function readIntent(prompt: string): SearchArgs & { wantsWraps: boolean; wantsBrows: boolean } {
  const p = prompt.toLowerCase();
  const args: SearchArgs & { wantsWraps: boolean; wantsBrows: boolean } = { wantsWraps: /wrap|turban|scarf|sleep|headwear/.test(p), wantsBrows: /brow|lash/.test(p) };
  if (/pixie|short|crop|low.?maint|summer|hot|easy/.test(p)) args.length = "short";
  else if (/shoulder|medium|bob|mid/.test(p)) args.length = "medium";
  else if (/\blong\b/.test(p)) args.length = "long";
  if (/wav|curl|soft wave|volume/.test(p)) args.texture = "wavy";
  else if (/straight|sleek/.test(p)) args.texture = "straight";
  if (/bang|fringe/.test(p)) args.bangs = true;
  const price = p.match(/(?:under|below|less than|max)\s*\$?(\d{2,4})/);
  if (price) args.max_price = Number(price[1]);
  if (/blond/.test(p)) args.colour_family = "blonde";
  else if (/\bred\b|copper|auburn|ginger/.test(p)) args.colour_family = "red";
  else if (/grey|gray|silver/.test(p)) args.colour_family = "grey";
  else if (/black|darker/.test(p)) args.colour_family = "black";
  else if (/new|different|change|bold|fun/.test(p)) args.colour_family = "new";
  else args.colour_family = "match";
  return args;
}

/** Rule-based planner: the same tools, called in a fixed order. Honest fallback when no LLM is configured. */
export function planWithRules(prompt: string, passport: Passport, styles: Style[]): GuideEvent[] {
  const events: GuideEvent[] = [];
  const intent = readIntent(prompt);
  const { wantsWraps, wantsBrows, ...search } = intent;
  events.push({ type: "thinking", text: "Reading your request and your hair passport." });
  events.push({
    type: "tool",
    name: "get_passport",
    label: "Checked your passport",
    detail: `${passport.hair.name}${passport.face ? `, ${passport.face.shape.toLowerCase()} face` : ""}${passport.hairLengthTerm ? `, ${lengthWords(passport.hairLengthTerm).toLowerCase()}` : ""}`,
  });

  let candidates = searchStyles(styles, passport, { ...search, kind: "wig", limit: 6 });
  const filters = [search.length, search.texture, search.bangs ? "bangs" : null, search.max_price ? `under $${search.max_price}` : null].filter(Boolean).join(", ");
  events.push({ type: "tool", name: "search_styles", label: `Searched wigs${filters ? ` (${filters})` : ""}`, detail: `${candidates.length} styles, ordered by ${search.colour_family === "match" ? "closeness to your colour" : `${search.colour_family} shades`}` });
  if (candidates.length < 3) {
    candidates = searchStyles(styles, passport, { kind: "wig", colour_family: search.colour_family, limit: 6 });
    events.push({ type: "tool", name: "search_styles", label: "Widened the search", detail: "Too few exact matches, so length and texture were relaxed" });
  }

  const scored = candidates.map((c) => ({ c, fit: fitSummary(styles, passport, c.variant_id)! }));
  for (const { c, fit } of scored.slice(0, 4)) events.push({ type: "tool", name: "fit_report", label: `Checked fit: ${c.style}, ${c.colour}`, detail: `${fit.overall}/100 · ${fit.colour}` });
  const top = scored.sort((a, b) => b.fit.overall - a.fit.overall).slice(0, wantsWraps ? 2 : 3);

  const picks: GuidePick[] = top.map(({ c, fit }) => ({
    variant_id: c.variant_id,
    style_id: c.style_id,
    title: `${c.style}, ${c.colour}`,
    overall: fit.overall,
    why: `${fit.colour.split(" (")[0]} to your colour; ${fit.face_shape.split(".")[0].toLowerCase()}.`,
  }));
  if (wantsWraps) {
    const wrap = searchStyles(styles, passport, { kind: "wrap", limit: 1 })[0];
    if (wrap) {
      events.push({ type: "tool", name: "search_styles", label: "Searched head wraps", detail: wrap.style });
      picks.push({ variant_id: wrap.variant_id, style_id: wrap.style_id, title: `${wrap.style}, ${wrap.colour}`, why: "Soft and easy for resting and sleeping days." });
    }
  }
  const brows = suggestBrowsAndLashes(passport);
  if (wantsBrows || passport.face) events.push({ type: "tool", name: "suggest_brows_and_lashes", label: "Matched brows and lashes", detail: `${brows.brow_label} brows, ${brows.lash_label.toLowerCase()} lashes` });
  events.push({ type: "picks", picks, brows, note: "Three looks to start with. Tap one to see it on you." });
  events.push({ type: "done", planner: "rules" });
  return events;
}

export const describeDistance = (dE: number) => describeDeltaE(dE).label;
