import { StatisticCharts } from "@/features/region/statistic-charts";
import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { ChartColumn, ArrowRight, ChevronDown } from "lucide-react";
import {
  getRegion,
  metricLabels,
  aggregateText,
  regionDate,
  type Statistic,
} from "@/lib/region";
import {
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/ui/motion";

export const metadata: Metadata = { title: "Statistik wilayah" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const period =
    typeof raw.period === "string" &&
    /^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/.test(raw.period)
      ? raw.period
      : "";
  const page = Math.min(100000, Math.max(1, Math.floor(Number(raw.page)) || 1));
  const query = new URLSearchParams({
    limit: "5",
    page: String(page),
    ...(period ? { period } : {}),
  });
  let data;
  let failed = false;
  try {
    data = await getRegion<Statistic>("statistics", query);
  } catch {
    failed = true;
  }
  const pageLink = (n: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(n));
    return `/statistik?${q}`;
  };

  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <MotionFadeIn>
        <PageHeading
          title="Statistik wilayah"
          icon={ChartColumn}
          description="Mengenal kelurahan melalui data penduduk, keluarga, dan lingkungan."
        />
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted">
          Data penduduk dan RT/RW ditampilkan dalam bentuk agregat, dengan periode
          dan sumber dari pengelola. Tidak memuat identitas atau nomor dokumen
          kependudukan individu.
        </p>
        <form className="public-content-filters mb-8">
          <label>
            Periode
            <input
              className="cms-input"
              name="period"
              defaultValue={period}
              pattern="[0-9]{4}(-[0-9]{2})?"
              maxLength={7}
              placeholder="YYYY atau YYYY-MM"
            />
          </label>
          <button className="yellow-button">Tampilkan</button>
        </form>
      </MotionFadeIn>

      {failed && (
        <p
          role="alert"
          className="my-6 rounded-xl border border-red-200 bg-red-50 p-5 text-[15px] text-red-800"
        >
          Statistik sementara tidak dapat dimuat.{" "}
          <Link href="/statistik" className="underline font-medium">
            Coba lagi
          </Link>
        </p>
      )}

      {data?.items.length === 0 && (
        <EmptyState
          title="Data statistik belum tersedia"
          description="Data resmi akan ditampilkan setelah diterbitkan. Coba periode lain atau kunjungi kembali nanti."
        />
      )}

      {data && data.items.length > 0 && (
        <MotionFadeIn delay={0.1} className="mb-10">
          <StatisticCharts items={data.items} />
        </MotionFadeIn>
      )}

      <MotionStagger className="space-y-4">
        {data?.items.map((item) => (
          <MotionStaggerItem key={item.id}>
            <details className="group rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs transition-all open:shadow-md">
              <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                <span>Tabel data · Periode {item.period}</span>
                <ChevronDown className="h-5 w-5 text-slate-400 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-4 break-words text-xs text-muted">
                  Sumber: <span className="font-medium text-slate-700">{item.source}</span>
                  {" · "}
                  Tanggal data: {regionDate(item.referenceDate)} · Diperbarui:{" "}
                  {regionDate(item.updatedAt)}
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">
                      Angka agregat wilayah periode {item.period}
                    </caption>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500">
                        <th scope="col" className="p-3.5 font-semibold">
                          Indikator
                        </th>
                        <th scope="col" className="p-3.5 font-semibold text-right">
                          Jumlah
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(metricLabels).map(([key, label]) => (
                        <tr
                          key={key}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <th scope="row" className="p-3.5 font-normal text-slate-800">
                            {label}
                          </th>
                          <td className="p-3.5 text-right font-medium tabular-nums text-slate-900">
                            {aggregateText(item[key as keyof typeof metricLabels])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      {data && (
        <MotionFadeIn delay={0.2}>
          <nav
            aria-label="Halaman statistik"
            className="mt-10 flex flex-wrap items-center justify-center gap-5 text-sm"
          >
            {page > 1 && (
              <Link
                href={pageLink(page - 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium hover:bg-slate-50 transition-colors"
              >
                Sebelumnya
              </Link>
            )}
            <span className="font-medium text-slate-600">
              Halaman {page} · {data.total} periode
            </span>
            {page * data.limit < data.total && (
              <Link
                href={pageLink(page + 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium hover:bg-slate-50 transition-colors"
              >
                Berikutnya
              </Link>
            )}
          </nav>
        </MotionFadeIn>
      )}

      <MotionFadeIn delay={0.3} className="mt-12">
        <Link
          href="/potensi"
          className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          <span>Lihat potensi lokal dan fasilitas publik wilayah</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </MotionFadeIn>
    </main>
  );
}
