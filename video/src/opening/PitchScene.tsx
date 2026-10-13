import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ArchMirror, type Look } from "../components/ArchMirror";
import { Film } from "../components/Film";
import { C, SANS, atelier, studio } from "../theme";

// Real YouCam renders on the sample face (frontend/public/fixtures/tryon), plus
// one layered render (wig + brows + lashes) made live through Bloom's /stack.
const LOOKS: (Look & { name: string; swatch: string })[] = [
  { src: "renders/tracy-short-wig--copper-glaze.jpg", at: 0, name: "Tracy wig, copper glaze", swatch: "#8a4a2b" },
  { src: "renders/jenna-long-wig--cappucino.jpg", at: 13, name: "Jenna wig, cappucino", swatch: "#3b2a22" },
  { src: "renders/bamboo-turban--sage-green.jpg", at: 25, name: "Bamboo turban, sage", swatch: "#8fae9a" },
  { src: "renders/nina-medium-wig--creamy-blond.jpg", at: 37, name: "Nina wig, creamy blond", swatch: "#c9a676" },
  { src: "renders/floral-head-scarf--floral.jpg", at: 50, name: "Floral head scarf", swatch: "#c9a7a0" },
  { src: "renders/diana-lf-long-wig--copper-glaze.jpg", at: 64, name: "Diana wig, copper glaze", swatch: "#a5683d" },
  { src: "renders/tracy-copper-layered.jpg", at: 82, name: "Tracy wig, with brows and lashes", swatch: "#8a4a2b" },
];

const W = 500;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** 1.2: hard cut into light. One face, many looks, then the name. */
export const PitchScene: React.FC = () => {
  const frame = useCurrentFrame();
  const current = [...LOOKS].reverse().find((l) => l.at <= frame) ?? LOOKS[0];
  const words = "Choose your hair before treatment does.".split(" ");

  return (
    <AbsoluteFill style={{ background: C.ivory, overflow: "hidden" }}>
      {/* warm light falling on the vanity */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 68% 42%, ${C.roseWash} 0%, rgba(244,222,220,0) 55%), radial-gradient(circle at 15% 90%, #f7ebcb 0%, rgba(247,235,203,0) 45%)`,
          opacity: 0.9,
        }}
      />

      {/* the mirror: centred while the looks cascade, then it steps aside for the name */}
      <div
        style={{
          position: "absolute",
          top: 1080 / 2 - (W * 1.25) / 2 - 30,
          left: interpolate(frame, [96, 132], [960 - W / 2, 1180], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          scale: interpolate(frame, [0, 16], [0.94, 1], { extrapolateRight: "clamp", easing: ease }),
        }}
      >
        <ArchMirror width={W} looks={LOOKS} />
        {/* the swatch label, as on the landing page */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -34, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 24px 10px 10px",
              borderRadius: 999,
              background: C.paper,
              boxShadow: "0 18px 40px -16px rgba(67,41,58,0.35)",
              fontFamily: SANS,
              fontSize: 24,
              fontWeight: 500,
              color: C.mulberry,
            }}
          >
            <span style={{ width: 38, height: 38, borderRadius: 999, background: current.swatch, border: "3px solid #fff" }} />
            {current.name}
          </div>
        </div>
      </div>

      {/* the name */}
      <div style={{ position: "absolute", left: 190, top: 330, width: 900 }}>
        <div
          style={{
            ...atelier,
            fontSize: 190,
            lineHeight: 0.95,
            color: C.mulberry,
            opacity: interpolate(frame, [112, 134], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [112, 140], ["0px 40px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          }}
        >
          Bloom.
        </div>
        <div style={{ ...studio, marginTop: 34, fontSize: 60, lineHeight: 1.12, color: C.mulberry, maxWidth: 820 }}>
          {words.map((w, i) => {
            const start = 132 + i * 4;
            return (
              <span
                key={w + i}
                style={{
                  display: "inline-block",
                  marginRight: "0.26em",
                  opacity: interpolate(frame, [start, start + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                  translate: interpolate(frame, [start, start + 18], ["0px 22px", "0px 0px"], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: ease,
                  }),
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: SANS,
            fontSize: 26,
            color: C.mulberrySoft,
            opacity: interpolate(frame, [168, 186], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          Every look shown is a real YouCam try-on render.
        </div>
      </div>

      {/* arriving from the phone's light: ivory clears to reveal the mirror */}
      <AbsoluteFill style={{ background: C.ivory, opacity: interpolate(frame, [0, 14], [1, 0], { extrapolateRight: "clamp" }) }} />
      <Film vignette={0.12} grain={0.035} />
    </AbsoluteFill>
  );
};
