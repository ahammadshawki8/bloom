import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import timings from "../../public/audio/timings.json";
import { ArchMirror } from "../components/ArchMirror";
import { Captions, type Cue } from "../components/Caption";
import { Film } from "../components/Film";
import { Shot } from "../components/Shot";
import { C, SANS, atelier, loadBloomFonts, sec, studio } from "../theme";

loadBloomFonts();

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const glide = Easing.bezier(0.65, 0, 0.35, 1);

// Part 4 of docs/script.md. Seconds, local to the closing.
export const CT = {
  why: { from: 0, to: 10.7 },
  team: { from: 10.7, to: 22.5 },
  stranger: { from: 22.5, to: 26.0 },
  dark: { from: 26.0, to: 26.6 },
  montage: { from: 26.6, to: 29.7 },
  still: { from: 29.7, to: 35.0 },
} as const;
export const CLOSING_SECONDS = 35.0;
/** The moment "still me." lands, with the hit. */
const HIT = 29.7;

const VO = [
  { id: "c1-why", at: 0.3 },
  { id: "c2-apis", at: 2.3 },
  { id: "c3-team", at: 10.95 },
  { id: "c4-stranger", at: 22.6 },
  { id: "c4a-look", at: 26.55 },
  { id: "c4b-still", at: HIT - 0.15 },
] as const;
type Line = { start: number; end: number; text: string };
const T = timings as Record<string, Line[]>;
const at = (id: string, i: number) => VO.find((v) => v.id === id)!.at + T[id][i].start;

const APIS = [
  { name: "AI Hairstyle (Hair Transfer)", does: "Wigs and wraps on her face" },
  { name: "AI Face Attributes & Ratio Analyzer", does: "Face shape and brows" },
  { name: "AI Hair Length Detection", does: "Length, before and on the render" },
  { name: "AI Hair Type Detection", does: "Curl, from optional side photos" },
  { name: "AI Hair Density Detection", does: "Fullness, from an optional top photo" },
  { name: "AI Makeup VTO", does: "Brows and lashes, layered on" },
];

