import type { InsertUser } from "@/server/utils/testing/test-user";

export const TestUser1: InsertUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "user1@example.com",
  name: "Test User 1",
  createdAt: new Date(),
};

export const TestUser2: InsertUser = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "user2@example.com",
  name: "Test User 2",
  createdAt: new Date(),
};

export const testUsers = [TestUser1, TestUser2];
