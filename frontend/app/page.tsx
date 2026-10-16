import Link from "next/link";
import Image from "next/image";
import { siteIdentity } from "@/lib/site-identity";
import { LeaderSection } from "@/components/site/leader-section";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  FileText,
  Megaphone,
  Newspaper,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const shortcuts = [
  {
    title: "Profil kelurahan",
    description: "Kenali wilayah & aparatur",
    href: "/profil",
    icon: Users,
  },
  {
    title: "Informasi publik",
    description: "Dokumen & keterbukaan",
    href: "/informasi-publik",
    icon: FileText,
  },
  {
    title: "Agenda kegiatan",
    description: "Jadwal di lingkungan Anda",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    title: "Panduan pelayanan",
    description: "Alur & informasi persyaratan",
    href: "/pelayanan",
    icon: BookOpen,
  },
];
export default function Home() {
  return (
    <main id="konten" tabIndex={-1}>
      <section className="watundehoa-hero relative isolate overflow-hidden bg-[#102e49] text-white">
        <Image
          src={siteIdentity.officePhoto}
          alt="Tampak depan Kantor Kelurahan Watundehoa dengan bangunan biru dan atap merah"
          fill
          unoptimized
          preload
          sizes="100vw"
          className="hero-office object-cover"
        />
        <div className="hero-shade absolute inset-0" aria-hidden="true" />
        <div className="container relative z-10 flex min-h-[560px] flex-col justify-center py-14 lg:min-h-[620px] lg:py-20">
          <p className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.18em] text-[#f3d58f]">
            <span className="h-px w-8 bg-[#e8bf69]" />
            Selamat datang di Watundehoa
          </p>
          <h1 className="max-w-2xl text-[2.8rem] leading-[1.08] font-semibold tracking-[-.045em] sm:text-6xl lg:text-[4.5rem]">
            Lebih dekat.
            <br />
            Lebih mudah.
            <br />
            <span className="font-display font-normal italic text-[#f3d58f]">
              Untuk warga.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#e2ebf4] sm:text-base">
            Portal informasi Kelurahan Watundehoa.
            <br />
            Kecamatan Puriala, Kabupaten Konawe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-white text-[#173951] hover:bg-[#e7eff6]"
            >
              <Link href="/pelayanan">
                Informasi pelayanan{" "}
                <ArrowUpRight aria-hidden="true" className="ml-4 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/profil">Mengenal Watundehoa</Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-3 text-[11px] text-[#d0dfeb]">
            <span
              className="size-1.5 rounded-full bg-[#f0cb7d]"
              aria-hidden="true"
            />
            Informasi publik, terbuka untuk semua.
          </div>
          <div className="mt-8 max-w-xs border-t border-white/25 pt-4 text-xs lg:absolute lg:right-0 lg:bottom-8 lg:mt-0 lg:text-right">
            <p className="font-semibold text-white">
              Kantor Kelurahan Watundehoa
            </p>
            <p className="mt-1 text-[#d0dfeb]">
              Kecamatan Puriala · Kabupaten Konawe
            </p>
          </div>
        </div>
      </section>
      <section
        aria-labelledby="akses-cepat"
        className="container relative z-10 py-8 lg:-mt-7 lg:pt-0"
      >
        <h2 id="akses-cepat" className="sr-only">
          Akses cepat
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-xl border border-border bg-white p-5 shadow-card transition-colors hover:border-primary"
            >
              <span className="rounded-lg bg-soft p-2.5 text-primary">
                <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-1 block text-xs text-muted">
                  {description}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="mt-1 size-4 text-primary"
              />
            </Link>
          ))}
        </div>
      </section>
      <LeaderSection />
      <section className="container grid gap-10 pt-5 pb-16 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Kabar dari lingkungan Anda</p>
              <h2 className="display-title mt-2 text-3xl">Berita kelurahan</h2>
            </div>
            <Link
              href="/berita"
              className="flex items-center gap-2 text-xs font-semibold text-primary"
            >
              Semua berita <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <EmptyState
            title="Ruang untuk kabar baik"
            description="Belum ada berita yang diterbitkan. Kegiatan dan informasi resmi kelurahan akan hadir di sini."
          >
            <Badge>Publikasi akan hadir di sini</Badge>
          </EmptyState>
        </div>
        <aside>
          <div className="mb-6">
            <p className="eyebrow">Jangan terlewat</p>
            <h2 className="display-title mt-2 text-3xl">Papan informasi</h2>
          </div>
          <div className="rounded-card border border-border bg-white">
            <Link
              href="/pengumuman"
              className="flex items-start gap-4 border-b border-border p-6 hover:bg-soft"
            >
              <Megaphone
                aria-hidden="true"
                className="size-5 shrink-0 text-primary"
              />
              <span>
                <span className="block text-sm font-semibold">Pengumuman</span>
                <span className="mt-2 block text-xs leading-5 text-muted">
                  Belum ada pengumuman resmi. Lihat halaman pengumuman untuk
                  pembaruan.
                </span>
              </span>
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
            <Link
              href="/agenda"
              className="flex items-start gap-4 p-6 hover:bg-soft"
            >
              <CalendarDays
                aria-hidden="true"
                className="size-5 shrink-0 text-primary"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Agenda mendatang
                </span>
                <span className="mt-2 block text-xs leading-5 text-muted">
                  Jadwal kegiatan akan ditampilkan setelah diterbitkan oleh
                  kelurahan.
                </span>
              </span>
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          </div>
        </aside>
      </section>
      <section className="container pb-16" aria-labelledby="kantor-title">
        <div className="grid overflow-hidden rounded-2xl border border-border bg-white md:grid-cols-2">
          <div className="relative min-h-56 sm:min-h-72">
            <Image
              src={siteIdentity.officeSignPhoto}
              alt="Papan nama Kantor Kelurahan Watundehoa di depan halaman kantor"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col items-start justify-center p-7 sm:p-10">
            <p className="eyebrow">Ruang pelayanan masyarakat</p>
            <h2 id="kantor-title" className="display-title mt-3 text-3xl">
              Mari terhubung
              <br />
              dengan kelurahan.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Kelurahan Watundehoa
              <br />
              Kecamatan Puriala, Kabupaten Konawe.
            </p>
            <Link
              href="/kontak"
              className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary"
            >
              Alamat dan informasi kontak{" "}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-soft">
        <div className="container flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
          <div className="flex items-start gap-5">
            <span className="hidden rounded-full border border-border p-4 sm:block">
              <Newspaper
                aria-hidden="true"
                className="size-7 text-primary"
                strokeWidth={1.3}
              />
            </span>
            <div>
              <p className="eyebrow">Persiapkan sebelum berkunjung</p>
              <h2 className="display-title mt-2 text-3xl">
                Informasi dulu, urusan lebih mudah.
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted">
                Pelayanan online akan hadir pada tahap berikutnya. Untuk saat
                ini, kenali alur pelayanan dan hubungi kantor kelurahan.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/kontak">
              Hubungi kelurahan{" "}
              <ArrowUpRight aria-hidden="true" className="ml-3 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
