// Domain types shared by the UI, the API client and (later) the backend contract.

export type Lab = [L: number, a: number, b: number];

export type StyleKind = "wig" | "wrap";
export type HairLength = "short" | "medium" | "long";
export type HairTexture = "straight" | "wavy";

export interface Variant {
  id: string;
  colorName: string;
  hex: string;
  lab: Lab;
  /** Colour measured from a real try-on render on a face (same on-device pipeline as the passport). */
  renderLab?: Lab;
  /** Local display image (mannequin / product shot). */
  image: string;
  /** Public product image used as the try-on reference. */
  refImageUrl: string;
  price: number;
}

export interface Style {
  id: string;
  kind: StyleKind;
  name: string;
  retailer: string;
  url: string;
  finalSale: boolean;
  length?: HairLength;
  texture?: HairTexture;
  bangs?: boolean;
  capSize?: string;
  laceFront?: boolean;
  rooted?: boolean;
  variants: Variant[];
}

export interface HairColour {
  hex: string;
  lab: Lab;
  name: string;
  /** 0..1 — share of sampled pixels that agreed with the median. */
  confidence: number;
  /** Number of hair pixels the median was taken from. */
  samples?: number;
}

export interface Passport {
  id: string;
  createdAt: string;
  isDemo: boolean;
  /** Object URL / data URL / fixture path of the front photo. */
  photo: string;
  hair: HairColour;
  length?: HairLength;
  texture?: HairTexture;
  curl?: { code: string; label: string };
  /** 1 (sparse) .. 4 (full) — baseline density level. */
  density?: 1 | 2 | 3 | 4;
  browHex?: string;
}

export type ResultKind = "wig" | "wrap" | "brow";

export interface TryOnResult {
  id: string;
  kind: ResultKind;
  styleId: string;
  variantId: string;
  image: string;
  createdAt: string;
  /** "live" = rendered for this person; "demo" = pre-rendered on the sample face. */
  source: "live" | "demo";
}

export type Shelf = "keep" | "maybe";

export interface SavedLook {
  resultId: string;
  shelf: Shelf;
  savedAt: string;
}

export interface ShareItem {
  resultId: string;
  image: string;
  title: string;
  subtitle: string;
}

export interface ShareVote {
  itemIndex: number;
  name?: string;
  note?: string;
  at: string;
}

export interface Share {
  id: string;
  ownerName?: string;
  message?: string;
  items: ShareItem[];
  votes: ShareVote[];
  createdAt: string;
  expiresAt: string;
}

export interface BrowPreset {
  id: string;
  label: string;
  description: string;
}
