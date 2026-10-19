"use client";

import { useId, useState } from "react";
import {
  Users,
  House,
  MapPin,
  Building2,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  aggregateText,
  metricLabels,
  regionDate,
  type Statistic,
} from "@/lib/region";
import {
  chartMaximum,
  chronologicalStatistics,
  genderComposition,
  statisticPeriod,
  validCount,
} from "@/lib/statistics";

type Metric = "population" | "households";
const percentage = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);
const summaries = [
  { key: "population", label: "Jumlah penduduk", unit: "jiwa", icon: Users },
  { key: "households", label: "Kepala keluarga", unit: "KK", icon: House },
  { key: "rt", label: "Rukun tetangga", unit: "RT", icon: MapPin },
  { key: "rw", label: "Rukun warga", unit: "RW", icon: Building2 },
] as const;

export function StatisticCharts({ items }: { items: Statistic[] }) {
  const ordered = chronologicalStatistics(items);
  const [selectedId, setSelectedId] = useState(ordered.at(-1)?.id);
  const [metric, setMetric] = useState<Metric>("population");
  const selected =
    ordered.find((item) => item.id === selectedId) ?? ordered.at(-1);
  const titleId = useId();
  if (!selected) return null;
  const gender = genderComposition(selected);
  const maximum = chartMaximum(ordered.map((item) => item[metric]));
  const unit = metric === "population" ? "jiwa" : "KK";
  const hasValues = ordered.some((item) => validCount(item[metric]));
  return (
    <div className="mb-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Gambaran wilayah
          </p>
          <h2 className="mt-1 text-2xl font-bold">Data dalam angka</h2>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">
          Periode ringkasan
          <select
            className="cms-input min-w-48"
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {[...ordered].reverse().map((item) => (
              <option key={item.id} value={item.id}>
                {statisticPeriod(item.period)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {summaries.map(({ key, label, unit, icon: Icon }) => (
          <div
            key={key}
            className="rounded-2xl border border-border bg-white p-4 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted">{label}</p>
              <Icon
                size={20}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
            </div>
            <p className="mt-4 flex flex-wrap items-baseline gap-x-2 font-bold tabular-nums">
              <span
                className={
                  validCount(selected[key])
                    ? "text-3xl tracking-tight"
                    : "text-lg"
                }
              >
                {aggregateText(selected[key])}
              </span>
              {validCount(selected[key]) && (
                <span className="text-sm font-medium text-muted">{unit}</span>
              )}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-7">
          <h3 className="text-xl font-bold">Komposisi penduduk</h3>
          <p className="mt-1 text-sm text-muted">
            Menurut jenis kelamin · {statisticPeriod(selected.period)}
          </p>
          {gender ? (
            <>
              <figure
                className="mt-6 flex flex-col items-center gap-6 sm:flex-row"
                aria-label={`Komposisi: laki-laki ${aggregateText(selected.male)} jiwa (${percentage(gender.malePercent)} persen), perempuan ${aggregateText(selected.female)} jiwa (${percentage(gender.femalePercent)} persen).`}
              >
                <div className="relative size-52 shrink-0" aria-hidden="true">
                  <svg viewBox="0 0 200 200" className="size-full -rotate-90">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#d8a53c"
                      strokeWidth="22"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#193b60"
                      strokeWidth="22"
                      pathLength="100"
                      strokeDasharray={`${gender.malePercent} ${100 - gender.malePercent}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tabular-nums">
                      {aggregateText(gender.total)}
                    </span>
                    <span className="mt-1 text-sm text-muted">
                      jiwa tercatat
                    </span>
                  </div>
                </div>
                <figcaption className="w-full space-y-5">
                  {(
                    [
                      ["male", "Laki-laki", gender.malePercent, "#193b60"],
                      ["female", "Perempuan", gender.femalePercent, "#d8a53c"],
                    ] as const
                  ).map(([key, label, percent, color]) => (
                    <div key={key}>
                      <p className="flex items-center gap-2 text-sm text-muted">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {label}
                      </p>
                      <p className="mt-1 flex items-baseline justify-between gap-3">
                        <span className="text-xl font-bold tabular-nums">
                          {aggregateText(selected[key])}{" "}
                          <span className="text-sm font-normal text-muted">
                            jiwa
                          </span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {percentage(percent)}%
                        </span>
                      </p>
                    </div>
                  ))}
                </figcaption>
              </figure>
              <p className="mt-5 text-sm leading-6 text-muted">
                Persentase dihitung dari jumlah laki-laki dan perempuan yang
                tercatat.
                {selected.population !== gender.total &&
                  " Jumlah ini dapat berbeda dari total penduduk pada ringkasan."}
              </p>
            </>
          ) : (
            <p className="mt-8 rounded-xl bg-slate-50 p-5 text-muted">
              Grafik komposisi belum tersedia. Diperlukan jumlah laki-laki dan
              perempuan dengan total lebih dari nol.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h3 id={titleId} className="text-xl font-bold">
              Perbandingan periode
            </h3>
            <ChartNoAxesCombined
              className="shrink-0 text-primary"
              size={22}
              aria-hidden="true"
            />
          </div>
          <div
            className="mt-4 flex flex-wrap gap-2"
            role="group"
            aria-label="Indikator grafik"
          >
            {(["population", "households"] as const).map((key) => (
              <button
                type="button"
                key={key}
                aria-pressed={metric === key}
                onClick={() => setMetric(key)}
                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${metric === key ? "border-primary bg-primary text-white" : "border-border bg-white text-muted hover:bg-slate-50"}`}
              >
                {metricLabels[key]}
              </button>
            ))}
          </div>
          <figure className="mt-6" aria-labelledby={titleId}>
            {hasValues ? (
              <>
                <div
                  className="mb-4 flex justify-between border-b border-border pb-2 text-xs text-muted"
                  aria-hidden="true"
                >
                  <span>0 {unit}</span>
                  <span>
                    {aggregateText(maximum)} {unit}
                  </span>
                </div>
                <div className="space-y-5">
                  {ordered.map((item) => (
                    <div key={item.id}>
                      <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
                        <span>{statisticPeriod(item.period)}</span>
                        <span className="font-bold tabular-nums">
                          {aggregateText(item[metric])}
                          {validCount(item[metric]) ? ` ${unit}` : ""}
                        </span>
                      </div>
                      <div
                        className="h-4 overflow-hidden rounded-full bg-slate-100"
                        aria-hidden="true"
                      >
                        {validCount(item[metric]) && (
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${(item[metric] / maximum) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-slate-50 p-5 text-muted">
                Angka {metricLabels[metric].toLowerCase()} belum tersedia untuk
                periode ini.
              </p>
            )}
            <figcaption className="mt-6 text-sm leading-6 text-muted">
              Menampilkan {ordered.length} periode pada halaman ini, diurutkan
              dari periode paling awal. Skala dimulai dari nol.
              {ordered.length === 1 &&
                " Pilih lebih banyak periode untuk membandingkan data."}
            </figcaption>
          </figure>
        </section>
      </div>
      <p className="break-words rounded-xl bg-slate-100 px-5 py-4 text-sm leading-6 text-muted">
        <span className="font-semibold text-foreground">Sumber ringkasan:</span>{" "}
        {selected.source}
        <br />
        Tanggal data: {regionDate(selected.referenceDate)} · Diperbarui:{" "}
        {regionDate(selected.updatedAt)}
      </p>
    </div>
  );
}
