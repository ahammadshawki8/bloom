import { describe, expect, it } from "vitest";
import { deltaE2000, hexToLab, labToHex, medianLab, nameHairColour, describeDeltaE } from "./index";

describe("hex <-> Lab", () => {
  it("converts white and black", () => {
    const w = hexToLab("#ffffff");
    expect(w[0]).toBeCloseTo(100, 0);
    expect(Math.abs(w[1])).toBeLessThan(0.5);
    expect(hexToLab("#000000")[0]).toBeCloseTo(0, 1);
  });

  it("round-trips a hair colour", () => {
    expect(labToHex(hexToLab("#6b4a35"))).toBe("#6b4a35");
  });
});

describe("deltaE2000", () => {
  // Reference pairs from Sharma, Wu & Dalal (2005)
  it.each([
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0],
    [[50, 2.5, 0], [50, 0, -2.5], 4.3065],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[90.8027, -2.0831, 1.441], [91.1528, -1.6435, 0.0447], 1.4441],
  ] as const)("matches the published value %#", (a, b, expected) => {
    expect(deltaE2000([...a], [...b])).toBeCloseTo(expected, 3);
  });

  it("is zero for identical colours", () => {
    expect(deltaE2000([40, 10, 20], [40, 10, 20])).toBe(0);
  });
});

describe("medianLab", () => {
  it("ignores outliers", () => {
    const m = medianLab([
      [30, 10, 20],
      [31, 11, 21],
      [32, 12, 22],
      [95, 0, 0],
    ]);
    expect(m[0]).toBeCloseTo(31.5, 5);
  });
});

describe("nameHairColour", () => {
  it("names common hair colours", () => {
    expect(nameHairColour(hexToLab("#2a1d17"))).toMatch(/espresso|black/i);
    expect(nameHairColour(hexToLab("#d8bf8a"))).toMatch(/blonde/i);
    expect(nameHairColour(hexToLab("#8a3b22"))).toMatch(/auburn|copper|red/i);
    expect(nameHairColour(hexToLab("#a9a49f"))).toMatch(/silver|grey/i);
    expect(nameHairColour(hexToLab("#6b4a35"))).toMatch(/brown|chestnut/i);
  });
});

describe("describeDeltaE", () => {
  it("uses plain words", () => {
    expect(describeDeltaE(1.2).label).toBe("Nearly identical");
    expect(describeDeltaE(4).label).toBe("Very close");
    expect(describeDeltaE(9).label).toBe("A gentle change");
    expect(describeDeltaE(20).label).toBe("Something new");
  });
});
