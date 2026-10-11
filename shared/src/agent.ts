// The Bloom guide's tools. Pure functions over the catalogue and the passport, so
// the same code powers the LLM agent on the server and the rule-based planner
// that runs when no model is available. The model plans; these tools decide the
// facts (colour distance, fit) deterministically.

import { deltaE2000, describeDeltaE } from "./color";
import { wornLab } from "./match";
import { browPresetFor, fitReport, lengthWords } from "./fit";
import { BROW_PRESETS, LASH_PRESETS } from "./presets";
import type { HairLength, HairTexture, Passport, ResultKind, Style, Variant } from "./types";

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

/**
 * Which named colour family a wig's measured colour belongs to. Thresholds are
 * read off the catalogue's measured Lab values (see tools/build_catalog.py).
 */
export function colourFamilyOf(v: Variant): "blonde" | "grey" | "red" | "black" | "brown" {
  const [L, a, b] = wornLab(v);
  if (L >= 50 && b >= 14) return "blonde";
  if (L >= 38 && b < 14) return "grey";
  if (a >= 12) return "red";
  if (L <= 12) return "black";
  return "brown";
}

const NAMED_FAMILIES = ["blonde", "brown", "black", "red", "grey"] as const;
const isNamedFamily = (f: ColourFamily | undefined): f is (typeof NAMED_FAMILIES)[number] => (NAMED_FAMILIES as readonly string[]).includes(f ?? "");

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
      // A named colour ("blonde") is a filter, not just an ordering.
      if (s.kind === "wig" && isNamedFamily(family) && colourFamilyOf(v) !== family) continue;
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

export function fitSummary(styles: Style[], passport: Passport, variantId: string, renderLength?: string): FitSummary | null {
  const f = findVariantIn(styles, variantId);
  if (!f) return null;
  if (f.style.kind !== "wig") return { variant_id: variantId, overall: 0, colour: "n/a (head wrap)", face_shape: "n/a", length_on_her: "n/a" };
  const variant = renderLength ? { ...f.variant, renderLength } : f.variant;
  const r = fitReport(passport, f.style, variant);
  const m = Object.fromEntries(r.metrics.map((x) => [x.key, x]));
  return {
    variant_id: variantId,
    overall: r.overall,
    colour: `${m.colour.display} (${m.colour.detail})`,
    face_shape: `${m.face.display}. ${m.face.detail}`,
    length_on_her: variant.renderLength ? lengthWords(variant.renderLength) : "not measured",
  };
}

/**
 * True when a model-written reason claims a feature the style doesn't have
 * (waves on a straight wig, bangs on one without). Such reasons are replaced
 * with one built from the facts.
 */
export function whyContradicts(style: Style, why: string, deltaE?: number | null): boolean {
  if (style.kind !== "wig") return /\b(wav|curl|bangs?|fringe)/i.test(why);
  const w = why.toLowerCase();
  // ΔE is distance from her natural colour; past ~10 it is not "close" or a "match".
  if (deltaE != null && deltaE > 10 && /\b(very close|close to|closest|matches|match to|near your)\b/.test(w)) return true;
  if (style.texture === "straight" && /\bwav|\bcurl/.test(w)) return true;
  if (style.texture === "wavy" && /\b(sleek|poker.?straight|straight)\b/.test(w)) return true;
  if (!style.bangs && /\b(bangs|fringe)\b/.test(w) && !/\bno (bangs|fringe)\b|without (bangs|a fringe)/.test(w)) return true;
  return false;
}

/** A factual reason for a catalogue pick, from the fit report alone. */
export function factualWhy(styles: Style[], passport: Passport, variantId: string): string {
  const f = findVariantIn(styles, variantId);
  if (!f) return "";
  if (f.style.kind !== "wig") return "A soft head wrap for resting and sleeping days.";
  const fit = fitSummary(styles, passport, variantId)!;
  return `${fit.colour.split(" (")[0]} to your colour; ${fit.face_shape.split(".")[0].toLowerCase()}.`;
}

// --- Her saved looks ---

/** A saved look as the app sends it: only ids and counts, never the photo. */
export interface SavedLookInput {
  result_id: string;
  kind: ResultKind;
  /** The wig or wrap variant (for wig, wrap and layered looks). */
  variant_id?: string;
  brow_id?: string;
  lash_id?: string;
  render_length?: string;
  shelf?: "keep" | "maybe";
  votes_up?: number;
  votes_down?: number;
}

export interface SavedLookRow {
  result_id: string;
  title: string;
  kind: "wig" | "wrap" | "brows and lashes";
  layers: string[];
  /** Fit score 0-100; only wigs have one (colour and face fit need hair). */
  fit: number | null;
  colour: string | null;
  face_shape: string | null;
  length_on_her: string | null;
  price: number | null;
  shelf: "keep" | "maybe";
  family_votes: { love: number; not_for_me: number };
}

/** Cleans what the app sent: well-formed entries only, a sensible cap. */
export function cleanSaved(raw: unknown): SavedLookInput[] {
  if (!Array.isArray(raw)) return [];
  const str = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length < 120 ? v : undefined);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.min(999, Math.round(v)) : 0);
  const kinds: ResultKind[] = ["wig", "wrap", "brow", "lash", "combo"];
  return raw
    .slice(0, 30)
    .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {}))
    .filter((r) => str(r.result_id) && kinds.includes(r.kind as ResultKind))
    .map((r) => ({
      result_id: str(r.result_id)!,
      kind: r.kind as ResultKind,
      variant_id: str(r.variant_id),
      brow_id: str(r.brow_id),
      lash_id: str(r.lash_id),
      render_length: str(r.render_length),
      shelf: r.shelf === "maybe" ? "maybe" : "keep",
      votes_up: num(r.votes_up),
      votes_down: num(r.votes_down),
    }));
}

