"use client";

import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  hair: string | null;
  brow: string | null;
  lash: string | null;
  busy: boolean;
  onRemoveHair: () => void;
  onRemoveBrow: () => void;
  onRemoveLash: () => void;
}

/** The layers of the look in the mirror. Each one can be taken off on its own. */
export function LayerChips({ hair, brow, lash, busy, onRemoveHair, onRemoveBrow, onRemoveLash }: Props) {
  const layers = [
    hair && { key: "hair", label: hair, remove: onRemoveHair },
    brow && { key: "brow", label: `${brow} brows`, remove: onRemoveBrow },
    lash && { key: "lash", label: `${lash} lashes`, remove: onRemoveLash },
  ].filter(Boolean) as { key: string; label: string; remove: () => void }[];
  if (!layers.length) return null;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Layers in this look">
      <li className="mr-1 text-[12px] text-mulberry-soft">Wearing</li>
      <AnimatePresence initial={false}>
        {layers.map((l) => (
          <motion.li
            key={l.key}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1 rounded-full bg-paper py-1 pr-1 pl-3 text-[12px] font-medium ring-1 ring-line"
          >
            {l.label}
            <button
              type="button"
              onClick={l.remove}
              disabled={busy}
              aria-label={`Take off ${l.label}`}
              className="grid size-6 place-items-center rounded-full text-mulberry-soft hover:bg-mulberry/5 hover:text-mulberry disabled:opacity-40"
            >
              <X size={12} weight="bold" />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
