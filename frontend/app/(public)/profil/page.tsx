import type { Metadata } from "next";
import Image from "next/image";
import { PageHeading } from "@/components/ui/page-heading";
import { Landmark } from "lucide-react";
import { LeaderSection } from "@/components/site/leader-section";
import { siteIdentity } from "@/lib/site-identity";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublicProfile } from "@/lib/profile";
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
        <PageHeading
          title="Profil kelurahan"
          icon={Landmark}
          description={`${settings.name}, ${settings.district}, ${settings.regency}. Kenali wilayah dan aparatur yang melayani Anda.`}
        />
      </div>
      <LeaderSection />
      <section className="container grid gap-5 pb-12 md:grid-cols-2">
        {profile.unavailable && (
          <p role="status">
            Profil resmi sementara tidak dapat dimuat. Silakan coba lagi.
          </p>
        )}
        {[
          ["sejarah", "Sejarah"],
          ["visi-misi", "Visi dan misi"],
          ["tugas-fungsi", "Tugas dan fungsi"],
          ["struktur-organisasi", "Struktur organisasi"],
          ["sambutan-lurah", "Sambutan lurah"],
        ].map(([slug, label]) => {
          const page = profile.pages.find((p) => p.slug === slug);
          return (
            <article
              key={slug}
              id={slug}
              className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"
            >
              <h2 className="text-xl font-semibold">{page?.title ?? label}</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                {page?.content || "Materi resmi belum dipublikasikan."}
              </p>
            </article>
          );
        })}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <h2 className="text-xl font-semibold">Aparatur</h2>
          {profile.officials.length === 0 && (
            <p className="mt-3">Daftar aparatur resmi belum dipublikasikan.</p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {profile.officials.map((official) => (
              <div
                className="rounded-xl border border-border p-5"
                key={official.id}
              >
                {official.photoUrl && (
                  <Image
                    src={official.photoUrl}
                    alt={official.name}
                    width={160}
                    height={180}
                    unoptimized
                    className="h-44 w-40 object-cover object-top"
                  />
                )}
                <h3 className="mt-3 font-semibold">{official.name}</h3>
                <p>{official.position}</p>
                <p>{official.unit}</p>
                <p className="mt-2 text-sm text-muted">
                  Masa tugas:{" "}
                  {official.termStart?.slice(0, 10) ?? "Belum diisi"} —{" "}
                  {official.termEnd?.slice(0, 10) ?? "Belum diisi"}
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <h2 className="text-xl font-semibold">Alamat dan peta</h2>
          <p className="mt-3">{settings.address ?? "Alamat belum diisi."}</p>
          {settings.latitude != null && settings.longitude != null ? (
            <a
              className="inline-block py-3 underline"
              href={`https://www.openstreetmap.org/?mlat=${settings.latitude}&mlon=${settings.longitude}#map=16/${settings.latitude}/${settings.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka peta kantor
            </a>
          ) : (
            <p>Koordinat kantor belum diisi.</p>
          )}
        </article>
      </section>
      <section className="container grid items-center gap-8 pb-16 md:grid-cols-2">
        <div className="relative aspect-[2/1] overflow-hidden rounded-xl">
          <Image
            src={siteIdentity.officeSignPhoto}
            alt="Papan nama Kantor Kelurahan Watundehoa"
            fill
            unoptimized
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="eyebrow">Kantor kelurahan</p>
          <h2 className="display-title mt-3 text-3xl">
            Hadir di tengah masyarakat.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            {settings.name} berada di{" "}
            {settings.district ?? siteIdentity.district},{" "}
            {settings.regency ?? siteIdentity.regency}. Informasi profil dan
            aparatur yang sudah dipublikasikan tersedia pada bagian di atas.
          </p>
        </div>
      </section>
    </main>
  );
}
