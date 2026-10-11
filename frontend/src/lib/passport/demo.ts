import { hexToLab, nameHairColour } from "@/lib/color";
import type { Passport } from "@/lib/types";

// Real YouCam results for the sample face (public/fixtures/demo/analysis.json):
// Face Attributes & Ratio Analyzer + Hair Length Detection, run 2026-10-11.

// The sample face from the YouCam docs. Its hair colour was measured from the
// photo by the same on-device pipeline a real passport uses (MediaPipe hair
// segmentation + median CIELAB).
const DEMO_HAIR_HEX = "#493321";

export function demoPassport(): Passport {
  const lab = hexToLab(DEMO_HAIR_HEX);
  return {
    id: "demo",
    createdAt: new Date().toISOString(),
    isDemo: true,
    photo: "/fixtures/demo/face.webp",
    hair: { hex: DEMO_HAIR_HEX, lab, name: nameHairColour(lab), confidence: 0.82, samples: 11651 },
    length: "medium",
    texture: "straight",
    curl: { code: "1b", label: "Straight with soft body" },
    density: 3,
    browHex: "#4a3426",
    face: { shape: "Square", browShape: "Soft Angled", browThickness: "Average", eyeShape: "Almond", cheekbones: "Flat Cheekbone" },
    hairLengthTerm: "short hair or longer",
  };
}
