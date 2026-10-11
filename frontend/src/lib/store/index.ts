"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { del, get, set } from "idb-keyval";
import type { Passport, SavedLook, Shelf, TryOnResult } from "@/lib/types";

// Everything personal lives on this device (IndexedDB). Nothing here is sent
// anywhere unless she runs a try-on or chooses to share.

const hasIdb = () => typeof indexedDB !== "undefined";
const idbStorage: StateStorage = {
  getItem: async (name) => (hasIdb() ? ((await get<string>(name)) ?? null) : null),
  setItem: async (name, value) => {
    if (hasIdb()) await set(name, value);
  },
  removeItem: async (name) => {
    if (hasIdb()) await del(name);
  },
};

export interface SentShare {
  id: string;
  createdAt: string;
  expiresAt: string;
  resultIds: string[];
}

interface BloomState {
  hydrated: boolean;
  passport: Passport | null;
  results: Record<string, TryOnResult>;
  saved: SavedLook[];
  shares: SentShare[];
  lastStyleId: string | null;
  setPassport: (p: Passport | null) => void;
  addResult: (r: TryOnResult) => void;
  save: (resultId: string, shelf: Shelf) => void;
  unsave: (resultId: string) => void;
  addShare: (s: SentShare) => void;
  setLastStyle: (id: string) => void;
  clearAll: () => Promise<void>;
}

export const useBloom = create<BloomState>()(
  persist(
    (setState) => ({
      hydrated: false,
      passport: null,
      results: {},
      saved: [],
      shares: [],
      lastStyleId: null,
      setPassport: (passport) => setState({ passport }),
      addResult: (r) => setState((s) => ({ results: { ...s.results, [r.id]: r } })),
      save: (resultId, shelf) =>
        setState((s) => ({
          saved: [{ resultId, shelf, savedAt: new Date().toISOString() }, ...s.saved.filter((x) => x.resultId !== resultId)],
        })),
      unsave: (resultId) => setState((s) => ({ saved: s.saved.filter((x) => x.resultId !== resultId) })),
      addShare: (share) => setState((s) => ({ shares: [share, ...s.shares] })),
      setLastStyle: (lastStyleId) => setState({ lastStyleId }),
      clearAll: async () => {
        setState({ passport: null, results: {}, saved: [], shares: [], lastStyleId: null });
        if (hasIdb()) await del("bloom");
        try {
          localStorage.removeItem("bloom.mock.shares");
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: "bloom",
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ passport, results, saved, shares, lastStyleId }) => ({ passport, results, saved, shares, lastStyleId }),
      onRehydrateStorage: () => () => useBloom.setState({ hydrated: true }),
    },
  ),
);

/** Find the saved entry for a result, if any. */
export const useSavedFor = (resultId: string | undefined) => useBloom((s) => (resultId ? s.saved.find((x) => x.resultId === resultId) : undefined));
