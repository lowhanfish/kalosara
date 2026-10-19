"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  LayoutDashboard,
  User,
  Shield,
  LogOut,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import {
  useAuth,
  useAuthRuntime,
  AuthRecovery,
} from "@/features/auth/auth-provider";
import { createHttpClient } from "@/services/http-client";
import { cmsError } from "@/features/cms/client";
export function CitizenAccess({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const path = usePathname();
  const [register, setRegister] = useState(false);
  const [notice, setNotice] = useState("");
  const login = useMutation({
    mutationFn: async ({
      body,
      register,
    }: {
      body: Record<string, unknown>;
      register: boolean;
    }) => {
      const http = createHttpClient();
      try {
        const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
        if (register)
          await http("/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify(body),
          });
        else
          await http("/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify(body),
          });
      } finally {
        delete body.password;
      }
    },
    onSuccess: async (_data, variables) => {
      if (variables.register) {
        setRegister(false);
        setNotice(
          "Akun berhasil didaftarkan. Silakan masuk. Kepemilikan kontak belum diverifikasi.",
        );
      } else {
        setNotice("");
        await runtime.bootstrap();
      }
    },
  });
  const logout = useMutation({ mutationFn: () => runtime.logout() });
  if (auth.status === "INITIALIZING")
    return (
      <div className="flex min-h-[300px] items-center justify-center p-8 text-center text-slate-500" role="status">
        <p className="animate-pulse">Memeriksa sesi akun…</p>
      </div>
    );
  if (auth.status === "TEMPORARY_ERROR" && !auth.user) return <AuthRecovery />;
  if (auth.status === "GUEST")
    return (
      <section className="cms-login mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-xs sm:p-9">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-primary">
            <UserCheck size={24} strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-slate-500">
            Portal Warga Kelurahan
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            {register ? "Daftar Akun Masyarakat" : "Masuk Akun Masyarakat"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {register
              ? "Daftarkan akun untuk pendataan warga dan persiapan layanan mandiri."
              : "Kelola data profil dan keamanan akun Anda secara mandiri."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setRegister(false);
              login.reset();
              setNotice("");
            }}
            className={`rounded-lg py-2 transition ${!register ? "bg-white text-primary shadow-xs" : "text-slate-500 hover:text-primary"}`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setRegister(true);
              login.reset();
              setNotice("");
            }}
            className={`rounded-lg py-2 transition ${register ? "bg-white text-primary shadow-xs" : "text-slate-500 hover:text-primary"}`}
          >
            Daftar Baru
          </button>
        </div>

        {notice && (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            role="status"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <p>{notice}</p>
          </div>
        )}

        {login.isError && (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            role="alert"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
            <p>{cmsError(login.error)}</p>
          </div>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            const body = {
              email: String(f.get("email")),
              password: String(f.get("password")),
              ...(register
                ? { displayName: String(f.get("displayName")) }
                : {}),
            };
            form.reset();
            login.mutate({ body, register });
          }}
        >
          {register && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Nama Lengkap
              </label>
              <input
                name="displayName"
                placeholder="Contoh: Budi Santoso"
                className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="name"
                required
                maxLength={120}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="nama@email.com"
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoComplete="username"
              required
              maxLength={254}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi
            </label>
            <input
              name="password"
              type="password"
              placeholder={register ? "Minimal 12 karakter" : "Masukkan kata sandi"}
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 12 : 1}
              maxLength={72}
            />
          </div>
          {register && (
            <p className="text-xs text-slate-500">
              Gunakan minimal 12 karakter demi keamanan akun Anda.
            </p>
          )}
          <button
            type="submit"
            className="yellow-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
            disabled={login.isPending}
          >
            {login.isPending ? "Memproses…" : register ? "Daftar Akun" : "Masuk ke Akun"}
            <ArrowRight size={16} />
          </button>
        </form>
      </section>
    );
  if (auth.user?.role !== "MASYARAKAT")
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900" role="alert">
        <p className="font-semibold">Area ini khusus untuk akun masyarakat.</p>
        <p className="mt-2 text-sm">
          Anda saat ini masuk sebagai staf/pengelola. Silakan{" "}
          <Link href="/admin" className="font-semibold underline">
            buka dashboard petugas
          </Link>
          .
        </p>
      </div>
    );
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="cms-navigation flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs"
          aria-label="Akun masyarakat"
        >
          {(
            [
              { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { key: "profil", label: "Profil Saya", icon: User },
              { key: "keamanan", label: "Keamanan", icon: Shield },
            ] as const
          ).map(({ key, label, icon: Icon }) => {
            const isActive = path === `/masyarakat/${key}`;
            return (
              <Link
                key={key}
                href={`/masyarakat/${key}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
        >
          <LogOut size={15} />
          {logout.isPending ? "Keluar…" : "Keluar"}
        </button>
      </div>
      {logout.isError && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          {cmsError(logout.error)}
        </div>
      )}
      {children}
    </>
  );
}

