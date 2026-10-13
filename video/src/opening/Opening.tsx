import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Captions } from "../components/Caption";
import { loadBloomFonts, sec } from "../theme";
import { ChristmasScene, HerselfScene, LossScene, QuestionScene, ReadyScene, StrangerScene } from "./StoryScenes";
import { NumbersScene } from "./NumbersScene";
import { PitchScene } from "./PitchScene";
import { OPENING_SECONDS, T, cues, voLines } from "./timeline";

loadBloomFonts();

const span = (s: { from: number; to: number }) => ({ from: sec(s.from), durationInFrames: sec(s.to) - sec(s.from) });

/** The opening: Renita's story, how little time there is, and Bloom. */
export const Opening: React.FC = () => {
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence name="Loss" layout="absolute-fill" {...span(T.loss)}>
        <LossScene />
      </Sequence>
      <Sequence name="A stranger" layout="absolute-fill" {...span(T.stranger)}>
        <StrangerScene />
      </Sequence>
      <Sequence name="Getting ready" layout="absolute-fill" {...span(T.ready)}>
        <ReadyScene />
      </Sequence>
      <Sequence name="Christmas" layout="absolute-fill" {...span(T.christmas)}>
        <ChristmasScene />
      </Sequence>
      <Sequence name="Herself again" layout="absolute-fill" {...span(T.herself)}>
        <HerselfScene />
      </Sequence>
      <Sequence name="18 days" layout="absolute-fill" {...span(T.fast)}>
        <NumbersScene />
      </Sequence>
      <Sequence name="The question" layout="absolute-fill" {...span(T.question)}>
        <QuestionScene />
      </Sequence>
      <Sequence name="Bloom" layout="absolute-fill" {...span(T.bloom)}>
        <PitchScene />
      </Sequence>

      <Sequence name="Captions (light)" layout="absolute-fill">
        <Captions cues={cues.filter((c) => c.tone === "light")} tone="light" />
      </Sequence>
      <Sequence name="Captions (dark)" layout="absolute-fill">
        <Captions cues={cues.filter((c) => c.tone === "dark")} tone="dark" />
      </Sequence>

      {/* voice (scratch track: replace with Nourin's recording) */}
      {voLines.map((v) => (
        <Sequence key={v.file} name={`VO ${v.file}`} from={v.from} layout="none">
          <Audio src={staticFile(v.file)} volume={1} />
        </Sequence>
      ))}

      {/* "Discover" by Eugenio Mininni (Mixkit licence): it rises as she feels like
          herself, pulls back for the hard fact, then lifts again into Bloom. */}
      <Audio
        src={staticFile("audio/music-discover.mp3")}
        volume={(f) =>
          interpolate(
            f,
            [0, sec(3), sec(T.christmas.from), sec(T.herself.from + 1.5), sec(T.fast.from + 0.5), sec(T.fast.from + 2), sec(T.question.from + 2), sec(T.bloom.from + 1), durationInFrames - 15, durationInFrames],
            [0, 0.22, 0.26, 0.42, 0.3, 0.16, 0.26, 0.4, 0.38, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
        trimAfter={sec(OPENING_SECONDS + 2)}
      />

      <Sequence name="SFX into the light" from={sec(T.bloom.from) - 24} layout="none">
        <Audio src={staticFile("audio/sfx-air-woosh.mp3")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};
