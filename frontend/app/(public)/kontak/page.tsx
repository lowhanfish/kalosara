import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { siteIdentity } from "@/lib/site-identity";
import { LocationMap } from "@/features/region/location-map";
import { ContactGuide } from "@/components/site/contact-guide";
import { MotionFadeIn } from "@/components/ui/motion";

export const metadata: Metadata = { title: "Kontak dan lokasi kantor" };

export default async function Page() {
  const settings = await getSiteSettings();
  const address = settings.address ?? siteIdentity.location;

  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <PageHeading
        title="Kontak & lokasi"
        icon={MessageCircle}
        description="Temukan alamat kantor, jam pelayanan, dan cara menghubungi kelurahan."
      />
      <MotionFadeIn direction="up">
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="text-xl font-bold text-primary">Informasi pelayanan</h2>
            <dl className="space-y-5">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Alamat Kantor
                </dt>
                <dd className="mt-1 font-semibold text-primary">{address}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Jam Pelayanan
                </dt>
                <dd className="mt-1 whitespace-pre-wrap font-semibold text-primary">
                  {settings.hours ?? "Jam pelayanan belum diisi pengelola."}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Telepon / WhatsApp
                </dt>
                <dd className="mt-1 font-semibold text-primary">
                  {settings.phone ? (
                    <a
                      className="hover:underline"
                      href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                    >
                      {settings.phone}
                    </a>
                  ) : (
                    "Nomor telepon belum diisi pengelola."
                  )}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email Resmi
                </dt>
                <dd className="mt-1 font-semibold text-primary">
                  {settings.email ? (
                    <a className="hover:underline" href={`mailto:${settings.email}`}>
                      {settings.email}
                    </a>
                  ) : (
                    "Email resmi belum diisi pengelola."
                  )}
                </dd>
              </div>
            </dl>
            {settings.relatedLinks.length > 0 && (
              <nav aria-label="Tautan resmi" className="pt-2">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tautan Resmi Terkait
                </h3>
                <ul className="space-y-2">
                  {settings.relatedLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline hover:text-primary-hover"
                      >
                        {link.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </section>
          <LocationMap
            latitude={settings.latitude}
            longitude={settings.longitude}
            address={address}
          />
        </div>
        <div className="mt-8">
          <ContactGuide />
        </div>
      </MotionFadeIn>
    </main>
  );
}
