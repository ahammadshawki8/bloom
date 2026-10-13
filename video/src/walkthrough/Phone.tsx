import React from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";

export interface Segment {
  /** Source seconds in the capture. */
  from: number;
  to: number;
  /** Playback speed for this segment (1 = real time). */
  rate?: number;
}

export const segmentFrames = (s: Segment, fps: number) => Math.round(((s.to - s.from) / (s.rate ?? 1)) * fps);
export const reelFrames = (segs: Segment[], fps: number) => segs.reduce((n, s) => n + segmentFrames(s, fps), 0);

/** Plays trimmed segments of one screen capture back to back. */
export const Reel: React.FC<{ src: string; segments: Segment[] }> = ({ src, segments }) => {
  const { fps } = useVideoConfig();
  let at = 0;
  return (
    <>
      {segments.map((s, i) => {
        const len = segmentFrames(s, fps);
        const from = at;
        at += len;
        return (
          <Sequence key={i} from={from} durationInFrames={len} layout="absolute-fill">
            <Video
              src={staticFile(src)}
              muted
              trimBefore={Math.round(s.from * fps)}
              trimAfter={Math.round(s.to * fps)}
              playbackRate={s.rate ?? 1}
              objectFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </Sequence>
        );
      })}
    </>
  );
};

export const SCREEN_W = 404;
export const SCREEN_H = Math.round(SCREEN_W * (2556 / 1178));

/** A plain modern phone: dark bezel, rounded screen, a small camera island. */
export const Phone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bezel = 14;
  return (
    <div
      style={{
        position: "relative",
        width: SCREEN_W + bezel * 2,
        height: SCREEN_H + bezel * 2,
        borderRadius: 68,
        background: "linear-gradient(145deg, #3a2d35 0%, #1c1419 55%, #2a2026 100%)",
        padding: bezel,
        boxShadow: "0 60px 120px -40px rgba(67,41,58,0.55), 0 20px 40px -20px rgba(67,41,58,0.35), inset 0 0 0 2px rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 54, overflow: "hidden", background: "#fbf6f2" }}>
        {children}
        <div style={{ position: "absolute", top: 12, left: "50%", translate: "-50% 0", width: 112, height: 32, borderRadius: 20, background: "#0d0a0c" }} />
      </div>
    </div>
  );
};
