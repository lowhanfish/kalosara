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
    <div className="flex h-full flex-col bg-[#0c2038] text-slate-300">
      <div className="px-6 pb-7 pt-8">
        <AdminBrand />
      </div>
      <nav
        aria-label="Menu admin"
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-5"
      >
        {adminLinks
          .filter(
            (item) => role === "ADMIN_KELURAHAN" || item.href === "/admin",
          )
          .map((item) => (
            <div key={item.href}>
              {item.group && (
                <p className="mb-2 mt-5 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">
                  {item.group}
                </p>
              )}
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
                className={`my-1 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${active?.href === item.href ? "bg-amber-300 text-slate-900 shadow-sm" : "hover:bg-white/7 hover:text-white"}`}
              >
                <item.icon size={18} strokeWidth={1.6} aria-hidden="true" />
                {item.label}
              </Link>
            </div>
          ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link
          href="/"
          className="flex min-h-11 items-center justify-between rounded-lg px-3 text-xs font-medium hover:bg-white/5"
        >
          Lihat website kelurahan
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
