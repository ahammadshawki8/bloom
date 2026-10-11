"use client";

import Image from "next/image";
import clsx from "clsx";
import { motion } from "motion/react";
import { describeDeltaE } from "@/lib/color";
import type { Style, Variant } from "@/lib/types";

export interface RailItem {
  style: Style;
  variant: Variant;
  deltaE?: number;
}

interface Props {
  items: RailItem[];
  selectedStyleId: string | null;
  triedVariantIds: Set<string>;
  onPick: (item: RailItem) => void;
  showMatch: boolean;
}

const toneRing = { match: "ring-sage", close: "ring-sage", gentle: "ring-butter-deep/40", new: "ring-lilac-deep/40" } as const;

/** Horizontal rail on phones, a grid on desktop. Each card is a product on its mannequin. */
export function StyleRail({ items, selectedStyleId, triedVariantIds, onPick, showMatch }: Props) {
  return (
    <ul className="-mx-4 no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 xl:grid-cols-4">
      {items.map((item) => {
        const selected = item.style.id === selectedStyleId;
        const words = item.deltaE !== undefined ? describeDeltaE(item.deltaE) : null;
        return (
          <li key={item.style.id} className="w-[132px] shrink-0 snap-start lg:w-auto">
            <button onClick={() => onPick(item)} aria-pressed={selected} className="group block w-full text-left">
              <span
                className={clsx(
                  "relative block aspect-[4/5] overflow-hidden rounded-[22px] bg-white ring-2 transition-all duration-300",
                  selected ? "shadow-lift ring-mulberry" : "ring-transparent group-hover:ring-line",
                )}
              >
                <Image
                  src={item.variant.image}
                  alt={`${item.style.name} in ${item.variant.colorName}`}
                  fill
                  sizes="(min-width: 1024px) 220px, 132px"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {triedVariantIds.has(item.variant.id) && (
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sage-deep">
                    Tried
                  </span>
                )}
                {selected && <motion.span layoutId="rail-selected" className="absolute inset-0 rounded-[22px] ring-2 ring-white/70 ring-inset" />}
              </span>
              <span className="mt-2 flex items-center gap-2">
                <span
                  className={clsx("size-4 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-ivory", words ? toneRing[words.tone] : "ring-line")}
                  style={{ background: item.variant.hex }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-small font-medium">{item.style.name}</span>
                  <span className="block truncate text-[12px] text-mulberry-soft">{showMatch && words ? words.label : item.variant.colorName}</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
