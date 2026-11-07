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
    <main id="konten" className="admin-auth">
      <section className="admin-auth-story" aria-label="Kelurahan Watundehoa">
        <div className="admin-auth-brand">
          <AdminBrand />
        </div>
        <div className="admin-auth-story-copy">
          <span className="admin-auth-story-label">
            PEMERINTAH KELURAHAN WATUNDEHOA
          </span>
          <h1>
            Informasi terkelola.
            <br />
            Pelayanan lebih dekat.
          </h1>
          <p>
            Ruang kerja bersama untuk mengelola informasi dan melayani
            masyarakat Kelurahan Watundehoa.
          </p>
          <div className="admin-auth-location">
            Kecamatan Puriala <span /> Kabupaten Konawe
          </div>
        </div>
        <p className="admin-auth-copyright">
          KALOSARA · Kanal Layanan Online Surat dan Administrasi Rakyat
        </p>
      </section>
      <section className="admin-auth-main">
        <Link href="/" className="admin-auth-back">
          <ArrowLeft size={16} /> Kembali ke website
        </Link>
        <div className="admin-auth-form-wrap">
          <span className="admin-auth-label">
            <LockKeyhole size={15} /> AKSES PENGELOLA
          </span>
          <h2>Selamat datang.</h2>
          <p className="admin-auth-intro">
            Masuk untuk mengelola informasi
            <br className="hidden sm:block" /> dan layanan kelurahan.
          </p>
          <form
            className="admin-auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate();
            }}
          >
            <div className="admin-auth-field">
              <label htmlFor="admin-email">Alamat email</label>
              <input
                id="admin-email"
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
            </div>
            <div className="admin-auth-field">
              <label htmlFor="admin-password">Kata sandi</label>
              <div className="admin-auth-password">
                <input
                  id="admin-password"
                  type={visible ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    login.reset();
                  }}
                />
                <button
                  type="button"
                  aria-label={
                    visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {login.isError && <AdminError error={login.error} />}
            <button className="admin-auth-submit" disabled={login.isPending}>
              {login.isPending ? "Sedang masuk…" : "Masuk ke panel admin"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="admin-auth-security">
            <ShieldCheck size={17} /> Khusus akun petugas yang memiliki akses.
          </p>
        </div>
        <p className="admin-auth-footer">
          Pemerintah Kelurahan Watundehoa <span>·</span> KALOSARA
        </p>
      </section>
    </main>
  );
}