/** The six YouCam APIs arrive around the mirror. */
const WhyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const first = sec(at("c2-apis", 0) - CT.why.from);
  return (
    <AbsoluteFill style={{ background: C.ivory }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.roseWash} 0%, rgba(244,222,220,0) 50%)` }} />
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "0.02em",
          color: C.mulberrySoft,
          opacity: interpolate(frame, [first - 6, first + 10], [0, 1], clamp),
        }}
      >
        Powered by Perfect Corp&apos;s YouCam APIs
      </div>
      <div style={{ position: "absolute", left: 960 - 190, top: 245, scale: interpolate(frame, [0, 24], [0.92, 1], { ...clamp, easing: ease }) }}>
        <ArchMirror
          width={380}
          looks={[
            { src: "renders/face.jpg", at: -100 },
            { src: "renders/tracy-short-wig--copper-glaze.jpg", at: 80 },
            { src: "renders/bamboo-turban--sage-green.jpg", at: 170 },
            { src: "renders/tracy-copper-layered.jpg", at: 250 },
          ]}
        />
      </div>
      {APIS.map((a, i) => {
        const left = i % 2 === 0;
        const row = Math.floor(i / 2);
        const start = first + i * 11;
        const p = interpolate(frame, [start, start + 16], [0, 1], { ...clamp, easing: ease });
        return (
          <div
            key={a.name}
            style={{
              position: "absolute",
              top: 300 + row * 190,
              ...(left ? { right: 960 + 250 } : { left: 960 + 250 }),
              width: 520,
              padding: "26px 30px",
              borderRadius: 22,
              background: C.paper,
              boxShadow: "0 24px 50px -28px rgba(67,41,58,0.45)",
              textAlign: left ? "right" : "left",
              opacity: p,
              translate: `${(1 - p) * (left ? -30 : 30)}px 0px`,
            }}
          >
            <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: C.roseDeep, letterSpacing: "0.04em" }}>YouCam</div>
            <div style={{ ...studio, marginTop: 6, fontSize: 36, lineHeight: 1.1, color: C.mulberry }}>{a.name}</div>
            <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 24, color: C.mulberrySoft }}>{a.does}</div>
          </div>
        );
      })}
      <Film vignette={0.1} grain={0.03} />
    </AbsoluteFill>
  );
};

/** A portrait inside Bloom's arched mirror. */
const Portrait: React.FC<{ src: string; position: string; width: number }> = ({ src, position, width }) => (
  <div style={{ position: "relative", width, height: width * 1.25 }}>
    <div style={{ position: "absolute", inset: 0, translate: `${width * 0.06}px ${width * 0.06}px`, borderRadius: `${width / 2}px ${width / 2}px 26px 26px`, background: C.roseWash }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: `${width / 2}px ${width / 2}px 26px 26px`,
        overflow: "hidden",
        boxShadow: "0 40px 90px -30px rgba(67,41,58,0.5)",
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position }} />
    </div>
  </div>
);

const Badge: React.FC<{ label: string; strong?: boolean; show: number }> = ({ label, strong, show }) => (
  <span
    style={{
      display: "inline-block",
      padding: "9px 20px",
      borderRadius: 999,
      fontFamily: SANS,
      fontSize: 24,
      fontWeight: 700,
      color: strong ? C.ivory : C.mulberry,
      background: strong ? C.roseDeep : C.roseWash,
      opacity: show,
      translate: `0px ${(1 - show) * 10}px`,
    }}
  >
    {label}
  </span>
);

/**
 * The team. Nourin first, alone and large: she leads. Then Ahammad joins her,
 * and the frame names what they share: two university students.
 */
const TeamScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (abs: number) => sec(abs - CT.team.from);
  const join = t(at("c3-team", 2)); // "With Ahammad Shawki, two university students..."
  const split = interpolate(frame, [join - 6, join + 18], [0, 1], { ...clamp, easing: glide });
  const n0 = interpolate(frame, [4, 26], [0, 1], { ...clamp, easing: ease });
  const s0 = interpolate(frame, [join + 4, join + 24], [0, 1], { ...clamp, easing: ease });
  const nourinX = interpolate(split, [0, 1], [960 - 560, 130]);
  const nourinW = interpolate(split, [0, 1], [420, 340]);
  const caption = interpolate(frame, [join + 20, join + 36], [0, 1], { ...clamp, easing: ease });

  return (
    <AbsoluteFill style={{ background: C.ivory }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 45%, ${C.roseWash} 0%, rgba(244,222,220,0) 50%), radial-gradient(circle at 80% 70%, #f7ebcb 0%, rgba(247,235,203,0) 45%)` }} />

      {/* Nourin */}
      <div style={{ position: "absolute", left: nourinX, top: 540 - (nourinW * 1.25) / 2 - 40, opacity: n0, translate: `0px ${(1 - n0) * 30}px` }}>
        <Portrait src="renders/nourin.jpg" position="8% 35%" width={nourinW} />
      </div>
      <div
        style={{
          position: "absolute",
          left: interpolate(split, [0, 1], [960 - 60, 510]),
          top: interpolate(split, [0, 1], [330, 380]),
          width: interpolate(split, [0, 1], [760, 400]),
          opacity: n0,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <Badge label="Women in Tech" strong show={interpolate(frame, [14, 28], [0, 1], clamp)} />
          <Badge label="Team lead" show={interpolate(frame, [20, 34], [0, 1], clamp)} />
        </div>
        <div style={{ ...atelier, marginTop: 26, fontSize: interpolate(split, [0, 1], [120, 68]), lineHeight: 0.95, color: C.mulberry }}>Nourin Richi</div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: interpolate(split, [0, 1], [34, 26]), lineHeight: 1.35, color: C.mulberrySoft, maxWidth: interpolate(split, [0, 1], [640, 390]) }}>
          Found the problem, led the research, and designed the experience.
        </div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 26, fontWeight: 600, color: C.mulberry, opacity: caption }}>BRAC University</div>
      </div>

      {/* Ahammad joins */}
      <div style={{ position: "absolute", left: 1000, top: 540 - 212 - 40, opacity: s0, translate: `${(1 - s0) * 40}px 0px` }}>
        <Portrait src="renders/shawki.jpg" position="80% 30%" width={340} />
      </div>
      <div style={{ position: "absolute", left: 1380, top: 380, width: 420, opacity: s0 }}>
        <div style={{ height: 50 }} />
        <div style={{ ...atelier, fontSize: 68, lineHeight: 0.95, color: C.mulberry }}>Ahammad Shawki</div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 26, lineHeight: 1.35, color: C.mulberrySoft }}>Full-stack and AI engineer.</div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 26, fontWeight: 600, color: C.mulberry, opacity: caption }}>BUET</div>
      </div>

      {/* what they share */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, opacity: caption }}>
        <div style={{ ...studio, fontSize: 54, color: C.mulberry }}>Two university students</div>
        <Badge label="Rising Star" show={caption} />
      </div>
      <Film vignette={0.1} grain={0.03} />
    </AbsoluteFill>
  );
};

