"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import {
  useAuth,
  useAuthRuntime,
  AuthRecovery,
} from "@/features/auth/auth-provider";
import { AdminLoginForm } from "@/components/admin/login-form";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import {
  adminMenuTree,
  filterAdminMenuByRole,
  findMenuBreadcrumbs,
  type AdminMenuNode,
} from "@/app/(admin)/_data/admin-menu";
import { Icon, KalosaraEmblemSvg } from "@/app/(admin)/_components/admin-icons";

export { adminLinks } from "@/components/admin/navigation";

function isNodeActive(
  item: AdminMenuNode,
  pathname: string,
  hash: string,
): boolean {
  const fullTarget = hash ? `${pathname}${hash}` : pathname;
  if (item.path) {
    if (item.path === fullTarget || item.path === pathname) return true;
    if (item.path.includes("#") && item.path.split("#")[0] === pathname && !hash) {
      return false;
    }
  }
  if (item.children?.length) {
    return item.children.some((child) => isNodeActive(child, pathname, hash));
  }
  return false;
}

function MenuItemRenderer({
  item,
  level = 1,
  pathname,
  hash,
  openMenus,
  toggleMenu,
  onItemClick,
}: {
  item: AdminMenuNode;
  level?: number;
  pathname: string;
  hash: string;
  openMenus: Record<string, boolean>;
  toggleMenu: (key: string, currentOpen: boolean) => void;
  onItemClick: () => void;
}) {
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const fullTarget = hash ? `${pathname}${hash}` : pathname;
  const isActive = isNodeActive(item, pathname, hash);
  const isExactActive =
    item.path === fullTarget ||
    (item.path === pathname && !item.path?.includes("#"));
  const menuKey = `${level}-${item.id}`;
  const isOpen = openMenus[menuKey] ?? isActive;

  const baseClass =
    level === 1
      ? `w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] transition-all duration-150 cursor-pointer select-none text-left ${
          isExactActive
            ? "glass-button-primary !justify-start !min-h-0 !py-2.5 !px-3 text-white font-bold shadow-md"
            : isActive
              ? "bg-sky-50/90 text-sky-700 font-bold border border-sky-200/80"
              : "text-slate-600 font-semibold hover:bg-sky-50/70 hover:text-sky-700"
        }`
      : `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer select-none text-left ${
          isExactActive
            ? "bg-sky-500/15 text-sky-800 font-bold border border-sky-300/80 shadow-2xs"
            : "text-slate-600 font-medium hover:bg-sky-50/70 hover:text-sky-700"
        }`;

  const innerContent = (
    <>
      {level === 1 ? (
        <Icon
          name={item.icon ?? "layers"}
          size={18}
          className={isExactActive ? "text-white" : "text-sky-600"}
        />
      ) : (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isExactActive ? "bg-sky-600 ring-2 ring-sky-400/30" : "bg-sky-300"
          }`}
        />
      )}
      <span className="flex-1 truncate leading-normal text-left">
        {item.title}
      </span>
      {hasChildren && (
        <Icon
          name="chevronDown"
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-sky-600" : ""
          }`}
        />
      )}
    </>
  );

  if (hasChildren && item.children) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => toggleMenu(menuKey, isOpen)}
          className={baseClass}
        >
          {innerContent}
        </button>

        {isOpen && (
          <div
            className={`space-y-1 pt-0.5 pb-1 ${
              level === 1
                ? "ml-4 pl-3 border-l-2 border-sky-200/80"
                : "ml-3 pl-2.5 border-l border-sky-100"
            }`}
          >
            {item.children.map((child) => (
              <MenuItemRenderer
                key={child.id}
                item={child}
                level={level + 1}
                pathname={pathname}
                hash={hash}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.path ?? "#"}
      aria-current={isExactActive ? "page" : undefined}
      onClick={(event) => {
        onItemClick();
        if (
          item.path &&
          item.path.includes("#") &&
          item.path.split("#")[0] === pathname
        ) {
          event.preventDefault();
          const nextHash = `#${item.path.split("#")[1]}`;
          window.location.hash = nextHash;
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
      }}
      className={baseClass}
    >
      {innerContent}
    </Link>
  );
}

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
  demoContent?: boolean;
}) {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    window.addEventListener("hashchange", sync);
    const id = window.requestAnimationFrame(sync);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("hashchange", sync);
    };
  }, [pathname]);

  const logout = useMutation({ mutationFn: () => runtime.logout() });

  const filteredMenu = filterAdminMenuByRole(adminMenuTree, auth.user?.role);

  if (auth.status === "INITIALIZING")
    return (
      <div className="admin-app min-h-dvh">
        <AdminLoading variant="shell" label="Memeriksa sesi Anda…" />
      </div>
    );
  if (auth.status === "TEMPORARY_ERROR")
    return (
      <div className="admin-app mx-auto grid min-h-dvh max-w-xl place-content-center px-6">
        <AuthRecovery />
      </div>
    );
  if (auth.status === "GUEST") return <AdminLoginForm />;
  if (!auth.user || !["ADMIN_KELURAHAN", "LURAH"].includes(auth.user.role))
    return (
      <main className="admin-app grid min-h-dvh place-content-center gap-4 p-6 text-center">
        <div className="glass-card max-w-md p-8 space-y-3">
          <h1 className="text-xl font-bold text-slate-900">
            Halaman Khusus Pengelola
          </h1>
          <p className="text-sm text-slate-600">
            Akun Anda tidak memiliki akses ke panel admin kelurahan.
          </p>
          <Link
            href="/"
            className="glass-button-primary mt-2 inline-flex px-5 py-2.5 text-xs font-bold"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );

  const toggleMenu = (key: string, currentOpen: boolean) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !currentOpen,
    }));
  };

  const breadcrumbs = findMenuBreadcrumbs(pathname, hash, filteredMenu);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1] ?? "Dashboard";

  return (
    <div className="admin-app min-h-dvh flex flex-col antialiased">
      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Floating Glass Sidebar (EduSetara Pattern + Soft Sky-Azure Blue Theme) ── */}
      <aside
        aria-label="Navigasi admin"
        className={`glass-card fixed top-3 bottom-3 left-3 z-50 w-[268px] !rounded-[24px] flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-[115%] lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-[76px] flex items-center justify-between px-4 shrink-0 border-b border-sky-100/80">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-2xl bg-white/80 border border-sky-200/80 px-3 py-2 flex-1 mr-1 shadow-2xs hover:border-sky-300 transition-colors"
          >
            <KalosaraEmblemSvg size={36} />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-extrabold text-sm tracking-wider text-slate-900 truncate">
                KALOSARA
              </span>
              <span className="text-[10.5px] font-semibold text-sky-700 truncate">
                Kelurahan Watundehoa
              </span>
            </div>
          </Link>

          <button
            type="button"
            className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-sky-50 hover:text-sky-700"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu admin"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav
          aria-label="Menu admin"
          className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
        >
          <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-600/85">
            Menu Utama
          </div>

          {filteredMenu.map((item) => (
            <MenuItemRenderer
              key={item.id}
              item={item}
              level={1}
              pathname={pathname}
              hash={hash}
              openMenus={openMenus}
              toggleMenu={toggleMenu}
              onItemClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sky-100/80 space-y-1.5 shrink-0">
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold text-sky-700 bg-sky-50/75 border border-sky-200/70 hover:bg-sky-100/80 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Icon name="globe" size={15} />
              <span>Lihat Portal Publik</span>
            </span>
            <Icon name="external" size={13} />
          </Link>
          <button
            type="button"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer text-left disabled:opacity-50"
          >
            <Icon name="logout" size={15} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 lg:pl-[296px] flex flex-col min-w-0 px-3 lg:pr-6">
        {/* Sticky Floating Glass Topbar */}
        <header className="glass-card sticky top-3 z-30 mt-3 h-16 !rounded-[22px] px-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden w-10 h-10 rounded-2xl border border-sky-200/80 bg-white/85 flex items-center justify-center text-sky-700 hover:bg-sky-50 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu admin"
            >
              <Icon name="menu" size={18} />
            </button>

            <div className="flex flex-col min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Link href="/admin" className="hover:text-sky-600 text-sky-700">
                  Admin
                </Link>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <span>/</span>
                    <span
                      className={
                        idx === breadcrumbs.length - 1
                          ? "text-slate-700 font-bold"
                          : "text-slate-500"
                      }
                    >
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/kotak-masuk"
              className="relative w-10 h-10 rounded-2xl border border-sky-200/75 bg-white/80 text-sky-700 hover:bg-sky-50 flex items-center justify-center transition-colors"
              aria-label="Kotak Masuk Warga"
              title="Kotak Masuk Warga"
            >
              <Icon name="bell" size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white" />
            </Link>

            <div className="flex items-center gap-2.5 pl-3 border-l border-sky-100">
              <div className="w-9 h-9 rounded-2xl bg-linear-to-b from-sky-400 to-sky-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shadow-sky-500/25 border border-sky-300/60 uppercase">
                {auth.user.role === "LURAH" ? "L" : "A"}
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                  <span>
                    {auth.user.role === "LURAH" ? "Lurah" : "Administrator"}
                  </span>
                  <ShieldCheck size={13} className="text-sky-600" />
                </span>
                <span className="text-[10.5px] font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Sesi Aktif
                </span>
              </div>
            </div>

            <button
              aria-label="Keluar dari akun"
              title="Keluar dari akun"
              disabled={logout.isPending}
              className="glass-button-secondary size-9 !min-h-9 !p-0 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              onClick={() => logout.mutate()}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </header>

        {/* Content Shell */}
        <div className="flex-1 py-6 space-y-6 w-full max-w-[1380px] mx-auto">
          {logout.isError && <AdminError error={logout.error} />}
          <div className="cms-shell">{children}</div>
        </div>

        {/* Footer */}
        <footer className="py-4 px-2 border-t border-sky-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            <strong className="font-extrabold text-sky-900">KALOSARA</strong> ·
            Ruang Kerja Digital Pemerintah Kelurahan Watundehoa
          </span>
          <Link
            href="/"
            className="font-bold text-sky-700 hover:text-sky-900 transition-colors"
          >
            Buka Portal Publik ↗
          </Link>
        </footer>
      </div>
    </div>
  );
}
