// "Complete the look" fixtures: one chained pipeline per look.
//   hair try-on render  ->  makeup VTO (brows + lashes + lip + blush, one call)  ->  necklace VTO
// Usage: node tools/render_looks.mjs <dir-with-render-jpgs> [--only=<base>]
import fs from "node:fs";
import path from "node:path";
import { task, upload, download } from "./yc.mjs";

const dir = process.argv[2];
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const OUT = path.resolve("frontend/public/fixtures/looks");
fs.mkdirSync(OUT, { recursive: true });

export const BASES = ["bamboo-turban--sage-green", "floral-head-scarf--floral", "tracy-short-wig--copper-glaze"];
export const PALETTES = {
  "soft-rose": { lip: "#b4626b", blush: "#d9898c" },
  "warm-berry": { lip: "#86354a", blush: "#c9727a" },
  "natural-nude": { lip: "#b0786c", blush: "#d4a08e" },
};
// Earrings were tried first, but the earring engine needs visible earlobes and
// wraps / wigs cover them ("earlobe alignment not confident"). Necklaces sit on the
// collarbone, which every passport photo shows, so they work with every look.
export const NECKLACES = {
  pearl: "https://cdn.shopify.com/s/files/1/0015/3849/0427/files/263-102-186-G_1_9e2ab3f0-7e48-4312-b2ec-6c35feb14468.jpg",
  shell: "https://cdn.shopify.com/s/files/1/0015/3849/0427/files/266-101-186-G_1_90095544-5b6e-45c4-a70c-a7eb38ba935a.jpg",
};

const effects = (p) => [
  {
    category: "eyebrows",
    pattern: { type: "shape", name: "SoftArch1", curvature: 10, thickness: 20, definition: 60 },
    palettes: [{ color: "#4a3426", colorIntensity: 70, texture: "matte" }],
  },
  { category: "eyelashes", pattern: { name: "Natural1" }, palettes: [{ color: "#1f1512", colorIntensity: 75 }] },
  { category: "lip_color", shape: { name: "original" }, palettes: [{ color: p.lip, texture: "satin", colorIntensity: 55 }], style: { type: "full" } },
  { category: "blush", pattern: { name: "1color1" }, palettes: [{ color: p.blush, texture: "matte", colorIntensity: 45 }] },
];

const resultUrl = (r) => r.json?.data?.results?.url ?? r.json?.data?.results?.urls?.[0];
let units = 0;

for (const base of BASES.filter((b) => !only || b === only)) {
  const baseId = await upload(path.join(dir, `${base}.jpg`));
  for (const [pname, p] of Object.entries(PALETTES)) {
    const makeupOut = path.join(OUT, `${base}--${pname}.jpg`);
    let makeupUrl = null;
    if (!fs.existsSync(makeupOut)) {
      const r = await task("/s2s/v2.0/task/makeup-vto", { src_file_id: baseId, version: "1.0", effects: effects(p) });
      makeupUrl = resultUrl(r);
      if (!makeupUrl) {
        console.log("FAIL makeup", base, pname, JSON.stringify(r).slice(0, 400));
        continue;
      }
      units += 1;
      await download(makeupUrl, makeupOut);
      console.log("OK makeup", base, pname);
    }
    for (const [ename, ref] of Object.entries(NECKLACES)) {
      const out = path.join(OUT, `${base}--${pname}--${ename}.jpg`);
      if (fs.existsSync(out)) continue;
      const src = makeupUrl ? { src_file_url: makeupUrl } : { src_file_id: await upload(makeupOut) };
      // The 2D VTO API wants the inputs twice: flat, and as source_info / object_infos with names.
      const r = await task("/s2s/v2.0/task/2d-vto/necklace", {
        ...src,
        ref_file_urls: [ref],
        source_info: { name: "selfie", ...src },
        object_infos: [{ name: "necklace", ref_file_urls: [ref] }],
      });
      const url = resultUrl(r);
      if (!url) {
        console.log("FAIL necklace", base, pname, ename, JSON.stringify(r).slice(0, 400));
        continue;
      }
      units += 1;
      await download(url, out);
      console.log("OK necklace", base, pname, ename);
    }
  }
}
console.log("units used", units);
