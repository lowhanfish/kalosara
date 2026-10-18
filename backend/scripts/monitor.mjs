/* global fetch, AbortSignal, console */
import process from 'node:process';
import { performance } from 'node:perf_hooks';
// Read-only operator snapshot. No env/database/client data is read or printed.
import { statfsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
const args = process.argv.slice(2);
const pids = args.filter((value) => /^\d+$/.test(value));
const disk = statfsSync(process.cwd());
const diskUsedPercent = Math.round(100 * (1 - disk.bavail / disk.blocks));
const processes = pids.map((pid) => {
  try {
    const values = execFileSync('ps', ['-p', pid, '-o', 'pid=,pcpu=,rss='], {
      encoding: 'utf8',
    })
      .trim()
      .split(/\s+/)
      .map(Number);
    return {
      pid: values[0],
      cpuPercent: values[1],
      rssMiB: Math.round(values[2] / 1024),
    };
  } catch {
    return { pid: Number(pid), unavailable: true };
  }
});
const memoryUsedPercent = Math.round(100 * (1 - os.freemem() / os.totalmem()));
const probes = await Promise.all(
  [
    ['api', 'http://127.0.0.1:4000/api/v1/health'],
    ['database', 'http://127.0.0.1:4000/api/v1/ready'],
    ['frontend', 'http://localhost:3001/'],
  ].map(async ([service, url]) => {
    const started = performance.now();
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      });
      await r.body?.cancel();
      return {
        service,
        status: r.status,
        ms: Math.round(performance.now() - started),
      };
    } catch {
      return {
        service,
        status: 0,
        ms: Math.round(performance.now() - started),
      };
    }
  }),
);
const alerts = [
  ...(diskUsedPercent >= 80 ? ['disk_at_least_80_percent'] : []),
  ...(memoryUsedPercent >= 85 ? ['memory_at_least_85_percent'] : []),
  ...(os.loadavg()[0] > os.cpus().length ? ['load_above_cpu_count'] : []),
  ...probes
    .filter((p) => p.status !== 200)
    .map((p) => `${p.service}_unavailable`),
  ...probes
    .filter((p) => p.status === 200 && p.ms > 2000)
    .map((p) => `${p.service}_slow`),
  ...processes
    .filter((p) => p.unavailable)
    .map((p) => `process_${p.pid}_unavailable`),
  ...processes
    .filter((p) => p.cpuPercent >= 90)
    .map((p) => `process_${p.pid}_cpu_at_least_90_percent`),
];
console.log(
  JSON.stringify({
    time: new Date().toISOString(),
    loadAverage: os.loadavg(),
    memoryUsedPercent,
    diskUsedPercent,
    freeDiskGiB: Math.round((disk.bavail * disk.bsize) / 1024 ** 3),
    processes,
    probes,
    alerts,
  }),
);
if (alerts.length) process.exitCode = 1;
