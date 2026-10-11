"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, LockSimple, Sparkle, Eye } from "@phosphor-icons/react";
import { CaptureGuide, type CaptureMode } from "./CaptureGuide";
import { PassportCard } from "./PassportCard";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { api, type HairReading } from "@/lib/api";
import { measureHairColour } from "@/lib/vision";
import { useBloom } from "@/lib/store";
import type { Passport } from "@/lib/types";

type Step = "intro" | "front" | "left" | "right" | "top" | "reading" | "reveal" | "failed";
const SEQUENCE: Step[] = ["front", "left", "right", "top"];

export function PassportFlow() {
  const [step, setStep] = useState<Step>("intro");
  const [shots, setShots] = useState<Partial<Record<CaptureMode, string>>>({});
  const [draft, setDraft] = useState<Passport | null>(null);
  const setPassport = useBloom((s) => s.setPassport);
  const router = useRouter();

  const stepIndex = SEQUENCE.indexOf(step);

  function captured(mode: CaptureMode, url: string) {
    setShots((s) => ({ ...s, [mode]: url }));
    const next = SEQUENCE[SEQUENCE.indexOf(mode) + 1];
    setStep(next ?? "reading");
  }

  function skipTo(next: Step) {
    setStep(next);
  }

  return (
    <div className="mx-auto w-full max-w-[640px] overflow-x-clip px-4 pb-12 md:px-6">
      {stepIndex >= 0 && (
        <div className="mb-6 flex items-center justify-between">
          <ol className="flex items-center gap-1.5" aria-label={`Photo ${stepIndex + 1} of ${SEQUENCE.length}`}>
            {SEQUENCE.map((s, i) => (
              <li
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${i < stepIndex ? "w-6 bg-mulberry" : i === stepIndex ? "w-10 bg-rose-deep" : "w-6 bg-line"}`}
              />
            ))}
          </ol>
          <span className="text-micro text-mulberry-soft">
            Photo {stepIndex + 1} of {SEQUENCE.length}
            {stepIndex > 0 && " · optional"}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === "intro" && <Intro onBegin={() => setStep("front")} />}

          {(step === "front" || step === "left" || step === "right" || step === "top") && (
            <>
              <CaptureGuide key={step} mode={step} onCapture={(u) => captured(step, u)} />
              {step !== "front" && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => skipTo(step === "left" ? "top" : step === "right" ? "top" : "reading")}
                    className="text-small font-medium text-mulberry-soft underline underline-offset-4 hover:text-mulberry"
                  >
                    {step === "top" ? "Skip and finish" : "Skip the side photos"}
                  </button>
                  <p className="mx-auto mt-2 max-w-[36ch] text-micro text-mulberry-soft">
                    {step === "top" ? "Helps us note how full your hair is today." : "Side photos help us read your curl pattern."}
                  </p>
                </div>
              )}
            </>
          )}

          {step === "reading" && shots.front && (
            <Reading
              photo={shots.front}
              shots={shots}
              onDone={(p) => {
                setDraft(p);
                setStep("reveal");
              }}
              onFail={() => setStep("failed")}
            />
          )}

          {step === "reveal" && draft && (
            <div>
              <h2 className="mb-6 text-center type-studio text-h2">Here&apos;s your hair, kept.</h2>
              <PassportCard passport={draft} reveal />
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  iconEnd={<ArrowRight size={18} />}
                  onClick={() => {
                    setPassport(draft);
                    toast("Passport saved on this phone.");
                    router.push("/studio/try");
                  }}
                >
                  Save and see my matches
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => {
                    setShots({});
                    setStep("front");
                  }}
                >
                  Retake photos
                </Button>
              </div>
            </div>
          )}

          {step === "failed" && (
            <div className="rounded-[var(--radius-card)] bg-paper p-6 text-center ring-1 ring-line">
              <h2 className="type-studio text-h3">We couldn&apos;t see enough hair to measure</h2>
              <p className="mx-auto mt-2 max-w-[40ch] text-small text-mulberry-soft">
                This works best with hair loose around your face and shoulders. If your hair is already short, a photo from a few months ago is perfect.
              </p>
              <Button className="mt-5" onClick={() => setStep("front")}>
                Try another photo
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex w-max items-end gap-2" aria-hidden>
        {["/fixtures/demo/face.webp", "/fixtures/tryon/kelly-short-wig--marble-brown.webp"].map((s, i) => (
          <div key={s} className={`relative aspect-[4/5] arch overflow-hidden ${i === 0 ? "w-28" : "w-20 opacity-70"}`}>
            <Image src={s} alt="" fill sizes="112px" className="object-cover" />
          </div>
        ))}
      </div>
      <h1 className="mt-7 type-studio text-h1 md:text-display">Your hair passport</h1>
      <p className="mx-auto mt-3 max-w-[38ch] text-lead text-mulberry-soft">
        A careful record of your hair as it is today, so every wig and colour can be matched to you.
      </p>
      <ul className="mx-auto mt-8 max-w-[380px] space-y-3 text-left">
        {[
          { icon: <Eye size={20} />, t: "One straight-on photo, then three optional ones", s: "Sides for curl pattern, top for fullness" },
          { icon: <Sparkle size={20} />, t: "Colour is measured right here on your phone", s: "From thousands of hair pixels, not a guess" },
          {
            icon: <LockSimple size={20} />,
            t: "Kept on this phone",
            s: api.mode === "live" ? "Photos are sent only to read your hair and render looks" : "Nothing is uploaded until you try a look",
          },
        ].map((r) => (
          <li key={r.t} className="flex gap-3 rounded-[20px] bg-paper p-4 ring-1 ring-line">
            <span className="mt-0.5 text-rose-deep">{r.icon}</span>
            <span>
              <span className="block text-small font-medium">{r.t}</span>
              <span className="block text-micro text-mulberry-soft">{r.s}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button size="lg" className="mt-8" onClick={onBegin} iconEnd={<ArrowRight size={18} />}>
        Begin
      </Button>
      <p className="mx-auto mt-4 max-w-[40ch] text-micro text-mulberry-soft">
        Bloom is cosmetic. It describes your hair; it never says anything about your health.
      </p>
    </div>
  );
}

const LINES = ["Finding your hair…", "Measuring its colour, pixel by pixel…", "Reading length and texture…", "Writing your passport…"];

function Reading({
  photo,
  shots,
  onDone,
  onFail,
}: {
  photo: string;
  shots: Partial<Record<CaptureMode, string>>;
  onDone: (p: Passport) => void;
  onFail: () => void;
}) {
  const [line, setLine] = useState(0);
  const cb = useRef({ onDone, onFail, shots });
  useLayoutEffect(() => {
    cb.current = { onDone, onFail, shots };
  });

  useEffect(() => {
    const { shots } = cb.current;
    const t = setInterval(() => setLine((l) => Math.min(LINES.length - 1, l + 1)), 1100);
    let alive = true;
    (async () => {
      const img = new window.Image();
      img.src = photo;
      await img.decode();
      const [hair, reading] = await Promise.all([
        measureHairColour(img).catch(() => null),
        api.readHair({ front: photo, sides: [shots.left, shots.right].filter(Boolean) as string[], top: shots.top }).catch((): HairReading => ({})),
        new Promise((r) => setTimeout(r, 3600)),
      ]);
      if (!alive) return;
      if (!hair || hair.confidence < 0.25) return cb.current.onFail();
      cb.current.onDone({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDemo: false,
        photo,
        hair,
        ...reading,
        density: shots.top ? reading.density : undefined,
        curl: shots.left || shots.right ? reading.curl : undefined,
        browHex: undefined,
      });
    })();
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [photo]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-full max-w-[300px]">
        <div className="relative aspect-[4/5] arch">
          <Image src={photo} alt="Your photo" fill unoptimized className="object-cover" />
          {/* a soft light sweeping down the mirror */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-white/45 to-transparent"
            initial={{ top: "-35%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={line}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mt-7 type-studio text-h3"
          role="status"
        >
          {LINES[line]}
        </motion.p>
      </AnimatePresence>
      <p className="mt-2 max-w-[40ch] text-small text-mulberry-soft">
        {api.mode === "live"
          ? "Colour is measured on your phone. Length and texture are read by the YouCam hair API, and nothing is kept."
          : "This happens on your phone. Your photo isn't uploaded."}
      </p>
    </div>
  );
}
