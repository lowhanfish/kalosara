"use client";
import { siteIdentity } from "@/lib/site-identity";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

import type { SiteSettings } from "@/lib/site-settings";
import { Dialog } from "@/components/ui/dialog";
import { SearchForm } from "./search-form";
export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const path = usePathname();
  const items = [
    { title: "Beranda", href: "/" },
    { title: "Profil", href: "/profil" },
    { title: "Berita", href: "/berita" },
    { title: "Pelayanan", href: "/pelayanan" },
    { title: "Agenda", href: "/agenda" },
    { title: "Galeri", href: "/galeri" },
    { title: "Informasi", href: "/informasi-publik" },
    { title: "Statistik", href: "/statistik" },
    { title: "Kontak", href: "/kontak" },
  ];
  const links = items.map((page) => (
    <Link
      key={page.href}
      href={page.href}
      aria-current={path === page.href ? "page" : undefined}
      className="portal-nav-link"
    >
      {page.title}
      {["Profil", "Pelayanan", "Informasi"].includes(page.title) && (
        <span className="nav-chevron" aria-hidden="true">
          ⌄
        </span>
      )}
    </Link>
  ));
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
            <Image
              src={settings.logoUrl ?? siteIdentity.logo}
              alt="Lambang Kabupaten Konawe"
              width={64}
              height={64}
              unoptimized
              className="portal-crest"
            />
            <span>
              <span className="block text-xs font-bold uppercase tracking-wide">
                Kelurahan
              </span>
              <span className="block text-xl leading-tight font-extrabold uppercase tracking-tight">
                {settings.name.replace(/^Kelurahan /, "")}
              </span>
              <span className="mt-1 block text-[9px] font-medium">
                {settings.district ?? "Kecamatan Puriala"},{" "}
                {settings.regency ?? "Kabupaten Konawe"}
              </span>
            </span>
          </Link>
          <div className="portal-header-content">
            <div className="portal-search-row">
              <SearchForm id="desktop-search" compact />
              <Link href="/pelayanan" className="yellow-button">
                Cek Layanan <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
            <nav aria-label="Navigasi utama" className="portal-desktop-nav">
              {links}
            </nav>
          </div>
          <div className="portal-mobile-menu">
            <Dialog title={`Jelajahi ${settings.name}`} triggerLabel="Menu">
              <nav
                aria-label="Navigasi seluler"
                className="mb-6 grid grid-cols-2 gap-x-4"
              >
                {links}
              </nav>
              <SearchForm id="mobile-search" />
            </Dialog>
          </div>
        </div>
      </header>
    </>
  );
}
