import { resolve } from "node:path";
import { instrumentDrizzleClient } from "@kubiks/otel-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import env from "@/env";

const migrationsFolder = resolve(import.meta.dirname, "migrations");

export const db = drizzle(env.DATABASE_URL);
instrumentDrizzleClient(db);

export async function runMigrations() {
  await migrate(db, { migrationsFolder });
}
