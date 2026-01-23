/**
 * Development orchestrator script.
 *
 * Starts the full dev environment with dynamic port allocation, allowing
 * multiple instances to run simultaneously without port conflicts.
 *
 * Flow:
 * 1. Find available ports for PostgreSQL, Vite, and Drizzle Studio
 * 2. Start PostgreSQL in Docker with a unique project name
 * 3. Wait for the database to be ready
 * 4. Run Vite dev server and Drizzle Studio concurrently
 * 5. Clean up all processes and containers on exit (Ctrl+C)
 */

import { $ } from "bun";
import concurrently from "concurrently";

const COMPOSE_FILE = "docker-compose.dev.yml";

// --- Port finding using Bun.listen ---
function findPort(start: number, max: number): number {
  for (let port = start; port <= max; port++) {
    try {
      const server = Bun.listen({
        hostname: "127.0.0.1",
        port,
        socket: { data() {} },
      });
      server.stop();
      return port;
    } catch {
      // Port in use, try next
    }
  }
  throw new Error(`No available port found in range ${start}-${max}`);
}

// --- Main ---
const dbPort = findPort(5432, 5500);
const vitePort = findPort(5173, 5200);
const studioPort = findPort(4983, 5100);

console.log(
  `[dev] Ports - DB: ${dbPort}, Vite: ${vitePort}, Studio: ${studioPort}`,
);

// Use DB port to create unique project name (so multiple instances don't clash)
const projectName = `dev-${dbPort}`;

// Override DATABASE_URL with new port
const originalDbUrl = process.env.DATABASE_URL;
if (!originalDbUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}
const dbUrl = new URL(originalDbUrl);
dbUrl.port = String(dbPort);
process.env.DATABASE_URL = dbUrl.toString();

// Start docker with unique project name
const docker = Bun.spawn(
  ["docker", "compose", "-p", projectName, "-f", COMPOSE_FILE, "up"],
  {
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, POSTGRES_PORT: String(dbPort) },
  },
);

// Cleanup handler
const cleanup = async () => {
  console.log("\n[dev] Shutting down...");
  docker.kill();
  await $`docker compose -p ${projectName} -f ${COMPOSE_FILE} down`.quiet();
  process.exit(0);
};
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Wait for DB
console.log("[dev] Waiting for database...");
while (true) {
  const r =
    await $`docker compose -p ${projectName} -f ${COMPOSE_FILE} exec -T postgres pg_isready -U postgres`
      .quiet()
      .nothrow();
  if (r.exitCode === 0) break;
  await Bun.sleep(1000);
}
console.log("[dev] Database ready!");

// Run dev servers
const { result } = concurrently(
  [
    {
      command: `vite dev --port ${vitePort}`,
      name: "VITE",
      prefixColor: "cyan",
    },
    {
      command: `drizzle-kit studio --port ${studioPort}`,
      name: "STUDIO",
      prefixColor: "yellow",
    },
  ],
  { killOthersOn: ["failure"] },
);

await result;
