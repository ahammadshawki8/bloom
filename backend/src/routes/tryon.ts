import type { FastifyInstance } from "fastify";
import { BROW_PRESETS, LASH_PRESETS, findVariantIn, type LookLayers } from "@bloom/shared";
import type { Db } from "../db/pool";
import { sessionOf } from "../services/session";
import { loadCatalog } from "../services/catalog";
import { decodeDataUrl, InputError, normalisePhoto, sha256 } from "../services/images";
import { assertBudget, charge } from "../services/budget";
import { cachedResult, demoResult, resultBytes, storeResult } from "../services/results";
import fs from "node:fs";
import path from "node:path";
import { env } from "../env";
import { download, resultUrl, runTask, uploadImage } from "../youcam/client";

interface TryOnBody {
  photo?: string;
  isDemo?: boolean;
  styleId: string;
  variantId: string;
}
interface StackBody {
  photo?: string;
  isDemo?: boolean;
  /** Live: a stored hair try-on to build on. */
  hairResultId?: string;
  /** Sample face: the pre-rendered hair try-on to build on. */
  hairVariantId?: string;
  browId?: string;
  lashId?: string;
  browHex?: string;
}
interface PresetBody {
  photo?: string;
  isDemo?: boolean;
  presetId: string;
  browHex?: string;
}

const BROW_SHAPES: Record<string, { name: string; curvature: number; thickness: number; definition: number }> = {
  "brow--soft-arch": { name: "SoftArch1", curvature: 10, thickness: 20, definition: 60 },
  "brow--straight": { name: "Straight1", curvature: 0, thickness: 30, definition: 60 },
  "brow--curved": { name: "Curved1", curvature: 20, thickness: 15, definition: 60 },
  "brow--high-arch": { name: "HighArch1", curvature: 30, thickness: 10, definition: 70 },
};
const browEffect = (presetId: string, shade: string) => ({
  category: "eyebrows",
  pattern: { type: "shape", ...BROW_SHAPES[presetId] },
  palettes: [{ color: shade, colorIntensity: 75, texture: "matte" }],
});
const lashEffect = (presetId: string) => ({
  category: "eyelashes",
  pattern: { name: LASH_STYLES[presetId].name },
  palettes: [{ color: "#1c1310", colorIntensity: LASH_STYLES[presetId].intensity }],
});

const LASH_STYLES: Record<string, { name: string; intensity: number }> = {
  "lash--natural": { name: "Natural1", intensity: 65 },
  "lash--full": { name: "UpperDense1", intensity: 80 },
  "lash--wispy": { name: "Wispies1", intensity: 75 },
};

