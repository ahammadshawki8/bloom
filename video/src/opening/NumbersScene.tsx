import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Shot } from "../components/Shot";
import { Film } from "../components/Film";
import { C, SANS, atelier, sec } from "../theme";
import { T, sentenceAt } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

// "In one study, it began just eighteen days..." The number lands on its word.
const START = sec(sentenceAt("s5-fast", 1) - T.fast.from);
const LAND = START + sec(2.2);

/** The turn: the warmth drains away, and one number says how little time there is. */
export const NumbersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [START, LAND], [0, 18], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  const track = interpolate(frame, [START, LAND], [0, 18 / 28], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const show = interpolate(frame, [START - 10, START + 8], [0, 1], clamp);

  return (
    <Shot src="stock/resting-iv.mp4" start={1.0} rate={0.75} grade="saturate(0.25) brightness(0.55) contrast(1.1)" push={[1.1, 1.18]} fadeIn={16}>
      <AbsoluteFill style={{ background: "rgba(34,20,29,0.55)", opacity: show }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: show }}>
        <div style={{ translate: interpolate(frame, [START - 10, START + 20], ["0px 40px", "0px -20px"], { ...clamp, easing: ease }), textAlign: "center" }}>
          <div style={{ ...atelier, fontSize: 300, lineHeight: 0.85, color: C.roseWash, fontVariantNumeric: "tabular-nums" }}>
            {n}
            <span style={{ fontSize: 120, marginLeft: 18, color: C.rose }}>days</span>
          </div>
          <div style={{ marginTop: 26, fontFamily: SANS, fontSize: 36, fontWeight: 500, color: C.ivory }}>from the first treatment to hair loss, on average</div>
          <div style={{ margin: "40px auto 0", width: 620 }}>
            <div style={{ position: "relative", height: 4, borderRadius: 4, background: "rgba(251,246,242,0.2)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${track * 100}%`, borderRadius: 4, background: C.rose }} />
              <div
                style={{
                  position: "absolute",
                  left: `calc(${track * 100}% - 10px)`,
                  top: -8,
                  width: 20,
                  height: 20,
                  borderRadius: 99,
                  background: C.roseWash,
                  boxShadow: "0 0 0 7px rgba(201,142,142,0.28)",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontFamily: SANS, fontSize: 22, color: C.mulberryFaint }}>
              <span>First treatment</span>
              <span>4 weeks</span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 70,
          fontFamily: SANS,
          fontSize: 22,
          color: "rgba(251,246,242,0.6)",
          opacity: show,
        }}
      >
        Watanabe et al., PLOS ONE, 2019. A survey of 1,478 breast cancer patients at 47 sites in Japan.
      </div>
      <Film vignette={0.7} grain={0.08} />
    </Shot>
  );
};
