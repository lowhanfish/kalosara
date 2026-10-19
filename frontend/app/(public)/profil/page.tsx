import type { Metadata } from "next";
import Image from "next/image";
import { PageHeading } from "@/components/ui/page-heading";
import { Landmark, MapPin, Building, Users, Calendar } from "lucide-react";
import { LeaderSection } from "@/components/site/leader-section";
import { siteIdentity } from "@/lib/site-identity";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublicProfile } from "@/lib/profile";
import {
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  MotionHoverCard,
} from "@/components/ui/motion";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Profil ${settings.name}`,
    description: `Profil, struktur organisasi dan aparatur ${settings.name}, ${settings.district}, ${settings.regency}.`,
    alternates: { canonical: "/profil" },
  };
}

export default async function Page() {
  const [settings, profile] = await Promise.all([
    getSiteSettings(),
    getPublicProfile(),
  ]);

  return (
    <main id="konten" tabIndex={-1}>
      <div className="container">
        <MotionFadeIn>
          <PageHeading
            title="Profil kelurahan"
            icon={Landmark}
            description={`${settings.name}, ${settings.district}, ${settings.regency}. Kenali wilayah dan aparatur yang melayani Anda.`}
          />
        </MotionFadeIn>
      </div>

      <LeaderSection />

      <section className="container pb-14">
        {profile.unavailable && (
          <p role="status" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Profil resmi sementara tidak dapat dimuat. Silakan coba lagi.
          </p>
        )}

        <MotionStagger className="grid gap-6 md:grid-cols-2">
          {[
            ["sejarah", "Sejarah", "Perjalanan dan rekam jejak kelurahan"],
            ["visi-misi", "Visi dan misi", "Arah pembangunan dan pengabdian"],
            ["tugas-fungsi", "Tugas dan fungsi", "Peran dalam tata kelola pelayanan"],
            ["struktur-organisasi", "Struktur organisasi", "Tata susunan perangkat kelurahan"],
            ["sambutan-lurah", "Sambutan lurah", "Pesan dari pimpinan wilayah"],
          ].map(([slug, label, subtitle]) => {
            const page = profile.pages.find((p) => p.slug === slug);
            return (
              <MotionStaggerItem key={slug}>
                <article
                  id={slug}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Building className="h-4 w-4" />
                      <span>{subtitle}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      {page?.title ?? label}
                    </h2>
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                      {page?.content || "Materi resmi belum dipublikasikan."}
                    </p>
                  </div>
                </article>
              </MotionStaggerItem>
            );
          })}

          <MotionStaggerItem>
            <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <MapPin className="h-4 w-4" />
                <span>Lokasi Kantor</span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Alamat dan peta</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {settings.address ?? "Alamat belum diisi."}
              </p>
              <div className="mt-auto pt-6">
                {settings.latitude != null && settings.longitude != null ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                    href={`https://www.openstreetmap.org/?mlat=${settings.latitude}&mlon=${settings.longitude}#map=16/${settings.latitude}/${settings.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-yellow-400" />
                    Buka peta kantor di OpenStreetMap
                  </a>
                ) : (
                  <p className="text-xs text-muted">Koordinat kantor belum diisi.</p>
                )}
              </div>
            </article>
          </MotionStaggerItem>
        </MotionStagger>

        <div className="mt-8">
          <MotionFadeIn delay={0.15}>
            <article className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Users className="h-4 w-4" />
                    <span>Perangkat Kelurahan</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">Aparatur Kelurahan</h2>
                </div>
              </div>

              {profile.officials.length === 0 && (
                <p className="mt-4 text-sm text-muted">Daftar aparatur resmi belum dipublikasikan.</p>
              )}

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {profile.officials.map((official) => (
                  <MotionHoverCard
                    className="group flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-center transition-all hover:bg-white hover:border-slate-200 hover:shadow-md"
                    key={official.id}
                  >
                    {official.photoUrl ? (
                      <div className="relative h-44 w-36 overflow-hidden rounded-xl bg-slate-200 shadow-xs group-hover:scale-105 transition-transform duration-300">
                        <Image
                          src={official.photoUrl}
                          alt={official.name}
                          fill
                          unoptimized
                          className="object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="grid h-44 w-36 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-bold text-slate-400 shadow-xs"
                      >
                        {official.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </div>
                    )}
                    <h3 className="mt-4 font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {official.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary">{official.position}</p>
                    <p className="text-xs text-muted mt-0.5">{official.unit}</p>
                    {(official.termStart || official.termEnd) && (
                      <p className="mt-3 flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-muted">
                        <Calendar className="h-3 w-3" />
                        {official.termStart?.slice(0, 10) ?? "—"} s/d {official.termEnd?.slice(0, 10) ?? "—"}
                      </p>
                    )}
                  </MotionHoverCard>
                ))}
              </div>
            </article>
          </MotionFadeIn>
        </div>
      </section>

      <section className="container pb-16">
        <MotionFadeIn delay={0.2}>
          <div className="grid items-center gap-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
              <Image
                src={siteIdentity.officeSignPhoto}
                alt="Papan nama Kantor Kelurahan Watundehoa"
                fill
                unoptimized
                sizes="(max-width:768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div>
              <p className="eyebrow">Kantor kelurahan</p>
              <h2 className="display-title mt-2 text-2xl sm:text-3xl font-bold">
                Hadir di tengah masyarakat.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {settings.name} berada di{" "}
                <span className="font-medium text-slate-800">{settings.district ?? siteIdentity.district}</span>,{" "}
                <span className="font-medium text-slate-800">{settings.regency ?? siteIdentity.regency}</span>. Informasi profil dan
                aparatur yang sudah dipublikasikan tersedia pada bagian di atas.
              </p>
            </div>
          </div>
        </MotionFadeIn>
      </section>
    </main>
  );
}
