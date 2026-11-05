"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Search, User, ChevronDown } from "lucide-react";
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
  const link = (item: (typeof navigation)[number]) => (
    <Link
      key={item.href}
      href={item.href}
      className="portal-nav-link"
      aria-current={
        (item.href === "/" ? path === "/" : path.startsWith(item.href))
          ? "page"
          : undefined
      }
    >
      {item.title}
    </Link>
  );
  return (
    <>
      <a className="skip-link" href="#konten">
        Langsung ke konten
      </a>
      <header className="portal-header">
        <div className="container portal-header-inner">
          <Link
            href="/"
            aria-label={`Beranda ${settings.name}`}
            className="portal-brand"
          >
            <span className="portal-crest">
              <Image
                src={settings.logoUrl ?? siteIdentity.logo}
                alt="Lambang Kabupaten Konawe"
                width={36}
                height={44}
                unoptimized
              />
            </span>
            <span>
              <span className="portal-brand-kicker">Kelurahan</span>
              <strong>{settings.name.replace(/^Kelurahan /, "")}</strong>
            </span>
          </Link>
          <nav aria-label="Navigasi utama" className="portal-desktop-nav">
            {navigation.slice(0, 4).map(link)}
            <div className="portal-more">
              <button
                type="button"
                className={`portal-nav-link ${navigation.slice(4).some((item) => path.startsWith(item.href)) ? "is-active" : ""}`}
                aria-haspopup="true"
              >
                Jelajahi <ChevronDown size={13} />
              </button>
              <div className="portal-dropdown">
                {navigation.slice(4).map(link)}
              </div>
            </div>
          </nav>
          <div className="portal-header-actions">
            <div className="portal-search">
              <Dialog
                title="Temukan informasi"
                triggerLabel="Cari"
                triggerClassName="portal-search-trigger"
              >
                <SearchForm id="navbar-search" />
              </Dialog>
              <Search size={16} aria-hidden="true" />
            </div>
            <Link href="/masyarakat/dashboard" className="portal-account">
              <User size={15} />
              <span>Akun Warga</span>
              <ArrowUpRight size={14} />
            </Link>
            <details className="portal-mobile-menu">
              <summary className="portal-menu-trigger">Menu</summary>
              <div className="portal-mobile-panel">
                <nav
                  aria-label="Navigasi seluler"
                  className="grid grid-cols-2 gap-2 mb-6"
                >
                  {navigation.map(link)}
                </nav>
                <SearchForm id="mobile-search" />
                <Link href="/admin" className="mt-6 block text-sm text-muted">
                  Panel pengelola ↗
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
