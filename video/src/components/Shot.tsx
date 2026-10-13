import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";

interface Props {
  src: string;
  /** Where in the source clip to start, in seconds. */
  start: number;
  /** Slower than 1 gives footage a calmer, more cinematic pace. */
  rate?: number;
  /** CSS filter used as the colour grade. */
  grade: string;
  /** Slow camera move: scale at the first and last frame of the shot. */
  push?: [number, number];
  origin?: string;
  /** Frames to fade up from black and down to black. */
  fadeIn?: number;
  fadeOut?: number;
  children?: React.ReactNode;
}

/** One graded story shot with a slow camera push. */
export const Shot: React.FC<Props> = ({ src, start, rate = 0.85, grade, push = [1.04, 1.12], origin = "50% 45%", fadeIn = 0, fadeOut = 0, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fade = Math.min(
    fadeIn ? interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) }) : 1,
    fadeOut ? interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], { extrapolateLeft: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) }) : 1,
  );
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: fade,
          transformOrigin: origin,
          scale: interpolate(frame, [0, durationInFrames], push, { easing: Easing.bezier(0.33, 0, 0.67, 1) }),
        }}
      >
        <Video
          src={staticFile(src)}
          muted
          trimBefore={Math.round(start * fps)}
          playbackRate={rate}
          objectFit="cover"
          style={{ width: "100%", height: "100%", filter: grade }}
        />
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
