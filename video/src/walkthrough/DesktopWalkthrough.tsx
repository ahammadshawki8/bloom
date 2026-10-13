import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import timings from "../../public/audio/timings.json";
import { Captions, type Cue } from "../components/Caption";
import { C, FPS, SANS, loadBloomFonts, sec, studio } from "../theme";
import { Reel, reelFrames } from "./Phone";
import { DESK, type DeskScene } from "./desktopScenes";

loadBloomFonts();

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const glide = Easing.bezier(0.65, 0, 0.35, 1);

export const DESK_LAYOUT = (() => {
  let at = 0;
  return DESK.map((s) => {
    const frames = reelFrames(s.segments, FPS);
    const item = { scene: s, from: at, frames };
    at += frames;
    return item;
  });
})();
export const DESK_FRAMES = DESK_LAYOUT.reduce((n, s) => n + s.frames, 0);

// The browser window: the capture at 75% of the frame.
const WIN = { w: 1440, h: 810, left: 240, top: 168 };

function focusAt(s: DeskScene, t: number) {
  const f = s.focus;
  const times = f.map((k) => k.at);
  const pick = (key: "scale" | "x" | "y") => (f.length === 1 ? f[0][key] : interpolate(t, times, f.map((k) => k[key]), { ...clamp, easing: glide }));
  return { scale: pick("scale"), x: pick("x"), y: pick("y") };
}

const Chip: React.FC<{ label: string; kind?: "youcam" | "tool" | "fact"; show: number }> = ({ label, kind = "fact", show }) => {
  const youcam = kind === "youcam";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 18px",
        borderRadius: 999,
        fontFamily: SANS,
        fontSize: 22,
        fontWeight: 600,
        whiteSpace: "nowrap",
        color: youcam ? C.ivory : C.mulberry,
        background: youcam ? C.mulberry : kind === "tool" ? "#e7e1f0" : C.roseWash,
        opacity: show,
        translate: `0px ${(1 - show) * 12}px`,
      }}
    >
      {youcam && <span style={{ width: 9, height: 9, borderRadius: 99, background: C.rose }} />}
      {label}
    </div>
  );
};

