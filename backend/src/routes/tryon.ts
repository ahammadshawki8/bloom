import type { FastifyInstance } from "fastify";
import { BROW_PRESETS, LASH_PRESETS, findVariantIn } from "@bloom/shared";
import type { Db } from "../db/pool";
import { sessionOf } from "../services/session";
import { loadCatalog } from "../services/catalog";
import { decodeDataUrl, InputError, normalisePhoto, sha256 } from "../services/images";
import { assertBudget, charge } from "../services/budget";
import { cachedResult, demoResult, storeResult } from "../services/results";
import { download, resultUrl, runTask, uploadImage } from "../youcam/client";

interface TryOnBody {
  photo?: string;
  isDemo?: boolean;
  styleId: string;
  variantId: string;
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
      const effect =
        kind === "brow"
          ? {
              category: "eyebrows",
              pattern: { type: "shape", ...BROW_SHAPES[presetId] },
              palettes: [{ color: shade, colorIntensity: 75, texture: "matte" }],
            }
          : { category: "eyelashes", pattern: { name: LASH_STYLES[presetId].name }, palettes: [{ color: "#1c1310", colorIntensity: LASH_STYLES[presetId].intensity }] };
      const fileId = await uploadImage(src);
      const out = await runTask("/s2s/v2.0/task/makeup-vto", { src_file_id: fileId, version: "1.0", effects: [effect] });
      const url = resultUrl(out);
      if (!url) throw new InputError("The try-on came back empty. Please try again.", "empty_result");
      await charge(db, session, `makeup-vto:${kind}`, 1);
      const img = await download(url);
      return storeResult(db, { cacheKey, kind, styleId: group, variantId: presetId, bytes: img.bytes, mime: img.mime, session });
    });
  makeup("brow");
  makeup("lash");
}
