"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

// The backend runs on Render's free tier, which sleeps after ~15 idle minutes and
// takes up to a minute or two to boot. We warm it the moment the landing page
// opens, and if someone taps into the studio before it's awake we show a gentle
// waiting toast and poll /health until it answers.

type WakeStatus = "idle" | "checking" | "waking" | "ready" | "failed";

interface WakeState {
  status: WakeStatus;
  lastOkAt: number;
  startedAt: number;
  pending: string | null;
}

const POLL_MS = 4000;
const GIVE_UP_MS = 3.5 * 60_000;
const FRESH_MS = 60_000;

export const useWake = create<WakeState>(() => ({ status: "idle", lastOkAt: 0, startedAt: 0, pending: null }));

let polling: Promise<boolean> | null = null;

async function check(): Promise<boolean> {
  const ok = await api.health();
  if (ok) useWake.setState({ status: "ready", lastOkAt: Date.now() });
  return ok;
}

/** Fire-and-forget warm-up ping. */
export function warmBackend() {
  const s = useWake.getState();
  if (s.status !== "idle") return;
  useWake.setState({ status: "checking" });
  check().then((ok) => {
    if (!ok) useWake.setState({ status: "idle" });
  });
}

/** Resolves true once the backend answers, polling gently while it boots. */
export function ensureAwake(pending: string): Promise<boolean> {
  const s = useWake.getState();
  if (s.status === "ready" && Date.now() - s.lastOkAt < FRESH_MS) return Promise.resolve(true);
  if (polling) {
    useWake.setState({ pending });
    return polling;
  }
  polling = (async () => {
    if (await check()) return true;
    useWake.setState({ status: "waking", startedAt: Date.now(), pending });
    while (Date.now() - useWake.getState().startedAt < GIVE_UP_MS) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      if (useWake.getState().status !== "waking") return false; // cancelled
      if (await check()) return true;
    }
    useWake.setState({ status: "failed" });
    return false;
  })().finally(() => {
    polling = null;
  });
  return polling;
}

export function cancelWaking() {
  useWake.setState({ status: "idle", pending: null });
}
