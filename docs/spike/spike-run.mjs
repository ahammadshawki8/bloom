// THROWAWAY feasibility spike for Crown+. Not product code.
// Usage: node spike-run.mjs <task-path e.g. /s2s/v2.1/task/hair-transfer> '<json body>' <out-name>
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Path to an env file holding YOUCAM_API_KEY / YOUCAM_SECRET_KEY (default: ./.env in the cwd).
const ENV = process.env.ENV_FILE ?? ".env";
for (const line of (fs.existsSync(ENV) ? fs.readFileSync(ENV, "utf8") : "").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const BASE = "https://yce-api-01.perfectcorp.com";
const KEY = process.env.YOUCAM_API_KEY;
const SECRET = process.env.YOUCAM_SECRET_KEY;
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "spike", "out");
fs.mkdirSync(OUT, { recursive: true });

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

let bearer = KEY;
async function call(method, p, body) {
  let r = await fetch(`${BASE}${p}`, {
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

const [, , taskPath, bodyStr, outName] = process.argv;
const t0 = Date.now();
const start = await call("POST", taskPath, JSON.parse(bodyStr));
const taskId = start.json?.data?.task_id;
if (!taskId) {
  console.log("START FAILED", start.status, JSON.stringify(start.json));
  process.exit(1);
}
for (;;) {
  await new Promise((r) => setTimeout(r, 2500));
  const s = await call("GET", `${taskPath}/${encodeURIComponent(taskId)}`);
  const d = s.json?.data ?? {};
  if (d.task_status === "running" || d.task_status === "pending") continue;
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (d.task_status !== "success") {
    console.log(outName, "ERROR after", secs, "s", JSON.stringify(s.json).slice(0, 600));
    process.exit(1);
  }
  const res = d.results ?? d.result ?? {};
  const url = res.url ?? res.urls?.[0] ?? res.output?.[0]?.url;
  if (url) {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, `${outName}.jpg`), buf);
    console.log(outName, "OK", secs, "s ->", path.join(OUT, `${outName}.jpg`));
  } else {
    console.log(outName, "OK (no url) ", secs, "s", JSON.stringify(res).slice(0, 1500));
  }
  break;
}
