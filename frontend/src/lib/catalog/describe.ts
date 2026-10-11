import { BROW_PRESETS, LASH_PRESETS } from "./brows";
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
  if (result.kind === "combo" && result.layers) {
    const base = result.layers.hairVariantId ? findVariant(styles, result.layers.hairVariantId) : null;
    const extras = [
      result.layers.browId && `${BROW_PRESETS.find((p) => p.id === result.layers!.browId)?.label ?? ""} brows`,
      result.layers.lashId && `${LASH_PRESETS.find((p) => p.id === result.layers!.lashId)?.label ?? ""} lashes`,
    ].filter(Boolean) as string[];
    return {
      title: base ? base.style.name : "Brows and lashes",
      subtitle: [base && base.style.variants.length > 1 ? base.variant.colorName : null, ...extras.map((e) => e.toLowerCase())].filter(Boolean).join(", "),
      style: base?.style,
      variant: base?.variant,
    };
  }
  if (result.kind === "lash") {
    const preset = LASH_PRESETS.find((p) => p.id === result.variantId);
    return { title: `${preset?.label ?? "New"} lashes`, subtitle: "Lash look" };
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
