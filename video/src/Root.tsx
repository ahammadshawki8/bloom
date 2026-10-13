import { Composition, Folder } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Opening } from "./opening/Opening";
import { OPENING_SECONDS } from "./opening/timeline";
import { DesktopWalkthrough, DESK_FRAMES } from "./walkthrough/DesktopWalkthrough";
import { Closing, CLOSING_SECONDS } from "./closing/Closing";
import { FPS } from "./theme";

const OPENING_FRAMES = Math.round(OPENING_SECONDS * FPS);
/** The soft crossfade from the opening's title into the phone. */
export const XFADE = 15;
const CLOSING_FRAMES = Math.round(CLOSING_SECONDS * FPS);

/** The film so far, end to end. */
const Film: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={OPENING_FRAMES} name="Opening">
      <Opening />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: XFADE })} />
    <TransitionSeries.Sequence durationInFrames={DESK_FRAMES} name="Walkthrough">
      <DesktopWalkthrough />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: XFADE })} />
    <TransitionSeries.Sequence durationInFrames={CLOSING_FRAMES} name="Closing">
      <Closing />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Bloom">
      <Composition id="Film" component={Film} durationInFrames={OPENING_FRAMES + DESK_FRAMES + CLOSING_FRAMES - 2 * XFADE} fps={FPS} width={1920} height={1080} />
      <Composition id="Opening" component={Opening} durationInFrames={OPENING_FRAMES} fps={FPS} width={1920} height={1080} />
      <Composition id="Closing" component={Closing} durationInFrames={CLOSING_FRAMES} fps={FPS} width={1920} height={1080} />
      <Composition id="DesktopWalkthrough" component={DesktopWalkthrough} durationInFrames={DESK_FRAMES} fps={FPS} width={1920} height={1080} />
    </Folder>
  );
};
