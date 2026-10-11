import { BROW_PRESETS } from "./brows";
import { findVariant } from "./useCatalog";
import type { Style, TryOnResult, Variant } from "@/lib/types";

export interface LookInfo {
  title: string;
  subtitle: string;
  style?: Style;
  variant?: Variant;
}

/** Human title for a saved try-on result. */
export function describeLook(result: TryOnResult, styles: Style[] | null): LookInfo {
  if (result.kind === "brow") {
    const preset = BROW_PRESETS.find((p) => p.id === result.variantId);
    return { title: `${preset?.label ?? "New"} brows`, subtitle: "In your passport shade" };
  }
  const found = findVariant(styles, result.variantId);
  if (!found) return { title: "A look you tried", subtitle: "" };
  return {
    title: found.style.name,
    subtitle: found.style.variants.length > 1 ? found.variant.colorName : found.style.kind === "wrap" ? "Head wrap" : "",
    style: found.style,
    variant: found.variant,
  };
}
