import { resolve } from "node:path";
import { instrumentDrizzleClient } from "@kubiks/otel-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import env from "@/env";
import * as schema from "./schema";

const migrationsFolder = resolve(process.cwd(), "server/database/migrations");

export const db = drizzle(env.DATABASE_URL, { schema });
instrumentDrizzleClient(db);

// Cross-driver, transaction-compatible handle: the prod pool, a pglite test db,
// and a transaction all satisfy it. Services type their `db` param as this.
// (The base PgDatabase intentionally hides driver internals like `.$client`.)
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export async function runMigrations() {
  await migrate(db, { migrationsFolder });
}
