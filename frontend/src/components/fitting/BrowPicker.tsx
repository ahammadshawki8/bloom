"use client";

import Image from "next/image";
import clsx from "clsx";
import { BROW_PRESETS } from "@/lib/catalog/brows";
import type { BrowPreset, Passport } from "@/lib/types";

interface Props {
  passport: Passport;
  selectedId: string | null;
  onPick: (p: BrowPreset) => void;
  busy: boolean;
}

/** Brow shapes, shown as close crops of real renders so the difference is visible. */
export function BrowPicker({ passport, selectedId, onPick, busy }: Props) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-[20px] bg-butter-wash p-4">
        <span className="size-8 shrink-0 rounded-full ring-2 ring-white" style={{ background: passport.browHex ?? "#4a3426" }} />
        <p className="text-small">
          <span className="font-semibold">Shade from your passport.</span>{" "}
          <span className="text-mulberry-soft">Brows are drawn in your own colour, so they still look like you if your brows thin.</span>
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BROW_PRESETS.map((p) => {
          const on = p.id === selectedId;
          return (
            <li key={p.id}>
              <button
                disabled={busy}
                onClick={() => onPick(p)}
                aria-pressed={on}
                className={clsx(
                  "block w-full overflow-hidden rounded-[22px] bg-paper text-left ring-2 transition-all disabled:opacity-70",
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
                <span className="block p-3">
                  <span className="block text-small font-medium">{p.label}</span>
                  <span className="block text-[12px] text-mulberry-soft">{p.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
