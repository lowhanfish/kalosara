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
import { MotionFadeIn } from "@/components/ui/motion";

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
      <MotionFadeIn direction="up">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {page ? (
              <article className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
                {page.content.includes("<") ? (
                  <div
                    className="cms-rich text-[15px] leading-8 text-slate-600"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-[15px] leading-8 text-slate-600">
                    {page.content}
                  </div>
                )}
              </article>
            ) : (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
                <span className="mb-5 grid size-12 place-items-center rounded-xl bg-slate-100 text-primary">
                  <FileText size={24} strokeWidth={1.6} />
                </span>
                <h2 className="text-xl font-bold text-primary sm:text-2xl">
                  Persiapkan kunjungan Anda
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-muted">
                  Panduan persyaratan lengkap sedang disiapkan. Untuk memastikan
                  dokumen yang perlu dibawa, konfirmasikan kebutuhan Anda kepada
                  petugas kelurahan.
                </p>
                <ol className="mt-7 space-y-4">
                  {[
                    "Hubungi petugas untuk menanyakan persyaratan dokumen.",
                    "Siapkan dokumen fisik dan fotokopi sesuai arahan petugas.",
                    "Kunjungi kantor kelurahan pada jam pelayanan resmi.",
                  ].map((step, index) => (
                    <li
                      key={step}
                      className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-slate-50"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-white shadow-xs">
                        {index + 1}
                      </span>
                      <p className="pt-0.5 text-[15px] font-medium leading-6 text-slate-700">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className="mt-6 flex gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm leading-6 text-amber-900 shadow-xs">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-amber-700" />
              <p>
                Pelayanan administrasi saat ini dilakukan langsung di kantor kelurahan.
                Pengajuan surat melalui website akan tersedia pada tahap berikutnya.
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-primary">
              <MapPin size={22} strokeWidth={1.6} />
            </span>
            <h2 className="mt-4 text-lg font-bold text-primary">
              Kantor kelurahan
            </h2>
            <p className="mt-2 text-[15px] leading-7 text-muted">
              {settings.address ?? settings.name}
            </p>
            {settings.hours && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs font-semibold leading-relaxed text-slate-700">
                <span className="text-slate-400">Jam Operasional:</span>
                <p className="mt-0.5 text-sm font-bold text-primary">{settings.hours}</p>
              </div>
            )}
            <Link
              href="/kontak"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-hover"
            >
              Lihat kontak & lokasi kantor
              <ArrowUpRight size={15} />
            </Link>
          </aside>
        </div>
      </MotionFadeIn>
    </main>
  );
}
