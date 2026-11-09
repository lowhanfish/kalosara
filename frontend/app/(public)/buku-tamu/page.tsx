import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/site-settings";
import { siteIdentity } from "@/lib/site-identity";
import { GuestbookForm } from "@/features/guestbook/guestbook-form";

export const metadata: Metadata = {
  title: "Buku Tamu Digital — Registrasi Kunjungan",
  description:
    "Formulir registrasi kunjungan dan buku tamu digital Kantor Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe.",
};

export default async function BukuTamuPage() {
  const settings = await getSiteSettings();
  const siteName = settings.name ?? siteIdentity.name;
  const locationName = settings.address ?? siteIdentity.location;

  return (
    <main id="konten" tabIndex={-1} className="min-h-screen bg-slate-50/50 pb-16">
      <GuestbookForm siteName={siteName} locationName={locationName} />
    </main>
  );
}
