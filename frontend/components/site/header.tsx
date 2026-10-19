"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
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
  const links = navigation.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={
        (item.href === "/" ? path === "/" : path.startsWith(item.href))
          ? "page"
          : undefined
      }
      className={`flex min-h-12 items-center border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${(item.href === "/" ? path === "/" : path.startsWith(item.href)) ? "border-amber-400 text-primary" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-primary"}`}
    >
      {item.title}
    </Link>
  ));
  return (
    <>
      <a className="skip-link" href="#konten">
        Langsung ke konten
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="hidden border-b border-slate-100 bg-slate-50/80 sm:block">
          <div className="container flex min-h-9 items-center justify-between gap-4 text-xs text-slate-500">
            <p className="flex items-center gap-2">
              <ShieldCheck size={13} className="text-primary" />
              {settings.name} · {settings.district}
            </p>
            <Link
              href="/kontak"
              className="flex items-center gap-1.5 font-medium hover:text-primary"
            >
              Informasi & bantuan
              <ArrowUpRight size={12} />
            </Link>
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
          <Link
            href="/pelayanan"
            className="hidden min-h-11 items-center gap-3 rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-400 lg:flex"
          >
            Panduan pelayanan
            <ArrowUpRight size={16} />
          </Link>
          <div className="lg:hidden">
            <Dialog
              title="Jelajahi KALOSARA"
              triggerLabel="Menu"
              triggerClassName="text-sm"
            >
              <nav
                aria-label="Navigasi seluler"
                className="mb-6 grid grid-cols-2 gap-x-5"
              >
                {links}
              </nav>
              <SearchForm id="mobile-search" />
              <Link
                href="/admin"
                className="mt-6 block border-t border-slate-100 pt-5 text-[15px] text-muted"
              >
                Masuk sebagai pengelola ↗
              </Link>
            </Dialog>
          </div>
        </div>
        <div className="hidden border-t border-slate-100 lg:block">
          <nav
            aria-label="Navigasi utama"
            className="container flex flex-wrap items-center justify-between gap-x-4"
          >
            {links}
          </nav>
        </div>
      </header>
    </>
  );
}
