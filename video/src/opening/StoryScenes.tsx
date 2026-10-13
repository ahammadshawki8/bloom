import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Shot } from "../components/Shot";
import { Film } from "../components/Film";
import { C, SANS } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Grades move with the story: cold and drained in loss, warming as she gets
// ready, golden at the table, soft and clear when she feels like herself.
const COLD = "saturate(0.35) contrast(1.08) brightness(0.8) sepia(0.08) hue-rotate(-8deg)";
const THAW = "saturate(0.6) contrast(1.04) brightness(0.92) sepia(0.12)";
const WARM = "saturate(0.95) contrast(1.05) brightness(0.92) sepia(0.18)";
const SOFT = "saturate(0.8) contrast(1.02) brightness(1.02) sepia(0.1)";

/** A small, honest label: whose story this is, and that the footage is illustrative. */
const SourceNote: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 70,
        fontFamily: SANS,
        fontSize: 22,
        lineHeight: 1.5,
        color: "rgba(251,246,242,0.78)",
        opacity: interpolate(frame, [from, from + 18, to - 18, to], [0, 1, 1, 0], clamp),
      }}
    >
      Renita&apos;s story, shared with Macmillan Cancer Support
      <br />
      <span style={{ color: "rgba(251,246,242,0.5)" }}>Illustrative footage</span>
    </div>
  );
};

export const LossScene: React.FC = () => (
  <Shot src="stock/loss-portrait.mp4" start={0.2} rate={0.82} grade={COLD} push={[1.0, 1.1]} origin="50% 30%" fadeIn={30}>
    <Film vignette={0.8} grain={0.09} />
    <SourceNote from={40} to={200} />
  </Shot>
);

export const StrangerScene: React.FC = () => (
  // She stops, and looks down. The camera drifts toward her reflection.
  <Shot src="stock/mirror-headscarf.mp4" start={7.0} rate={0.8} grade={COLD} push={[1.08, 1.2]} origin="30% 40%">
    <Film vignette={0.7} grain={0.08} />
  </Shot>
);

export const ReadyScene: React.FC = () => (
  // Lipstick, then the first small smile.
  <Shot src="stock/lipstick-mirror.mp4" start={2.2} rate={0.9} grade={THAW} push={[1.1, 1.18]} origin="28% 40%">
    <Film vignette={0.55} grain={0.07} />
  </Shot>
);

export const ChristmasScene: React.FC = () => (
  <Shot src="stock/christmas-dinner.mp4" start={7.6} rate={0.85} grade={WARM} push={[1.02, 1.1]} origin="55% 45%">
    <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 30%, rgba(255,190,110,0.18) 0%, rgba(255,190,110,0) 60%)" }} />
    <Film vignette={0.5} grain={0.07} />
  </Shot>
);

export const HerselfScene: React.FC = () => (
  <Shot src="stock/flowers-serene.mp4" start={8.6} rate={0.8} grade={SOFT} push={[1.05, 1.13]} origin="55% 35%" fadeOut={14}>
    <Film vignette={0.45} grain={0.06} />
  </Shot>
);

/**
 * 30–35 s: she looks at her phone. The camera pushes into the screen, and its
 * light opens into Bloom's ivory, carrying us into the product.
 */
export const QuestionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const glow = interpolate(frame, [durationInFrames - 34, durationInFrames - 4], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0) });
  return (
    <Shot src="stock/phone-resting.mp4" start={1.0} rate={0.85} grade={THAW} push={[1.05, 1.7]} origin="45% 58%" fadeIn={10}>
      <Film vignette={0.55} grain={0.07} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 45% 58%, ${C.ivory} 0%, ${C.ivory} ${glow * 60}%, rgba(251,246,242,0) ${glow * 60 + 25}%)`,
          opacity: glow > 0 ? 1 : 0,
        }}
      />
    </Shot>
  );
};
