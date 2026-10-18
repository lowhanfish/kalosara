// Exercises the production Nginx template on isolated ports with mock upstreams.
// No request is forwarded to the user's API/database. Certificate trust is explicit.
import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
const binary = process.env.NGINX_BIN;
if (!binary) throw Error("Explicit native NGINX_BIN required");
const temp = mkdtempSync(join(tmpdir(), "kalosara-tls-test-"));
let nginx;
const frontend = http.createServer((_req, res) => res.end("QA frontend"));
const backend = http.createServer(async (req, res) => {
  let size = 0;
  for await (const chunk of req) size += chunk.length;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ size }));
});
try {
  await new Promise((accept, reject) => {
    frontend.once("error", reject);
    frontend.listen(4101, "127.0.0.1", accept);
  });
  await new Promise((accept, reject) => {
    backend.once("error", reject);
    backend.listen(4103, "127.0.0.1", accept);
  });
  execFileSync(
    process.env.OPENSSL_BIN ?? "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      join(temp, "key.pem"),
      "-out",
      join(temp, "cert.pem"),
      "-days",
      "1",
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  mkdirSync(join(temp, "logs"));
  let config = readFileSync(
    resolve(import.meta.dirname, "../nginx-production.conf"),
    "utf8",
  )
    .replaceAll("__DOMAIN__", "localhost")
    .replace("listen 80;", "listen 127.0.0.1:3080;")
    .replace("listen 443 ssl;", "listen 127.0.0.1:3443 ssl;")
    .replace(
      "/etc/letsencrypt/live/localhost/fullchain.pem",
      join(temp, "cert.pem"),
    )
    .replace(
      "/etc/letsencrypt/live/localhost/privkey.pem",
      join(temp, "key.pem"),
    )
    .replaceAll("/var/log/nginx/", temp + "/logs/")
    .replaceAll("127.0.0.1:4000", "127.0.0.1:4103")
    .replaceAll("127.0.0.1:3001", "127.0.0.1:4101");
  config = `worker_processes 1;\npid ${temp}/nginx.pid;\nerror_log ${temp}/logs/error.log;\nevents {worker_connections 128;}\nhttp {${config}\n}\n`;
  const file = join(temp, "nginx.conf");
  writeFileSync(file, config, { mode: 0o600 });
  execFileSync(binary, ["-p", temp + "/", "-c", file, "-t"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  nginx = spawn(binary, ["-p", temp + "/", "-c", file, "-g", "daemon off;"], {
    stdio: "ignore",
  });
  const ca = readFileSync(join(temp, "cert.pem"));
  const request = (path, body, plain = false, headers = {}) =>
    new Promise((accept, reject) => {
      const req = (plain ? http : https).request(
        {
          hostname: "localhost",
          port: plain ? 3080 : 3443,
          path,
          method: body ? "POST" : "GET",
          ca,
          headers: {
            ...headers,
            ...(body
              ? {
                  "Content-Type": "multipart/form-data; boundary=qa",
                  "Content-Length": body.length,
                }
              : {}),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () =>
            accept({ status: res.statusCode, headers: res.headers, data }),
          );
        },
      );
      req.on("error", reject);
      req.end(body);
    });
  let available = false;
  for (let i = 0; i < 40; i++) {
    try {
      if ((await request("/")).status === 200) {
        available = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(available, "TLS proxy startup");
  assert.equal((await request("/api/internal/revalidate")).status, 404);
  const redirect = await request("/?x=1", undefined, true, {
    Host: "attacker.invalid",
  });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.location, "https://localhost/?x=1");
  assert.equal(
    (await request("/api/v1/public/test", Buffer.alloc(1024 * 1024 + 1)))
      .status,
    413,
  );
  const allowed = await request(
    "/api/v1/admin/media",
    Buffer.alloc(20 * 1024 * 1024 + 8192),
  );
  assert.equal(allowed.status, 200);
  assert.equal(JSON.parse(allowed.data).size, 20 * 1024 * 1024 + 8192);
  assert.equal(
    (await request("/api/v1/admin/media", Buffer.alloc(21 * 1024 * 1024 + 1)))
      .status,
    413,
  );
  console.log(
    JSON.stringify({
      passed: 6,
      checks: [
        "nginx config validation",
        "TLS trusted temporary certificate",
        "internal webhook404",
        "canonical HTTPS redirect despite hostile Host",
        "default1MiB body cap",
        "multipart20MiB+overhead accepted and21MiB+1 rejected",
      ],
      publicDomainCertificateTested: false,
    }),
  );
} finally {
  if (nginx && nginx.exitCode === null) {
    nginx.kill("SIGTERM");
    await Promise.race([
      once(nginx, "exit"),
      new Promise((resolve) =>
        setTimeout(() => {
          nginx.kill("SIGKILL");
          resolve();
        }, 5000),
      ),
    ]);
  }
  await Promise.all(
    [frontend, backend].map(
      (server) => new Promise((resolve) => server.close(() => resolve())),
    ),
  );
  rmSync(temp, { recursive: true, force: true });
}
