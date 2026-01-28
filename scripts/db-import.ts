import { parseArgs } from "node:util";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    from: { type: "string", default: "staging" },
    to: { type: "string", default: "local" },
    force: { type: "boolean", default: false },
  },
});

const fromEnv = values.from ?? "staging";
const toTarget = values.to ?? "local";
const force = values.force ?? false;

async function getRailwayDatabaseUrl(env: string): Promise<string> {
  const proc = Bun.spawn(["railway", "variables", "-e", env, "--json"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Failed to get Railway variables for "${env}":\n${stderr}`);
  }

  const json = JSON.parse(await new Response(proc.stdout).text());
  const url = json.DATABASE_URL;
  if (!url) {
    throw new Error(`DATABASE_URL not found in Railway environment "${env}"`);
  }
  return url;
}

async function getTargetUrl(target: string): Promise<string> {
  if (target === "local") {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL not set in environment. Is infisical/dotenv configured?",
      );
    }
    return url;
  }
  return getRailwayDatabaseUrl(target);
}

async function confirm(message: string): Promise<boolean> {
  process.stdout.write(`${message} [y/N] `);
  for await (const line of console) {
    return line.trim().toLowerCase() === "y";
  }
  return false;
}

async function main() {
  console.log(`Importing DB: ${fromEnv} → ${toTarget}`);

  const sourceUrl = await getRailwayDatabaseUrl(fromEnv);
  const targetUrl = await getTargetUrl(toTarget);

  // Prompt for confirmation when targeting a Railway environment
  if (toTarget !== "local" && !force) {
    const ok = await confirm(
      `This will overwrite the "${toTarget}" database. Continue?`,
    );
    if (!ok) {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  console.log("Starting pg_dump...");

  const dump = Bun.spawn(
    ["pg_dump", "--no-owner", "--no-acl", "-Fc", sourceUrl],
    { stdout: "pipe", stderr: "pipe" },
  );

  const restore = Bun.spawn(
    [
      "pg_restore",
      "--no-owner",
      "--no-acl",
      "--clean",
      "--if-exists",
      "-d",
      targetUrl,
    ],
    { stdin: dump.stdout, stderr: "pipe" },
  );

  const [dumpExit, restoreExit] = await Promise.all([
    dump.exited,
    restore.exited,
  ]);

  if (dumpExit !== 0) {
    const stderr = await new Response(dump.stderr).text();
    console.error(`pg_dump failed (exit ${dumpExit}):\n${stderr}`);
    process.exit(1);
  }

  if (restoreExit !== 0) {
    const stderr = await new Response(restore.stderr).text();
    // pg_restore exits 1 for warnings (e.g. dropping non-existent objects), which is fine with --clean --if-exists
    if (restoreExit !== 1) {
      console.error(`pg_restore failed (exit ${restoreExit}):\n${stderr}`);
      process.exit(1);
    }
    if (stderr.trim()) {
      console.warn(`pg_restore warnings:\n${stderr}`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
