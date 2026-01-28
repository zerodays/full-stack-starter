import { user } from "@/server/database/schema";
import type { TestDb } from "./test-db";

export type InsertUser = typeof user.$inferInsert;

export const importTestUsers = async (
  db: TestDb["db"],
  testUsers: InsertUser[],
) => {
  await db.insert(user).values(testUsers);
};
