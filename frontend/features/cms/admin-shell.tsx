"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LogOut, Menu, X, ChevronRight, ShieldCheck } from "lucide-react";
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
        className="admin-mobile-menu fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[290px] max-w-[90vw] border-0 bg-white/90 backdrop-blur-xl p-0 shadow-2xl"
      >
        <button
          type="button"
          aria-label="Tutup menu admin"
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700"
          onClick={closeMenu}
        >
          <X size={20} strokeWidth={2} />
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
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              type="button"
              ref={menuTrigger}
              aria-label="Buka menu admin"
              aria-haspopup="dialog"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-blue-200/70 bg-white/80 text-blue-700 shadow-2xs hover:bg-blue-50 lg:hidden"
              onClick={() => mobileMenu.current?.showModal()}
            >
              <Menu size={20} strokeWidth={2} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600/80">
                Sistem Informasi Pemerintah Kelurahan
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-sm">
                <span className="hidden font-medium text-slate-500 sm:inline">
                  Ruang Kerja
                </span>
                <ChevronRight
                  size={14}
                  strokeWidth={2}
                  className="hidden text-blue-300 sm:block"
                />
                <span className="truncate font-bold text-slate-900">
                  {current?.label ?? "Pengelolaan"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl border border-sky-200/70 bg-white/85 px-3 py-1.5 shadow-2xs backdrop-blur-md">
              <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-b from-sky-400 to-sky-600 text-xs font-extrabold text-white shadow-xs shadow-sky-500/25 border border-sky-300/60">
                {auth.user.role === "LURAH" ? "L" : "A"}
              </span>
              <div className="hidden sm:block pr-1">
                <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                  <span>
                    {auth.user.role === "LURAH" ? "Lurah" : "Administrator"}
                  </span>
                  <ShieldCheck size={13} className="text-sky-600" />
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 leading-none">
                  <span className="size-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  Sesi Aktif
                </p>
              </div>
            </div>

            <button
              aria-label="Keluar dari akun"
              title="Keluar dari akun"
              disabled={logout.isPending}
              className="glass-button-secondary size-10 min-h-10 p-0 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              onClick={() => logout.mutate()}
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="admin-content mx-auto w-full flex-1">
          {logout.isError && <AdminError error={logout.error} />}
          <div className="cms-shell">{children}</div>
        </div>

        <footer className="admin-footer flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-slate-500">
            <strong className="font-bold text-blue-900">KALOSARA</strong> · Ruang
            Kerja Digital Pengelola Kelurahan Watundehoa
          </span>
          <Link
            href="/"
            className="font-semibold text-blue-700 hover:text-blue-900 transition-colors"
          >
            Buka Portal Publik ↗
          </Link>
        </footer>
      </div>
    </div>
  );
}
