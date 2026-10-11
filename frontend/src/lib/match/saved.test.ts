import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { asksAboutSaved, cleanSaved, colourFamilyOf, honoursRequest, planWithRules, savedLooks, searchStyles, whyContradicts, type GuideEvent, type SavedLookInput, type Style } from "@/lib/types";
import { demoPassport } from "@/lib/passport/demo";

const styles = (JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/fixtures/catalog.json"), "utf8")) as { styles: Style[] }).styles;
const passport = demoPassport();

const saved: SavedLookInput[] = [
  { result_id: "r_wrap", kind: "wrap", variant_id: "bamboo-turban--black", votes_up: 3 },
  { result_id: "r_far", kind: "wig", variant_id: "kelly-short-wig--sandy-silver" },
  { result_id: "r_combo", kind: "combo", variant_id: "tracy-short-wig--ginger-brown", brow_id: "brow--straight", lash_id: "lash--wispy", votes_up: 2, votes_down: 1 },
];

const picksOf = (events: GuideEvent[]) => events.find((e): e is Extract<GuideEvent, { type: "picks" }> => e.type === "picks");

describe("saved looks in the guide", () => {
  it("recognises questions about saved looks", () => {
    expect(asksAboutSaved("i have 3 looks saved. which one suits me better?")).toBe(true);
    expect(asksAboutSaved("Which of my saved looks suits me best?")).toBe(true);
    expect(asksAboutSaved("I like long blonde hair")).toBe(false);
  });

  it("ranks wigs by fit and keeps a wrap without inventing a score", () => {
    const rows = savedLooks(styles, passport, saved);
    expect(rows.map((r) => r.result_id).slice(0, 2)).toEqual(
      [...rows.filter((r) => r.fit !== null)].sort((a, b) => b.fit! - a.fit!).map((r) => r.result_id).slice(0, 2),
    );
    const wrap = rows.find((r) => r.result_id === "r_wrap")!;
    expect(wrap.fit).toBeNull();
    expect(wrap.family_votes.love).toBe(3);
    const combo = rows.find((r) => r.result_id === "r_combo")!;
    expect(combo.layers[0]).toMatch(/^Tracy/);
    expect(combo.layers.slice(1)).toEqual(["Straight brows", "Wispy lashes"]);
    expect(combo.fit).toBeGreaterThan(0);
  });

  it("answers from her saved looks, linking each pick to its render", () => {
    const picks = picksOf(planWithRules("which one suits me better?", passport, styles, saved))!;
    expect(picks.picks).toHaveLength(3);
    expect(picks.picks.every((p) => p.result_id)).toBe(true);
    expect(picks.note).toMatch(/Of your 3 saved looks/);
  });

  it("says so when nothing is saved", () => {
    const picks = picksOf(planWithRules("which of my saved looks suits me?", passport, styles, []))!;
    expect(picks.picks).toHaveLength(0);
    expect(picks.note).toMatch(/haven't saved/);
  });

  it("catches reasons that claim features the style doesn't have", () => {
    const diana = styles.find((s) => s.id === "diana-lf-long-wig")!; // straight, with bangs
    const jenna = styles.find((s) => s.id === "jenna-long-wig")!; // straight, no bangs
    expect(whyContradicts(diana, "A new colour with soft waves that suit a square face")).toBe(true);
    expect(whyContradicts(diana, "Long and sleek, with bangs that soften the brow")).toBe(false);
    expect(whyContradicts(jenna, "The fringe frames your eyes")).toBe(true);
    expect(whyContradicts(jenna, "Close to your colour, with no fringe to manage")).toBe(false);
    // ΔE 28 from her natural colour is not "very close".
    expect(whyContradicts(jenna, "Very close to your desired colour (ΔE 28.1)", 28.1)).toBe(true);
    expect(whyContradicts(jenna, "Very close to your colour (ΔE 2.4)", 2.4)).toBe(false);
  });

  it("treats a named colour as a filter and holds picks to it", () => {
    const rows = searchStyles(styles, passport, { kind: "wig", length: "long", colour_family: "blonde" });
    expect(rows.map((r) => r.variant_id).sort()).toEqual(["diana-lf-long-wig--creamy-toast", "jenna-long-wig--frosted-taupe", "rochelle-long-wig--creamy-blond"]);
    const jenna = styles.find((s) => s.id === "jenna-long-wig")!;
    const cappucino = jenna.variants.find((v) => v.id === "jenna-long-wig--cappucino")!;
    expect(colourFamilyOf(cappucino)).toBe("brown");
    expect(honoursRequest("I like long blonde hair", jenna, cappucino)).toBe(false);
    expect(honoursRequest("something long", jenna, cappucino)).toBe(true);
  });

  it("drops malformed entries from the request", () => {
    expect(cleanSaved([{ result_id: "a", kind: "wig" }, { kind: "wig" }, { result_id: "b", kind: "hat" }, null]).map((s) => s.result_id)).toEqual(["a"]);
    expect(cleanSaved("nope")).toEqual([]);
  });
});
