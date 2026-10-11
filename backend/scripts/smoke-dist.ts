// Boots the built server (dist/server.js) with plain node against a throwaway
// Postgres and checks /health and /catalog: proves the production bundle runs.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startLocalPostgres } from "./local-pg";

const pg = await startLocalPostgres({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "bloom-smoke-")), port: 6547, persistent: false });
const server = spawn(process.execPath, ["dist/server.js"], {
  cwd: path.resolve(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL: pg.url, PORT: "8799", LOG_LEVEL: "warn" },
  stdio: "inherit",
});
let ok = false;
for (let i = 0; i < 40 && !ok; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const h = await fetch("http://127.0.0.1:8799/health").then((r) => r.json());
    const c = await fetch("http://127.0.0.1:8799/catalog").then((r) => r.json());
    console.log("health", JSON.stringify(h), "styles", c.styles.length);
    ok = true;
  } catch {
    /* not up yet */
  }
}
server.kill();
await pg.stop();
process.exit(ok ? 0 : 1);
