import { buildApp } from "./app";
import { env } from "./env";
import { migrate, seedCatalog } from "./db/migrate";
import { pool } from "./db/pool";

await migrate(pool);
const n = await seedCatalog(pool, env.catalogPath);
const app = await buildApp({ db: pool });
app.log.info(`catalogue: ${n} styles`);
await app.listen({ port: env.port, host: env.host });

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    await app.close();
    await pool.end();
    process.exit(0);
  });
}
