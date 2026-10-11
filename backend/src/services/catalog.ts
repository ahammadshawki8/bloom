import type { Style } from "@bloom/shared";
import type { Db } from "../db/pool";

let cache: { at: number; styles: Style[] } | null = null;

export async function loadCatalog(db: Db): Promise<Style[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.styles;
  const rows = (await db.query<{ data: Style }>(`select data from catalog_styles order by position`)).rows;
  cache = { at: Date.now(), styles: rows.map((r) => r.data) };
  return cache.styles;
}

export function clearCatalogCache() {
  cache = null;
}
