import { createAuthClient } from "better-auth/react";

// Better Auth requires a full URL
const baseURL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/auth`
    : "http://localhost:5173/api/auth";

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
