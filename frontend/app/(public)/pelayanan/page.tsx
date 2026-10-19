import type { Metadata } from "next";
import Link from "next/link";
import {
  Landmark,
  FileText,
  MapPin,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { getPublicProfile } from "@/lib/profile";
import { getSiteSettings } from "@/lib/site-settings";
import { PageHeading } from "@/components/ui/page-heading";
export const metadata: Metadata = { title: "Pelayanan" };
export default async function Page() {
  const [profile, settings] = await Promise.all([
    getPublicProfile(),
    getSiteSettings(),
  ]);
  const page = profile.pages.find((p) => p.slug === "pelayanan");
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <PageHeading
        title={page?.title ?? "Panduan pelayanan"}
        description="Ketahui informasi dan persyaratan sebelum mengurus administrasi di kantor kelurahan."
        icon={Landmark}
      />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {page ? (
            <article className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-6 text-[15px] leading-8 text-slate-600 sm:p-8">
              {page.content}
            </article>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <span className="mb-5 grid size-12 place-items-center rounded-xl bg-slate-50 text-primary">
                <FileText size={24} strokeWidth={1.5} />
              </span>
              <h2 className="text-xl font-bold text-primary">
                Persiapkan kunjungan Anda
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-muted">
                Panduan persyaratan lengkap sedang disiapkan. Untuk memastikan
                dokumen yang perlu dibawa, konfirmasikan kebutuhan Anda kepada
                petugas kelurahan.
              </p>
              <ol className="mt-7 space-y-5">
                {[
                  "Hubungi petugas untuk menanyakan persyaratan.",
                  "Siapkan dokumen sesuai informasi dari petugas.",
                  "Kunjungi kantor kelurahan pada jam pelayanan.",
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <p className="pt-0.5 text-[15px] leading-6 text-slate-600">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            <CheckCircle2 size={18} className="mt-1 shrink-0" />
            <p>
              Pelayanan administrasi dilakukan di kantor kelurahan. Pengajuan
              surat melalui website belum tersedia.
            </p>
          </div>
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <MapPin size={22} strokeWidth={1.5} className="text-primary" />
          <h2 className="mt-4 text-base font-bold text-primary">
            Kantor kelurahan
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-muted">
            {settings.address ?? settings.name}
          </p>
          {settings.hours && (
            <p className="mt-4 text-sm font-medium leading-6 text-primary">
              {settings.hours}
            </p>
          )}
          <Link
            href="/kontak"
            className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-lg bg-primary px-5 text-sm font-semibold text-white"
          >
            Lihat kontak & lokasi
            <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
