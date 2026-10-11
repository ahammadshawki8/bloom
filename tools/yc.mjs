// Minimal YouCam API client for tooling (fixtures, probes). The product client lives in backend/.
// Usage:
//   node tools/yc.mjs task <path> '<json body>'            -> prints final task JSON
//   node tools/yc.mjs upload <local-file>                    -> prints file_id
//   node tools/yc.mjs get <path>                              -> prints JSON
// Bodies may reference local files as "@file:<path>"; they are uploaded and replaced by file ids.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
export const BASE = "https://yce-api-01.perfectcorp.com";
const KEY = process.env.YOUCAM_API_KEY;
const SECRET = process.env.YOUCAM_SECRET_KEY;

let bearer = KEY;
async function legacyToken() {
  const pub = crypto.createPublicKey({ key: Buffer.from(SECRET, "base64"), format: "der", type: "spki" });
  const id_token = crypto
    .publicEncrypt({ key: pub, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(`client_id=${KEY}&timestamp=${Date.now()}`))
    .toString("base64");
  const r = await fetch(`${BASE}/s2s/v1.0/client/auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: KEY, id_token }) });
  const j = await r.json();
  return j?.result?.access_token ?? j?.data?.access_token;
}

export async function call(method, p, body) {
  const r = await fetch(`${BASE}${p}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401 && bearer === KEY) {
    bearer = await legacyToken();
    return call(method, p, body);
  }
  return { status: r.status, json: await r.json().catch(() => null) };
}

export async function upload(file, feature = "") {
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).slice(1).toLowerCase();
  const content_type = ext === "png" ? "image/png" : "image/jpeg";
  const res = await call("POST", `/s2s/v2.0/file${feature ? "/" + feature : ""}`, { files: [{ content_type, file_name: path.basename(file), file_size: buf.length }] });
  const f = res.json?.data?.files?.[0] ?? res.json?.result?.files?.[0];
  if (!f) throw new Error(`upload init failed ${res.status} ${JSON.stringify(res.json).slice(0, 300)}`);
  const req = f.requests?.[0];
  const put = await fetch(req.url, { method: req.method ?? "PUT", headers: req.headers ?? { "Content-Type": content_type }, body: buf });
  if (!put.ok) throw new Error(`upload PUT failed ${put.status}`);
  return f.file_id;
}

async function resolveFiles(v) {
  if (typeof v === "string" && v.startsWith("@file:")) return upload(v.slice(6));
  if (Array.isArray(v)) return Promise.all(v.map(resolveFiles));
  if (v && typeof v === "object") return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await resolveFiles(x)])));
  return v;
}

export async function task(p, body, { poll = 2500, max = 80 } = {}) {
  const start = await call("POST", p, await resolveFiles(body));
  const id = start.json?.data?.task_id;
  if (!id) return { started: false, ...start };
  for (let i = 0; i < max; i++) {
    await new Promise((r) => setTimeout(r, poll));
    const s = await call("GET", `${p}/${encodeURIComponent(id)}`);
    const st = s.json?.data?.task_status;
    if (st === "running" || st === "pending") continue;
    return { started: true, status: st, json: s.json };
  }
  return { started: true, status: "timeout" };
}

export async function download(url, out) {
  fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()));
}

const [, , cmd, a, b] = process.argv;
if (cmd === "task") console.log(JSON.stringify(await task(a, JSON.parse(b ?? "{}")), null, 1));
if (cmd === "upload") console.log(await upload(a));
if (cmd === "get") console.log(JSON.stringify((await call("GET", a)).json, null, 1).slice(0, 4000));
