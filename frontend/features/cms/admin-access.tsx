"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { createHttpClient } from "@/services/http-client";
import { cmsError } from "./client";
export function AdminAccess({
  children,
  monitoring = false,
}: {
  children: React.ReactNode;
  monitoring?: boolean;
}) {
  const path = usePathname();
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: async () => {
      const http = createHttpClient();
      const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
      await http("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
    },
    onSuccess: async () => {
      setPassword("");
      await runtime.bootstrap();
    },
  });
  const logout = useMutation({
    mutationFn: async () => {
      const http = createHttpClient();
      const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
      await http("/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
      });
      await runtime.bootstrap();
    },
  });
  return (
    <>
      {auth.status === "INITIALIZING" && <p role="status">Memeriksa sesi…</p>}
      {auth.status === "GUEST" && (
        <form
          className="cms-login max-w-md space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <p>Masuk dengan akun petugas terprovisi.</p>
          <label className="block">
            Email
            <input
              className="cms-input"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            Kata sandi
            <input
              className="cms-input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="yellow-button" disabled={login.isPending}>
            Masuk
          </button>
          {login.isError && <p role="alert">{cmsError(login.error)}</p>}
        </form>
      )}
      {(auth.user?.role === "ADMIN_KELURAHAN" ||
        auth.user?.role === "LURAH") && (
        <nav aria-label="Pengelolaan website" className="cms-navigation">
          <Link
            href="/admin"
            aria-current={path === "/admin" ? "page" : undefined}
          >
            Dashboard
          </Link>
          {auth.user?.role === "ADMIN_KELURAHAN" && (
            <>
              <Link
                href="/admin/pengguna"
                aria-current={path === "/admin/pengguna" ? "page" : undefined}
              >
                Pengguna, audit dan upload
              </Link>
              <Link
                aria-current={path === "/admin/profil" ? "page" : undefined}
                href="/admin/profil"
              >
                Profil dan pengaturan
              </Link>
              <Link
                aria-current={path === "/admin/berita" ? "page" : undefined}
                href="/admin/berita"
              >
                Berita dan media
              </Link>
              <Link
                aria-current={path === "/admin/konten" ? "page" : undefined}
                href="/admin/konten"
              >
                Kanal informasi
              </Link>
              <Link
                aria-current={path === "/admin/wilayah" ? "page" : undefined}
                href="/admin/wilayah"
              >
                Statistik dan wilayah
              </Link>
            </>
          )}
          <button
            className="underline"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Keluar
          </button>
        </nav>
      )}
      {logout.isError && <p role="alert">{cmsError(logout.error)}</p>}
      {(auth.user?.role === "ADMIN_KELURAHAN" ||
        (monitoring && auth.user?.role === "LURAH")) &&
        auth.status !== "GUEST" && (
          <Fragment key={auth.user.id}>{children}</Fragment>
        )}
      {auth.status === "AUTHENTICATED" &&
        auth.user?.role !== "ADMIN_KELURAHAN" &&
        !(monitoring && auth.user?.role === "LURAH") && (
          <p role="alert">
            {monitoring
              ? "Dashboard hanya untuk ADMIN_KELURAHAN atau LURAH."
              : "Akses kelola hanya untuk ADMIN_KELURAHAN."}
          </p>
        )}
    </>
  );
}
