"use client";

import Image from "next/image";
import clsx from "clsx";
import { Sparkle } from "@phosphor-icons/react";
import { BROW_PRESETS, LASH_PRESETS } from "@/lib/catalog/brows";
import { browPresetFor } from "@/lib/match/fit";
import type { BrowPreset, Passport } from "@/lib/types";

interface Props {
  passport: Passport;
  selectedId: string | null;
  onPick: (p: BrowPreset) => void;
  lashId: string | null;
  onPickLash: (p: BrowPreset) => void;
  busy: boolean;
  /** Name of the wig or wrap the brows and lashes are layered onto, if any. */
  onHair: string | null;
}

/** Brows and lashes, as close crops of real renders. The brow closest to her own is suggested. */
export function BrowPicker({ passport, selectedId, onPick, lashId, onPickLash, busy, onHair }: Props) {
  const natural = passport.face?.browShape;
  const suggested = natural ? browPresetFor(natural) : null;

  return (
    <div>
      <p className="mb-3 text-[13px] text-mulberry-soft">
        {onHair ? (
          <>
            Layered onto <span className="font-semibold text-mulberry">{onHair}</span>, so you see the whole look. Tap a style again to take it off.
          </>
        ) : (
          <>Try a wig or wrap first to see brows and lashes with it, or try them on their own. Tap a style again to take it off.</>
        )}
      </p>
      <div className="mb-3 flex items-center gap-3 rounded-[20px] bg-butter-wash p-3.5">
        <span className="size-7 shrink-0 rounded-full ring-2 ring-white" style={{ background: passport.browHex ?? "#4a3426" }} />
        <p className="text-[13px] leading-snug">
          {natural ? (
            <>
              <span className="font-semibold">Your brows read as {natural.toLowerCase()}</span>
              <span className="text-mulberry-soft"> (YouCam Face Analyzer), so we suggest the closest shape, drawn in your passport shade.</span>
            </>
          ) : (
            <>
              <span className="font-semibold">Drawn in your passport shade</span>
              <span className="text-mulberry-soft">, so they still look like yours if your brows thin.</span>
            </>
          )}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {BROW_PRESETS.map((p) => {
          const on = p.id === selectedId;
          return (
            <li key={p.id}>
              <button
                disabled={busy}
                onClick={() => onPick(p)}
                aria-pressed={on}
                className={clsx(
                  "relative block w-full overflow-hidden rounded-[20px] bg-paper text-left ring-2 transition-all disabled:opacity-70",
                  on ? "ring-mulberry" : "ring-transparent hover:ring-line",
                )}
              >
                <span className="relative block aspect-[2/1] overflow-hidden">
                  <Image
                    src={`/fixtures/tryon/${p.id}.webp`}
                    alt=""
                    fill
                    sizes="240px"
                    className="scale-[2.6] object-cover object-[50%_40%]"
                    style={{ transformOrigin: "50% 41%" }}
                  />
                </span>
                {suggested === p.id && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-butter-deep">
                    <Sparkle size={10} weight="fill" /> Closest to yours
                  </span>
                )}
                <span className="block p-2.5">
                  <span className="block text-[13px] font-medium">{p.label}</span>
                  <span className="block text-[11px] text-mulberry-soft">{p.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-6 mb-1 type-studio text-[1.15rem]">Lashes</h3>
      <p className="mb-3 text-[13px] text-mulberry-soft">Lashes can thin during treatment too. See which look feels like you.</p>
      <ul className="grid grid-cols-3 gap-2.5">
        {LASH_PRESETS.map((p) => {
          const on = p.id === lashId;
          return (
            <li key={p.id}>
              <button
                disabled={busy}
                onClick={() => onPickLash(p)}
                aria-pressed={on}
                className={clsx(
                  "block w-full overflow-hidden rounded-[20px] bg-paper text-left ring-2 transition-all disabled:opacity-70",
                  on ? "ring-mulberry" : "ring-transparent hover:ring-line",
                )}
              >
                <span className="relative block aspect-[2/1] overflow-hidden">
                  <Image
                    src={`/fixtures/tryon/${p.id}.webp`}
                    alt=""
                    fill
                    sizes="200px"
                    className="scale-[2.8] object-cover object-[50%_45%]"
                    style={{ transformOrigin: "50% 44%" }}
                  />
                </span>
                <span className="block p-2.5">
                  <span className="block text-[13px] font-medium">{p.label}</span>
                  <span className="block text-[11px] text-mulberry-soft">{p.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
