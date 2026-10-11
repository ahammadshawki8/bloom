// Pre-render real YouCam try-ons on the demo face for every catalogue variant,
// plus brow presets. These double as the zero-cost demo cache.
// Resumable: skips outputs that already exist. Units are only consumed on success.
// Usage (repo root):  node tools/render_fixtures.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const BASE = "https://yce-api-01.perfectcorp.com";
const KEY = process.env.YOUCAM_API_KEY;
const SECRET = process.env.YOUCAM_SECRET_KEY;
const DEMO_FACE = "https://plugins-media.makeupar.com/strapi/assets/face_reshape_01_85c8ffc055.jpg";
const OUT = path.join(ROOT, "frontend", "public", "fixtures", "tryon");
const DRY = process.argv.includes("--dry");
fs.mkdirSync(OUT, { recursive: true });

let bearer = KEY;
async function legacyToken() {
  const pub = crypto.createPublicKey({ key: Buffer.from(SECRET, "base64"), format: "der", type: "spki" });
  const id_token = crypto
    .publicEncrypt({ key: pub, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(`client_id=${KEY}&timestamp=${Date.now()}`))
    .toString("base64");
  const r = await fetch(`${BASE}/s2s/v1.0/client/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: KEY, id_token }),
  });
  const j = await r.json();
  return j?.result?.access_token ?? j?.data?.access_token;
}
async function call(method, p, body) {
  const r = await fetch(`${BASE}${p}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && bearer === KEY) {
    bearer = await legacyToken();
    return call(method, p, body);
  }
  return { status: r.status, json: await r.json().catch(() => null) };
}

async function runTask(taskPath, body, outFile) {
  const start = await call("POST", taskPath, body);
  const taskId = start.json?.data?.task_id;
  if (!taskId) throw new Error(`start failed ${start.status} ${JSON.stringify(start.json).slice(0, 300)}`);
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const s = await call("GET", `${taskPath}/${encodeURIComponent(taskId)}`);
    const d = s.json?.data ?? {};
    if (d.task_status === "running" || d.task_status === "pending") continue;
    if (d.task_status !== "success") throw new Error(`task error ${JSON.stringify(s.json).slice(0, 300)}`);
    const res = d.results ?? d.result ?? {};
    const url = res.url ?? res.urls?.[0];
    fs.writeFileSync(outFile, Buffer.from(await (await fetch(url)).arrayBuffer()));
    return;
  }
  throw new Error("timeout");
}

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "frontend", "public", "fixtures", "catalog.json"), "utf8"));
const jobs = [];
for (const style of catalog.styles) {
  for (const v of style.variants) {
    jobs.push({
      name: v.id,
      out: path.join(OUT, `${v.id}.jpg`),
      run: (out) => runTask("/s2s/v2.1/task/hair-transfer", { src_file_url: DEMO_FACE, ref_file_url: v.refImageUrl }, out),
    });
  }
}
const BROWS = [
  { id: "brow--soft-arch", name: "SoftArch1", curvature: 10, thickness: 20, definition: 60 },
  { id: "brow--straight", name: "Straight1", curvature: 0, thickness: 30, definition: 60 },
  { id: "brow--curved", name: "Curved1", curvature: 20, thickness: 15, definition: 60 },
  { id: "brow--high-arch", name: "HighArch1", curvature: 30, thickness: 10, definition: 70 },
];
for (const b of BROWS) {
  jobs.push({
    name: b.id,
    out: path.join(OUT, `${b.id}.jpg`),
    run: (out) =>
      runTask(
        "/s2s/v2.0/task/makeup-vto",
        {
          src_file_url: DEMO_FACE,
          version: "1.0",
          effects: [
            {
              category: "eyebrows",
              pattern: { type: "shape", name: b.name, curvature: b.curvature, thickness: b.thickness, definition: b.definition },
              palettes: [{ color: "#4a3426", colorIntensity: 75, texture: "matte" }],
            },
          ],
        },
        out,
      ),
  });
}

const todo = jobs.filter((j) => !fs.existsSync(j.out));
console.log(`${jobs.length} jobs, ${todo.length} to render`);
if (DRY) process.exit(0);
let ok = 0, fail = 0;
async function worker() {
  while (todo.length) {
    const j = todo.shift();
    try {
      await j.run(j.out);
      ok++;
      console.log("OK", j.name);
    } catch (e) {
      fail++;
      console.log("FAIL", j.name, e.message);
    }
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log(`done ok=${ok} fail=${fail}`);
