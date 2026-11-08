import type { Metadata } from "next";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { PageHeading } from "@/components/ui/page-heading";
import { Landmark } from "lucide-react";
import { LeaderSection } from "@/components/site/leader-section";
import { ProfileAccordion } from "@/components/site/profile-accordion";
import { siteIdentity } from "@/lib/site-identity";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublicProfile } from "@/lib/profile";
import { MotionFadeIn } from "@/components/ui/motion";

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
          <p
            role="status"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            Profil resmi sementara tidak dapat dimuat. Silakan coba lagi.
          </p>
        )}

        <MotionFadeIn delay={0.1}>
          <ProfileAccordion profile={profile} settings={settings} />
        </MotionFadeIn>
      </section>

      <section className="container pb-16">
        <MotionFadeIn delay={0.2}>
          <div className="portal-card grid items-center gap-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
              <SkeletonImage
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
                <span className="font-medium text-slate-800">
                  {settings.district ?? siteIdentity.district}
                </span>
                ,{" "}
                <span className="font-medium text-slate-800">
                  {settings.regency ?? siteIdentity.regency}
                </span>
                . Informasi profil dan aparatur yang sudah dipublikasikan
                tersedia pada bagian di atas.
              </p>
            </div>
          </div>
        </MotionFadeIn>
      </section>
    </main>
  );
}
