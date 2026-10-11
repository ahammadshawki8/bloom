// Local Postgres for development (real Postgres binaries, data kept in .data/pg).
//   npm run db:dev   then   DATABASE_URL=postgresql://postgres:bloom@127.0.0.1:6544/bloom
import path from "node:path";
import { startLocalPostgres } from "./local-pg";

const dir = path.resolve(import.meta.dirname, "../.data/pg");
const db = await startLocalPostgres({ dir, port: Number(process.env.DEV_DB_PORT ?? 6544), persistent: true });
console.log(`dev Postgres ready: ${db.url}`);
const stop = async () => {
  await db.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
