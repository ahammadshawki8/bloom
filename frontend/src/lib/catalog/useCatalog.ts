"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Style } from "@/lib/types";

let cache: Style[] | null = null;

export function useCatalog() {
  const [styles, setStyles] = useState<Style[] | null>(cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    api
      .catalog()
      .then((s) => {
        cache = s;
        if (alive) setStyles(s);
      })
      .catch(() => alive && setError("We couldn't load the collection. Check your connection and try again."));
    return () => {
      alive = false;
    };
  }, []);

  return { styles, error };
}

export function findVariant(styles: Style[] | null, variantId: string) {
  for (const style of styles ?? []) {
    const variant = style.variants.find((v) => v.id === variantId);
    if (variant) return { style, variant };
  }
  return null;
}
