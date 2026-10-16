"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Landmark } from "lucide-react";
import { publicPages } from "@/lib/public-pages";
import type { SiteSettings } from "@/lib/site-settings";
import { Dialog } from "@/components/ui/dialog";
import { SearchForm } from "./search-form";
export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const path = usePathname();
  const links = publicPages.map((page) => (
    <Link
      key={page.href}
      href={page.href}
      aria-current={path === page.href ? "page" : undefined}
      className="portal-nav-link"
    >
      {page.title}
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
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt={`Logo resmi ${settings.name}`}
                width={48}
                height={58}
                unoptimized
              />
            ) : (
              <span
                className="portal-brand-mark"
                title="Ikon kelurahan; logo resmi belum diisi"
              >
                <Landmark aria-hidden="true" size={30} strokeWidth={1.7} />
              </span>
            )}
            <span>
              <span className="block text-xs font-bold uppercase tracking-wide">
                Kelurahan
              </span>
              <span className="block text-xl leading-tight font-extrabold uppercase tracking-tight">
                {settings.name.replace(/^Kelurahan /, "")}
              </span>
              <span className="mt-1 block text-[9px] font-medium">
                Kecamatan Puriala, Kabupaten Konawe
              </span>
            </span>
          </Link>
          <div className="portal-header-content">
            <div className="portal-search-row">
              <SearchForm id="desktop-search" compact />
              <Link href="/pelayanan" className="yellow-button">
                Cek pelayanan <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
            <nav aria-label="Navigasi utama" className="portal-desktop-nav">
              {links}
            </nav>
          </div>
          <div className="portal-mobile-menu">
            <Dialog title="Jelajahi Watundehoa" triggerLabel="Menu">
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