/** Her saved looks with the same fit facts the fitting room shows, best fit first. */
export function savedLooks(styles: Style[], passport: Passport, saved: SavedLookInput[]): SavedLookRow[] {
  const rows = saved.map((s): SavedLookRow => {
    const hair = s.variant_id ? findVariantIn(styles, s.variant_id) : null;
    const brow = s.brow_id ? BROW_PRESETS.find((p) => p.id === s.brow_id) : undefined;
    const lash = s.lash_id ? LASH_PRESETS.find((p) => p.id === s.lash_id) : undefined;
    const layers = [hair && `${hair.style.name}, ${hair.variant.colorName}`, brow && `${brow.label} brows`, lash && `${lash.label} lashes`].filter(Boolean) as string[];
    const fit = hair && hair.style.kind === "wig" ? fitSummary(styles, passport, hair.variant.id, s.render_length) : null;
    return {
      result_id: s.result_id,
      title: layers.length ? layers.join(" with ") : "A saved look",
      kind: hair ? hair.style.kind : "brows and lashes",
      layers,
      fit: fit?.overall ?? null,
      colour: fit?.colour ?? null,
      face_shape: fit?.face_shape ?? null,
      length_on_her: fit?.length_on_her ?? null,
      price: hair?.variant.price ?? null,
      shelf: s.shelf ?? "keep",
      family_votes: { love: s.votes_up ?? 0, not_for_me: s.votes_down ?? 0 },
    };
  });
  const net = (r: SavedLookRow) => r.family_votes.love - r.family_votes.not_for_me;
  return rows.sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1) || net(b) - net(a));
}

/** One plain sentence on why a saved look ranks where it does, from the facts only. */
export function savedWhy(r: SavedLookRow): string {
  const votes = r.family_votes.love + r.family_votes.not_for_me ? ` Family: ${r.family_votes.love} love, ${r.family_votes.not_for_me} not for me.` : "";
  if (r.fit !== null && r.colour && r.face_shape)
    return `Fit ${r.fit}/100: ${r.colour.split(" (")[0].toLowerCase()} to your colour; ${r.face_shape.split(".")[0].toLowerCase()}.${votes}`;
  if (r.kind === "wrap") return `A head wrap, so there's no colour or face-fit score.${votes}`;
  return `Brows and lashes on their own, with no hair to score.${votes}`;
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
  /** Set when the pick is one of her saved looks; the app opens that exact render. */
  result_id?: string;
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
/** True when a catalogue pick honours the colour and length she named. */
export function honoursRequest(prompt: string, style: Style, variant: Variant): boolean {
  if (style.kind !== "wig") return true;
  const wish = readIntent(prompt);
  if (isNamedFamily(wish.colour_family) && colourFamilyOf(variant) !== wish.colour_family) return false;
  if (wish.length && style.length !== wish.length) return false;
  return true;
}

/** True when she's asking about looks she already saved rather than for new ones. */
export function asksAboutSaved(prompt: string): boolean {
  return /\bsaved\b|my (looks|favou?rites|shortlist)|which (one|of (them|these|those|my))|suits? me (best|better|most)|best for me|compare|choose between|decide between/i.test(prompt);
}

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
export function planWithRules(prompt: string, passport: Passport, styles: Style[], saved: SavedLookInput[] = []): GuideEvent[] {
  if (asksAboutSaved(prompt)) return planSaved(passport, styles, saved);
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

/** Rule-based answer to "which of my saved looks suits me?". */
function planSaved(passport: Passport, styles: Style[], saved: SavedLookInput[]): GuideEvent[] {
  const events: GuideEvent[] = [{ type: "thinking", text: "Looking at the looks you saved." }];
  events.push({ type: "tool", name: "get_passport", label: "Checked your passport", detail: `${passport.hair.name}${passport.face ? `, ${passport.face.shape.toLowerCase()} face` : ""}` });
  const rows = savedLooks(styles, passport, saved);
  events.push({ type: "tool", name: "get_saved_looks", label: "Read your saved looks", detail: rows.length ? `${rows.length} saved, each scored for colour and face fit` : "None saved yet" });
  if (!rows.length) {
    events.push({ type: "picks", picks: [], note: "You haven't saved any looks yet. Try a few wigs or wraps, tap the heart on the ones you like, then ask me again." });
    events.push({ type: "done", planner: "rules" });
    return events;
  }
  const picks = rows.slice(0, 3).map((r) => savedPick(r, saved, savedWhy(r)));
  const best = rows[0];
  const note =
    best.fit !== null
      ? `Of your ${rows.length} saved looks, ${best.layers[0] ?? best.title} fits you best on colour and face shape.`
      : "None of your saved looks is a wig, so there's no fit score to compare. Here they are with your family's votes.";
  events.push({ type: "picks", picks, note });
  events.push({ type: "done", planner: "rules" });
  return events;
}

/** A guide pick that points at one of her saved renders. */
export function savedPick(r: SavedLookRow, saved: SavedLookInput[], why: string): GuidePick {
  const input = saved.find((s) => s.result_id === r.result_id);
  return {
    result_id: r.result_id,
    variant_id: input?.variant_id ?? input?.brow_id ?? input?.lash_id ?? r.result_id,
    style_id: r.kind,
    title: r.title,
    why,
    overall: r.fit ?? undefined,
  };
}
