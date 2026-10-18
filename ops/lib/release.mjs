import { createHash } from "node:crypto";
import { readFileSync, readdirSync, lstatSync, readlinkSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";
export function inventory(root, directory = root, entries = {}) {
  for (const name of readdirSync(directory).sort()) {
    const path = join(directory, name);
    const key = relative(root, path).split("\\").join("/");
    if (key === "release.json") continue;
    if (
      name.startsWith(".env") ||
      name.startsWith("._") ||
      name === ".git" ||
      name === "uploads"
    )
      throw Error("Forbidden runtime data in release");
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      const target = readlinkSync(path);
      const dest = relative(root, resolve(directory, target));
      if (isAbsolute(target) || dest.startsWith("..") || isAbsolute(dest))
        throw Error("Release symlink escapes root");
      entries[key] = { link: target };
    } else if (stat.isDirectory()) inventory(root, path, entries);
    else if (stat.isFile())
      entries[key] = {
        sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
        bytes: stat.size,
      };
    else throw Error("Unsupported release file");
  }
  return entries;
}
export function verifyRelease(root) {
  const manifest = JSON.parse(readFileSync(join(root, "release.json"), "utf8"));
  if (manifest.version !== 1 || !/^[a-f0-9]{40}$/.test(manifest.commit))
    throw Error("Invalid release identity");
  if (
    manifest.platform !== process.platform ||
    manifest.arch !== process.arch ||
    manifest.nodeMajor !== Number(process.versions.node.split(".")[0])
  )
    throw Error("Release platform/Node mismatch; build on matching runner");
  if (JSON.stringify(inventory(root)) !== JSON.stringify(manifest.files))
    throw Error("Release checksum or symlink mismatch");
  return manifest;
}
