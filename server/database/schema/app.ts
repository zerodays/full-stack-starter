// Custom application tables - add your own tables here
// This file is NOT overwritten by Better Auth CLI

// Example:
// import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
// import { user } from "./auth";
//
// export const project = pgTable("project", {
//   id: text("id").primaryKey(),
//   name: text("name").notNull(),
//   ownerId: text("owner_id")
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });
