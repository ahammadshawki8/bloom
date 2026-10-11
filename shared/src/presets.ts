import type { BrowPreset } from "./types";

export const BROW_PRESETS: BrowPreset[] = [
  { id: "brow--soft-arch", label: "Soft arch", description: "A gentle lift that suits most faces" },
  { id: "brow--straight", label: "Straight", description: "Calm and youthful, low arch" },
  { id: "brow--curved", label: "Rounded", description: "Soft curve, friendly and open" },
  { id: "brow--high-arch", label: "High arch", description: "More lift, a little more drama" },
];

export const LASH_PRESETS: BrowPreset[] = [
  { id: "lash--natural", label: "Natural", description: "Your own lashes, a little fuller" },
  { id: "lash--full", label: "Fuller", description: "Soft density along the lash line" },
  { id: "lash--wispy", label: "Wispy", description: "Fluttery, for days you want more" },
];