/** Back to the woman from the opening. The music falls away. */
const StrangerScene: React.FC = () => (
  <Shot src="stock/loss-portrait.mp4" start={13.0} rate={0.8} grade="saturate(0.25) contrast(1.1) brightness(0.72) sepia(0.08) hue-rotate(-8deg)" push={[1.06, 1.16]} origin="50% 30%" fadeIn={10} fadeOut={6}>
    <Film vignette={0.85} grain={0.1} />
  </Shot>
);

const FLASH = [
  "renders/face.jpg",
  "renders/jenna-long-wig--cappucino.jpg",
  "renders/bamboo-turban--sage-green.jpg",
  "renders/nina-medium-wig--creamy-blond.jpg",
  "renders/diana-lf-long-wig--copper-glaze.jpg",
  "renders/floral-head-scarf--floral.jpg",
  "renders/monroe-medium-wig--coffee-latte.jpg",
  "renders/rochelle-long-wig--creamy-blond.jpg",
  "renders/tracy-short-wig--copper-glaze.jpg",
  "renders/jenna-long-wig--cappucino.jpg",
  "renders/nina-medium-wig--creamy-blond.jpg",
  "renders/bamboo-turban--sage-green.jpg",
];

/** In the dark, the mirror lights up and the looks come faster and faster. */
const MontageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // accelerating cuts: long holds first, then quicker, building into the hit
  let acc = 0;
  const cuts = FLASH.map((src, i) => {
    const hold = Math.max(3, Math.round(14 - i * 1.3));
    const c = { src, at: acc };
    acc += hold;
    return c;
  });
  const glow = interpolate(frame, [0, durationInFrames], [0.15, 0.6]);
  return (
    <AbsoluteFill style={{ background: "#0e090c", justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, rgba(244,222,220,${glow}) 0%, rgba(244,222,220,0) 38%)` }} />
      <div style={{ translate: "0px -30px", scale: interpolate(frame, [0, durationInFrames], [0.94, 1.08], { easing: Easing.bezier(0.5, 0, 0.9, 0.6) }) }}>
        <ArchMirror width={420} echo={false} looks={cuts.map((c) => ({ src: c.src, at: c.at }))} />
      </div>
      <Film vignette={0.6} grain={0.08} />
    </AbsoluteFill>
  );
};

/** The hit: light floods back, "still me.", then the name. */
const StillScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const card = durationInFrames - sec(3.2);
  const flash = interpolate(frame, [0, 3, 18], [1, 1, 0], clamp);
  const meOut = interpolate(frame, [card - 14, card + 4], [1, 0], clamp);
  const words = "Choose your hair before treatment does.".split(" ");
  return (
    <AbsoluteFill style={{ background: C.ivory }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${C.roseWash} 0%, rgba(244,222,220,0) 55%), radial-gradient(circle at 20% 92%, #f7ebcb 0%, rgba(247,235,203,0) 45%)` }} />
      <div style={{ position: "absolute", left: 960 - 200, top: 90, opacity: meOut, scale: interpolate(frame, [0, 40], [1.12, 1], { ...clamp, easing: ease }) }}>
        <ArchMirror width={400} looks={[{ src: "renders/tracy-copper-layered.jpg", at: -100 }]} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 650,
          textAlign: "center",
          ...studio,
          fontStyle: "italic",
          fontSize: 170,
          lineHeight: 1,
          color: C.mulberry,
          opacity: interpolate(frame, [2, 10], [0, 1], clamp) * meOut,
          scale: interpolate(frame, [2, 30], [1.15, 1], { ...clamp, easing: ease }),
          letterSpacing: interpolate(frame, [2, 60], [8, -2], clamp),
        }}
      >
        still me.
      </div>

      {/* the name */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              ...atelier,
              fontSize: 230,
              lineHeight: 0.9,
              color: C.mulberry,
              opacity: interpolate(frame, [card, card + 14], [0, 1], clamp),
              scale: interpolate(frame, [card, card + 40], [1.08, 1], { ...clamp, easing: ease }),
            }}
          >
            Bloom.
          </div>
          <div style={{ ...studio, marginTop: 30, fontSize: 58, color: C.mulberry }}>
            {words.map((w, i) => {
              const s = card + 14 + i * 3;
              return (
                <span key={w + i} style={{ display: "inline-block", marginRight: "0.26em", opacity: interpolate(frame, [s, s + 12], [0, 1], clamp), translate: `0px ${interpolate(frame, [s, s + 16], [16, 0], { ...clamp, easing: ease })}px` }}>
                  {w}
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: 54, fontFamily: SANS, fontSize: 34, fontWeight: 600, color: C.roseDeep, opacity: interpolate(frame, [card + 40, card + 54], [0, 1], clamp) }}>
            bloom-nourinrichi2026-9069.vercel.app
          </div>
          <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 28, color: C.mulberrySoft, opacity: interpolate(frame, [card + 46, card + 60], [0, 1], clamp) }}>
            Try it with our sample face. No photo needed.
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Film vignette={0.1} grain={0.03} />
    </AbsoluteFill>
  );
};

