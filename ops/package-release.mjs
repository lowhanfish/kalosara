// Build outputs must already pass checks. Never copy .env, DB data or uploads.
import {
  cpSync,
  rmSync,
  mkdirSync,
  existsSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { resolve, join, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { runtimePackages } from "./lib/runtime-deps.mjs";
import { inventory, verifyRelease } from "./lib/release.mjs";
const root = resolve(import.meta.dirname, "..");
const output = resolve(process.argv[2] ?? "");
if (!process.argv[2] || existsSync(output))
  throw Error("Specify a new empty output path");
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
if (!/^[a-f0-9]{40}$/.test(commit)) throw Error("Invalid Git commit");
const origin = new URL(process.env.SITE_ORIGIN ?? "");
if (
  origin.origin !== process.env.SITE_ORIGIN ||
  (origin.protocol !== "https:" && origin.origin !== "http://localhost:3002")
)
  throw Error(
    "Explicit HTTPS release origin or isolated localhost3002 required",
  );
if (origin.username || origin.password) throw Error("Invalid release origin");
const routes = JSON.parse(
  readFileSync(join(root, "frontend/.next/routes-manifest.json"), "utf8"),
);
const rewrite = (
  Array.isArray(routes.rewrites) ? routes.rewrites : routes.rewrites.afterFiles
).find((item) => item.source === "/api/v1/:path*");
if (
  !rewrite?.destination.startsWith(
    (process.env.API_INTERNAL_URL ?? "http://localhost:4000") + "/api/v1/",
  )
)
  throw Error("Built API rewrite does not match release target");
if (
  origin.protocol === "https:" &&
  !JSON.stringify(routes.headers).includes("Strict-Transport-Security")
)
  throw Error("Build lacks HTTPS headers");
const copy = (source, dest) =>
  cpSync(source, dest, {
    recursive: true,
    verbatimSymlinks: true,
    filter: (path) =>
      !basename(path).startsWith(".env") &&
      !basename(path).startsWith("._") &&
      !["uploads", ".git", "cache"].includes(basename(path)),
  });
mkdirSync(output, { recursive: true, mode: 0o700 });
const backend = join(output, "backend");
mkdirSync(backend);
for (const name of ["package.json", "package-lock.json", "dist"])
  copy(join(root, "backend", name), join(backend, name));
// Ignore lifecycle scripts and optional peer toolchains; Sharp's platform packages remain.
execFileSync(
  "npm",
  [
    "ci",
    "--omit=dev",
    "--omit=peer",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
  { cwd: backend, stdio: "inherit" },
);
// npm retains devOptional peers even with omit flags; prune by locked runtime closure.
const lock = JSON.parse(
  readFileSync(join(backend, "package-lock.json"), "utf8"),
);
const keep = runtimePackages(lock);
for (const key of Object.keys(lock.packages)
  .filter((key) => key.startsWith("node_modules/") && !keep.has(key))
  .sort((a, b) => b.length - a.length))
  rmSync(join(backend, key), { recursive: true, force: true });
rmSync(join(backend, "node_modules/.bin"), { recursive: true, force: true });
copy(
  join(root, "backend/node_modules/.prisma"),
  join(backend, "node_modules/.prisma"),
);
mkdirSync(join(backend, "prisma"));
copy(
  join(root, "backend/prisma/schema.prisma"),
  join(backend, "prisma/schema.prisma"),
);
copy(
  join(root, "backend/prisma/migrations"),
  join(backend, "prisma/migrations"),
);
for (const name of ["typescript", "eslint", "vitest", "prisma"])
  if (existsSync(join(backend, "node_modules", name)))
    throw Error("Development tool leaked into backend release");
const frontend = join(output, "frontend");
copy(join(root, "frontend/.next/standalone"), frontend);
copy(join(root, "frontend/.next/static"), join(frontend, ".next/static"));
copy(join(root, "frontend/public"), join(frontend, "public"));
const files = inventory(output);
// Reject known configured secrets even if a build tool accidentally inlined them.
const secrets = [
  "DATABASE_URL",
  "AUTH_SIGNING_KEYS",
  "CACHE_INVALIDATION_SECRET",
]
  .map((key) => process.env[key])
  .filter((v) => v && v.length >= 16);
for (const [key, item] of Object.entries(files))
  if (item.sha256 && /\.(?:js|json|html|txt|map)$/.test(key)) {
    const content = readFileSync(join(output, key), "utf8");
    if (secrets.some((secret) => content.includes(secret)))
      throw Error("Configured secret detected in release");
  }
writeFileSync(
  join(output, "release.json"),
  JSON.stringify(
    {
      version: 1,
      commit,
      origin: origin.origin,
      platform: process.platform,
      arch: process.arch,
      nodeMajor: Number(process.versions.node.split(".")[0]),
      files,
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
verifyRelease(output);
console.log(
  JSON.stringify({
    event: "release_packaged",
    commit,
    files: Object.keys(files).length,
  }),
);
