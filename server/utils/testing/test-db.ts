import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/server/database/schema";

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

export const createTestDb = async () => {
  const client = new PGlite({
    extensions: { uuid_ossp, pg_trgm },
  });
  const db = drizzle({ client, schema });

  await migrate(db, { migrationsFolder: "./server/database/migrations" });

  return { dbClient: client, db };
};
