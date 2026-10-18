import { posix } from "node:path";
// Follow locked runtime dependencies, optional platform binaries and required peers.
// Optional peers (Prisma CLI/TypeScript) are intentionally excluded.
export function runtimePackages(lock) {
  const packages = lock.packages;
  const live = new Set();
  function visit(name, parent = "", optional = false) {
    let cursor = parent;
    let key;
    while (true) {
      const candidate = posix.join(cursor, "node_modules", name);
      if (packages[candidate]) {
        key = candidate;
        break;
      }
      if (!cursor) break;
      const next = posix.dirname(cursor);
      cursor = next === "." ? "" : next;
    }
    if (!key) {
      if (optional) return;
      throw Error("Missing locked runtime dependency");
    }
    if (live.has(key)) return;
    live.add(key);
    const item = packages[key];
    for (const dependency of Object.keys(item.dependencies ?? {}))
      visit(dependency, key, Boolean(item.optionalDependencies?.[dependency]));
    for (const dependency of Object.keys(item.optionalDependencies ?? {}))
      visit(dependency, key, true);
    for (const dependency of Object.keys(item.peerDependencies ?? {}))
      if (!item.peerDependenciesMeta?.[dependency]?.optional)
        visit(dependency, key);
  }
  for (const name of Object.keys(packages[""].dependencies ?? {})) visit(name);
  return live;
}
