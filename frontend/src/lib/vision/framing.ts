// Framing rules for a passport photo. They mirror what the YouCam hair-transfer
// API needs: one face, the whole head with hair visible, shoulders in frame,
// face roughly straight (roll within ±15°, yaw within ±45°), reasonable light.

export interface Point {
  x: number;
  y: number;
}

export interface FaceObservation {
  box: { x: number; y: number; width: number; height: number };
  leftEye: Point;
  rightEye: Point;
  nose: Point;
}

export type FramingCode = "no_face" | "too_close" | "too_far" | "off_centre" | "head_cut" | "tilted" | "turned" | "too_dark" | "too_bright";

export interface FramingIssue {
  code: FramingCode;
  message: string;
}

export interface FramingResult {
  ok: boolean;
  issues: FramingIssue[];
}

const MESSAGES: Record<FramingCode, string> = {
  no_face: "Let's find your face. Look toward the screen.",
  too_close: "Step back a little so we can see your shoulders.",
  too_far: "Come a little closer.",
  off_centre: "Move into the middle of the mirror.",
  head_cut: "Tilt the phone up a touch so all your hair is in view.",
  tilted: "Keep your head level.",
  turned: "Look straight at the screen.",
  too_dark: "Find a little more light, facing a window works well.",
  too_bright: "The light is very bright. Try stepping out of direct sun.",
};

/** Pure framing check. `brightness` is mean luma 0..255 of the face area. */
export function checkFraming(face: FaceObservation | null, frame: { width: number; height: number }, brightness: number): FramingResult {
  const issues: FramingIssue[] = [];
  const add = (code: FramingCode) => issues.push({ code, message: MESSAGES[code] });

  if (!face) {
    add("no_face");
    return { ok: false, issues };
  }

  const { box } = face;
  const widthRatio = box.width / frame.width;
  const cx = (box.x + box.width / 2) / frame.width;

  if (widthRatio > 0.48 || box.y + box.height > frame.height * 0.78) add("too_close");
  else if (widthRatio < 0.16) add("too_far");
  if (cx < 0.3 || cx > 0.7) add("off_centre");
  // Hair above the forehead needs room: about 40% of a face height above the box.
  if (box.y < box.height * 0.35) add("head_cut");

  const roll = (Math.atan2(face.rightEye.y - face.leftEye.y, face.rightEye.x - face.leftEye.x) * 180) / Math.PI;
  if (Math.abs(roll) > 14) add("tilted");
  const eyeMid = (face.leftEye.x + face.rightEye.x) / 2;
  const eyeGap = Math.abs(face.rightEye.x - face.leftEye.x) || 1;
  if (Math.abs(face.nose.x - eyeMid) / eyeGap > 0.32) add("turned");

  if (brightness < 70) add("too_dark");
  else if (brightness > 225) add("too_bright");

  return { ok: issues.length === 0, issues };
}
