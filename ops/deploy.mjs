// Operator-only Linux deployment. No build, secret output or automatic migration.
import {
  readFileSync,
  lstatSync,
  realpathSync,
  existsSync,
  symlinkSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";
import { verifyRelease } from "./lib/release.mjs";
const base = "/srv/kalosara";
const target = resolve(process.argv[2] ?? "");
if (
  process.platform !== "linux" ||
  !/^\/srv\/kalosara\/releases\/[a-f0-9]{40}$/.test(target) ||
  realpathSync(target) !== target
)
  throw Error(
    "Only a pinned Linux release under /srv/kalosara/releases is allowed",
  );
const manifest = verifyRelease(target);
if (
  target.split("/").at(-1) !== manifest.commit ||
  !manifest.origin.startsWith("https:")
)
  throw Error("Release directory/origin mismatch");
const backend = parseEnv(readFileSync("/etc/kalosara/backend.env", "utf8"));
const frontend = parseEnv(readFileSync("/etc/kalosara/frontend.env", "utf8"));
if (
  backend.APP_ORIGIN !== manifest.origin ||
  frontend.SITE_ORIGIN !== manifest.origin ||
  !backend.CACHE_INVALIDATION_SECRET ||
  backend.CACHE_INVALIDATION_SECRET !== frontend.CACHE_INVALIDATION_SECRET ||
  backend.UPLOAD_ROOT !== base + "/shared/uploads" ||
  backend.PORT !== "4000" ||
  frontend.PORT !== "3001" ||
  frontend.HOSTNAME !== "127.0.0.1"
)
  throw Error("Runtime configuration mismatch");
const serviceNode = execFileSync(
  "/usr/bin/node",
  ["-p", 'process.versions.node.split(".")[0]'],
  { encoding: "utf8" },
).trim();
if (serviceNode !== String(manifest.nodeMajor))
  throw Error("Systemd Node version does not match release");
if (process.env.ROLLBACK_SCHEMA_COMPATIBLE !== "1")
  throw Error(
    "Confirm backward-compatible database schema before enabling automatic application rollback",
  );
// Separate approvals: migration review and a verified offsite backup receipt.
if (process.env.MIGRATIONS_REVIEWED_COMMIT !== manifest.commit)
  throw Error(
    "Review migration status separately and set MIGRATIONS_REVIEWED_COMMIT",
  );
const receipt = JSON.parse(
  readFileSync(process.env.BACKUP_RECEIPT_FILE ?? "", "utf8"),
);
const age = Date.now() - Date.parse(receipt.createdAt);
if (
  receipt.version !== 1 ||
  receipt.approvedForCommit !== manifest.commit ||
  receipt.offsiteVerified !== true ||
  !/^[a-f0-9]{64}$/.test(receipt.sha256) ||
  !Number.isFinite(age) ||
  age < 0 ||
  age > 86400000
)
  throw Error("A verified offsite backup receipt from the last24h is required");
const current = join(base, "current");
if (existsSync(current) && !lstatSync(current).isSymbolicLink())
  throw Error("Current release must be a managed symlink");
const previous = existsSync(current) ? realpathSync(current) : null;
if (previous && !/^\/srv\/kalosara\/releases\/[a-f0-9]{40}$/.test(previous))
  throw Error("Previous release outside managed root");
const systemctl = (...args) =>
  execFileSync("systemctl", args, { stdio: "inherit" });
function switchTo(path) {
  const temp = join(base, `.current-${process.pid}`);
  if (existsSync(temp)) unlinkSync(temp);
  symlinkSync(path, temp);
  renameSync(temp, current);
}
async function healthy() {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const results = await Promise.all(
        ["http://127.0.0.1:4000/api/v1/ready", "http://127.0.0.1:3001/"].map(
          (url) =>
            fetch(url, {
              signal: AbortSignal.timeout(3000),
              redirect: "error",
            }).then(async (response) => {
              await response.body?.cancel();
              return response.status === 200;
            }),
        ),
      );
      if (results.every(Boolean)) return true;
    } catch {
      /* wait for startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}
systemctl("stop", "kalosara-frontend", "kalosara-backend");
try {
  switchTo(target);
  systemctl("start", "kalosara-backend", "kalosara-frontend");
  if (!(await healthy())) throw Error("Readiness failed");
} catch {
  systemctl("stop", "kalosara-frontend", "kalosara-backend");
  if (previous) {
    switchTo(previous);
    systemctl("start", "kalosara-backend", "kalosara-frontend");
  }
  throw Error(
    "Release failed; previous application restored when available. Database was not rolled back.",
  );
}
console.log(
  JSON.stringify({ event: "release_activated", commit: manifest.commit }),
);
