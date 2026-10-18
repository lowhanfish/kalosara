// End-to-end release rehearsal. All mutations stay on explicit LOCAL disposable DBs.
import { spawn, execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  openSync,
  closeSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import os from "node:os";
import { testDatabase, hashFile } from "./lib/backup.mjs";
import { verifyRelease } from "./lib/release.mjs";
const root = resolve(import.meta.dirname, "..");
const sourceUrl = process.env.TEST_DATABASE_URL;
const restoredUrl = process.env.TEST_RESTORE_DATABASE_URL;
testDatabase(sourceUrl ?? "");
testDatabase(restoredUrl ?? "");
if (sourceUrl === restoredUrl)
  throw Error("Separate restore database required");
const release = resolve(process.env.QA_RELEASE_DIR ?? "");
const manifest = verifyRelease(release);
if (manifest.origin !== "http://localhost:3002")
  throw Error("QA release must target localhost3002");
const temp = mkdtempSync("/tmp/kalosara-p14-qa-");
const fixture = join(temp, "fixture.json");
const children = [];
const env = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: sourceUrl,
  APP_ORIGIN: "http://localhost:3002",
  FRONTEND_INTERNAL_URL: "http://localhost:3002",
  UPLOAD_ROOT: join(temp, "uploads"),
  AUTH_SIGNING_KEYS: `qa:${randomBytes(32).toString("base64url")}`,
  CACHE_INVALIDATION_SECRET: randomBytes(32).toString("hex"),
};
const reports = {};
let stage = "migrations";
function run(script, args = [], extra = {}) {
  return execFileSync(process.execPath, [join(root, script), ...args], {
    cwd: root,
    env: { ...env, ...extra },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}
function start(file, cwd, extra) {
  const log = openSync(
    join(temp, `process-${children.length}.log`),
    "w",
    0o600,
  );
  const child = spawn(process.execPath, [file], {
    cwd,
    env: { ...env, ...extra },
    stdio: ["ignore", log, log],
  });
  closeSync(log);
  children.push(child);
  return child;
}
async function stop() {
  for (const child of children)
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGTERM");
  await Promise.all(
    children.map((child) =>
      child.exitCode !== null || child.signalCode !== null
        ? undefined
        : new Promise((resolve) => {
            const timeout = setTimeout(() => {
              child.kill("SIGKILL");
              resolve();
            }, 15000);
            child.once("exit", () => {
              clearTimeout(timeout);
              resolve();
            });
          }),
    ),
  );
}
async function ready(url) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) });
      await r.body?.cancel();
      if (r.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw Error("QA startup failed");
}
try {
  const prismaBin = join(root, "backend/node_modules/prisma/build/index.js");
  execFileSync(process.execPath, [prismaBin, "migrate", "deploy"], {
    cwd: join(root, "backend"),
    env: { ...env, DATABASE_URL: sourceUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  stage = "fixture";
  run("backend/scripts/qa-fixture.mjs", [], {
    TEST_DATABASE_URL: sourceUrl,
    QA_FIXTURE_FILE: fixture,
  });
  stage = "startup";
  const api = start("dist/server.js", join(release, "backend"), {
    PORT: "4002",
  });
  const frontend = start("server.js", join(release, "frontend"), {
    PORT: "3002",
    HOSTNAME: "127.0.0.1",
    SITE_ORIGIN: "http://localhost:3002",
    API_INTERNAL_URL: "http://127.0.0.1:4002",
  });
  stage = "API readiness";
  await ready("http://127.0.0.1:4002/api/v1/ready");
  stage = "frontend readiness";
  await ready("http://localhost:3002/");
  stage = "browser";
  reports.browser = JSON.parse(
    run("frontend/scripts/security-e2e.mjs", [], {
      QA_FIXTURE_FILE: fixture,
    }).trim(),
  );
  stage = "load";
  reports.load = JSON.parse(
    run("ops/load-test.mjs", [], {
      TEST_DATABASE_URL: sourceUrl,
      QA_PIDS: `${api.pid},${frontend.pid}`,
      LOAD_REQUESTS: process.env.LOAD_REQUESTS ?? "100",
      LOAD_CONCURRENCY: process.env.LOAD_CONCURRENCY ?? "4",
    }).trim(),
  );
  stage = "uploads";
  // Include a real PRIVATE image and its PUBLIC derivatives in the restore drill.
  const users = JSON.parse(readFileSync(fixture, "utf8"));
  const csrfResponse = await fetch("http://localhost:4002/api/v1/auth/csrf");
  const csrf = (await csrfResponse.json()).data.csrfToken;
  let cookies = csrfResponse.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  const headers = {
    Origin: env.APP_ORIGIN,
    "X-CSRF-Token": csrf,
    Cookie: cookies,
  };
  const login = await fetch("http://localhost:4002/api/v1/auth/login", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: users.admin.email,
      password: users.admin.password,
    }),
  });
  if (login.status !== 200) throw Error("QA upload login failed");
  cookies +=
    "; " +
    login.headers
      .getSetCookie()
      .map((v) => v.split(";")[0])
      .join("; ");
  headers.Cookie = cookies;
  const media = [];
  for (const visibility of ["PRIVATE", "PUBLIC"]) {
    const body = new FormData();
    body.set("visibility", visibility);
    body.set("alt", "QA restore");
    body.set("caption", "");
    body.set("source", "general");
    body.set(
      "file",
      new Blob(
        [
          readFileSync(
            join(root, "frontend/public/images/watundehoa/konawe.png"),
          ),
        ],
        { type: "image/png" },
      ),
      "fixture.png",
    );
    const r = await fetch("http://localhost:4002/api/v1/admin/media", {
      method: "POST",
      headers,
      body,
    });
    if (r.status !== 201) throw Error("QA media upload failed");
    media.push((await r.json()).data.asset);
  }
  await stop();
  const keyFile = join(temp, "backup.key");
  writeFileSync(keyFile, randomBytes(32), { mode: 0o600 });
  const archive = join(temp, "backup.enc");
  const started = performance.now();
  stage = "backup";
  reports.backup = JSON.parse(
    run("ops/backup.mjs", [archive], {
      MAINTENANCE_CONFIRMED: "1",
      SOURCE_COMMIT: manifest.commit,
      BACKUP_DATABASE_URL: sourceUrl,
      BACKUP_KEY_FILE: keyFile,
    }).trim(),
  );
  const tampered = join(temp, "tampered.enc");
  const bytes = readFileSync(archive);
  bytes[bytes.length - 1] ^= 1;
  writeFileSync(tampered, bytes, { mode: 0o600 });
  try {
    run("ops/restore-test.mjs", [tampered], {
      TEST_DATABASE_URL: restoredUrl,
      BACKUP_KEY_FILE: keyFile,
      RESTORE_UPLOAD_ROOT: join(temp, "tampered-uploads"),
    });
    throw Error("Tampered backup accepted");
  } catch (error) {
    if (!error.status) throw error;
  }
  stage = "restore";
  reports.restore = JSON.parse(
    run("ops/restore-test.mjs", [archive], {
      TEST_DATABASE_URL: restoredUrl,
      BACKUP_KEY_FILE: keyFile,
      RESTORE_UPLOAD_ROOT: join(temp, "restored-uploads"),
    }).trim(),
  );
  reports.restore.elapsedSeconds =
    Math.round((performance.now() - started) / 10) / 100;
  reports.restore.tamperedArchiveRejected = true;
  start("dist/server.js", join(release, "backend"), {
    PORT: "4002",
    DATABASE_URL: restoredUrl,
    UPLOAD_ROOT: join(temp, "restored-uploads"),
  });
  await ready("http://127.0.0.1:4002/api/v1/ready");
  for (const asset of media) {
    const publicFile = await fetch(
      `http://localhost:4002/api/v1/public/media/${asset.id}`,
    );
    if (publicFile.status !== (asset.visibility === "PUBLIC" ? 200 : 404))
      throw Error("Restored visibility mismatch");
    await publicFile.body?.cancel();
    const ownerFile = await fetch(
      `http://localhost:4002/api/v1/admin/media/${asset.id}/file`,
      { headers: { Cookie: cookies } },
    );
    if (ownerFile.status !== 200) throw Error("Restored owner access failed");
    await ownerFile.body?.cancel();
  }
  const log = readFileSync(join(temp, "process-0.log"), "utf8");
  if (
    Object.values(users).some(
      (user) => log.includes(user.email) || log.includes(user.password),
    )
  )
    throw Error("QA logs contain credentials");
  reports.restore.privateAndPublicAccessVerified = true;
  reports.backup.archiveSha256 = hashFile(archive);
  reports.environment = {
    cpuLogicalCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model,
    totalMemoryGiB: Math.round(os.totalmem() / 1024 ** 3),
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    releaseCommit: manifest.commit,
    realOffsiteTested: false,
    publicHttpsTested: false,
  };
  if (process.env.QA_REPORT_FILE)
    writeFileSync(
      process.env.QA_REPORT_FILE,
      JSON.stringify(reports, null, 2) + "\n",
    );
  console.log(JSON.stringify(reports));
} catch {
  for (let i = 0; i < children.length; i++) {
    try {
      const log = readFileSync(join(temp, `process-${i}.log`), "utf8");
      const missing = log.match(
        /Cannot find (?:module|package) ['"]([^'"]+)['"]/,
      );
      if (missing)
        console.error(`QA process${i} missing module: ${missing[1]}`);
    } catch {}
  }
  console.error(
    `QA rehearsal failed at ${stage}. Credentials and child outputs suppressed; verify build/tools and disposable databases.`,
  );
  process.exitCode = 1;
} finally {
  await stop();
  rmSync(temp, { recursive: true, force: true });
}
