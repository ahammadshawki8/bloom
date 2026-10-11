import { httpApi } from "./http";
import { mockApi } from "./mock";
import type { BloomApi } from "./types";

export const api: BloomApi = process.env.NEXT_PUBLIC_API_MODE === "live" ? httpApi : mockApi;
export * from "./types";
