import fs from "node:fs";
import type { Style } from "@bloom/shared";
import type { Db } from "./pool";

// Ordered, idempotent migrations. Each runs once, recorded in schema_migrations.
const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_init",
    sql: `
      create table if not exists catalog_styles (
        id text primary key,
        kind text not null,
        position int not null,
        data jsonb not null,
        updated_at timestamptz not null default now()
      );
      create table if not exists results (
        id text primary key,
        cache_key text unique,
        kind text not null,
        style_id text not null,
        variant_id text not null,
        mime text not null,
        bytes bytea not null,
        render_length text,
        session text,
        created_at timestamptz not null default now()
      );
      create table if not exists budget_ledger (
        id bigserial primary key,
        session text not null,
        feature text not null,
        units int not null,
        created_at timestamptz not null default now()
      );
      create index if not exists budget_ledger_session on budget_ledger(session);
      create table if not exists shares (
        id text primary key,
        owner_name text,
        message text,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null
      );
      create table if not exists share_items (
        share_id text not null references shares(id) on delete cascade,
        idx int not null,
        result_id text not null,
        image text not null,
        title text not null,
        subtitle text not null default '',
        primary key (share_id, idx)
      );
      create table if not exists share_votes (
        id bigserial primary key,
        share_id text not null references shares(id) on delete cascade,
        item_index int not null,
        value smallint not null check (value in (-1, 1)),
        name text,
        note text,
        created_at timestamptz not null default now()
      );
      create table if not exists agent_runs (
        id bigserial primary key,
        session text,
        prompt text not null,
        planner text not null,
        picks jsonb,
        created_at timestamptz not null default now()
      );
    `,
  },
  {
    id: "002_result_layers",
    sql: `alter table results add column if not exists layers jsonb;`,
  },
];

export async function migrate(db: Db) {
  await db.query(`create table if not exists schema_migrations (id text primary key, ran_at timestamptz not null default now())`);
  const done = new Set((await db.query<{ id: string }>(`select id from schema_migrations`)).rows.map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    await db.query(m.sql);
    await db.query(`insert into schema_migrations (id) values ($1)`, [m.id]);
  }
}

/** Loads the catalogue (built by tools/build_catalog.py) into Postgres. Safe to re-run. */
export async function seedCatalog(db: Db, catalogPath: string) {
  if (!fs.existsSync(catalogPath)) throw new Error(`Catalogue not found at ${catalogPath}`);
  const { styles } = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as { styles: Style[] };
  for (const [i, s] of styles.entries()) {
    await db.query(
      `insert into catalog_styles (id, kind, position, data) values ($1, $2, $3, $4)
       on conflict (id) do update set kind = excluded.kind, position = excluded.position, data = excluded.data, updated_at = now()`,
      [s.id, s.kind, i, JSON.stringify(s)],
    );
  }
  return styles.length;
}
