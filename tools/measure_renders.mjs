// Runs YouCam Hair Length Detection on every wig try-on render, turning the VTO
// output into a measurement: "on her, this wig reads as <length>".
// Usage: node tools/measure_renders.mjs <dir-with-render-jpgs>
import fs from "node:fs";
import path from "node:path";
import { task, upload } from "./yc.mjs";

const dir = process.argv[2];
const catPath = path.resolve("frontend/public/fixtures/catalog.json");
const cat = JSON.parse(fs.readFileSync(catPath, "utf8"));
const jobs = cat.styles.filter((s) => s.kind === "wig").flatMap((s) => s.variants).filter((v) => !v.renderLength);
console.log(jobs.length, "renders to measure");
let ok = 0;
async function worker() {
  while (jobs.length) {
    const v = jobs.shift();
    try {
      const id = await upload(path.join(dir, `${v.id}.jpg`));
      const r = await task("/s2s/v2.0/task/hair-length-detection", { src_file_id: id });
      const term = r.json?.data?.results?.hair_length?.term;
      if (!term) throw new Error(JSON.stringify(r).slice(0, 200));
      v.renderLength = term;
      ok++;
      console.log("OK", v.id, term);
    } catch (e) {
      console.log("FAIL", v.id, e.message);
    }
  }
}
await Promise.all([worker(), worker(), worker()]);
fs.writeFileSync(catPath, JSON.stringify(cat, null, 1));
console.log("done", ok);