/** The browser chrome: three dots and the live address, so it reads as the real site. */
const Chrome: React.FC = () => (
  <div style={{ height: 40, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", background: "#f1e8e2", borderBottom: `1px solid ${C.line}` }}>
    <div style={{ display: "flex", gap: 8 }}>
      {["#e3b5b0", "#e8d3a6", "#bcccb5"].map((c) => (
        <span key={c} style={{ width: 12, height: 12, borderRadius: 99, background: c }} />
      ))}
    </div>
    <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
      <div style={{ padding: "5px 18px", borderRadius: 999, background: C.paper, fontFamily: SANS, fontSize: 16, color: C.mulberrySoft }}>bloom-nourinrichi2026-9069.vercel.app</div>
    </div>
    <div style={{ width: 52 }} />
  </div>
);

export const DesktopWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Math.max(0, DESK_LAYOUT.findIndex((l) => frame >= l.from && frame < l.from + l.frames));
  const cur = DESK_LAYOUT[idx];
  const local = frame - cur.from;
  const t = local / fps;
  const f = focusAt(cur.scene, t);
  const pull = Math.min(1, (f.scale - 1) / 0.3);
  const live = cur.scene.live ? interpolate(t, [cur.scene.live[0], cur.scene.live[0] + 0.3, cur.scene.live[1] - 0.3, cur.scene.live[1]], [0, 1, 1, 0], clamp) : 0;
  const prevTitle = DESK_LAYOUT[idx - 1]?.scene.title;
  const titleIn = prevTitle === cur.scene.title ? 1 : interpolate(local, [2, 18], [0, 1], { ...clamp, easing: ease });

  const cues: Cue[] = DESK_LAYOUT.flatMap((l) =>
    l.scene.vo.flatMap((v) =>
      (timings as Record<string, { start: number; end: number; text: string }[]>)[v.id].map((s) => ({
        from: l.from + sec(v.at + s.start),
        to: l.from + sec(v.at + s.end) + 4,
        text: s.text,
      })),
    ),
  );

  return (
    <AbsoluteFill style={{ background: C.ivory, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 20% 15%, ${C.roseWash} 0%, rgba(244,222,220,0) 45%), radial-gradient(circle at 85% 90%, #f7ebcb 0%, rgba(247,235,203,0) 40%)`,
          opacity: 0.8,
        }}
      />

      {/* the live site in a browser window; close-ups push into the moment that matters */}
      <div
        style={{
          position: "absolute",
          left: WIN.left,
          top: WIN.top - 40,
          width: WIN.w,
          height: WIN.h + 40,
          scale: f.scale,
          // the focus point lands exactly on the frame's centre (960, 540)
          translate: `${-(f.x - 0.5) * WIN.w * f.scale * pull}px ${(-(f.y - 0.5) * WIN.h * f.scale - (WIN.top + WIN.h / 2 - 540)) * pull}px`,
          transformOrigin: `50% ${((WIN.h / 2 + 40) / (WIN.h + 40)) * 100}%`,
          borderRadius: 18,
          overflow: "hidden",
          background: C.paper,
          boxShadow: "0 50px 110px -40px rgba(67,41,58,0.5), 0 14px 34px -16px rgba(67,41,58,0.3)",
        }}
      >
        <Chrome />
        <div style={{ position: "relative", width: WIN.w, height: WIN.h }}>
          {DESK_LAYOUT.map((l) => (
            <Sequence key={l.scene.id} from={l.from} durationInFrames={l.frames} layout="absolute-fill" name={l.scene.id}>
              <Reel src={l.scene.src} segments={l.scene.segments} />
            </Sequence>
          ))}
        </div>
      </div>

      {/* header: a soft band keeps it legible when the window pushes in beneath it */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${C.ivory} 0%, rgba(251,246,242,0.92) 9%, rgba(251,246,242,0) 15%)`,
          opacity: interpolate(f.scale, [1, 1.15], [0, 1], clamp),
        }}
      />
      <div style={{ position: "absolute", left: WIN.left, right: 1920 - WIN.left - WIN.w, top: 42, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ ...studio, fontSize: 56, lineHeight: 1, color: C.mulberry, opacity: titleIn, translate: `0px ${(1 - titleIn) * 18}px`, whiteSpace: "nowrap" }}>
          {cur.scene.title}
        </div>
        {cur.scene.note && (
          <div style={{ padding: "8px 16px", borderRadius: 999, background: C.paper, fontFamily: SANS, fontSize: 20, fontWeight: 600, color: C.mulberrySoft, opacity: interpolate(local, [6, 18], [0, 1], clamp) }}>
            {cur.scene.note}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {live > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", borderRadius: 999, background: "#7a2f3b", color: C.ivory, fontFamily: SANS, fontSize: 22, fontWeight: 600, opacity: live }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: "#f1958f", boxShadow: "0 0 0 5px rgba(241,149,143,0.3)" }} />
              Live YouCam API call
            </div>
          )}
          {(cur.scene.chips ?? []).map((c) => (
            <Chip
              key={c.label}
              label={c.label}
              kind={c.kind}
              show={interpolate(local, [sec(c.at ?? 0), sec(c.at ?? 0) + 12], [0, 1], { ...clamp, easing: ease }) * interpolate(local, [cur.frames - 8, cur.frames], [1, 0], clamp)}
            />
          ))}
        </div>
      </div>

      <Captions cues={cues} tone="dark" area={{ left: 0, right: 0, bottom: 26 }} />

      <Audio
        src={staticFile("audio/music-discover.mp3")}
        trimBefore={sec(42.5) - 15}
        volume={(fr) => interpolate(fr, [0, 15, 40, DESK_FRAMES - 30, DESK_FRAMES], [0, 0.36, 0.17, 0.17, 0.3], clamp)}
      />
      {DESK_LAYOUT.flatMap((l) =>
        l.scene.vo.map((v) => (
          <Sequence key={v.id} from={l.from + sec(v.at)} layout="none" name={`VO ${v.id}`}>
            <Audio src={staticFile(`audio/${v.id}.mp3`)} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};
