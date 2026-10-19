import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { siteIdentity } from "@/lib/site-identity";
import { LocationMap } from "@/features/region/location-map";
import { ContactGuide } from "@/components/site/contact-guide";
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
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6 rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold">Informasi pelayanan</h2>
          <dl className="space-y-5">
            <div>
              <dt className="font-semibold">Alamat</dt>
              <dd>{address}</dd>
            </div>
            <div>
              <dt className="font-semibold">Jam pelayanan</dt>
              <dd className="whitespace-pre-wrap">
                {settings.hours ?? "Jam pelayanan belum diisi pengelola."}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Telepon</dt>
              <dd>
                {settings.phone ? (
                  <a
                    className="underline"
                    href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                  >
                    {settings.phone}
                  </a>
                ) : (
                  "Nomor telepon belum diisi pengelola."
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Email</dt>
              <dd>
                {settings.email ? (
                  <a className="underline" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                ) : (
                  "Email resmi belum diisi pengelola."
                )}
              </dd>
            </div>
          </dl>
          {settings.relatedLinks.length > 0 && (
            <nav aria-label="Tautan resmi">
              <h3 className="mb-3 font-semibold">Tautan resmi</h3>
              <ul className="space-y-2">
                {settings.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {link.label}
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
    </main>
  );
}
