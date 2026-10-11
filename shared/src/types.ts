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
  /** YouCam Hair Length Detection term, read off the try-on render. */
  renderLength?: string;
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

export type FaceShape = "Triangle" | "Diamond" | "Heart" | "InvTriangle" | "Oblong" | "Oval" | "Round" | "Square";

/** From the YouCam Face Attributes & Ratio Analyzer. */
export interface FaceProfile {
  shape: FaceShape;
  browShape: string;
  browThickness: string;
  eyeShape: string;
  cheekbones: string;
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
  face?: FaceProfile;
  /** YouCam Hair Length Detection term for her own hair. */
  hairLengthTerm?: string;
  /** Analyses that couldn't be read, so the card can say so instead of guessing. */
  analysisNotes?: string[];
}

export type ResultKind = "wig" | "wrap" | "brow" | "lash" | "combo";

/** The layers of a stacked look: hair (wig or wrap) with brows and/or lashes on top. */
export interface LookLayers {
  hairResultId?: string;
  hairVariantId?: string;
  browId?: string;
  lashId?: string;
}

export interface TryOnResult {
  id: string;
  kind: ResultKind;
  styleId: string;
  variantId: string;
  image: string;
  createdAt: string;
  /** "live" = rendered for this person; "demo" = pre-rendered on the sample face. */
  source: "live" | "demo";
  /** YouCam Hair Length Detection read off this render (live wig try-ons). */
  renderLength?: string;
  /** For stacked looks (kind "combo"): what it is made of. */
  layers?: LookLayers;
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
  /** +1 = love it, -1 = not for me */
  value: 1 | -1;
  name?: string;
  note?: string;
  at: string;
}

export interface ShareTally {
  up: number;
  down: number;
}

/** Up/down counts per share item. */
export function tallyShare(share: Pick<Share, "items" | "votes">): ShareTally[] {
  const t = share.items.map(() => ({ up: 0, down: 0 }));
  for (const v of share.votes) {
    if (!t[v.itemIndex]) continue;
    if (v.value === -1) t[v.itemIndex].down++;
    else t[v.itemIndex].up++;
  }
  return t;
}

/** What the passport flow gets back from the hair and face analysis APIs. */
export interface HairReading {
  length?: HairLength;
  texture?: HairTexture;
  curl?: { code: string; label: string };
  density?: 1 | 2 | 3 | 4;
  face?: FaceProfile;
  hairLengthTerm?: string;
  /** Analyses that couldn't be read from these photos, in plain words. */
  notes?: string[];
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
