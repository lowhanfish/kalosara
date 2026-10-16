import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  getRegion,
  metricLabels,
  aggregateText,
  regionDate,
  type Statistic,
} from "@/lib/region";
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
      <Breadcrumb
        items={[{ label: "Beranda", href: "/" }, { label: "Statistik" }]}
      />
      <h1 className="display-title py-8 text-4xl">Statistik wilayah</h1>
      <p className="mb-6 max-w-3xl text-muted">
        Data penduduk dan RT/RW ditampilkan dalam bentuk agregat, dengan periode
        dan sumber dari pengelola. Tidak memuat identitas atau nomor dokumen
        kependudukan individu.
      </p>
      <form className="public-content-filters">
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
      {failed && (
        <p role="alert">
          Statistik sementara tidak dapat dimuat.{" "}
          <Link href="/statistik" className="underline">
            Coba lagi
          </Link>
        </p>
      )}
      {data?.items.length === 0 && (
        <p>Belum ada statistik resmi yang diterbitkan untuk periode ini.</p>
      )}
      <div className="space-y-8">
        {data?.items.map((item) => (
          <section
            key={item.id}
            className="rounded-xl border border-border bg-white p-5 sm:p-7"
          >
            <h2 className="text-2xl font-bold">Periode {item.period}</h2>
            <p className="my-3 break-words text-sm text-muted">
              Sumber: {item.source}
              <br />
              Tanggal data: {regionDate(item.referenceDate)} · Diperbarui:{" "}
              {regionDate(item.updatedAt)}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <caption className="pb-4 text-left font-semibold">
                  Angka agregat wilayah periode {item.period}
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="p-3">
                      Indikator
                    </th>
                    <th scope="col" className="p-3">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metricLabels).map(([key, label]) => (
                    <tr key={key} className="border-b border-border">
                      <th scope="row" className="p-3 font-medium">
                        {label}
                      </th>
                      <td className="p-3 tabular-nums">
                        {aggregateText(item[key as keyof typeof metricLabels])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
      {data && (
        <nav
          aria-label="Halaman statistik"
          className="mt-8 flex flex-wrap gap-5"
        >
          {page > 1 && <Link href={pageLink(page - 1)}>Sebelumnya</Link>}
          <span>
            Halaman {page} · {data.total} periode
          </span>
          {page * data.limit < data.total && (
            <Link href={pageLink(page + 1)}>Berikutnya</Link>
          )}
        </nav>
      )}
      <p className="mt-8">
        <Link href="/potensi" className="underline">
          Lihat potensi lokal dan fasilitas publik
        </Link>
      </p>
    </main>
  );
}
