import { defineConfig } from "drizzle-kit";
import env from "./env";

const url = env.DATABASE_URL;
if (!url) {
  throw "Database URL is required";
}

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
