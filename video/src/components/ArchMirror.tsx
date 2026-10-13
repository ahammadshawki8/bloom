import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";

export interface Look {
  src: string;
  /** Frame (local to the mirror) at which this look starts revealing. */
  at: number;
}

interface Props {
  width: number;
  looks: Look[];
  /** Show the soft rose arch behind the mirror, like the landing page. */
  echo?: boolean;
  style?: React.CSSProperties;
}

const REVEAL = 9;

/**
 * Bloom's vanity mirror: a 4:5 frame with a semicircular top. Each new look
 * blooms open from the centre over the previous one, as it does in the app.
 */
export const ArchMirror: React.FC<Props> = ({ width, looks, echo = true, style }) => {
  const frame = useCurrentFrame();
  const height = width * 1.25;
  const radius = `${width / 2}px ${width / 2}px 28px 28px`;
  const visible = looks.filter((l) => l.at <= frame).slice(-2);

  return (
    <div style={{ position: "relative", width, height, ...style }}>
      {echo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            translate: `${width * 0.06}px ${width * 0.06}px`,
            borderRadius: radius,
            background: C.roseWash,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          overflow: "hidden",
          background: C.ivoryDeep,
          boxShadow: "0 40px 90px -30px rgba(67,41,58,0.45), 0 12px 30px -12px rgba(67,41,58,0.25)",
        }}
      >
        {visible.map((l) => {
          const p = interpolate(frame, [l.at, l.at + REVEAL], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          });
          return (
            <Img
              key={`${l.src}-${l.at}`}
              src={staticFile(l.src)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "50% 35%",
                clipPath: `circle(${p * 75}% at 50% 42%)`,
                scale: interpolate(p, [0, 1], [1.06, 1]),
              }}
            />
          );
        })}
        {/* glass sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 38%)",
          }}
        />
      </div>
    </div>
  );
};
