import Link from "next/link";
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
import { Neighborhood } from "@/components/site/neighborhood";

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
      <section className="overflow-hidden border-b border-border bg-[#f0f4e9]">
        <div className="container grid items-center gap-4 pt-12 pb-8 lg:grid-cols-[1.05fr_1fr] lg:py-14">
          <div className="relative z-10 py-4">
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-7 bg-primary" />
              Terhubung, terbuka, melayani
            </p>
            <h1 className="display-title mt-5 max-w-xl text-5xl sm:text-6xl lg:text-[4.25rem]">
              Lebih dekat dengan
              <br className="hidden sm:block" /> kelurahan Anda.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted">
              Temukan informasi lingkungan, kabar kelurahan, dan panduan
              pelayanan dalam satu tempat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/pelayanan">
                  Jelajahi pelayanan{" "}
                  <ArrowUpRight aria-hidden="true" className="ml-4 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/profil">Kenali kelurahan</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted">
              Portal dalam pengembangan. Konten resmi belum diterbitkan.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <Neighborhood />
            <p className="text-right text-[10px] tracking-wide text-muted">
              ILUSTRASI KANTOR • BUKAN LOKASI SEBENARNYA
            </p>
          </div>
        </div>
      </section>
      <section aria-labelledby="akses-cepat" className="container py-9">
        <h2 id="akses-cepat" className="sr-only">
          Akses cepat
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-card border border-border bg-white p-5 transition-colors hover:border-primary"
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
            <Badge>Pratinjau • belum ada konten resmi</Badge>
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
      <section className="border-y border-border bg-[#edf2e9]">
        <div className="container flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
          <div className="flex items-start gap-5">
            <span className="hidden rounded-full border border-[#bccfb9] p-4 sm:block">
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
