import type { BrowPreset, HairLength, HairTexture, Passport, Share, Style, TryOnResult, Variant } from "@/lib/types";

export interface HairReading {
  length?: HairLength;
  texture?: HairTexture;
  curl?: { code: string; label: string };
  density?: 1 | 2 | 3 | 4;
}

export interface CreateShareInput {
  ownerName?: string;
  message?: string;
  items: Share["items"];
}

/** Everything the frontend needs from the outside world. */
export interface BloomApi {
  readonly mode: "mock" | "live";
  health(): Promise<boolean>;
  catalog(): Promise<Style[]>;
  readHair(input: { front: string; sides?: string[]; top?: string }): Promise<HairReading>;
  tryOn(input: { passport: Passport; style: Style; variant: Variant }): Promise<TryOnResult>;
  brows(input: { passport: Passport; preset: BrowPreset }): Promise<TryOnResult>;
  /** Chained pipeline: hair try-on -> makeup VTO (brows, lashes, lip, blush) -> necklace VTO. */
  composeLook(input: { passport: Passport; base: TryOnResult; palette: string; necklace: string | null }): Promise<TryOnResult>;
  createShare(input: CreateShareInput): Promise<Share>;
  getShare(id: string): Promise<Share | null>;
  vote(id: string, vote: { itemIndex: number; name?: string; note?: string }): Promise<Share>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly hint?: string,
  ) {
    super(message);
  }
}
