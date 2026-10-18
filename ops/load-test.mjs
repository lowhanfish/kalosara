// Bounded, read-only local QA load. Refuses production/Neon targets.
import { performance } from "node:perf_hooks";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const origin = process.env.QA_ORIGIN ?? "http://localhost:3002";
if (origin !== "http://localhost:3002")
  throw Error("Load target must be isolated localhost3002");
const concurrency = Number(process.env.LOAD_CONCURRENCY ?? 4);
const requests = Number(process.env.LOAD_REQUESTS ?? 100);
if (
  !Number.isInteger(concurrency) ||
  concurrency < 1 ||
  concurrency > 10 ||
  !Number.isInteger(requests) ||
  requests < 10 ||
  requests > 500
)
  throw Error("Bounded QA load only (1–10 workers,10–500 requests)");
const pauseMs = Number(process.env.LOAD_PAUSE_MS ?? 50);
if (!Number.isInteger(pauseMs) || pauseMs < 0 || pauseMs > 250)
  throw Error("Bounded pause required");
const pids = (process.env.QA_PIDS ?? "")
  .split(",")
  .filter((value) => /^\d+$/.test(value));
if (!pids.length)
  throw Error("Explicit QA process IDs required for CPU/RAM sampling");
const samples = [];
function sample() {
  const processes = pids.map((pid) => {
    try {
      const values = execFileSync("ps", ["-p", pid, "-o", "pid=,pcpu=,rss="], {
        encoding: "utf8",
      })
        .trim()
        .split(/\s+/)
        .map(Number);
      return {
        pid: values[0],
        cpuPercent: values[1],
        rssMiB: values[2] / 1024,
      };
    } catch {
      return { pid: Number(pid), unavailable: true };
    }
  });
  samples.push(processes);
}
// Database URL guard before importing Prisma or querying any database.
const { testDatabase } = await import("./lib/backup.mjs");
testDatabase(process.env.TEST_DATABASE_URL ?? "");
const { PrismaClient } = await import(
  "../backend/node_modules/@prisma/client/default.js"
);
const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
let maxConnections = 0;
let sampling = false;
async function observe() {
  if (sampling) return;
  sampling = true;
  try {
    sample();
    const rows =
      await db.$queryRaw`SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = current_database()`;
    maxConnections = Math.max(maxConnections, rows[0].count);
  } finally {
    sampling = false;
  }
}
const latency = [];
const statuses = {};
let sent = 0;
// Warm caches separately; cold latency is not mixed with the bounded warm run.
for (const path of ["/", "/berita", "/api/v1/public/news", "/api/v1/ready"]) {
  const r = await fetch(origin + path, { signal: AbortSignal.timeout(10000) });
  await r.body?.cancel();
  if (r.status !== 200) throw Error("QA warmup failed");
}
await observe();
let observationError = false;
const timer = setInterval(
  () =>
    void observe().catch(() => {
      observationError = true;
    }),
  1000,
);
const started = performance.now();
try {
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (sent < requests) {
        const index = sent++;
        const start = performance.now();
        try {
          const path = ["/", "/berita", "/api/v1/public/news", "/api/v1/ready"][
            index % 4
          ];
          const r = await fetch(origin + path, {
            signal: AbortSignal.timeout(10000),
            redirect: "error",
          });
          await r.arrayBuffer();
          statuses[r.status] = (statuses[r.status] ?? 0) + 1;
        } catch {
          statuses.network_error = (statuses.network_error ?? 0) + 1;
        }
        latency.push(performance.now() - start);
        if (pauseMs)
          await new Promise((resolve) => setTimeout(resolve, pauseMs));
      }
    }),
  );
} finally {
  clearInterval(timer);
  while (sampling) await new Promise((resolve) => setTimeout(resolve, 10));
  await observe();
  await db.$disconnect();
}
latency.sort((a, b) => a - b);
const percentile = (n) =>
  Math.round(latency[Math.ceil(latency.length * n) - 1] * 100) / 100;
const processes = pids.map((pid) => {
  const values = samples
    .flat()
    .filter((item) => item.pid === Number(pid) && !item.unavailable);
  return {
    pid: Number(pid),
    samples: values.length,
    peakRssMiB:
      Math.round(Math.max(...values.map((v) => v.rssMiB)) * 100) / 100,
    peakCpuPercent: Math.max(...values.map((v) => v.cpuPercent)),
  };
});
const result = {
  environment: "local QA; not VPS capacity",
  requests,
  concurrency,
  pauseMs,
  elapsedSeconds: (performance.now() - started) / 1000,
  statuses,
  p50ms: percentile(0.5),
  p95ms: percentile(0.95),
  p99ms: percentile(0.99),
  maxDatabaseConnectionsIncludingObserver: maxConnections,
  processes,
  observationError,
};
if (process.env.LOAD_REPORT_FILE)
  writeFileSync(
    process.env.LOAD_REPORT_FILE,
    JSON.stringify(result, null, 2) + "\n",
  );
console.log(JSON.stringify(result));
if (
  statuses[200] !== requests ||
  observationError ||
  processes.some((p) => p.samples === 0)
)
  process.exitCode = 1;
