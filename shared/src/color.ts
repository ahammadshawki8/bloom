import type { Lab } from "./types";

// sRGB (D65) <-> CIELAB ----------------------------------------------------

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const XN = 0.95047;
const ZN = 1.08883;
const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
const fInv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));

export function rgbToLab(r: number, g: number, b: number): Lab {
  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / XN;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const z = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / ZN;
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labToRgb([L, a, b]: Lab): [number, number, number] {
  const fy = (L + 16) / 116;
  const x = fInv(fy + a / 500) * XN;
  const y = fInv(fy);
  const z = fInv(fy - b / 200) * ZN;
  const r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const bl = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  return [r, g, bl].map((c) => Math.max(0, Math.min(255, Math.round(fromLinear(c))))) as [number, number, number];
}

export function hexToLab(hex: string): Lab {
  const h = hex.replace("#", "");
  return rgbToLab(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
}

export function labToHex(lab: Lab): string {
  return (
    "#" +
    labToRgb(lab)
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

// CIEDE2000 (Sharma, Wu & Dalal 2005) --------------------------------------

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function deltaE2000([L1, a1, b1]: Lab, [L2, a2, b2]: Lab): number {
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = C1p === 0 ? 0 : (deg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = C2p === 0 ? 0 : (deg(Math.atan2(b2, a2p)) + 360) % 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
    else hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  }
  const T = 1 - 0.17 * Math.cos(rad(hbp - 30)) + 0.24 * Math.cos(rad(2 * hbp)) + 0.32 * Math.cos(rad(3 * hbp + 6)) - 0.2 * Math.cos(rad(4 * hbp - 63));
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

// Statistics ----------------------------------------------------------------

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function medianLab(samples: Lab[]): Lab {
  return [median(samples.map((s) => s[0])), median(samples.map((s) => s[1])), median(samples.map((s) => s[2]))];
}

// Words ---------------------------------------------------------------------

/** A friendly, hairdresser-style name for a hair colour. */
export function nameHairColour([L, a, b]: Lab): string {
  const C = Math.hypot(a, b);
  const warm = a > 14;
  if (C < 9 && L > 55) return L > 76 ? "Silver white" : "Soft silver";
  if (L < 22) return C > 6 ? "Espresso" : "Soft black";
  if (L < 35) return warm ? "Dark auburn" : "Dark chocolate brown";
  if (L < 50) return a > 15 ? "Auburn" : a > 11 && a / Math.max(b, 1) > 0.75 ? "Auburn brown" : C < 12 ? "Ash brown" : "Chestnut brown";
  if (L < 62) return warm ? "Copper" : C < 14 ? "Mushroom brown" : "Light brown";
  if (L < 72) return a > 12 ? "Strawberry blonde" : C < 16 ? "Ash blonde" : "Honey blonde";
  return C < 14 ? "Pale ash blonde" : b > 24 ? "Golden blonde" : "Light blonde";
}

export interface DeltaWords {
  label: string;
  sentence: string;
  tone: "match" | "close" | "gentle" | "new";
}

/** Turns a ΔE2000 value into plain language for the UI. */
export function describeDeltaE(dE: number): DeltaWords {
  if (dE < 2) return { label: "Nearly identical", sentence: "Most people wouldn't notice a difference from your own colour.", tone: "match" };
  if (dE < 6) return { label: "Very close", sentence: "Reads as your colour, a touch lighter or warmer up close.", tone: "close" };
  if (dE < 12) return { label: "A gentle change", sentence: "Noticeably different, but still in your family of shades.", tone: "gentle" };
  return { label: "Something new", sentence: "A clear change from your natural colour.", tone: "new" };
}
