// Restore is deliberately restricted to disposable LOCAL databases and fresh temp uploads.
import {
  mkdtempSync,
  readFileSync,
  statSync,
  openSync,
  readSync,
  closeSync,
  createReadStream,
  createWriteStream,
  rmSync,
  cpSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import { createDecipheriv } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { magic, keyFromFile, checksums, testDatabase } from "./lib/backup.mjs";
let temporary;
try {
  const env = testDatabase(process.env.TEST_DATABASE_URL ?? "");
  const key = keyFromFile(process.env.BACKUP_KEY_FILE);
  const source = resolve(process.argv[2] ?? "");
  const destination = process.env.RESTORE_UPLOAD_ROOT;
  if (!destination?.startsWith("/tmp/kalosara-") || existsSync(destination))
    throw Error("New /tmp/kalosara-* upload path required");
  const size = statSync(source).size;
  const fd = openSync(source, "r");
  const head = Buffer.alloc(magic.length + 12);
  const tag = Buffer.alloc(16);
  try {
    readSync(fd, head, 0, head.length, 0);
    readSync(fd, tag, 0, 16, size - 16);
  } finally {
    closeSync(fd);
  }
  if (!head.subarray(0, magic.length).equals(magic) || size < head.length + 17)
    throw Error("Invalid archive");
  temporary = mkdtempSync(join(tmpdir(), "kalosara-restore-"));
  const archive = join(temporary, "snapshot.tar");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    head.subarray(magic.length),
  );
  decipher.setAuthTag(tag);
  await pipeline(
    createReadStream(source, { start: head.length, end: size - 17 }),
    decipher,
    createWriteStream(archive, { mode: 0o600, flags: "wx" }),
  );
  const list = execFileSync("tar", ["-tf", archive], { encoding: "utf8" })
    .trim()
    .split("\n");
  if (
    list.some(
      (path) =>
        path.startsWith("/") ||
        path.split("/").includes("..") ||
        !/^(?:db\.dump|manifest\.json|uploads\/?(?:.*))$/.test(path),
    )
  )
    throw Error("Unsafe archive path");
  const types = execFileSync("tar", ["-tvf", archive], { encoding: "utf8" })
    .trim()
    .split("\n");
  if (types.some((line) => !["-", "d"].includes(line[0])))
    throw Error("Links/special archive entries forbidden");
  execFileSync("tar", ["-xf", archive, "-C", temporary], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  const manifest = JSON.parse(
    readFileSync(join(temporary, "manifest.json"), "utf8"),
  );
  const files = { ...checksums(join(temporary, "uploads")) };
  const actual = {
    "db.dump": checksums(temporary)["db.dump"],
    ...Object.fromEntries(
      Object.entries(files).map(([path, hash]) => ["uploads/" + path, hash]),
    ),
  };
  const expected = manifest.files;
  if (
    manifest.version !== 1 ||
    Object.keys(actual).length !== Object.keys(expected).length ||
    Object.entries(actual).some(([key, value]) => expected[key] !== value)
  )
    throw Error("Manifest checksum mismatch");
  execFileSync(
    process.env.PG_RESTORE_BIN ?? "pg_restore",
    [
      "--exit-on-error",
      "--no-owner",
      "--no-privileges",
      "--dbname",
      env.PGDATABASE,
      join(temporary, "db.dump"),
    ],
    { env, stdio: ["ignore", "ignore", "pipe"] },
  );
  cpSync(join(temporary, "uploads"), destination, { recursive: true });
  console.log(
    JSON.stringify({
      event: "isolated_restore_completed",
      sourceCommit: manifest.sourceCommit,
      files: Object.keys(files).length,
    }),
  );
} catch {
  console.error(
    "Isolated restore failed; credentials suppressed. Require empty local test DB, valid authenticated archive/key and fresh temp path.",
  );
  process.exitCode = 1;
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
}
