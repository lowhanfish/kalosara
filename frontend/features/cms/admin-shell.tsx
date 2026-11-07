"use client";
import Link from "next/link";
import { DemoNotice } from "@/components/site/demo-notice";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LogOut, Menu, X, ChevronRight } from "lucide-react";
import {
  useAuth,
  useAuthRuntime,
  AuthRecovery,
} from "@/features/auth/auth-provider";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminLoginForm } from "@/components/admin/login-form";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { adminLinks } from "@/components/admin/navigation";
export { adminLinks } from "@/components/admin/navigation";
export function AdminShell({
  children,
  demoContent = false,
}: {
  children: React.ReactNode;
  demoContent?: boolean;
}) {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const path = usePathname();
  const [hash, setHash] = useState("");
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    mobileMenu.current?.close();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [path]);
  const logout = useMutation({ mutationFn: () => runtime.logout() });
  if (auth.status === "INITIALIZING")
    return (
      <div className="grid min-h-dvh place-content-center bg-slate-50">
        <AdminLoading label="Memeriksa sesi Anda…" />
      </div>
    );
  if (auth.status === "TEMPORARY_ERROR")
    return (
      <div className="mx-auto grid min-h-dvh max-w-xl place-content-center px-6">
        <AuthRecovery />
      </div>
    );
  if (auth.status === "GUEST") return <AdminLoginForm />;
  if (!auth.user || !["ADMIN_KELURAHAN", "LURAH"].includes(auth.user.role))
    return (
      <main className="grid min-h-dvh place-content-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-xl font-bold">Halaman khusus pengelola</h1>
        <p className="text-[15px] text-slate-500">
          Akun Anda tidak memiliki akses ke panel admin.
        </p>
        <Link href="/" className="underline">
          Kembali ke beranda
        </Link>
      </main>
    );
  const current =
    adminLinks.find((item) => item.href === path + hash) ??
    adminLinks.find((item) => item.href.split("#")[0] === path);
  const closeMenu = () => mobileMenu.current?.close();
  return (
    <div className="admin-app flex min-h-dvh">
      <aside className="admin-desktop-sidebar sticky top-0 hidden h-dvh shrink-0 lg:block">
        <AdminSidebar
          path={path}
          hash={hash}
          role={auth.user.role}
          onNavigate={closeMenu}
        />
      </aside>
      <dialog
        ref={mobileMenu}
        aria-label="Navigasi admin"
        onClose={() => menuTrigger.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu();
        }}
        className="admin-mobile-menu fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[290px] max-w-[90vw] border-0 bg-white p-0 shadow-2xl"
      >
        <button
          type="button"
          aria-label="Tutup menu admin"
          className="absolute right-2 top-2 z-10 grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          onClick={closeMenu}
        >
          <X size={20} />
        </button>
        <AdminSidebar
          path={path}
          hash={hash}
          role={auth.user.role}
          onNavigate={closeMenu}
        />
      </dialog>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-topbar sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              ref={menuTrigger}
              aria-label="Buka menu admin"
              aria-haspopup="dialog"
              className="grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 text-primary lg:hidden"
              onClick={() => mobileMenu.current?.showModal()}
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-400">
                Panel pengelola
              </p>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="hidden text-slate-500 sm:inline">
                  Ruang kerja
                </span>
                <ChevronRight
                  size={12}
                  className="hidden text-slate-300 sm:block"
                />
                <span className="truncate font-semibold text-slate-800">
                  {current?.label ?? "Pengelolaan"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-sm font-bold text-primary">
              {auth.user.role === "LURAH" ? "L" : "A"}
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">
                {auth.user.role === "LURAH" ? "Lurah" : "Administrator"}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Sesi aktif
              </p>
            </div>
            <button
              aria-label="Keluar dari akun"
              disabled={logout.isPending}
              className="ml-1 grid size-11 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              onClick={() => logout.mutate()}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="admin-content mx-auto w-full flex-1">
          {logout.isError && <AdminError error={logout.error} />}
          {demoContent && (
            <div className="admin-demo-notice">
              <DemoNotice />
            </div>
          )}
          <div className="cms-shell">{children}</div>
        </div>
        <footer className="admin-footer flex flex-wrap justify-between gap-2">
          <span>KALOSARA · Ruang kerja pengelola kelurahan</span>
          <Link href="/" className="hover:text-primary">
            Lihat website ↗
          </Link>
        </footer>
      </div>
    </div>
  );
}
