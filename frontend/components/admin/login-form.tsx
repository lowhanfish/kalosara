"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useAuthRuntime } from "@/features/auth/auth-provider";
import { createHttpClient } from "@/services/http-client";
import { AdminBrand } from "./brand";
import { AdminError } from "./feedback";
export function AdminLoginForm() {
  const runtime = useAuthRuntime();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
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
      router.replace("/admin");
    },
  });
  return (
    <main
      id="konten"
      className="grid min-h-dvh bg-[#f6f8fb] lg:grid-cols-[1fr_1.05fr]"
    >
      <section className="relative flex flex-col justify-between overflow-hidden bg-[#0c2038] p-7 text-white sm:p-12 lg:min-h-dvh lg:p-16">
        <div className="relative z-10">
          <AdminBrand />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -left-20 size-[600px] rounded-full border-[80px] border-white/3"
        />
        <div className="relative hidden max-w-lg py-20 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-amber-300">
            Ruang kerja pengelola
          </p>
          <h1 className="mt-7 text-5xl font-bold leading-[1.13] tracking-tight xl:text-6xl">
            Informasi yang baik
            <br />
            dimulai dari sini.
          </h1>
          <p className="mt-7 max-w-sm text-base leading-8 text-slate-300">
            Satu ruang untuk merawat informasi, mendekatkan pelayanan, dan
            terhubung dengan warga.
          </p>
          <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck size={18} className="text-amber-300" />
            Akses khusus pengelola kelurahan
          </div>
        </div>
        <p className="relative hidden text-[11px] leading-6 text-slate-400 lg:block">
          Kanal Layanan Online Surat dan Administrasi Rakyat
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <form
          className="w-full max-w-[390px]"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <span className="mb-7 grid size-14 place-items-center rounded-2xl border border-slate-200 bg-white text-primary shadow-sm">
            <LockKeyhole size={25} strokeWidth={1.6} />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">
            Selamat datang kembali
          </p>
          <h2 className="mt-3 text-[30px] font-bold tracking-tight text-slate-900">
            Masuk ke panel admin
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Gunakan email dan kata sandi akun petugas Anda.
          </p>
          <div className="mt-8 space-y-5">
            <label
              className="block text-sm font-semibold text-slate-700"
              htmlFor="admin-email"
            >
              Alamat email
              <input
                id="admin-email"
                className="field mt-2"
                type="email"
                required
                autoComplete="username"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  login.reset();
                }}
              />
            </label>
            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="admin-password"
              >
                Kata sandi
              </label>
              <div className="relative mt-2">
                <input
                  id="admin-password"
                  className="field pr-12"
                  type={visible ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    login.reset();
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-slate-500 hover:text-primary"
                  aria-label={
                    visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          {login.isError && <AdminError error={login.error} />}
          <button
            disabled={login.isPending}
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
          >
            {login.isPending ? "Sedang masuk…" : "Masuk ke panel admin"}
            <ArrowRight size={17} />
          </button>
          <Link
            href="/"
            className="mt-7 flex min-h-11 items-center justify-center gap-2 text-xs text-slate-500 hover:text-primary"
          >
            <ArrowLeft size={14} />
            Kembali ke website kelurahan
          </Link>
        </form>
      </section>
    </main>
  );
}
