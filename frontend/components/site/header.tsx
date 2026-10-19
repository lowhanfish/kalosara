"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ShieldCheck, User } from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import type { SiteSettings } from "@/lib/site-settings";
import { Dialog } from "@/components/ui/dialog";
import { SearchForm } from "./search-form";
const navigation = [
  { title: "Beranda", href: "/" },
  { title: "Profil", href: "/profil" },
  { title: "Berita", href: "/berita" },
  { title: "Pelayanan", href: "/pelayanan" },
  { title: "Agenda", href: "/agenda" },
  { title: "Galeri", href: "/galeri" },
  { title: "Informasi publik", href: "/informasi-publik" },
  { title: "Statistik", href: "/statistik" },
  { title: "Potensi", href: "/potensi" },
  { title: "Kontak", href: "/kontak" },
];
export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const path = usePathname();
  const links = navigation.map((item) => {
    const isActive =
      item.href === "/" ? path === "/" : path.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex min-h-12 items-center px-2.5 py-3 text-sm font-semibold transition-colors ${
          isActive
            ? "text-primary"
            : "text-slate-500 hover:text-primary"
        }`}
      >
        {item.title}
        {isActive && (
          <span
            className="absolute inset-x-1.5 bottom-0 h-0.5 rounded-full bg-amber-400"
            aria-hidden="true"
          />
        )}
      </Link>
    );
  });
  return (
    <>
      <a className="skip-link" href="#konten">
        Langsung ke konten
      </a>
      <header className="border-b border-slate-100 bg-white">
        <div className="hidden border-b border-slate-100 bg-slate-50/80 sm:block">
          <div className="container flex min-h-9 items-center justify-between gap-4 text-xs text-slate-500">
            <p className="flex items-center gap-2">
              <ShieldCheck size={13} className="text-primary" />
              {settings.name} · {settings.district}
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/masyarakat/dashboard"
                className="flex items-center gap-1.5 font-medium text-slate-600 transition-colors hover:text-primary"
              >
                <User size={13} className="text-primary" />
                Akun Warga
              </Link>
              <span className="text-slate-200" aria-hidden="true">
                |
              </span>
              <Link
                href="/kontak"
                className="flex items-center gap-1.5 font-medium transition-colors hover:text-primary"
              >
                Informasi & bantuan
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
        <div className="container flex min-h-[88px] items-center justify-between gap-6 py-4">
          <Link
            href="/"
            aria-label={`Beranda ${settings.name}`}
            className="flex min-w-0 items-center gap-3"
          >
            <Image
              src={settings.logoUrl ?? siteIdentity.logo}
              alt="Lambang Kabupaten Konawe"
              width={46}
              height={54}
              unoptimized
              className="h-12 w-10 shrink-0 object-contain sm:h-14 sm:w-12"
            />
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[.2em] text-slate-500">
                Kelurahan
              </span>
              <span className="mt-0.5 block text-lg font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-xl">
                {settings.name.replace(/^Kelurahan /, "")}
              </span>
              <span className="mt-1 hidden text-xs text-slate-500 sm:block">
                {settings.regency ?? "Kabupaten Konawe"}
              </span>
            </span>
          </Link>
          <div className="hidden w-full max-w-sm lg:block">
            <SearchForm id="desktop-search" compact />
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/masyarakat/dashboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-slate-300 hover:bg-slate-50"
            >
              <User size={15} />
              Akun Warga
            </Link>
            <Link
              href="/pelayanan"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-amber-400"
            >
              Panduan pelayanan
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="lg:hidden">
            <Dialog
              title="Jelajahi KALOSARA"
              triggerLabel="Menu"
              triggerClassName="text-sm font-semibold"
            >
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Layanan Mandiri Warga
                </p>
                <Link
                  href="/masyarakat/dashboard"
                  className="mt-2.5 flex items-center justify-between rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-hover"
                >
                  <span className="flex items-center gap-2">
                    <User size={16} />
                    Portal Akun Warga
                  </span>
                  <ArrowUpRight size={15} />
                </Link>
              </div>
              <nav
                aria-label="Navigasi seluler"
                className="mb-6 grid grid-cols-2 gap-x-5"
              >
                {links}
              </nav>
              <SearchForm id="mobile-search" />
              <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 text-sm text-muted">
                <Link
                  href="/masyarakat/dashboard"
                  className="flex items-center justify-between py-1 hover:text-primary"
                >
                  Masuk / Daftar Akun Masyarakat ↗
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center justify-between py-1 hover:text-primary"
                >
                  Masuk sebagai pengelola ↗
                </Link>
              </div>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Bagian menu navigasi yang STICKY */}
      <nav
        aria-label="Navigasi utama"
        className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all duration-200"
      >
        <div className="container hidden lg:flex items-center justify-between gap-x-2 text-sm">
          {links}
        </div>
        <div className="container flex h-12 items-center justify-between lg:hidden">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary"
          >
            <Image
              src={settings.logoUrl ?? siteIdentity.logo}
              alt=""
              width={22}
              height={26}
              unoptimized
              className="h-5 w-4 object-contain"
            />
            <span>{settings.name.replace(/^Kelurahan /, "")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/masyarakat/dashboard"
              className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              Akun Warga
            </Link>
            <Dialog
              title="Jelajahi KALOSARA"
              triggerLabel="Menu"
              triggerClassName="text-xs py-1 px-3"
            >
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Layanan Mandiri Warga
                </p>
                <Link
                  href="/masyarakat/dashboard"
                  className="mt-2.5 flex items-center justify-between rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-hover"
                >
                  <span className="flex items-center gap-2">
                    <User size={16} />
                    Portal Akun Warga
                  </span>
                  <ArrowUpRight size={15} />
                </Link>
              </div>
              <nav
                aria-label="Navigasi seluler"
                className="mb-6 grid grid-cols-2 gap-x-5"
              >
                {links}
              </nav>
              <SearchForm id="mobile-sticky-search" />
              <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 text-sm text-muted">
                <Link
                  href="/masyarakat/dashboard"
                  className="flex items-center justify-between py-1 hover:text-primary"
                >
                  Masuk / Daftar Akun Masyarakat ↗
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center justify-between py-1 hover:text-primary"
                >
                  Masuk sebagai pengelola ↗
                </Link>
              </div>
            </Dialog>
          </div>
        </div>
      </nav>
    </>
  );
}
