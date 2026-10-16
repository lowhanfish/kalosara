"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Landmark, MapPin } from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import { publicPages } from "@/lib/public-pages";
import type { SiteSettings } from "@/lib/site-settings";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchForm } from "./search-form";
export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const path = usePathname();
  const navItems = publicPages.filter((page) => page.href !== "/pelayanan");
  const link = (page: (typeof publicPages)[number]) => (
    <Link
      key={page.href}
      href={page.href}
      aria-current={path === page.href ? "page" : undefined}
      className={`border-b-2 px-1 py-4 text-[13px] font-medium transition-colors ${path === page.href ? "border-primary text-primary" : "border-transparent text-muted hover:border-primary hover:text-primary"}`}
    >
      {page.title}
    </Link>
  );
  return (
    <>
      <a className="skip-link" href="#konten">
        Langsung ke konten
      </a>
      <div className="bg-[#102d45] text-white">
        <div className="container flex min-h-9 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-[11px]">
          <p className="flex items-center gap-2">
            <span
              className="size-1.5 rounded-full bg-[#d7ad50]"
              aria-hidden="true"
            />
            {settings.isExample
              ? "Pratinjau portal • Identitas dan konten contoh"
              : "Pemerintah Kabupaten Konawe • Kecamatan Puriala"}
          </p>
          <Link
            href="/kontak"
            className="flex items-center gap-1.5 hover:underline"
          >
            <MapPin aria-hidden="true" className="size-3" /> Hubungi kelurahan{" "}
            <ArrowUpRight aria-hidden="true" className="size-3" />
          </Link>
        </div>
      </div>
      <header className="border-b border-border bg-white">
        <div className="container flex min-h-24 items-center justify-between gap-5 py-4">
          <Link
            href="/"
            aria-label={`Beranda ${settings.name}`}
            className="flex min-w-0 items-center gap-3"
          >
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt={`Logo resmi ${settings.name}`}
                width={44}
                height={52}
                unoptimized
                className="h-12 w-11 object-contain"
              />
            ) : (
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-soft text-primary"
                title="Slot logo resmi belum diisi"
              >
                <Landmark
                  aria-hidden="true"
                  className="size-7"
                  strokeWidth={1.3}
                />
              </span>
            )}
            <span className="min-w-0">
              <span className="mb-0.5 block text-[9px] font-semibold tracking-[.18em] text-primary">
                KALOSARA
              </span>
              <span className="block text-[1.35rem] font-bold tracking-tight text-foreground">
                {settings.name.replace(/^Kelurahan /, "")}
              </span>
              <span className="block text-[10px] font-medium tracking-wide text-muted">
                Kelurahan · {siteIdentity.district}
              </span>
            </span>
          </Link>
          <div className="hidden items-center gap-5 lg:flex">
            <Dialog
              title="Temukan halaman"
              triggerLabel="Cari halaman"
              triggerClassName="gap-2"
            >
              <SearchForm id="desktop-search" />
            </Dialog>
            <Button asChild>
              <Link href="/pelayanan">
                Informasi pelayanan{" "}
                <ArrowUpRight aria-hidden="true" className="ml-3 size-4" />
              </Link>
            </Button>
          </div>
          <div className="lg:hidden">
            <Dialog title="Jelajahi KALOSARA" triggerLabel="Menu">
              <nav
                aria-label="Navigasi seluler"
                className="mb-6 grid grid-cols-2 gap-x-4"
              >
                {publicPages.map(link)}
              </nav>
              <SearchForm id="mobile-search" />
            </Dialog>
          </div>
        </div>
        <nav
          aria-label="Navigasi utama"
          className="container hidden justify-between gap-3 lg:flex"
        >
          {navItems.map(link)}
          <Link
            href="/pelayanan"
            aria-current={path === "/pelayanan" ? "page" : undefined}
            className="flex items-center gap-2 border-b-2 border-transparent py-4 text-[13px] font-semibold text-primary hover:border-primary"
          >
            Pelayanan <ArrowUpRight aria-hidden="true" className="size-3" />
          </Link>
        </nav>
      </header>
    </>
  );
}
