import { ApiError, type BloomApi } from "./types";
import type { Share, Style, TryOnResult } from "@/lib/types";

// Live implementation talking to the Bloom backend (Render). Wired up in tier B5.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? "Something went wrong.", body.code ?? `http_${res.status}`, body.hint);
  }
  return res.json() as Promise<T>;
}

export const httpApi: BloomApi = {
  mode: "live",
  async health() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${BASE}/health`, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  },
  catalog: () => request<{ styles: Style[] }>("/catalog").then((d) => d.styles),
  readHair: (input) => request("/passport/read", { method: "POST", body: JSON.stringify(input) }),
  tryOn: ({ passport, style, variant }) =>
    request<TryOnResult>("/tryon", {
      method: "POST",
      body: JSON.stringify({ photo: passport.photo, isDemo: passport.isDemo, styleId: style.id, variantId: variant.id }),
    }),
  brows: ({ passport, preset }) =>
    request<TryOnResult>("/brows", {
      method: "POST",
      body: JSON.stringify({ photo: passport.photo, isDemo: passport.isDemo, presetId: preset.id, browHex: passport.browHex }),
    }),
  composeLook: ({ passport, base, palette, necklace }) =>
    request<TryOnResult>("/looks", {
      method: "POST",
      body: JSON.stringify({ isDemo: passport.isDemo, baseResultId: base.id, baseImage: base.image, palette, necklace }),
    }),
  createShare: (input) => request<Share>("/shares", { method: "POST", body: JSON.stringify(input) }),
  getShare: (id) => request<Share>(`/shares/${id}`).catch(() => null),
  vote: (id, vote) => request<Share>(`/shares/${id}/votes`, { method: "POST", body: JSON.stringify(vote) }),
};
