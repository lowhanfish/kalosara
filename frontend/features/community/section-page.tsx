import Link from "next/link";
import { ChartColumn } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import {
  communitySections,
  getSection,
  type SectionSlug,
} from "@/lib/community";
import { aggregateText } from "@/lib/region";
export default async function SectionPage({ slug }: { slug: SectionSlug }) {
  const config = communitySections[slug];
  let section;
  let failed = false;
  try {
    section = await getSection(slug);
  } catch {
    failed = true;
  }
  return (
    <main id="konten" className="container pb-16">
      <PageHeading
        title={section?.title ?? config.title}
        description={config.description}
        icon={ChartColumn}
      />
      <nav
        aria-label="Infografis kelurahan"
        className="mb-8 flex flex-wrap gap-3"
      >
        {[
          ["Penduduk", "/statistik"],
          ["Anggaran", "/anggaran"],
          ["Bansos", "/bansos"],
          ["Stunting", "/stunting"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={href === `/${slug}` ? "page" : undefined}
            className={href === `/${slug}` ? "navy-button" : "white-button"}
          >
            {label}
          </Link>
        ))}
      </nav>
      {failed ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6"
        >
          Informasi sementara tidak dapat dimuat. Silakan muat ulang halaman.
        </p>
      ) : !section ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-bold">Data resmi belum dipublikasikan</h2>
          <p className="mt-3 text-muted">
            Data {config.title.toLowerCase()} akan ditampilkan setelah diperiksa
            dan diterbitkan oleh pengelola. Data yang belum tersedia tidak
            dihitung sebagai nol.
          </p>
        </section>
      ) : (
        <>
          <p className="mb-5 text-sm text-muted">
            Periode: {section.period} · Sumber: {section.source}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {section.metrics.map((m, i) => (
              <article
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <p className="text-sm text-muted">{m.label}</p>
                <p className="mt-3 text-2xl font-bold text-primary">
                  {m.unit === "Rp" && m.value !== null ? "Rp " : ""}
                  {aggregateText(m.value)}
                </p>
                {m.unit !== "Rp" && (
                  <p className="mt-1 text-xs text-muted">{m.unit}</p>
                )}
              </article>
            ))}
          </div>
          <div className="mt-8 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-7 leading-8">
            {section.content}
          </div>
        </>
      )}
      {slug === "bansos" && (
        <section className="mt-8 rounded-2xl bg-primary p-8 text-white">
          <h2 className="text-xl font-bold">Cek bantuan melalui kanal resmi</h2>
          <p className="my-4 text-sm text-slate-200">
            Pengecekan penerima dilakukan melalui layanan Cek Bansos Kemensos.
            Website ini hanya menampilkan informasi dan rekapitulasi, tanpa
            mempublikasikan identitas penerima.
          </p>
          <a
            className="yellow-button"
            href="https://cekbansos.kemensos.go.id/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka Cek Bansos Kemensos ↗
          </a>
        </section>
      )}
      <Link
        href="/informasi-publik"
        className="mt-8 inline-block font-semibold text-primary"
      >
        Lihat dokumen pendukung →
      </Link>
    </main>
  );
}
