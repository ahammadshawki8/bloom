// Local Postgres for development: PGlite (Postgres compiled to WASM) behind a
// Postgres wire-protocol socket, so the backend uses the normal `pg` driver
// exactly as it does against Render Postgres in production.
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const dir = path.resolve(import.meta.dirname, "../.data/pglite");
fs.mkdirSync(dir, { recursive: true });
const db = await PGlite.create(dir);
const server = new PGLiteSocketServer({ db, port: Number(process.env.DEV_DB_PORT ?? 6544), host: "127.0.0.1" });
await server.start();
console.log(`dev Postgres (PGlite) listening on ${server.getServerConn()}  data: ${dir}`);
process.on("SIGINT", async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
