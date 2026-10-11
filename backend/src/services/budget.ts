import { env } from "../env";
import type { Db } from "../db/pool";

// Circuit breaker for YouCam units. Judges share one deployment, so there is a
// total cap and a per-browser-session cap; when either is reached the app falls
// back to clearly labelled demo results instead of failing.

export class BudgetError extends Error {
  code = "budget_exhausted";
}

export async function spent(db: Db, session?: string) {
  const total = Number((await db.query<{ s: string }>(`select coalesce(sum(units), 0) as s from budget_ledger`)).rows[0].s);
  const mine = session ? Number((await db.query<{ s: string }>(`select coalesce(sum(units), 0) as s from budget_ledger where session = $1`, [session])).rows[0].s) : 0;
  return { total, mine };
}

export async function assertBudget(db: Db, session: string, units: number) {
  const { total, mine } = await spent(db, session);
  if (total + units > env.budgetTotal) throw new BudgetError("Bloom has used today's try-on allowance. You can keep exploring with the sample face.");
  if (mine + units > env.budgetSession) throw new BudgetError("You've reached the try-on limit for this visit. Your saved looks are all still here.");
}

export async function charge(db: Db, session: string, feature: string, units: number) {
  if (units > 0) await db.query(`insert into budget_ledger (session, feature, units) values ($1, $2, $3)`, [session, feature, units]);
}
