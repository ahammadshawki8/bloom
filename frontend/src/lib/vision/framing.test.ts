import { describe, expect, it } from "vitest";
import { checkFraming } from "./framing";

const frame = { width: 1000, height: 1250 };
const eyes = (cx: number, y: number, gap = 90) => ({ leftEye: { x: cx - gap / 2, y }, rightEye: { x: cx + gap / 2, y }, nose: { x: cx, y: y + 60 } });

describe("checkFraming", () => {
  it("passes a centred head-and-shoulders photo", () => {
    const r = checkFraming({ box: { x: 380, y: 300, width: 260, height: 300 }, ...eyes(510, 400) }, frame, 140);
    expect(r.ok).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it("asks for a face when none is found", () => {
    const r = checkFraming(null, frame, 140);
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe("no_face");
  });

  it("asks to step back when the face is too big (shoulders cut off)", () => {
    const r = checkFraming({ box: { x: 200, y: 250, width: 600, height: 700 }, ...eyes(500, 500, 200) }, frame, 140);
    expect(r.issues.map((i) => i.code)).toContain("too_close");
  });

  it("asks to come closer when the face is tiny", () => {
    const r = checkFraming({ box: { x: 460, y: 300, width: 90, height: 110 }, ...eyes(505, 340, 32) }, frame, 140);
    expect(r.issues.map((i) => i.code)).toContain("too_far");
  });

  it("asks to centre", () => {
    const r = checkFraming({ box: { x: 30, y: 300, width: 260, height: 300 }, ...eyes(160, 400) }, frame, 140);
    expect(r.issues.map((i) => i.code)).toContain("off_centre");
  });

  it("flags a tilted head", () => {
    const r = checkFraming({ box: { x: 380, y: 300, width: 260, height: 300 }, leftEye: { x: 465, y: 380 }, rightEye: { x: 555, y: 430 }, nose: { x: 510, y: 470 } }, frame, 140);
    expect(r.issues.map((i) => i.code)).toContain("tilted");
  });

  it("flags dim light", () => {
    const r = checkFraming({ box: { x: 380, y: 300, width: 260, height: 300 }, ...eyes(510, 400) }, frame, 40);
    expect(r.issues.map((i) => i.code)).toContain("too_dark");
  });
});
