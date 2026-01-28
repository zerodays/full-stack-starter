import { instrumentDrizzleClient } from "@kubiks/otel-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import env from "@/env";

export const db = drizzle(env.DATABASE_URL);
instrumentDrizzleClient(db);
