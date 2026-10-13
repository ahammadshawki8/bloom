import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, SANS } from "../theme";

export interface Cue {
  /** Frames, absolute within the parent sequence. */
  from: number;
  to: number;
  text: string;
}

/** Burned-in captions: many judges watch muted. One line, low and quiet. */
export const Captions: React.FC<{ cues: Cue[]; tone?: "light" | "dark"; area?: { left: number; right: number; bottom: number } }> = ({ cues, tone = "light", area }) => {
  const frame = useCurrentFrame();
  const cue = cues.find((c) => frame >= c.from && frame < c.to);
  if (!cue) return null;
  const opacity = interpolate(frame, [cue.from, cue.from + 6, cue.to - 6, cue.to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const dark = tone === "dark";
  return (
    <div
      style={{
        position: "absolute",
        left: area?.left ?? 0,
        right: area?.right ?? 0,
        bottom: area?.bottom ?? 72,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          padding: "12px 26px",
          borderRadius: 999,
          fontFamily: SANS,
          fontSize: 38,
          fontWeight: 500,
          lineHeight: 1.25,
          textAlign: "center",
          color: dark ? C.mulberry : "#fff",
          background: dark ? "rgba(255,253,251,0.82)" : "rgba(20,10,16,0.42)",
          backdropFilter: "blur(6px)",
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};
