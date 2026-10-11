import type { BloomApi, CreateShareInput, HairReading } from "./types";
import type { Share, Style, TryOnResult } from "@/lib/types";

// Mock implementation backed by real fixtures. Every try-on image it returns is a
// genuine YouCam render on the demo face (see tools/render_fixtures.mjs).

const SHARE_KEY = "bloom.mock.shares";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number) => base + Math.round(Math.random() * base * 0.4);
const uid = () => Math.random().toString(36).slice(2, 10);

let catalogPromise: Promise<Style[]> | null = null;

function readShares(): Record<string, Share> {
  try {
    return JSON.parse(localStorage.getItem(SHARE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function writeShares(all: Record<string, Share>) {
  try {
    localStorage.setItem(SHARE_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: shares live for this tab only */
  }
}

function result(kind: TryOnResult["kind"], styleId: string, variantId: string): TryOnResult {
  return {
    id: `${variantId}--${uid()}`,
    kind,
    styleId,
    variantId,
    image: `/fixtures/tryon/${variantId}.webp`,
    createdAt: new Date().toISOString(),
    source: "demo",
  };
}

export const mockApi: BloomApi = {
  mode: "mock",

  async health() {
    const slow = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("wake") === "slow";
    if (slow) {
      const started = Number(sessionStorage.getItem("bloom.mock.wakeStart") ?? Date.now());
      sessionStorage.setItem("bloom.mock.wakeStart", String(started));
      await wait(400);
      return Date.now() - started > 9000;
    }
    await wait(120);
    return true;
  },

  catalog() {
    catalogPromise ??= fetch("/fixtures/catalog.json")
      .then((r) => r.json())
      .then((d: { styles: Style[] }) => d.styles);
    return catalogPromise;
  },

  async readHair(): Promise<HairReading> {
    // Length, curl and density come from the YouCam hair APIs on the backend.
    // In preview mode we return nothing rather than invent values for her photo.
    await wait(400);
    return {};
  },

  async tryOn({ style, variant }) {
    await wait(jitter(2600));
    return result(style.kind, style.id, variant.id);
  },

  async brows({ preset }) {
    await wait(jitter(1800));
    return result("brow", "brows", preset.id);
  },

  async createShare(input: CreateShareInput) {
    await wait(500);
    const now = new Date();
    const share: Share = {
      id: uid(),
      ownerName: input.ownerName,
      message: input.message,
      items: input.items,
      votes: [],
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 7 * 864e5).toISOString(),
    };
    const all = readShares();
    all[share.id] = share;
    writeShares(all);
    return share;
  },

  async getShare(id) {
    await wait(300);
    return readShares()[id] ?? null;
  },

  async vote(id, vote) {
    await wait(400);
    const all = readShares();
    const share = all[id];
    if (!share) throw new Error("This link has expired.");
    share.votes.push({ ...vote, at: new Date().toISOString() });
    writeShares(all);
    return share;
  },
};
