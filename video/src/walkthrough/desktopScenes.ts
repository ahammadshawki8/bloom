import type { Segment } from "./Phone";

export interface Focus {
  /** Seconds into the scene. */
  at: number;
  scale: number;
  /** The point of the capture to bring to the centre, as fractions of its width and height. */
  x: number;
  y: number;
}

export interface DeskScene {
  id: string;
  src: string;
  segments: Segment[];
  vo: { id: string; at: number }[];
  title: string;
  chips?: { label: string; at?: number; kind?: "youcam" | "tool" | "fact" }[];
  live?: [number, number];
  note?: string;
  focus: Focus[];
}

const D = "walkthrough-desktop";
const wide = (at: number): Focus => ({ at, scale: 1, x: 0.5, y: 0.5 });

// Captures: DEVICE=desktop node tools/capture-walkthrough.mjs (live site, 1920 x 1080).
// Each scene ends on a held moment (about two seconds) before the next begins.
export const DESK: DeskScene[] = [
  {
    id: "passport",
    src: `${D}/passport.mp4`,
    segments: [
      { from: 0.6, to: 2.3 },
      { from: 2.3, to: 9.3 },
      { from: 9.3, to: 12.0 },
      { from: 33.0, to: 43.4 },
    ],
    vo: [
      { id: "w1-passport", at: 0.4 },
      { id: "w2-reading", at: 10.6 },
    ],
    title: "Hair Passport",
    chips: [
      { label: "Colour measured on the device", at: 12.4, kind: "fact" },
      { label: "YouCam AI Face Analyzer", at: 15.2, kind: "youcam" },
      { label: "YouCam AI Hair Length Detection", at: 16.0, kind: "youcam" },
    ],
    live: [8.6, 11.4],
    focus: [wide(0), wide(13.0), { at: 14.2, scale: 1.45, x: 0.585, y: 0.5 }, { at: 19.4, scale: 1.45, x: 0.585, y: 0.5 }, wide(20.6)],
  },
  {
    id: "tryon",
    src: `${D}/tryon.mp4`,
    segments: [
      { from: 0.5, to: 4.5 },
      { from: 16.2, to: 30.5 },
    ],
    vo: [
      { id: "w3-tryon", at: 0.4 },
      { id: "w4-check", at: 10.0 },
    ],
    title: "Fitting room",
    chips: [
      { label: "YouCam AI Hairstyle (Hair Transfer)", at: 2.6, kind: "youcam" },
      { label: "Colour checked on the finished render", at: 12.6, kind: "fact" },
    ],
    live: [2.2, 5.5],
    focus: [wide(0), wide(11.8), { at: 13.0, scale: 1.6, x: 0.2, y: 0.85 }, { at: 16.6, scale: 1.6, x: 0.2, y: 0.85 }, wide(17.8)],
  },
  {
    id: "new",
    src: `${D}/tryon.mp4`,
    segments: [
      { from: 30.6, to: 34.0 },
      { from: 47.6, to: 52.2 },
    ],
    vo: [{ id: "w5-new", at: 0.4 }],
    title: "Try anything",
    chips: [{ label: "Many wigs are final sale", at: 0.8, kind: "fact" }],
    focus: [wide(0)],
  },
  {
    id: "layers",
    src: `${D}/layers.mp4`,
    segments: [
      { from: 1.8, to: 4.2 },
      { from: 10.4, to: 15.0 },
      { from: 25.6, to: 28.4 },
      { from: 43.8, to: 49.9 },
    ],
    vo: [{ id: "w6-layers", at: 0.4 }],
    title: "Wraps, brows and lashes",
    chips: [
      { label: "YouCam AI Hairstyle: head wraps", at: 2.6, kind: "youcam" },
      { label: "YouCam AI Makeup VTO: brows and lashes", at: 7.4, kind: "youcam" },
    ],
    focus: [wide(0)],
  },
  {
    id: "guide",
    src: `${D}/guide.mp4`,
    segments: [
      { from: 2.0, to: 4.9 },
      { from: 4.9, to: 13.8, rate: 1.8 },
      { from: 13.8, to: 18.8 },
    ],
    vo: [{ id: "w7-guide", at: 0.4 }],
    title: "Bloom guide",
    chips: [
      { label: "get_passport", at: 3.2, kind: "tool" },
      { label: "search_styles", at: 3.8, kind: "tool" },
      { label: "fit_report", at: 4.6, kind: "tool" },
      { label: "shortlist", at: 7.8, kind: "tool" },
    ],
    note: "AI agent",
    focus: [wide(0), wide(2.6), { at: 3.8, scale: 1.35, x: 0.5, y: 0.56 }, { at: 12.0, scale: 1.35, x: 0.5, y: 0.56 }, wide(13.2)],
  },
  {
    id: "together",
    src: `${D}/together.mp4`,
    segments: [{ from: 1.5, to: 13.3, rate: 1.5 }],
    vo: [{ id: "w8-together", at: 0.6 }],
    title: "Choose together",
    focus: [wide(0)],
  },
  {
    id: "family",
    src: `${D}/family.mp4`,
    segments: [{ from: 1.0, to: 9.6, rate: 1.4 }],
    vo: [],
    title: "Choose together",
    note: "Mum, on her own device",
    focus: [wide(0)],
  },
  {
    id: "decision",
    src: `${D}/decision.mp4`,
    segments: [{ from: 1.0, to: 13.1, rate: 1.15 }],
    vo: [{ id: "w9-decision", at: 0.4 }],
    title: "Her choice",
    chips: [{ label: "Straight to the store", at: 2.2, kind: "fact" }],
    focus: [wide(0)],
  },
];
