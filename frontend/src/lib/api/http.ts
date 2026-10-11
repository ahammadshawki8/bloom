import { ApiError, type BloomApi, type GuideEvent } from "./types";
import type { Share, Style, TryOnResult } from "@/lib/types";
import { sessionId } from "@/lib/session";

// Live implementation talking to the Bloom backend (Render).

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/$/, "");

const headers = () => ({ "Content-Type": "application/json", "X-Bloom-Session": sessionId() });

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  } catch {
    throw new ApiError("Network error", "network", "We couldn't reach Bloom. Check your connection and try again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? "Something went wrong.", body.code ?? `http_${res.status}`, body.hint ?? body.message);
  }
  return res.json() as Promise<T>;
}

const photoOf = (p: { isDemo: boolean; photo: string }) => (p.isDemo ? undefined : p.photo);

export const httpApi: BloomApi = {
  mode: "live",

  async health() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${API_URL}/health`, { signal: ctrl.signal, cache: "no-store" });
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
      body: JSON.stringify({ photo: photoOf(passport), isDemo: passport.isDemo, styleId: style.id, variantId: variant.id }),
    }),

  brows: ({ passport, preset }) =>
    request<TryOnResult>("/brows", {
      method: "POST",
      body: JSON.stringify({ photo: photoOf(passport), isDemo: passport.isDemo, presetId: preset.id, browHex: passport.browHex }),
    }),

  lashes: ({ passport, preset }) =>
    request<TryOnResult>("/lashes", {
      method: "POST",
      body: JSON.stringify({ photo: photoOf(passport), isDemo: passport.isDemo, presetId: preset.id }),
    }),

  stack: ({ passport, hair, browId, lashId }) =>
    request<TryOnResult>("/stack", {
      method: "POST",
      body: JSON.stringify({
        isDemo: passport.isDemo,
        photo: hair ? undefined : photoOf(passport),
        hairResultId: !passport.isDemo && hair ? hair.id : undefined,
        hairVariantId: passport.isDemo && hair ? hair.variantId : undefined,
        browId,
        lashId,
        browHex: passport.browHex,
      }),
    }),

  createShare: (input) => request<Share>("/shares", { method: "POST", body: JSON.stringify(input) }),
  getShare: (id) => request<Share>(`/shares/${encodeURIComponent(id)}`).catch(() => null),
  vote: (id, input) => request<Share>(`/shares/${encodeURIComponent(id)}/votes`, { method: "POST", body: JSON.stringify(input) }),

  async guide({ prompt, passport, saved }, onEvent, signal) {
    // The agent never needs the photo, only measured facts.
    const res = await fetch(`${API_URL}/agent`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ prompt, passport: { ...passport, photo: "" }, saved }),
      signal,
    }).catch(() => null);
    if (!res || !res.ok || !res.body) {
      const body = res ? await res.json().catch(() => ({})) : {};
      throw new ApiError(
        body.message ?? "The guide is unavailable.",
        body.code ?? "guide_unavailable",
        body.hint ?? "The guide couldn't start. Please try again in a moment.",
      );
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let i: number;
      while ((i = buffer.indexOf("\n\n")) >= 0) {
        const chunk = buffer.slice(0, i);
        buffer = buffer.slice(i + 2);
        if (chunk.startsWith("data: ")) onEvent(JSON.parse(chunk.slice(6)) as GuideEvent);
      }
    }
  },
};
