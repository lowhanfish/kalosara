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
import {
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/ui/motion";

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

      {/* News & Announcements Section */}
      <section className="container grid gap-10 py-14 sm:py-18 lg:grid-cols-[1.6fr_1fr]">
        <MotionFadeIn direction="up">
          <SectionHeading
            title="Kabar dari kelurahan"
            eyebrow="Informasi terkini"
            href="/berita"
            icon={Newspaper}
          />
          <HomeNews />
        </MotionFadeIn>

        <aside>
          <MotionFadeIn direction="up" delay={0.15}>
            <SectionHeading
              title="Pengumuman"
              eyebrow="Perlu Anda ketahui"
              href="/pengumuman"
              icon={Megaphone}
            />
            {notices.length ? (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                {notices.map((item) => (
                  <Link
                    key={item.id}
                    href={`/pengumuman#${item.id}`}
                    className="group flex items-start gap-4 p-5 transition-all duration-300 hover:bg-slate-50 hover:pl-6"
                  >
                    <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 transition-colors group-hover:bg-amber-100">
                      <Megaphone size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <time className="text-xs font-medium text-slate-400">
                        {formatContentDate(item.updatedAt)}
                      </time>
                      <h3 className="mt-1 text-[15px] font-semibold leading-snug text-primary transition-colors group-hover:text-primary">
                        {item.title}
                      </h3>
                    </div>
                    <ArrowUpRight
                      size={15}
                      className="mt-2 text-slate-300 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                    />
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
          </MotionFadeIn>
        </aside>
      </section>

      {/* Region Overview & Statistics Section */}
      <section className="border-y border-slate-200/80 bg-[#f4f7fb]/80 py-14 sm:py-18">
        <div className="container grid items-center gap-10 lg:grid-cols-2">
          <MotionFadeIn direction="left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-slate-500">
              Mengenal wilayah kita
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              Hadir di tengah masyarakat.
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-muted">
              {identity.name} berada di {identity.district}, {identity.regency}.
              Kenali wilayah, aparatur, dan keterbukaan informasi kelurahan Anda.
            </p>
            <Link
              href="/profil"
              className="mt-6 inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-xs transition hover:border-primary hover:bg-slate-50"
            >
              Tentang kelurahan
              <ArrowUpRight size={15} />
            </Link>
          </MotionFadeIn>

          <div>
            <MotionStagger className="grid grid-cols-2 gap-3 sm:gap-4">
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
                <MotionStaggerItem key={label}>
                  <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60 sm:p-6">
                    <div className="mb-4 grid size-11 place-items-center rounded-xl bg-slate-100 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-amber-300 group-hover:scale-105">
                      <Icon size={20} strokeWidth={1.7} />
                    </div>
                    <dt className="text-[13px] font-medium text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-3xl font-extrabold tracking-tight text-primary">
                      {value}
                    </dd>
                  </div>
                </MotionStaggerItem>
              ))}
            </MotionStagger>

            <p className="mt-4 text-[13px] leading-6 text-muted">
              {metric
                ? `Periode ${metric.period} · Sumber: ${metric.source}`
                : statistics.status === "rejected"
                  ? "Data statistik belum dapat dimuat."
                  : "Statistik akan tampil setelah data resmi diterbitkan."}{" "}
              <Link
                href="/statistik"
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                Lihat statistik lengkap ↗
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Events & Gallery Section */}
      <section className="container grid gap-10 py-14 sm:py-18 lg:grid-cols-2">
        <MotionFadeIn direction="up">
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
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="grid size-14 shrink-0 place-content-center rounded-xl bg-slate-100/80 text-center text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <strong className="text-xl font-extrabold leading-none">
                      {item.event
                        ? new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            timeZone: "Asia/Makassar",
                          }).format(new Date(item.event.start))
                        : "—"}
                    </strong>
                    <span className="mt-0.5 text-xs font-semibold uppercase">
                      {item.event
                        ? new Intl.DateTimeFormat("id-ID", {
                            month: "short",
                            timeZone: "Asia/Makassar",
                          }).format(new Date(item.event.start))
                        : ""}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-bold leading-6 text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {item.event?.location}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-slate-300 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  />
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
        </MotionFadeIn>

        <MotionFadeIn direction="up" delay={0.15}>
          <SectionHeading
            title="Cerita dalam foto"
            eyebrow="Galeri kelurahan"
            href="/galeri"
            icon={Images}
          />
          {photos.length ? (
            <div className="grid grid-cols-2 gap-3.5">
              {photos.map((photo) => (
                <Link
                  key={photo.mediaId}
                  href="/galeri"
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 shadow-xs"
                >
                  <Image
                    src={`/api/v1/public/media/${photo.mediaId}?variant=display`}
                    alt={photo.alt}
                    fill
                    unoptimized
                    sizes="(max-width:768px) 45vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
        </MotionFadeIn>
      </section>

      {/* Call To Action Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0c2e52] via-[#08233d] to-[#051728] text-white">
        {/* Ambient Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full bg-amber-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-sky-500/10 blur-3xl"
        />

        <div className="container relative z-10 grid items-center gap-8 py-14 sm:py-18 lg:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-5">
            <span className="hidden size-14 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 text-amber-300 backdrop-blur-md sm:grid">
              <MessageCircle size={26} strokeWidth={1.6} />
            </span>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-amber-300">
                Kami siap membantu
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ada pertanyaan seputar pelayanan?
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-300 sm:text-base">
                Pelajari persyaratan sebelum berkunjung, atau hubungi kantor
                melalui kontak resmi kelurahan.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/pelayanan"
              className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-amber-300 px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-300/15 transition hover:bg-amber-400 hover:shadow-xl"
            >
              Panduan pelayanan
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/kontak"
              className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
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

