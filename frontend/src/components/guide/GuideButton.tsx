"use client";

import { Sparkle } from "@phosphor-icons/react";
import { useGuide } from "./GuideSheet";

export function GuideButton({ label = "Guide" }: { label?: string }) {
  const setOpen = useGuide((s) => s.setOpen);
  return (
    <button
      onClick={() => setOpen(true)}
      className="flex h-10 items-center gap-1.5 rounded-full bg-lilac-wash px-4 text-[13px] font-semibold text-mulberry transition-colors hover:bg-[#ddd5ea]"
    >
      <Sparkle size={16} weight="fill" className="text-lilac-deep" />
      {label}
    </button>
  );
}
