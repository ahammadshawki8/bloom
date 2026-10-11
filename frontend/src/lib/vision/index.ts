"use client";

import type { FaceDetector, ImageSegmenter } from "@mediapipe/tasks-vision";
import { medianLab, labToHex, nameHairColour, rgbToLab } from "@/lib/color";
import type { HairColour, Lab } from "@/lib/types";
import type { FaceObservation } from "./framing";

// Everything here runs in the browser. Photos never leave the device to be
// framed or measured. Assets are self-hosted in /public (no CDN at runtime).

type Source = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

let visionPromise: Promise<typeof import("@mediapipe/tasks-vision")> | null = null;
let filesetPromise: Promise<unknown> | null = null;
let detectorPromise: Promise<FaceDetector> | null = null;
let videoDetectorPromise: Promise<FaceDetector> | null = null;
let segmenterPromise: Promise<ImageSegmenter> | null = null;

const lib = () => (visionPromise ??= import("@mediapipe/tasks-vision"));
async function fileset() {
  const { FilesetResolver } = await lib();
  return (filesetPromise ??= FilesetResolver.forVisionTasks("/mediapipe/wasm"));
}

function makeDetector(mode: "IMAGE" | "VIDEO") {
  return (async () => {
    const { FaceDetector } = await lib();
    return FaceDetector.createFromOptions((await fileset()) as never, {
      baseOptions: { modelAssetPath: "/models/blaze_face_short_range.tflite" },
      runningMode: mode,
      minDetectionConfidence: 0.5,
    });
  })();
}

const imageDetector = () => (detectorPromise ??= makeDetector("IMAGE"));
const videoDetector = () => (videoDetectorPromise ??= makeDetector("VIDEO"));

function hairSegmenter() {
  return (segmenterPromise ??= (async () => {
    const { ImageSegmenter } = await lib();
    return ImageSegmenter.createFromOptions((await fileset()) as never, {
      baseOptions: { modelAssetPath: "/models/hair_segmenter.tflite" },
      runningMode: "IMAGE",
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    });
  })());
}

/** Start loading models early (e.g. as the capture screen opens). */
export function warmUpVision() {
  void videoDetector().catch(() => {});
  void imageDetector().catch(() => {});
}

function sizeOf(src: Source) {
  if (src instanceof HTMLVideoElement) return { width: src.videoWidth, height: src.videoHeight };
  if (src instanceof HTMLImageElement) return { width: src.naturalWidth, height: src.naturalHeight };
  return { width: src.width, height: src.height };
}

/** Largest face with eye/nose keypoints, in source pixels. */
export async function observeFace(src: Source, videoTime?: number): Promise<FaceObservation | null> {
  const { width, height } = sizeOf(src);
  if (!width || !height) return null;
  const det = videoTime !== undefined ? await videoDetector() : await imageDetector();
  const res = videoTime !== undefined ? det.detectForVideo(src, videoTime) : det.detect(src);
  const best = [...(res.detections ?? [])].sort((a, b) => (b.boundingBox?.width ?? 0) - (a.boundingBox?.width ?? 0))[0];
  if (!best?.boundingBox) return null;
  const k = best.keypoints ?? [];
  // BlazeFace keypoints: 0 right eye, 1 left eye, 2 nose tip (normalised, subject's perspective)
  const pt = (i: number) => ({ x: (k[i]?.x ?? 0.5) * width, y: (k[i]?.y ?? 0.5) * height });
  const [a, b] = [pt(0), pt(1)];
  const [leftEye, rightEye] = a.x < b.x ? [a, b] : [b, a];
  const bb = best.boundingBox;
  return { box: { x: bb.originX, y: bb.originY, width: bb.width, height: bb.height }, leftEye, rightEye, nose: pt(2) };
}

const scratch = () => document.createElement("canvas");

/** Mean luma (0..255) of a region of the source. */
export function brightness(src: Source, region?: { x: number; y: number; width: number; height: number }): number {
  const { width, height } = sizeOf(src);
  const r = region ?? { x: 0, y: 0, width, height };
  const c = scratch();
  c.width = 48;
  c.height = 48;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx || !r.width || !r.height) return 128;
  ctx.drawImage(src, r.x, r.y, r.width, r.height, 0, 0, 48, 48);
  const d = ctx.getImageData(0, 0, 48, 48).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  return sum / (d.length / 4);
}

/** Draw the source to a canvas no larger than `max` on its long side. */
export function toCanvas(src: Source, max = 1024, mirror = false): HTMLCanvasElement {
  const { width, height } = sizeOf(src);
  const s = Math.min(1, max / Math.max(width, height));
  const c = scratch();
  c.width = Math.round(width * s);
  c.height = Math.round(height * s);
  const ctx = c.getContext("2d")!;
  if (mirror) {
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/**
 * Measures natural hair colour: segment hair pixels with MediaPipe, convert each
 * to CIELAB, take the median. Confidence = share of hair pixels within ΔE*ab 12
 * of the median (a robust, explainable agreement score).
 */
export async function measureHairColour(src: Source): Promise<HairColour | null> {
  const canvas = toCanvas(src, 512);
  const seg = await hairSegmenter();
  const result = seg.segment(canvas);
  const masks = result.confidenceMasks ?? [];
  const mask = masks[masks.length - 1]; // last channel = hair
  if (!mask) return null;
  const m = mask.getAsFloat32Array();
  const mw = mask.width;
  const mh = mask.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  // Only pixels the model is very sure are hair: avoids skin, background and fly-aways.
  let threshold = 0.9;
  const collect = (t: number) => {
    const out: Lab[] = [];
    const step = Math.max(1, Math.floor((mw * mh) / 40000));
    for (let i = 0; i < m.length; i += step) {
      if (m[i] < t) continue;
      const x = Math.floor(((i % mw) / mw) * canvas.width);
      const y = Math.floor((Math.floor(i / mw) / mh) * canvas.height);
      const o = (y * canvas.width + x) * 4;
      const lab = rgbToLab(px[o], px[o + 1], px[o + 2]);
      if (lab[0] > 92 || lab[0] < 4) continue; // specular highlights and deep shadow
      out.push(lab);
    }
    return out;
  };
  let samples = collect(threshold);
  if (samples.length < 300) samples = collect((threshold = 0.6));
  masks.forEach((mk) => mk.close());
  result.close?.();
  if (samples.length < 200) return null;
  const med = medianLab(samples);
  const near = samples.filter((s) => Math.hypot(s[0] - med[0], s[1] - med[1], s[2] - med[2]) < 15).length;
  const rounded: Lab = [Number(med[0].toFixed(2)), Number(med[1].toFixed(2)), Number(med[2].toFixed(2))];
  return { lab: rounded, hex: labToHex(rounded), name: nameHairColour(rounded), confidence: Number((near / samples.length).toFixed(2)), samples: samples.length };
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __bloomVision: unknown }).__bloomVision = { measureHairColour, observeFace };
}
