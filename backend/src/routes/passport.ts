import fs from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import type { FaceProfile, FaceShape, HairLength, HairReading } from "@bloom/shared";
import type { Db } from "../db/pool";
import { sessionOf } from "../services/session";
import { decodeDataUrl, InputError, normalisePhoto } from "../services/images";
import { assertBudget, charge } from "../services/budget";
import { runTask, uploadImage } from "../youcam/client";
import { env } from "../env";

interface Body {
  front?: string;
  sides?: string[];
  top?: string;
  isDemo?: boolean;
}

const LENGTH_FROM_TERM: Record<string, HairLength> = {
  "above the ears": "short",
  "ear length": "short",
  "ear length or longer": "short",
  "short hair": "short",
  "short hair or longer": "medium",
  "above chest": "medium",
  "above chest or longer": "long",
  "long hair": "long",
};
const SHAPES: FaceShape[] = ["Triangle", "Diamond", "Heart", "InvTriangle", "Oblong", "Oval", "Round", "Square"];

/** Finds the first value for any of `keys` anywhere in a nested result. */
function deep(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  for (const [k, v] of Object.entries(obj)) {
    if (keys.includes(k) && (typeof v === "string" || typeof v === "number")) return v;
  }
  for (const v of Object.values(obj)) {
    const found = deep(v, keys);
    if (found !== undefined) return found;
  }
  return undefined;
}

export async function passportRoutes(app: FastifyInstance, db: Db) {
  // Reads a passport with YouCam's analysis APIs. Colour is measured on the phone;
  // this adds face shape (Face Analyzer), length, curl pattern and density.
  app.post<{ Body: Body }>("/passport/read", async (req): Promise<HairReading> => {
    const { front, sides, top, isDemo } = req.body ?? {};
    if (isDemo) {
      const fixture = path.resolve(path.dirname(env.catalogPath), "demo/analysis.json");
      const a = JSON.parse(fs.readFileSync(fixture, "utf8"));
      return {
        face: { shape: a.faceShape, browShape: a.eyebrowShape[1], browThickness: a.eyebrowThickness[0], eyeShape: a.eyeShape, cheekbones: a.cheekbones },
        hairLengthTerm: a.hairLength,
        length: LENGTH_FROM_TERM[a.hairLength],
      };
    }
    if (!front) throw new InputError("A front photo is needed.", "no_photo");
    const session = sessionOf(req);
    const hasSides = Array.isArray(sides) && sides.length === 2;
    await assertBudget(db, session, 12 + (hasSides ? 2 : 0) + (top ? 1 : 0));

    const frontId = await uploadImage(await normalisePhoto(decodeDataUrl(front)));
    const reading: HairReading = {};

    const jobs: Promise<void>[] = [
      runTask<Record<string, unknown>>("/s2s/v2.0/task/face-attr-analysis", {
        src_file_id: frontId,
        features: ["faceShape", "eyebrowShape", "eyebrowThickness", "eyeShape", "cheekbones"],
      })
        .then(async (r) => {
          const brow = (r.eyebrow ?? {}) as Record<string, string>;
          const shape = String(r.faceshape ?? "");
          if (SHAPES.includes(shape as FaceShape)) {
            const face: FaceProfile = {
              shape: shape as FaceShape,
              browShape: brow.right_shape ?? brow.left_shape ?? "Soft Angled",
              browThickness: brow.right_body_thickness ?? brow.left_body_thickness ?? "Average",
              eyeShape: ((r.eyelid ?? {}) as Record<string, string>).left_shape ?? "Almond",
              cheekbones: ((r.cheekbone ?? {}) as Record<string, string>).overrall ?? ((r.cheekbone ?? {}) as Record<string, string>).overall ?? "",
            };
            reading.face = face;
          }
          await charge(db, session, "face-attr-analysis", 10);
        })
        .catch((e) => req.log.warn({ err: e }, "face analysis skipped")),
      runTask<{ hair_length?: { term?: string } }>("/s2s/v2.0/task/hair-length-detection", { src_file_id: frontId })
        .then(async (r) => {
          const term = r.hair_length?.term;
          if (term) {
            reading.hairLengthTerm = term;
            reading.length = LENGTH_FROM_TERM[term];
            await charge(db, session, "hair-length-detection", 2);
          }
        })
        .catch((e) => req.log.warn({ err: e }, "hair length skipped")),
    ];

    if (hasSides) {
      jobs.push(
        (async () => {
          const [right, left] = await Promise.all(sides!.map(async (s) => uploadImage(await normalisePhoto(decodeDataUrl(s)))));
          const r = await runTask("/s2s/v2.0/task/hair-type-detection", { src_file_ids: [frontId, right, left] });
          const mapping = String(deep(r, ["mapping"]) ?? "");
          const term = String(deep(r, ["term"]) ?? "");
          if (mapping) {
            reading.curl = { code: mapping, label: term || mapping };
            reading.texture = mapping.startsWith("1") ? "straight" : "wavy";
            await charge(db, session, "hair-type-detection", 2);
          }
        })().catch((e) => req.log.warn({ err: e }, "hair type skipped")),
      );
    }
    if (top) {
      jobs.push(
        (async () => {
          const id = await uploadImage(await normalisePhoto(decodeDataUrl(top)));
          const r = await runTask("/s2s/v2.0/task/hair-density-detection", { src_file_id: id });
          const raw = deep(r, ["level", "density", "term", "class", "result"]);
          const level = Number(String(raw ?? "").match(/[1-4]/)?.[0]);
          if (level >= 1 && level <= 4) {
            reading.density = level as 1 | 2 | 3 | 4;
            await charge(db, session, "hair-density-detection", 1);
          }
        })().catch((e) => req.log.warn({ err: e }, "hair density skipped")),
      );
    }
    await Promise.all(jobs);
    return reading;
  });
}
