import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  chmodSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { inventory, verifyRelease } from "../lib/release.mjs";
import { keyFromFile, testDatabase, checksums, pgEnv } from "../lib/backup.mjs";
test("release manifest detects tampering and excludes secrets/escaping symlinks", () => {
  const root = mkdtempSync(join(tmpdir(), "kalosara-release-test-"));
  try {
    writeFileSync(join(root, "server.js"), "hello");
    const manifest = {
      version: 1,
      commit: "a".repeat(40),
      platform: process.platform,
      arch: process.arch,
      nodeMajor: Number(process.versions.node.split(".")[0]),
      files: inventory(root),
    };
    writeFileSync(join(root, "release.json"), JSON.stringify(manifest));
    assert.equal(verifyRelease(root).commit, manifest.commit);
    writeFileSync(join(root, "server.js"), "tampered");
    assert.throws(() => verifyRelease(root), /checksum/);
    writeFileSync(join(root, ".env"), "SECRET");
    assert.throws(() => inventory(root), /Forbidden/);
    rmSync(join(root, ".env"));
    symlinkSync("/etc/passwd", join(root, "outside"));
    assert.throws(() => inventory(root), /escapes/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("backup key and restore guards reject unsafe permissions, remote DB and file links", () => {
  const root = mkdtempSync(join(tmpdir(), "kalosara-backup-test-"));
  try {
    const key = join(root, "key");
    writeFileSync(key, randomBytes(32), { mode: 0o600 });
    assert.equal(keyFromFile(key).length, 32);
    chmodSync(key, 0o644);
    assert.throws(() => keyFromFile(key), /mode0600/);
    for (const url of [
      "postgresql://user@neon.example/kalosara_private_test",
      "postgresql://user@127.0.0.1/production",
      "postgresql://user@127.0.0.1/kalosara_safe_test?sslmode=require",
    ])
      assert.throws(() => testDatabase(url));
    assert.equal(
      testDatabase("postgresql://test@127.0.0.1:55439/kalosara_restore_test")
        .PGDATABASE,
      "kalosara_restore_test",
    );
    symlinkSync("/etc/passwd", join(root, "private"));
    assert.throws(() => checksums(root), /symlinks/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("runtime closure preserves native optional binaries and excludes compiler optional peers", async () => {
  const { runtimePackages } = await import("../lib/runtime-deps.mjs");
  const lock = {
    packages: {
      "": { dependencies: { client: "1", sharp: "1" } },
      "node_modules/client": {
        peerDependencies: { prisma: "*" },
        peerDependenciesMeta: { prisma: { optional: true } },
      },
      "node_modules/prisma": { dependencies: { compiler: "1" } },
      "node_modules/compiler": {},
      "node_modules/sharp": { optionalDependencies: { native: "1" } },
      "node_modules/native": {},
    },
  };
  assert.deepEqual([...runtimePackages(lock)].sort(), [
    "node_modules/client",
    "node_modules/native",
    "node_modules/sharp",
  ]);
});

test("backup preserves remote TLS and channel binding; deploy refuses unmanaged paths", async () => {
  const remote = pgEnv(
    "postgresql://operator@database.example/db?sslmode=require&channel_binding=require",
  );
  assert.equal(remote.PGSSLMODE, "require");
  assert.equal(remote.PGCHANNELBINDING, "require");
  assert.throws(() =>
    pgEnv("postgresql://operator@database.example/db?sslmode=disable"),
  );
  const { spawnSync } = await import("node:child_process");
  const script = new URL("../deploy.mjs", import.meta.url);
  const run = spawnSync(process.execPath, [script.pathname, "/tmp/unmanaged"], {
    encoding: "utf8",
  });
  assert.notEqual(run.status, 0);
});
