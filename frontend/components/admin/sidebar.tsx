"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { adminLinks } from "./navigation";
import { AdminBrand } from "./brand";

export function AdminSidebar({
  path,
  hash,
  role,
  onNavigate,
}: {
  path: string;
  hash: string;
  role: string;
  onNavigate: () => void;
}) {
  const active =
    adminLinks.find((item) => item.href === path + hash) ??
    adminLinks.find((item) => item.href.split("#")[0] === path);

  return (
    <div className="admin-sidebar flex h-full flex-col">
      <div className="admin-sidebar-brand">
        <AdminBrand />
      </div>
      <nav
        aria-label="Menu admin"
        className="admin-sidebar-nav min-h-0 flex-1 overflow-y-auto"
      >
        {adminLinks
          .filter(
            (item) =>
              role === "ADMIN_KELURAHAN" ||
              role === "LURAH" ||
              item.href === "/admin",
          )
          .map((item) => (
            <div key={item.href}>
              {item.group && <p className="admin-nav-group">{item.group}</p>}
              <Link
                href={item.href}
                aria-current={active?.href === item.href ? "page" : undefined}
                onClick={(event) => {
                  onNavigate();
                  if (
                    item.href.includes("#") &&
                    item.href.split("#")[0] === path
                  ) {
                    event.preventDefault();
                    window.location.hash = item.href.split("#")[1];
                  }
                }}
                className="admin-nav-link"
              >
                <item.icon size={20} strokeWidth={2} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </div>
          ))}
      </nav>
      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-website-link">
          <span className="font-semibold">Lihat Portal Publik</span>
          <ArrowUpRight size={16} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
