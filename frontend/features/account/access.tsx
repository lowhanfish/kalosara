"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
    return <p role="status">Memeriksa sesi…</p>;
  if (auth.status === "TEMPORARY_ERROR" && !auth.user) return <AuthRecovery />;
  if (auth.status === "GUEST")
    return (
      <section className="cms-login max-w-xl">
        <h1>{register ? "Daftar akun masyarakat" : "Masuk akun masyarakat"}</h1>
        <p>
          Website publik dapat dibaca tanpa akun. Pengajuan pelayanan belum
          aktif. Tidak perlu unggah KTP.
        </p>
        {notice && <p role="status">{notice}</p>}
        <form
          className="space-y-4 mt-4"
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
            <label className="block">
              Nama
              <input
                name="displayName"
                className="cms-input"
                autoComplete="name"
                required
                maxLength={120}
              />
            </label>
          )}
          <label className="block">
            Email
            <input
              name="email"
              type="email"
              className="cms-input"
              autoComplete="username"
              required
              maxLength={254}
            />
          </label>
          <label className="block">
            Kata sandi
            <input
              name="password"
              type="password"
              className="cms-input"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 12 : 1}
              maxLength={72}
            />
          </label>
          {register && (
            <p>
              Minimal 12 karakter, maksimal 72 byte. Email dipakai untuk masuk;
              verifikasi kontak dilakukan melalui petugas.
            </p>
          )}
          <button className="yellow-button" disabled={login.isPending}>
            {login.isPending ? "Memproses…" : register ? "Daftar" : "Masuk"}
          </button>
          {login.isError && <p role="alert">{cmsError(login.error)}</p>}
        </form>
        <button
          className="cms-edit-button mt-4"
          disabled={login.isPending}
          onClick={() => {
            setRegister(!register);
            login.reset();
            setNotice("");
          }}
        >
          {register ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
        </button>
      </section>
    );
  if (auth.user?.role !== "MASYARAKAT")
    return (
      <p role="alert">
        Area ini untuk akun masyarakat.{" "}
        <Link href="/admin" className="underline">
          Buka dashboard petugas
        </Link>
        .
      </p>
    );
  return (
    <>
      <nav className="cms-navigation" aria-label="Akun masyarakat">
        {(
          [
            ["dashboard", "Dashboard"],
            ["profil", "Profil saya"],
            ["keamanan", "Keamanan"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={`/masyarakat/${key}`}
            aria-current={path === `/masyarakat/${key}` ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
        <button disabled={logout.isPending} onClick={() => logout.mutate()}>
          Keluar
        </button>
      </nav>
      {logout.isError && <p role="alert">{cmsError(logout.error)}</p>}
      {children}
    </>
  );
}
