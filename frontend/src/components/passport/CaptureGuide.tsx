"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, ImageSquare, CheckCircle } from "@phosphor-icons/react";
import clsx from "clsx";
import { brightness, observeFace, toCanvas, warmUpVision } from "@/lib/vision";
import { checkFraming, type FramingResult } from "@/lib/vision/framing";

export type CaptureMode = "front" | "left" | "right" | "top";

const PROMPTS: Record<CaptureMode, { title: string; hint: string }> = {
  front: { title: "Look straight at the mirror", hint: "Head and shoulders in the arch, hair loose, soft light on your face." },
  left: { title: "Turn your head to the left", hint: "About halfway, so we can see the side of your hair." },
  right: { title: "Now turn to the right", hint: "Same again on the other side." },
  top: { title: "Show us the top of your head", hint: "Tip your head down toward the phone, or ask someone to take this one." },
};

interface Props {
  mode: CaptureMode;
  onCapture: (dataUrl: string) => void;
}

type CamState = "starting" | "live" | "denied" | "unavailable";

const HOLD_MS = 1400;

export function CaptureGuide({ mode, onCapture }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [cam, setCam] = useState<CamState>("starting");
  const [framing, setFraming] = useState<FramingResult | null>(null);
  const [holdStart, setHoldStart] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadIssue, setUploadIssue] = useState<string | null>(null);
  const strict = mode === "front";

  // Camera lifecycle
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    warmUpVision();
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setCam("unavailable");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1600 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
        }
        setCam("live");
      } catch (e) {
        setCam((e as Error).name === "NotAllowedError" ? "denied" : "unavailable");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const shoot = useCallback(() => {
    const v = video.current;
    if (!v) return;
    onCapture(toCanvas(v, 1024, false).toDataURL("image/jpeg", 0.9));
  }, [onCapture]);

  // Live framing loop (front photo only)
  useEffect(() => {
    if (cam !== "live" || !strict) return;
    let raf = 0;
    let last = 0;
    let busy = false;
    const loop = async (t: number) => {
      raf = requestAnimationFrame(loop);
      const v = video.current;
      if (busy || !v || v.readyState < 2 || t - last < 220) return;
      busy = true;
      last = t;
      try {
        const face = await observeFace(v, performance.now());
        const light = brightness(v, face?.box);
        setFraming(checkFraming(face, { width: v.videoWidth, height: v.videoHeight }, light));
      } catch {
        /* model still loading */
      } finally {
        busy = false;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cam, strict]);

  // Hold-still auto capture
  const ok = !strict || framing?.ok === true;
  useEffect(() => {
    if (cam !== "live" || !strict) return;
    if (!ok) {
      setHoldStart(null);
      setProgress(0);
      return;
    }
    const start = holdStart ?? performance.now();
    if (holdStart === null) setHoldStart(start);
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / HOLD_MS);
      setProgress(p);
      if (p >= 1) shoot();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ok, cam, strict, holdStart, shoot]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setUploadIssue(null);
    const img = new Image();
    img.src = URL.createObjectURL(f);
    await img.decode().catch(() => {});
    const canvas = toCanvas(img, 1024);
    if (strict) {
      const face = await observeFace(canvas).catch(() => null);
      const result = checkFraming(face, canvas, brightness(canvas, face?.box));
      // For uploads we only insist on the essentials; small framing differences are fine.
      const blocking = result.issues.find((i) => ["no_face", "too_close", "head_cut", "turned"].includes(i.code));
      if (blocking) {
        setUploadIssue(`${blocking.message} Try another photo.`);
        URL.revokeObjectURL(img.src);
        return;
      }
    }
    URL.revokeObjectURL(img.src);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }

  const message = !strict
    ? PROMPTS[mode].hint
    : framing === null
      ? "Getting the mirror ready…"
      : framing.ok
        ? "Perfect. Hold still for a moment."
        : framing.issues[0].message;

  return (
    <div className="flex flex-col items-center">
      <div className="text-center">
        <h2 className="type-studio text-h3 md:text-h2">{PROMPTS[mode].title}</h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-small text-mulberry-soft">{PROMPTS[mode].hint}</p>
      </div>

      <div className="relative mt-6 w-full max-w-[360px]">
        <div className="arch relative aspect-[4/5] bg-mulberry/90">
          <video ref={video} playsInline muted className={clsx("absolute inset-0 size-full -scale-x-100 object-cover transition-opacity duration-500", cam === "live" ? "opacity-100" : "opacity-0")} />

          {/* guide overlay: where the head and shoulders go */}
          {cam === "live" && (
            <svg viewBox="0 0 400 500" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
              <ellipse cx="200" cy={mode === "top" ? 230 : 205} rx="92" ry="118" fill="none" stroke="white" strokeOpacity={ok ? 0.95 : 0.6} strokeWidth="2" strokeDasharray={ok ? "0" : "6 8"} />
              {mode !== "top" && <path d="M40 470 C 80 380, 140 360, 200 360 C 260 360, 320 380, 360 470" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="6 8" />}
            </svg>
          )}

          {cam !== "live" && (
            <div className="absolute inset-0 grid place-items-center p-8 text-center text-ivory">
              {cam === "starting" ? (
                <p className="text-small text-ivory/80">Opening your camera…</p>
              ) : (
                <div>
                  <Camera size={34} className="mx-auto opacity-80" />
                  <p className="mt-3 text-small">
                    {cam === "denied" ? "Camera access is off. You can allow it in your browser settings, or use a photo instead." : "No camera here. Use a photo instead."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* status pill */}
          {cam === "live" && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={message}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  role="status"
                  className={clsx("flex items-center gap-2 rounded-full px-4 py-2 text-small font-medium backdrop-blur-md", ok && strict ? "bg-sage/90 text-white" : "bg-white/85 text-mulberry")}
                >
                  {ok && strict && <CheckCircle size={18} weight="fill" />}
                  {message}
                </motion.p>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* shutter */}
      <div className="mt-6 flex flex-col items-center gap-4">
        {cam === "live" && (
          <button
            onClick={shoot}
            disabled={strict && !ok && framing !== null && framing.issues[0]?.code === "no_face"}
            aria-label="Take photo"
            className="relative grid size-[76px] place-items-center rounded-full bg-paper shadow-float transition-transform active:scale-95 disabled:opacity-50"
          >
            <svg viewBox="0 0 76 76" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="38" cy="38" r="35" fill="none" stroke="var(--color-line)" strokeWidth="3" />
              <circle cx="38" cy="38" r="35" fill="none" stroke="var(--color-rose-deep)" strokeWidth="3" strokeLinecap="round" strokeDasharray={220} strokeDashoffset={220 * (1 - progress)} />
            </svg>
            <span className="size-[58px] rounded-full bg-rose" />
          </button>
        )}
        <button onClick={() => file.current?.click()} className="flex items-center gap-2 text-small font-medium underline decoration-rose/60 underline-offset-4">
          <ImageSquare size={18} />
          {cam === "live" ? "Use a photo instead" : "Choose a photo"}
        </button>
        <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        {uploadIssue && (
          <p role="alert" className="max-w-[34ch] text-center text-small text-rose-deep">
            {uploadIssue}
          </p>
        )}
        {strict && (
          <p className="max-w-[36ch] text-center text-micro text-mulberry-soft">
            Hair already short? Choose a photo from before, where your hair and shoulders are visible.
          </p>
        )}
      </div>
    </div>
  );
}
