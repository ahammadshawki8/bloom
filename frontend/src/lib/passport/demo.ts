import { hexToLab, nameHairColour } from "@/lib/color";
import type { Passport } from "@/lib/types";

// The sample face from the YouCam docs. Its hair colour was measured from the
// photo (median of side-hair pixels), the same way a real passport is measured.
const DEMO_HAIR_HEX = "#5e4028";

export function demoPassport(): Passport {
  const lab = hexToLab(DEMO_HAIR_HEX);
  return {
    id: "demo",
    createdAt: new Date().toISOString(),
    isDemo: true,
    photo: "/fixtures/demo/face.webp",
    hair: { hex: DEMO_HAIR_HEX, lab, name: nameHairColour(lab), confidence: 0.86 },
    length: "medium",
    texture: "straight",
    curl: { code: "1b", label: "Straight with soft body" },
    density: 3,
    browHex: "#4a3426",
  };
}
