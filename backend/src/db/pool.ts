import pg from "pg";
import { env } from "../env";

// Render Postgres needs TLS from outside its private network; local dev does not.
const needsSsl = /render\.com|sslmode=require/.test(env.databaseUrl);

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: env.poolMax,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

export type Db = Pick<pg.Pool, "query">;
