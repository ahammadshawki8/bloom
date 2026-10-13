import timings from "../../public/audio/timings.json";
import { sec } from "../theme";
import type { Cue } from "../components/Caption";

// The opening: Renita's story, the turn, and Bloom. Seconds, absolute from the
// start of the film. Each scene's voice line starts a beat after its picture.
export const T = {
  loss: { from: 0, to: 7.6, vo: 0.9 },
  stranger: { from: 7.6, to: 11.5, vo: 7.75 },
  ready: { from: 11.5, to: 14.6, vo: 11.7 },
  christmas: { from: 14.6, to: 19.1 },
  herself: { from: 19.1, to: 23.6, vo: 19.35 },
  fast: { from: 23.6, to: 30.5, vo: 23.8 },
  question: { from: 30.5, to: 35.0, vo: 30.65 },
  bloom: { from: 35.0, to: 42.5, vo: 35.35 },
} as const;

export const OPENING_SECONDS = 42.5;

type LineId = keyof typeof timings;
const VO: { id: LineId; at: number; tone: "light" | "dark" }[] = [
  { id: "s1-loss", at: T.loss.vo, tone: "light" },
  { id: "s2-stranger", at: T.stranger.vo, tone: "light" },
  { id: "s3-christmas", at: T.ready.vo, tone: "light" },
  { id: "s4-herself", at: T.herself.vo, tone: "light" },
  { id: "s5-fast", at: T.fast.vo, tone: "light" },
  { id: "s6-question", at: T.question.vo, tone: "light" },
  { id: "s7-bloom", at: T.bloom.vo, tone: "dark" },
];

export const voLines = VO.map((v) => ({ file: `audio/${v.id}.mp3`, from: sec(v.at) }));

/** Long sentences become two shorter cues, split at the comma nearest the middle. */
const MAX = 56;
function split(s: { start: number; end: number; text: string }) {
  if (s.text.length <= MAX) return [s];
  const commas = [...s.text.matchAll(/, /g)].map((m) => m.index!);
  if (!commas.length) return [s];
  const cut = commas.reduce((a, b) => (Math.abs(b - s.text.length / 2) < Math.abs(a - s.text.length / 2) ? b : a));
  const mid = s.start + ((s.end - s.start) * (cut + 1)) / s.text.length;
  return [
    { start: s.start, end: mid, text: s.text.slice(0, cut + 1) },
    { start: mid, end: s.end, text: s.text.slice(cut + 2) },
  ];
}

export const cues: (Cue & { tone: "light" | "dark" })[] = VO.flatMap((v) =>
  timings[v.id].flatMap(split).map((s, i, all) => ({
    from: sec(v.at + s.start),
    to: i < all.length - 1 ? sec(v.at + all[i + 1].start) : sec(v.at + s.end) + 4,
    text: s.text,
    tone: v.tone,
  })),
);

/** Absolute time (s) a sentence of a voice line starts. */
export const sentenceAt = (id: LineId, index: number) => {
  const v = VO.find((x) => x.id === id)!;
  return v.at + timings[id][index].start;
};
