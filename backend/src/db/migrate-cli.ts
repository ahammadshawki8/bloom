import { env } from "../env";
import { migrate, seedCatalog } from "./migrate";
import { pool } from "./pool";

await migrate(pool);
const n = await seedCatalog(pool, env.catalogPath);
console.log(`migrated; catalogue seeded with ${n} styles`);
await pool.end();
