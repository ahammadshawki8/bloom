import type { BloomApi, CreateShareInput, HairReading } from "./types";
import { planWithRules, type Share, type Style, type TryOnResult } from "@/lib/types";

// Preview implementation backed by real fixtures. Every try-on image it returns is
// a genuine YouCam render on the sample face (see tools/render_fixtures.mjs), and
// the guide runs the same rule-based planner the backend falls back to.

const SHARE_KEY = "bloom.mock.shares";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number) => base + Math.round(Math.random() * base * 0.4);
const uid = () => Math.random().toString(36).slice(2, 10);

let catalogPromise: Promise<Style[]> | null = null;
const loadCatalog = () =>
  (catalogPromise ??= fetch("/fixtures/catalog.json")
    .then((r) => r.json())
    .then((d: { styles: Style[] }) => d.styles));

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

function result(kind: TryOnResult["kind"], styleId: string, variantId: string, renderLength?: string): TryOnResult {
  return {
    id: `${variantId}--${uid()}`,
    kind,
    styleId,
    variantId,
    image: `/fixtures/tryon/${variantId}.webp`,
    createdAt: new Date().toISOString(),
    source: "demo",
    renderLength,
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

  catalog: loadCatalog,

  async readHair({ isDemo }): Promise<HairReading> {
    // Length, curl, density and face shape come from the YouCam APIs on the backend.
    // In preview mode we return nothing for a real photo rather than invent values.
    await wait(400);
    if (!isDemo) return {};
    const a = await fetch("/fixtures/demo/analysis.json").then((r) => r.json());
    return {
      face: { shape: a.faceShape, browShape: a.eyebrowShape[1], browThickness: a.eyebrowThickness[0], eyeShape: a.eyeShape, cheekbones: a.cheekbones },
      hairLengthTerm: a.hairLength,
    };
  },

  async tryOn({ style, variant }) {
    await wait(jitter(2600));
    return result(style.kind, style.id, variant.id, variant.renderLength);
  },

  async brows({ preset }) {
    await wait(jitter(1800));
    return result("brow", "brows", preset.id);
  },

  async lashes({ preset }) {
    await wait(jitter(1800));
    return result("lash", "lashes", preset.id);
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

  async vote(id, { votes, name, note }) {
    await wait(400);
    const all = readShares();
    const share = all[id];
    if (!share) throw new Error("This link has closed.");
    const at = new Date().toISOString();
    votes.forEach((v, i) => share.votes.push({ itemIndex: v.itemIndex, value: v.value, name, note: i === 0 ? note : undefined, at }));
    writeShares(all);
    return share;
  },

  async guide({ prompt, passport }, onEvent, signal) {
    const styles = await loadCatalog();
    for (const e of planWithRules(prompt, passport, styles)) {
      if (signal?.aborted) return;
      await wait(e.type === "tool" ? jitter(450) : 250);
      onEvent(e);
    }
  },
};
