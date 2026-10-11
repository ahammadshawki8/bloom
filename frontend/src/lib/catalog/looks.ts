// "Complete the look": one chained YouCam pipeline per look.
//   hair try-on  ->  makeup VTO (brows + lashes + lip + blush, one call)  ->  necklace VTO
// See tools/render_looks.mjs for the exact requests.

export interface LookPalette {
  id: string;
  label: string;
  lip: string;
  blush: string;
  note: string;
}

export const PALETTES: LookPalette[] = [
  { id: "soft-rose", label: "Soft rose", lip: "#b4626b", blush: "#d9898c", note: "Brings warmth back on pale days" },
  { id: "warm-berry", label: "Warm berry", lip: "#86354a", blush: "#c9727a", note: "A little more presence" },
  { id: "natural-nude", label: "Natural", lip: "#b0786c", blush: "#d4a08e", note: "Just like you, rested" },
];

export interface Necklace {
  id: string;
  label: string;
  image: string;
  retailer: string;
  url: string;
  price: number;
}

export const NECKLACES: Necklace[] = [
  {
    id: "pearl",
    label: "Pearl strand",
    image: "/fixtures/catalog/necklace-pearl.webp",
    retailer: "Gorjana",
    url: "https://www.gorjana.com/products/finley-pearl-necklace",
    price: 75,
  },
  {
    id: "shell",
    label: "Shell pendant",
    image: "/fixtures/catalog/necklace-shell.webp",
    retailer: "Gorjana",
    url: "https://www.gorjana.com/products/scallop-pearl-necklace",
    price: 85,
  },
];

/** Base looks that have pre-rendered complete-look fixtures (preview mode). */
export const LOOK_BASES = ["bamboo-turban--sage-green", "floral-head-scarf--floral", "tracy-short-wig--copper-glaze"];

export const lookImage = (baseVariantId: string, palette: string, necklace: string | null) =>
  `/fixtures/looks/${baseVariantId}--${palette}${necklace ? `--${necklace}` : ""}.webp`;

/** The pipeline steps, for showing judges and users what happened. */
export const PIPELINE = [
  { api: "AI Hair / Hair Transfer", does: "the wig or wrap" },
  { api: "AI Makeup VTO", does: "brows, lashes, lip and blush in one pass" },
  { api: "AI Necklace VTO", does: "the finishing piece" },
];
