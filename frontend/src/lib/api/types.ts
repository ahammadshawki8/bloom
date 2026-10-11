import type { BrowPreset, GuideEvent, HairReading, Passport, Share, Style, TryOnResult, Variant } from "@/lib/types";

export type { HairReading } from "@/lib/types";
export type { GuideEvent } from "@/lib/types";

export interface CreateShareInput {
  ownerName?: string;
  message?: string;
  items: Share["items"];
}

export interface VoteInput {
  votes: { itemIndex: number; value: 1 | -1 }[];
  name?: string;
  note?: string;
}

/** Everything the frontend needs from the outside world. */
export interface BloomApi {
  readonly mode: "mock" | "live";
  health(): Promise<boolean>;
  catalog(): Promise<Style[]>;
  readHair(input: { front: string; sides?: string[]; top?: string; isDemo?: boolean }): Promise<HairReading>;
  tryOn(input: { passport: Passport; style: Style; variant: Variant }): Promise<TryOnResult>;
  brows(input: { passport: Passport; preset: BrowPreset }): Promise<TryOnResult>;
  lashes(input: { passport: Passport; preset: BrowPreset }): Promise<TryOnResult>;
  /** Brows and/or lashes layered on top of a hair try-on (or her own face). */
  stack(input: { passport: Passport; hair: TryOnResult | null; browId?: string; lashId?: string }): Promise<TryOnResult>;
  createShare(input: CreateShareInput): Promise<Share>;
  getShare(id: string): Promise<Share | null>;
  vote(id: string, input: VoteInput): Promise<Share>;
  /** The Bloom guide: streams the agent's steps and its shortlist. */
  guide(input: { prompt: string; passport: Passport }, onEvent: (e: GuideEvent) => void, signal?: AbortSignal): Promise<void>;
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
