import { resolve } from "node:path";
import { verifyRelease } from "./lib/release.mjs";
const manifest = verifyRelease(resolve(process.argv[2] ?? "."));
console.log(
  JSON.stringify({
    event: "release_verified",
    commit: manifest.commit,
    origin: manifest.origin,
    files: Object.keys(manifest.files).length,
  }),
);
