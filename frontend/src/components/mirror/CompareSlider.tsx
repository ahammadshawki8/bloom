"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

interface Props {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/** Drag (or use arrow keys) to compare her own hair with the try-on. */
export function CompareSlider({ before, after, beforeLabel = "Your hair", afterLabel = "Try-on" }: Props) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromEvent = useCallback((clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const onDown = (e: PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    fromEvent(e.clientX);
  };
  const onMove = (e: PointerEvent) => dragging.current && fromEvent(e.clientX);
  const onUp = () => (dragging.current = false);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
  };

  return (
    <div
      ref={box}
      className="absolute inset-0 touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <Image src={after} alt={afterLabel} fill sizes="(min-width: 1024px) 480px, 90vw" className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt={beforeLabel} fill sizes="(min-width: 1024px) 480px, 90vw" className="object-cover" />
      </div>
      <span className="absolute bottom-5 left-5 rounded-full bg-white/75 px-3 py-1 text-micro font-medium backdrop-blur">{beforeLabel}</span>
      <span className="absolute right-5 bottom-5 rounded-full bg-white/75 px-3 py-1 text-micro font-medium backdrop-blur">{afterLabel}</span>
      <div className="absolute inset-y-0 w-px bg-white/90" style={{ left: `${pos}%` }}>
        <button
          role="slider"
          aria-label="Compare your hair with the try-on"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={onKey}
          className="absolute top-1/2 left-1/2 grid size-11 -translate-1/2 cursor-ew-resize place-items-center rounded-full bg-white text-mulberry shadow-float"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
