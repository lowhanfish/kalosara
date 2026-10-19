"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  CalendarDays,
  Images,
  ChartColumn,
  MapPin,
  Settings,
  Users,
  LogOut,
  ExternalLink,
  Menu,
  X,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import {
  useAuth,
  useAuthRuntime,
  AuthRecovery,
} from "@/features/auth/auth-provider";
import { createHttpClient } from "@/services/http-client";
import { cmsError } from "./client";
export const adminLinks = [
  {
    label: "Ringkasan",
    href: "/admin",
    icon: LayoutDashboard,
    group: "Ruang kerja",
  },
  {
    label: "Beranda & kontak",
    href: "/admin/profil#pengaturan",
    icon: Settings,
    group: "Konten website",
  },
  {
    label: "Profil kelurahan",
    href: "/admin/profil#halaman-profil",
    icon: FileText,
  },
  { label: "Pelayanan", href: "/admin/pelayanan", icon: FileText },
  { label: "Berita & media", href: "/admin/berita", icon: Newspaper },
  { label: "Pengumuman", href: "/admin/konten#announcements", icon: FileText },
  { label: "Agenda", href: "/admin/konten#events", icon: CalendarDays },
  { label: "Galeri", href: "/admin/konten#galleries", icon: Images },
  {
    label: "Informasi publik",
    href: "/admin/konten#documents",
    icon: FileText,
  },
  { label: "Statistik", href: "/admin/wilayah#statistics", icon: ChartColumn },
  { label: "Potensi", href: "/admin/wilayah#potentials", icon: MapPin },
  {
    label: "Fasilitas publik",
    href: "/admin/wilayah#facilities",
    icon: MapPin,
  },
  {
    label: "Pengguna & audit",
    href: "/admin/pengguna",
    icon: Users,
    group: "Administrasi",
  },
  { label: "Verifikasi kontak", href: "/admin/verifikasi-kontak", icon: Users },
];
export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const path = usePathname();
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const sync = () => {
      setHash(window.location.hash);
      setOpen(false);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [path]);
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
  const logout = useMutation({ mutationFn: () => runtime.logout() });
  if (auth.status === "INITIALIZING")
    return (
      <div className="admin-loading" role="status">
        Memeriksa sesi Anda…
      </div>
    );
  if (auth.status === "TEMPORARY_ERROR")
    return (
      <div className="admin-loading">
        <AuthRecovery />
      </div>
    );
  if (auth.status === "GUEST")
    return (
      <div className="admin-login-page">
        <section className="admin-login-story">
          <Link href="/" className="admin-brand">
            K
            <span>
              KALOSARA<small>ADMINISTRASI KELURAHAN</small>
            </span>
          </Link>
          <div>
            <span className="admin-eyebrow">RUANG KERJA PENGELOLA</span>
            <h1>
              Informasi yang baik
              <br />
              dimulai dari sini.
            </h1>
            <p>
              Kelola berita, profil, dan informasi kelurahan dalam satu ruang
              kerja.
            </p>
          </div>
          <small>Kanal Layanan Online Surat dan Administrasi Rakyat</small>
        </section>
        <section className="admin-login-area">
          <form
            className="admin-login-card"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate();
            }}
          >
            <div className="admin-lock">
              <LockKeyhole size={24} />
            </div>
            <span className="admin-eyebrow">SELAMAT DATANG KEMBALI</span>
            <h2>Masuk ke panel admin</h2>
            <p>Gunakan akun petugas untuk mengelola website.</p>
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
            <label htmlFor="admin-password">Kata sandi</label>
            <div className="admin-password">
              <input
                id="admin-password"
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
                aria-label={
                  visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                }
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {login.isError && (
              <div className="admin-error" role="alert">
                {cmsError(login.error)}
              </div>
            )}
            <button className="admin-primary" disabled={login.isPending}>
              {login.isPending ? "Sedang masuk…" : "Masuk ke panel admin"}
              <ArrowRight size={18} />
            </button>
            <Link className="admin-back" href="/">
              ← Kembali ke website kelurahan
            </Link>
          </form>
        </section>
      </div>
    );
  if (!auth.user || !["ADMIN_KELURAHAN", "LURAH"].includes(auth.user.role))
    return (
      <div className="admin-loading">
        Akun ini tidak memiliki akses panel admin.{" "}
        <Link href="/">Kembali ke beranda</Link>
      </div>
    );
  const current =
    adminLinks.find((l) => l.href === path + hash) ??
    adminLinks.find((l) => l.href.split("#")[0] === path);
  return (
    <div className="admin-workspace">
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <Link href="/admin" className="admin-brand">
          K
          <span>
            KALOSARA<small>PANEL PENGELOLA</small>
          </span>
        </Link>
        <button
          className="admin-mobile-close"
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <nav aria-label="Menu admin">
          {adminLinks
            .filter(
              (l) =>
                auth.user?.role === "ADMIN_KELURAHAN" || l.href === "/admin",
            )
            .map((l) => (
              <div key={l.href}>
                {l.group && <p className="admin-nav-group">{l.group}</p>}
                <Link
                  href={l.href}
                  onClick={(event) => {
                    setOpen(false);
                    if (l.href.includes("#") && l.href.split("#")[0] === path) {
                      event.preventDefault();
                      window.location.hash = l.href.split("#")[1];
                    }
                  }}
                  aria-current={current?.href === l.href ? "page" : undefined}
                >
                  <l.icon size={18} />
                  {l.label}
                </Link>
              </div>
            ))}
        </nav>
        <Link href="/" className="admin-visit">
          <ExternalLink size={17} />
          Lihat website
        </Link>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <div>
            <button
              className="admin-mobile-toggle"
              aria-label="Buka menu admin"
              onClick={() => setOpen(!open)}
            >
              <Menu />
            </button>
            <span>
              Ruang kerja <span className="admin-separator">/</span>{" "}
              <strong>{current?.label ?? "Pengelolaan"}</strong>
            </span>
          </div>
          <div className="admin-account">
            <span className="admin-avatar">
              {auth.user.role === "LURAH" ? "L" : "A"}
            </span>
            <span>
              {auth.user.role === "LURAH" ? "Lurah" : "Administrator"}
              <small>Sesi aktif</small>
            </span>
            <button
              title="Keluar dari akun"
              aria-label="Keluar dari akun"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        {logout.isError && (
          <div className="admin-error" role="alert">
            {cmsError(logout.error)}
          </div>
        )}
        <div className="admin-content">{children}</div>
        <footer className="admin-footer">
          KALOSARA · Panel pengelola kelurahan
        </footer>
      </div>
    </div>
  );
}
