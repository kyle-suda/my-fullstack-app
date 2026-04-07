/**
 * Production startup script.
 * Runs Prisma migrations, then starts the Express server.
 * Handles missing DATABASE_URL gracefully with a clear error message.
 */

const { execSync } = require("child_process");
const path = require("path");

// ── Validate required environment variables ──────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error("\n========================================================");
  console.error("  FATAL: DATABASE_URL environment variable is not set.");
  console.error("  In Railway: go to your service → Variables tab and add:");
  console.error('    DATABASE_URL  =  ${{Postgres.DATABASE_URL}}');
  console.error("========================================================\n");
  process.exit(1);
}

// ── Run database migrations ──────────────────────────────────────────────────
const serverDir = path.join(__dirname, "server");

try {
  console.log("Running database migrations…");
  execSync("npx prisma migrate deploy", {
    cwd: serverDir,
    stdio: "inherit",
    env: { ...process.env },
  });
  console.log("Migrations complete.\n");
} catch (err) {
  console.error("Migration failed:", err.message);
  console.error("Check that DATABASE_URL is correct and the Postgres service is online.");
  process.exit(1);
}

// ── Start server ─────────────────────────────────────────────────────────────
require(path.join(serverDir, "index.js"));
