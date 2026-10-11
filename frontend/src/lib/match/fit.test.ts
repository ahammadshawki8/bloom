import { describe, expect, it } from "vitest";
import { browPresetFor, compareLength, faceFit, fitReport, lengthWords } from "./fit";
import { hexToLab } from "@/lib/color";
import type { Passport, Style } from "@/lib/types";

const wig = (o: Partial<Style>): Style => ({ id: "s", kind: "wig", name: "S", retailer: "r", url: "", finalSale: false, variants: [], ...o });

describe("faceFit", () => {
  it("favours soft waves and bangs for a square face", () => {
    const wavy = faceFit("Square", wig({ length: "medium", texture: "wavy", bangs: true }));
    const blunt = faceFit("Square", wig({ length: "short", texture: "straight", bangs: false }));
    expect(wavy.score).toBeGreaterThan(blunt.score);
    expect(wavy.why).toMatch(/soften/i);
  });

  it("treats an oval face as suiting most styles", () => {
    expect(faceFit("Oval", wig({ length: "short", texture: "straight" })).score).toBeGreaterThanOrEqual(80);
  });

  it("prefers length below the chin for a round face", () => {
    expect(faceFit("Round", wig({ length: "long" })).score).toBeGreaterThan(faceFit("Round", wig({ length: "short" })).score);
  });

  it("stays neutral when the face shape is unknown", () => {
    expect(faceFit(undefined, wig({ length: "short" })).score).toBe(70);
  });
});

describe("length", () => {
  it("puts YouCam terms into plain words", () => {
    expect(lengthWords("short hair or longer")).toMatch(/shoulder/i);
    expect(lengthWords("ear length")).toMatch(/ears/i);
  });

  it("compares a render's length to her own", () => {
    expect(compareLength("short hair", "short hair or longer")).toBe("shorter");
    expect(compareLength("short hair or longer", "short hair or longer")).toBe("same");
    expect(compareLength("long hair", "short hair")).toBe("longer");
  });
});

describe("browPresetFor", () => {
  it("maps her natural brow shape to the closest preset", () => {
    expect(browPresetFor("Soft Angled")).toBe("brow--soft-arch");
    expect(browPresetFor("Hard Angled")).toBe("brow--high-arch");
    expect(browPresetFor("Straight")).toBe("brow--straight");
    expect(browPresetFor("Rounded")).toBe("brow--curved");
  });
});

describe("fitReport", () => {
  it("combines colour, face, length and reports sources", () => {
    const passport: Passport = {
      id: "p",
      createdAt: "",
      isDemo: true,
      photo: "",
      hair: { hex: "#493321", lab: hexToLab("#493321"), name: "", confidence: 1 },
      face: { shape: "Square", browShape: "Soft Angled", browThickness: "Average", eyeShape: "Almond", cheekbones: "Flat Cheekbone" },
      hairLengthTerm: "short hair or longer",
    };
    const style = wig({ length: "medium", texture: "wavy", bangs: true });
    const variant = {
      id: "v",
      colorName: "c",
      hex: "#4a3527",
      lab: hexToLab("#4a3527"),
      image: "",
      refImageUrl: "",
      price: 1,
      renderLength: "short hair or longer",
    };
    const r = fitReport(passport, style, variant, 1.2);
    expect(r.metrics.map((m) => m.key)).toEqual(["colour", "face", "length"]);
    expect(r.overall).toBeGreaterThan(70);
    expect(r.metrics.find((m) => m.key === "length")?.source).toMatch(/YouCam/);
  });
});
