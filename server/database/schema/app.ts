// Custom application tables - add your own tables here
// This file is NOT overwritten by Better Auth CLI

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Helper for generic timestamp columns
const timestampColumns = {
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// TODO: EXAMPLE TABLE - you should remove this
export const project = pgTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestampColumns,
});