const span = (s: { from: number; to: number }) => ({ from: sec(s.from), durationInFrames: sec(s.to) - sec(s.from) });

export const Closing: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const darkFrom = sec(CT.stranger.from);
  const darkTo = sec(CT.still.from);
  const split = (s: Line): Line[] => {
    if (s.text.length <= 56) return [s];
    const commas = [...s.text.matchAll(/, /g)].map((m) => m.index!);
    if (!commas.length) return [s];
    const cut = commas.reduce((a, b) => (Math.abs(b - s.text.length / 2) < Math.abs(a - s.text.length / 2) ? b : a));
    const mid = s.start + ((s.end - s.start) * (cut + 1)) / s.text.length;
    return [{ start: s.start, end: mid, text: s.text.slice(0, cut + 1) }, { start: mid, end: s.end, text: s.text.slice(cut + 2) }];
  };
  const cues: (Cue & { tone: "light" | "dark" })[] = VO.filter((v) => v.id !== "c4b-still").flatMap((v) =>
    T[v.id].flatMap(split).map((s) => {
      const from = sec(v.at + s.start);
      return { from, to: sec(v.at + s.end) + 4, text: s.text, tone: from + 10 >= darkFrom && from + 10 < darkTo ? "light" : "dark" };
    }),
  );
  return (
    <AbsoluteFill style={{ background: C.ivory }}>
      <Sequence name="Why Bloom" layout="absolute-fill" {...span(CT.why)}>
        <WhyScene />
      </Sequence>
      <Sequence name="Team" layout="absolute-fill" {...span(CT.team)}>
        <TeamScene />
      </Sequence>
      <Sequence name="A stranger" layout="absolute-fill" {...span(CT.stranger)}>
        <StrangerScene />
      </Sequence>
      <Sequence name="Silence" layout="absolute-fill" {...span(CT.dark)}>
        <AbsoluteFill style={{ background: "#000" }} />
      </Sequence>
      <Sequence name="Looks" layout="absolute-fill" {...span(CT.montage)}>
        <MontageScene />
      </Sequence>
      <Sequence name="Still me" layout="absolute-fill" {...span(CT.still)}>
        <StillScene />
      </Sequence>

      <Captions cues={cues.filter((c) => c.tone === "dark")} tone="dark" />
      <Captions cues={cues.filter((c) => c.tone === "light")} tone="light" />

      {VO.map((v) => (
        <Sequence key={v.id} from={sec(v.at)} layout="none" name={`VO ${v.id}`}>
          <Audio src={staticFile(`audio/${v.id}.mp3`)} />
        </Sequence>
      ))}

      {/* "Possible Dreams" by Eugenio Mininni (Mixkit licence). It carries the team,
          falls away for the stranger and the silence, then returns full at the hit. */}
      <Audio
        src={staticFile("audio/music-possible-dreams.mp3")}
        trimBefore={sec(100)}
        volume={(f) =>
          interpolate(
            f,
            [0, 15, sec(2.3), sec(CT.stranger.from), sec(CT.stranger.from + 1.2), sec(CT.dark.from), sec(HIT), sec(HIT + 0.4), durationInFrames - sec(1.2), durationInFrames],
            [0, 0.3, 0.2, 0.22, 0.06, 0, 0, 0.5, 0.48, 0],
            clamp,
          )
        }
      />
      {/* the last words, spoken as the end card appears: "Bloom. Choose your hair before treatment does." */}
      <Sequence name="VO c5-bloom" from={durationInFrames - sec(3.2)} layout="none">
        <Audio src={staticFile("audio/c5-bloom.wav")} />
      </Sequence>
      {/* sound design for the ending */}
      <Sequence name="SFX heartbeat" from={sec(CT.dark.from) - 8} durationInFrames={sec(1.6)} layout="none">
        <Audio src={staticFile("audio/sfx-heartbeat.mp3")} volume={(f) => interpolate(f, [0, 6, 36, 48], [0, 0.7, 0.7, 0], clamp)} />
      </Sequence>
      <Sequence name="SFX riser" from={sec(HIT - 3.5)} durationInFrames={sec(3.6)} layout="none">
        <Audio src={staticFile("audio/sfx-riser.mp3")} volume={0.55} />
      </Sequence>
      <Sequence name="SFX hit" from={sec(HIT - 1.35)} layout="none">
        <Audio src={staticFile("audio/sfx-logo-impact.mp3")} volume={0.7} />
      </Sequence>
    </AbsoluteFill>
  );
};
