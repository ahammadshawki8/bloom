import type { LookLayers, ResultKind, TryOnResult } from "@bloom/shared";
import { env } from "../env";
import type { Db } from "../db/pool";
import { newId } from "./images";

interface Row {
  id: string;
  kind: ResultKind;
  style_id: string;
  variant_id: string;
  render_length: string | null;
  layers: LookLayers | null;
  created_at: Date;
}

const toResult = (r: Row): TryOnResult => ({
  id: r.id,
  kind: r.kind,
  styleId: r.style_id,
  variantId: r.variant_id,
  image: `${env.publicUrl}/results/${r.id}`,
  createdAt: new Date(r.created_at).toISOString(),
  source: "live",
  renderLength: r.render_length ?? undefined,
  layers: r.layers ?? undefined,
});

export async function cachedResult(db: Db, cacheKey: string): Promise<TryOnResult | null> {
  const r = await db.query<Row>(`select id, kind, style_id, variant_id, render_length, layers, created_at from results where cache_key = $1`, [cacheKey]);
  return r.rows[0] ? toResult(r.rows[0]) : null;
}

export async function storeResult(
  db: Db,
  input: {
    cacheKey: string;
    kind: ResultKind;
    styleId: string;
    variantId: string;
    bytes: Buffer;
    mime: string;
    renderLength?: string;
    layers?: LookLayers;
    session: string;
  },
): Promise<TryOnResult> {
  const id = newId("r_");
  const r = await db.query<Row>(
    `insert into results (id, cache_key, kind, style_id, variant_id, mime, bytes, render_length, layers, session)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     on conflict (cache_key) do update set cache_key = excluded.cache_key
     returning id, kind, style_id, variant_id, render_length, layers, created_at`,
    [
      id,
      input.cacheKey,
      input.kind,
      input.styleId,
      input.variantId,
      input.mime,
      input.bytes,
      input.renderLength ?? null,
      input.layers ? JSON.stringify(input.layers) : null,
      input.session,
    ],
  );
  return toResult(r.rows[0]);
}

/** A pre-rendered result on the sample face (served by the frontend, costs nothing). */
export function demoResult(kind: ResultKind, styleId: string, variantId: string, renderLength?: string): TryOnResult {
  return {
    id: `${variantId}--demo-${newId()}`,
    kind,
    styleId,
    variantId,
    image: `/fixtures/tryon/${variantId}.webp`,
    createdAt: new Date().toISOString(),
    source: "demo",
    renderLength,
  };
}

/** Raw bytes of a stored result (used as the source for stacked looks). */
export async function resultBytes(db: Db, id: string): Promise<Buffer | null> {
  const r = await db.query<{ bytes: Buffer }>(`select bytes from results where id = $1`, [id]);
  return r.rows[0]?.bytes ?? null;
}
