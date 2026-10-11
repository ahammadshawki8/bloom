import { describe, expect, it } from "vitest";
import { closestVariant, rankLooks } from "./index";
import { hexToLab } from "@/lib/color";
import type { Passport, Style, Variant } from "@/lib/types";

const v = (id: string, hex: string): Variant => ({ id, colorName: id, hex, lab: hexToLab(hex), image: "", refImageUrl: "", price: 200 });

const styles: Style[] = [
  { id: "short-a", kind: "wig", name: "A", retailer: "r", url: "", finalSale: false, length: "short", texture: "straight", variants: [v("a-dark", "#2b1e18"), v("a-brown", "#5f4129"), v("a-blonde", "#d3b98a")] },
  { id: "medium-b", kind: "wig", name: "B", retailer: "r", url: "", finalSale: false, length: "medium", texture: "straight", variants: [v("b-brown", "#62432b"), v("b-red", "#8a3b22")] },
  { id: "medium-c", kind: "wig", name: "C", retailer: "r", url: "", finalSale: false, length: "medium", texture: "wavy", variants: [v("c-silver", "#b0aaa4")] },
  { id: "wrap", kind: "wrap", name: "W", retailer: "r", url: "", finalSale: false, variants: [v("w-pink", "#f1a7c0")] },
];

const passport: Passport = {
  id: "p",
  createdAt: "",
  isDemo: true,
  photo: "",
  hair: { hex: "#5e4028", lab: hexToLab("#5e4028"), name: "", confidence: 1 },
  length: "medium",
  texture: "straight",
};

describe("closestVariant", () => {
  it("picks the variant nearest her colour", () => {
    expect(closestVariant(passport, styles[0]).variant.id).toBe("a-brown");
  });
});

describe("rankLooks", () => {
  it("in match mode puts same-colour, same-length, same-texture first", () => {
    const ranked = rankLooks(passport, styles, "match");
    expect(ranked[0].variant.id).toBe("b-brown");
    expect(ranked[0].reasons.join(" ")).toMatch(/length/i);
  });

  it("ignores wraps", () => {
    expect(rankLooks(passport, styles, "match").some((r) => r.style.kind === "wrap")).toBe(false);
  });

  it("returns one look per style", () => {
    const ids = rankLooks(passport, styles, "match").map((r) => r.style.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("in new mode prefers a clear but not extreme change", () => {
    const ranked = rankLooks(passport, styles, "new");
    expect(ranked[0].deltaE).toBeGreaterThan(6);
  });
});
