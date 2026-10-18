import {
  readFileSync,
  statSync,
  readdirSync,
  lstatSync,
  openSync,
  readSync,
  closeSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
export const magic = Buffer.from("KALOSARA-BACKUP-1\n");
export function keyFromFile(path) {
  if (!path || statSync(path).mode & 0o077)
    throw Error("Backup key requires mode0600");
  const key = readFileSync(path);
  if (key.length !== 32) throw Error("Backup key must contain32 random bytes");
  return key;
}
export function hashFile(path) {
  const hash = createHash("sha256");
  const fd = openSync(path, "r");
  const buffer = Buffer.alloc(1024 * 1024);
  try {
    let bytes;
    while ((bytes = readSync(fd, buffer, 0, buffer.length, null)))
      hash.update(buffer.subarray(0, bytes));
  } finally {
    closeSync(fd);
  }
  return hash.digest("hex");
}
export function checksums(root, folder = root, result = {}) {
  for (const name of readdirSync(folder).sort()) {
    const file = join(folder, name);
    const stat = lstatSync(file);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()))
      throw Error("Backup cannot contain symlinks/special files");
    if (stat.isDirectory()) checksums(root, file, result);
    else result[file.slice(root.length + 1)] = hashFile(file);
  }
  return result;
}
export function pgEnv(value) {
  const url = new URL(value);
  if (url.protocol !== "postgresql:") throw Error("PostgreSQL URL required");
  const sslmode = url.searchParams.get("sslmode");
  if (
    !["localhost", "127.0.0.1"].includes(url.hostname) &&
    !["require", "verify-full", "verify-ca"].includes(sslmode)
  )
    throw Error("Remote backup requires TLS");
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGSSLMODE: sslmode ?? "prefer",
    PGCHANNELBINDING: url.searchParams.get("channel_binding") ?? "prefer",
    PGCONNECT_TIMEOUT: "10",
  };
}
export function testDatabase(value) {
  const url = new URL(value);
  if (
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    !/^\/kalosara_[a-z0-9_]+_test$/.test(url.pathname) ||
    url.search
  )
    throw Error(
      "Restore/load test requires explicit local disposable kalosara_*_test",
    );
  return pgEnv(value);
}
