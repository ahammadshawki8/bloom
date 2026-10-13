import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Bloom's own tokens, copied from frontend/src/app/globals.css so the film and
// the product read as one thing.
export const C = {
  ivory: "#fbf6f2",
  ivoryDeep: "#f3eae3",
  paper: "#fffdfb",
  mulberry: "#43293a",
  mulberrySoft: "#6b5261",
  mulberryFaint: "#b9a8b1",
  line: "#eadfd9",
  rose: "#c98e8e",
  roseDeep: "#8f4f57",
  roseWash: "#f4dedc",
  sage: "#8fa08a",
  night: "#22141d",
} as const;

export const SERIF = "Fraunces";
export const SANS = "Figtree";

// The landing page's display setting ("type-atelier").
export const atelier = {
  fontFamily: SERIF,
  fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 0',
  fontWeight: 330,
  letterSpacing: "-0.022em",
} as const;

// The studio's softer setting ("type-studio").
export const studio = {
  fontFamily: SERIF,
  fontVariationSettings: '"opsz" 60, "SOFT" 100, "WONK" 0',
  fontWeight: 470,
  letterSpacing: "-0.012em",
} as const;

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);

let fontsLoaded = false;
export function loadBloomFonts() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  // Variable fonts from the website's own build (frontend/.next/static/media).
  loadFont({ family: SERIF, url: staticFile("fonts/Fraunces.woff2"), weight: "100 900", style: "normal" });
  loadFont({ family: SERIF, url: staticFile("fonts/Fraunces-Italic.woff2"), weight: "100 900", style: "italic" });
  loadFont({ family: SANS, url: staticFile("fonts/Figtree.woff2"), weight: "300 900", style: "normal" });
}
