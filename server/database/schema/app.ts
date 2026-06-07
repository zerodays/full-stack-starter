// Custom application tables - add your own tables here
// This file is NOT overwritten by Better Auth CLI

import { timestamp } from "drizzle-orm/pg-core";

// Helper for generic timestamp columns
export const timestampColumns = {
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};
