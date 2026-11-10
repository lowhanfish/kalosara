import rawMenu from "./admin-menu.json";

export interface AdminMenuNode {
  id: string;
  title: string;
  icon?: string | null;
  path: string | null;
  role?: "ADMIN_KELURAHAN" | "LURAH";
  children: AdminMenuNode[];
}

export const adminMenuTree = rawMenu as AdminMenuNode[];

export function filterAdminMenuByRole(
  nodes: AdminMenuNode[],
  role?: string,
): AdminMenuNode[] {
  return nodes
    .filter((node) => {
      if (!node.role) return true;
      if (node.role === role) return true;
      if (
        (role === "ADMIN_KELURAHAN" || role === "LURAH") &&
        (node.role === "ADMIN_KELURAHAN" || node.role === "LURAH")
      ) {
        return true;
      }
      return false;
    })
    .map((node) => ({
      ...node,
      children: filterAdminMenuByRole(node.children ?? [], role),
    }))
    .filter((node) => node.path !== null || node.children.length > 0);
}

export function findMenuBreadcrumbs(
  pathname: string,
  hash = "",
  nodes: AdminMenuNode[] = adminMenuTree,
  trail: string[] = [],
): string[] {
  const fullTarget = hash ? `${pathname}${hash}` : pathname;
  for (const node of nodes) {
    const nextTrail = [...trail, node.title];
    if (node.path === fullTarget || node.path === pathname) {
      return nextTrail;
    }
    if (node.children?.length) {
      const found = findMenuBreadcrumbs(pathname, hash, node.children, nextTrail);
      if (found.length) return found;
    }
  }
  return ["Dashboard"];
}
