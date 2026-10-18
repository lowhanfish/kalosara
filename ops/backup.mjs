// Read-only source snapshot; operator must first pause mutating traffic/jobs.
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  readFileSync,
  writeFileSync,
  createReadStream,
  createWriteStream,
  appendFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import { randomBytes, createCipheriv, createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { magic, keyFromFile, checksums, pgEnv } from "./lib/backup.mjs";
let temporary;
try {
  if (process.env.MAINTENANCE_CONFIRMED !== "1")
    throw Error("Pause all mutations/jobs and confirm maintenance first");
  const sourceCommit = process.env.SOURCE_COMMIT;
  if (!/^[a-f0-9]{40}$/.test(sourceCommit ?? ""))
    throw Error("SOURCE_COMMIT required");
  const output = resolve(process.argv[2] ?? "");
  if (!process.argv[2] || existsSync(output))
    throw Error("New encrypted output path required");
  const key = keyFromFile(process.env.BACKUP_KEY_FILE);
  const env = pgEnv(process.env.BACKUP_DATABASE_URL ?? "");
  const uploads = resolve(process.env.UPLOAD_ROOT ?? "");
  if (!process.env.UPLOAD_ROOT || !existsSync(uploads))
    throw Error("Explicit upload directory required");
  checksums(uploads); // Reject symlinks before copying anything.
  temporary = mkdtempSync(join(tmpdir(), "kalosara-backup-"));
  const content = join(temporary, "content");
  mkdirSync(content, { mode: 0o700 });
  execFileSync(
    process.env.PG_DUMP_BIN ?? "pg_dump",
    [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "--file",
      join(content, "db.dump"),
    ],
    { env, stdio: ["ignore", "ignore", "pipe"] },
  );
  cpSync(uploads, join(content, "uploads"), { recursive: true });
  const createdAt = new Date().toISOString();
  writeFileSync(
    join(content, "manifest.json"),
    JSON.stringify({
      version: 1,
      createdAt,
      sourceCommit,
      files: checksums(content),
    }),
    { mode: 0o600 },
  );
  const archive = join(temporary, "snapshot.tar");
  execFileSync(
    "tar",
    ["-cf", archive, "-C", content, "db.dump", "uploads", "manifest.json"],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  writeFileSync(output, Buffer.concat([magic, iv]), {
    mode: 0o600,
    flag: "wx",
  });
  await pipeline(
    createReadStream(archive),
    cipher,
    createWriteStream(output, { flags: "a", mode: 0o600 }),
  );
  appendFileSync(output, cipher.getAuthTag());
  const sha256 = createHash("sha256");
  for await (const chunk of createReadStream(output)) sha256.update(chunk);
  const receipt = {
    version: 1,
    createdAt,
    sourceCommit,
    sha256: sha256.digest("hex"),
    offsiteVerified: false,
  };
  writeFileSync(
    output + ".receipt.json",
    JSON.stringify(receipt, null, 2) + "\n",
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    JSON.stringify({ event: "encrypted_backup_created", ...receipt }),
  );
} catch {
  console.error(
    "Backup failed; no credentials printed. Check tools, maintenance confirmation, key and paths. A partial output must not be accepted.",
  );
  process.exitCode = 1;
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
}
