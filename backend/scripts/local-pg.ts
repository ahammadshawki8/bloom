// Real Postgres for local development and end-to-end runs, from the official
// binaries (embedded-postgres). No Docker, no system install, no password setup.
import fs from "node:fs";
import EmbeddedPostgres from "embedded-postgres";

export async function startLocalPostgres({ dir, port, persistent }: { dir: string; port: number; persistent: boolean }) {
  const fresh = !fs.existsSync(`${dir}/PG_VERSION`);
  const pg = new EmbeddedPostgres({ databaseDir: dir, port, user: "postgres", password: "bloom", persistent, onLog: () => {} });
  if (fresh) await pg.initialise();
  await pg.start();
  if (fresh) await pg.createDatabase("bloom").catch(() => {});
  return { url: `postgresql://postgres:bloom@127.0.0.1:${port}/bloom`, stop: () => pg.stop() };
}
