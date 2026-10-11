"use client";

import { useEffect, useState } from "react";
import { deltaE2000 } from "@/lib/color";
import type { Lab } from "@/lib/types";

const memo = new Map<string, Lab | null>();

/**
 * Verification loop: measures the hair colour in a rendered try-on image with the
 * same on-device pipeline as the passport, and returns ΔE2000 to her natural hair.
 * The match claim is checked on the render itself, not assumed from the product.
 */
export function useRenderedColour(image: string | null, natural: Lab | null) {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!image || memo.has(image)) return;
    let alive = true;
    (async () => {
      let lab: Lab | null = null;
      try {
        const { measureHairColour } = await import("@/lib/vision");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = image;
        await img.decode();
        lab = (await measureHairColour(img))?.lab ?? null;
      } catch {
        lab = null;
      }
      memo.set(image, lab);
      if (alive) bump((n) => n + 1);
    })();
    return () => {
      alive = false;
    };
  }, [image]);

  const lab = image ? (memo.get(image) ?? null) : null;
  const measuring = !!image && !memo.has(image);
  return { lab, measuring, deltaE: lab && natural ? deltaE2000(natural, lab) : null };
}