export async function tryOnRoutes(app: FastifyInstance, db: Db) {
  // Wigs and head wraps: YouCam AI Hairstyle (hair transfer), then for wigs YouCam
  // Hair Length Detection on the render, so the length claim is measured on her.
  app.post<{ Body: TryOnBody }>("/tryon", async (req) => {
    const { photo, isDemo, styleId, variantId } = req.body ?? ({} as TryOnBody);
    const found = findVariantIn(await loadCatalog(db), variantId);
    if (!found || found.style.id !== styleId) throw new InputError("We couldn't find that style.", "unknown_style");
    const { style, variant } = found;
    if (isDemo) return demoResult(style.kind, style.id, variant.id, variant.renderLength);
    if (!photo) throw new InputError("Your passport photo is missing. Make your passport first.", "no_photo");

    const session = sessionOf(req);
    const src = await normalisePhoto(decodeDataUrl(photo));
    const cacheKey = `hair:${sha256(src)}:${variant.id}`;
    const hit = await cachedResult(db, cacheKey);
    if (hit) return hit;

    const measure = style.kind === "wig";
    await assertBudget(db, session, measure ? 4 : 2);
    const fileId = await uploadImage(src);
    const out = await runTask("/s2s/v2.1/task/hair-transfer", { src_file_id: fileId, ref_file_url: variant.refImageUrl });
    const url = resultUrl(out);
    if (!url) throw new InputError("The try-on came back empty. Please try again.", "empty_result");
    await charge(db, session, "hair-transfer", 2);

    let renderLength: string | undefined;
    if (measure) {
      try {
        const len = await runTask<{ hair_length?: { term?: string } }>("/s2s/v2.0/task/hair-length-detection", { src_file_url: url });
        renderLength = len.hair_length?.term;
        if (renderLength) await charge(db, session, "hair-length-detection", 2);
      } catch {
        // Length is a bonus measurement; the try-on itself succeeded.
      }
    }
    const img = await download(url);
    return storeResult(db, { cacheKey, kind: style.kind, styleId: style.id, variantId: variant.id, bytes: img.bytes, mime: img.mime, renderLength, session });
  });

  // Brows and lashes: YouCam AI Makeup VTO.
  const makeup = (kind: "brow" | "lash") =>
    app.post<{ Body: PresetBody }>(kind === "brow" ? "/brows" : "/lashes", async (req) => {
      const { photo, isDemo, presetId, browHex } = req.body ?? ({} as PresetBody);
      const presets = kind === "brow" ? BROW_PRESETS : LASH_PRESETS;
      if (!presets.some((p) => p.id === presetId)) throw new InputError("Unknown style.", "unknown_preset");
      const group = kind === "brow" ? "brows" : "lashes";
      if (isDemo) return demoResult(kind, group, presetId);
      if (!photo) throw new InputError("Your passport photo is missing. Make your passport first.", "no_photo");

      const session = sessionOf(req);
      const src = await normalisePhoto(decodeDataUrl(photo));
      const shade = /^#[0-9a-f]{6}$/i.test(browHex ?? "") ? browHex! : "#4a3426";
      const cacheKey = `${kind}:${sha256(src)}:${presetId}:${kind === "brow" ? shade : ""}`;
      const hit = await cachedResult(db, cacheKey);
      if (hit) return hit;

      await assertBudget(db, session, 1);
      const effect = kind === "brow" ? browEffect(presetId, shade) : lashEffect(presetId);
      const fileId = await uploadImage(src);
      const out = await runTask("/s2s/v2.0/task/makeup-vto", { src_file_id: fileId, version: "1.0", effects: [effect] });
      const url = resultUrl(out);
      if (!url) throw new InputError("The try-on came back empty. Please try again.", "empty_result");
      await charge(db, session, `makeup-vto:${kind}`, 1);
      const img = await download(url);
      return storeResult(db, { cacheKey, kind, styleId: group, variantId: presetId, bytes: img.bytes, mime: img.mime, session });
    });
  // Stacked looks: brows and/or lashes (one makeup VTO call) on top of a hair
  // try-on, so she sees the whole new face at once. Cached per combination, so a
  // look rendered once is free for everyone after.
  app.post<{ Body: StackBody }>("/stack", async (req) => {
    const { photo, isDemo, hairResultId, hairVariantId, browId, lashId, browHex } = req.body ?? ({} as StackBody);
    if (browId && !BROW_SHAPES[browId]) throw new InputError("Unknown brow style.", "unknown_preset");
    if (lashId && !LASH_STYLES[lashId]) throw new InputError("Unknown lash style.", "unknown_preset");
    if (!browId && !lashId) throw new InputError("Choose brows or lashes to add.", "nothing_to_stack");
    const shade = /^#[0-9a-f]{6}$/i.test(browHex ?? "") ? browHex! : "#4a3426";
    const styles = await loadCatalog(db);
    const fixtures = path.dirname(env.catalogPath);

    let src: Buffer;
    let styleId = "face";
    let variantId: string | undefined;
    if (isDemo) {
      const single = !hairVariantId && Boolean(browId) !== Boolean(lashId);
      if (single) return demoResult(browId ? "brow" : "lash", browId ? "brows" : "lashes", (browId ?? lashId)!);
      if (hairVariantId) {
        const f = findVariantIn(styles, hairVariantId);
        if (!f) throw new InputError("We couldn't find that style.", "unknown_style");
        styleId = f.style.id;
        variantId = f.variant.id;
      }
      const file = path.join(fixtures, variantId ? `tryon/${variantId}.webp` : "demo/face.webp");
      src = await normalisePhoto(fs.readFileSync(file));
    } else if (hairResultId) {
      const bytes = await resultBytes(db, hairResultId);
      if (!bytes) throw new InputError("That try-on has expired. Try the wig or wrap again first.", "base_missing");
      const base = await db.query<{ style_id: string; variant_id: string }>(`select style_id, variant_id from results where id = $1`, [hairResultId]);
      styleId = base.rows[0].style_id;
      variantId = base.rows[0].variant_id;
      src = await normalisePhoto(bytes);
    } else {
      if (!photo) throw new InputError("Your passport photo is missing. Make your passport first.", "no_photo");
      src = await normalisePhoto(decodeDataUrl(photo));
    }

    const layers: LookLayers = { hairResultId: isDemo ? undefined : hairResultId, hairVariantId: variantId, browId, lashId };
    const cacheKey = `stack:${sha256(src)}:${browId ?? "-"}:${lashId ?? "-"}:${browId ? shade : "-"}`;
    const hit = await cachedResult(db, cacheKey);
    if (hit) return hit;

    const session = sessionOf(req);
    await assertBudget(db, session, 1);
    const effects = [browId ? browEffect(browId, shade) : null, lashId ? lashEffect(lashId) : null].filter(Boolean);
    const fileId = await uploadImage(src);
    const out = await runTask("/s2s/v2.0/task/makeup-vto", { src_file_id: fileId, version: "1.0", effects });
    const url = resultUrl(out);
    if (!url) throw new InputError("The try-on came back empty. Please try again.", "empty_result");
    await charge(db, session, "makeup-vto:stack", 1);
    const img = await download(url);
    return storeResult(db, { cacheKey, kind: "combo", styleId, variantId: variantId ?? [browId, lashId].filter(Boolean).join("+"), bytes: img.bytes, mime: img.mime, layers, session });
  });

  makeup("brow");
  makeup("lash");
}
