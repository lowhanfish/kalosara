import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import {
  ArrowRight,
  ArrowUpRight,
  Newspaper,
  Megaphone,
  CalendarDays,
  Images,
  MapPin,
  Users,
  Building2,
  Landmark,
  MessageCircle,
} from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublicProfile } from "@/lib/profile";
import { getRegion, type Statistic } from "@/lib/region";
import { getContent, formatContentDate } from "@/lib/content";
import { HomeNews } from "@/features/news/home-news";
import { HomeHero } from "./components/hero";
import { QuickLinks } from "./components/quick-links";
import { SectionHeading } from "./components/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
export default async function HomePage() {
  await connection();
  const [settings, profile, announcements, events, galleries, statistics] =
    await Promise.allSettled([
      getSiteSettings(),
      getPublicProfile(),
      getContent("announcements", new URLSearchParams({ limit: "4" })),
      getContent(
        "events",
        new URLSearchParams({ limit: "3", period: "upcoming" }),
      ),
      getContent("galleries", new URLSearchParams({ limit: "1" })),
      getRegion<Statistic>("statistics", new URLSearchParams({ limit: "1" })),
    ]);
  const identity =
    settings.status === "fulfilled" ? settings.value : await getSiteSettings();
  const leader =
    profile.status === "fulfilled"
      ? profile.value.officials.find(
          (o) => o.position.toLowerCase() === "lurah",
        )
      : undefined;
  const notices =
    announcements.status === "fulfilled" ? announcements.value.items : [];
  const agenda = events.status === "fulfilled" ? events.value.items : [];
  const photos =
    galleries.status === "fulfilled"
      ? (galleries.value.items[0]?.gallery?.photos.slice(0, 4) ?? [])
      : [];
  const metric =
    statistics.status === "fulfilled" ? statistics.value.items[0] : undefined;
  const number = (v: number | null | undefined) =>
    v == null ? "—" : new Intl.NumberFormat("id-ID").format(v);
  return (
    <main id="konten" tabIndex={-1}>
      <HomeHero settings={identity} leader={leader} />
      <QuickLinks />
      <section className="container grid gap-10 py-14 sm:py-18 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <SectionHeading
            title="Kabar dari kelurahan"
            eyebrow="Informasi terkini"
            href="/berita"
            icon={Newspaper}
          />
          <HomeNews />
        </div>
        <aside>
          <SectionHeading
            title="Pengumuman"
            eyebrow="Perlu Anda ketahui"
            href="/pengumuman"
            icon={Megaphone}
          />
          {notices.length ? (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {notices.map((item) => (
                <Link
                  key={item.id}
                  href={`/pengumuman#${item.id}`}
                  className="group flex items-start gap-4 p-5 hover:bg-slate-50"
                >
                  <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                    <Megaphone size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <time className="text-[10px] text-slate-500">
                      {formatContentDate(item.updatedAt)}
                    </time>
                    <h3 className="mt-1.5 text-sm font-semibold leading-6 text-primary">
                      {item.title}
                    </h3>
                  </div>
                  <ArrowUpRight size={15} className="mt-2 text-slate-400" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                announcements.status === "rejected"
                  ? "Pengumuman belum dapat dimuat"
                  : "Belum ada pengumuman"
              }
              description={
                announcements.status === "rejected"
                  ? "Silakan coba kembali beberapa saat lagi."
                  : "Informasi penting untuk warga akan tersedia di sini."
              }
            />
          )}
        </aside>
      </section>
      <section className="border-y border-slate-200 bg-[#f4f7fb]">
        <div className="container grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
              Mengenal wilayah kita
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              Hadir di tengah masyarakat.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted">
              {identity.name} berada di {identity.district}, {identity.regency}.
              Kenali wilayah, aparatur, dan informasi resmi kelurahan Anda.
            </p>
            <Link
              href="/profil"
              className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary"
            >
              Tentang kelurahan
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div>
            <dl className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                {
                  label: "Penduduk",
                  value: number(metric?.population),
                  icon: Users,
                },
                {
                  label: "Kepala keluarga",
                  value: number(metric?.households),
                  icon: Building2,
                },
                {
                  label: "Rukun tetangga",
                  value: number(metric?.rt),
                  icon: Landmark,
                },
                {
                  label: "Rukun warga",
                  value: number(metric?.rw),
                  icon: MapPin,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
                >
                  <Icon
                    size={19}
                    strokeWidth={1.6}
                    className="mb-4 text-slate-400"
                  />
                  <dt className="text-[11px] text-slate-500">{label}</dt>
                  <dd className="mt-1 text-3xl font-bold tracking-tight text-primary">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[11px] leading-6 text-muted">
              {metric
                ? `Periode ${metric.period} · Sumber: ${metric.source}`
                : statistics.status === "rejected"
                  ? "Data statistik belum dapat dimuat."
                  : "Statistik akan tampil setelah data resmi diterbitkan."}{" "}
              <Link
                href="/statistik"
                className="font-medium underline underline-offset-4"
              >
                Lihat statistik ↗
              </Link>
            </p>
          </div>
        </div>
      </section>
      <section className="container grid gap-10 py-14 sm:py-18 lg:grid-cols-2">
        <div>
          <SectionHeading
            title="Agenda kegiatan"
            eyebrow="Ruang kebersamaan"
            href="/agenda"
            icon={CalendarDays}
          />
          {agenda.length ? (
            <div className="space-y-3">
              {agenda.map((item) => (
                <Link
                  key={item.id}
                  href={`/agenda#${item.id}`}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
                >
                  <div className="grid size-14 shrink-0 place-content-center rounded-xl bg-slate-50 text-center text-primary">
                    <strong className="text-xl">
                      {item.event
                        ? new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            timeZone: "Asia/Makassar",
                          }).format(new Date(item.event.start))
                        : "—"}
                    </strong>
                    <span className="text-[10px] uppercase">
                      {item.event
                        ? new Intl.DateTimeFormat("id-ID", {
                            month: "short",
                            timeZone: "Asia/Makassar",
                          }).format(new Date(item.event.start))
                        : ""}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-6 text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {item.event?.location}
                    </p>
                  </div>
                  <ArrowUpRight size={16} className="shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                events.status === "rejected"
                  ? "Agenda belum dapat dimuat"
                  : "Belum ada agenda mendatang"
              }
              description={
                events.status === "rejected"
                  ? "Silakan coba kembali beberapa saat lagi."
                  : "Jadwal kegiatan kelurahan berikutnya akan diumumkan di sini."
              }
            />
          )}
        </div>
        <div>
          <SectionHeading
            title="Cerita dalam foto"
            eyebrow="Galeri kelurahan"
            href="/galeri"
            icon={Images}
          />
          {photos.length ? (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo) => (
                <Link
                  key={photo.mediaId}
                  href="/galeri"
                  className="relative aspect-[4/3] overflow-hidden rounded-xl"
                >
                  <Image
                    src={`/api/v1/public/media/${photo.mediaId}?variant=thumb`}
                    alt={photo.alt}
                    fill
                    unoptimized
                    sizes="(max-width:768px) 45vw, 25vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                galleries.status === "rejected"
                  ? "Galeri belum dapat dimuat"
                  : "Dokumentasi segera hadir"
              }
              description={
                galleries.status === "rejected"
                  ? "Silakan coba kembali beberapa saat lagi."
                  : "Lihat momen dan kegiatan warga setelah dokumentasi diterbitkan."
              }
            />
          )}
        </div>
      </section>
      <section className="bg-[#0b2c4d] text-white">
        <div className="container grid items-center gap-8 py-12 sm:py-14 lg:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-5">
            <span className="hidden size-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/5 text-amber-300 sm:grid">
              <MessageCircle size={26} strokeWidth={1.5} />
            </span>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-amber-300">
                Kami siap membantu
              </p>
              <h2 className="text-2xl font-bold tracking-tight">
                Ada pertanyaan seputar pelayanan?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Pelajari persyaratan sebelum berkunjung, atau hubungi kantor
                melalui kontak resmi kelurahan.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pelayanan"
              className="inline-flex min-h-11 items-center gap-3 rounded-lg bg-amber-300 px-5 text-xs font-bold text-slate-900 hover:bg-amber-400"
            >
              Panduan pelayanan
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/kontak"
              className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-white/25 px-5 text-xs font-semibold text-white hover:bg-white/10"
            >
              Hubungi kami
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
