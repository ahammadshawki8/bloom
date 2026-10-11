// One bounded run of the full stack: a throwaway real Postgres + the real backend, then Playwright against the production frontend
// build in live mode. Everything shuts down when the tests finish.
//   npx tsx --env-file=../.env scripts/e2e-live.ts [playwright args]
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { startLocalPostgres } from "./local-pg";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bloom-pg-"));
const localPg = await startLocalPostgres({ dir, port: 6545, persistent: false });
process.env.DATABASE_URL = localPg.url;
process.env.PG_POOL_MAX = "5";
process.env.LOG_LEVEL ??= "warn";
process.env.CATALOG_PATH ??= path.resolve(import.meta.dirname, "../../frontend/public/fixtures/catalog.json");

const { pool } = await import("../src/db/pool");
const { migrate, seedCatalog } = await import("../src/db/migrate");
const { buildApp } = await import("../src/app");
await migrate(pool);
await seedCatalog(pool, process.env.CATALOG_PATH);
const app = await buildApp({ db: pool });
await app.listen({ port: 8787, host: "127.0.0.1" });
console.log("backend ready on :8787 (local Postgres)");

const code = await new Promise<number>((resolve) => {
  const p = spawn("npx", ["playwright", "test", ...process.argv.slice(2)], {
    cwd: path.resolve(import.meta.dirname, "../../frontend"),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, E2E_PORT: "3300" },
  });
  p.on("exit", (c) => resolve(c ?? 1));
});

const spent = await pool.query<{ s: string }>("select coalesce(sum(units),0) as s from budget_ledger");
console.log(`YouCam units charged during this run: ${spent.rows[0].s}`);
await app.close();
await pool.end();
await localPg.stop();
process.exit(code);
