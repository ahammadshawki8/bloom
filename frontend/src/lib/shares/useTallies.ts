"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBloom } from "@/lib/store";
import { tallyShare, type Share, type ShareTally } from "@/lib/types";

/** Live share data for every link she has sent, plus up/down totals per saved look. */
export function useShareTallies() {
  const sent = useBloom((s) => s.shares);
  const [shares, setShares] = useState<Record<string, Share | null>>({});

  useEffect(() => {
    let alive = true;
    Promise.all(sent.map((s) => api.getShare(s.id).then((v) => [s.id, v] as const))).then((pairs) => {
      if (alive) setShares(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
  }, [sent]);

  const byResult: Record<string, ShareTally> = {};
  for (const share of Object.values(shares)) {
    if (!share) continue;
    tallyShare(share).forEach((t, i) => {
      const id = share.items[i]?.resultId;
      if (!id) return;
      const cur = (byResult[id] ??= { up: 0, down: 0 });
      cur.up += t.up;
      cur.down += t.down;
    });
  }
  return { shares, byResult, loaded: sent.every((s) => s.id in shares) };
}
