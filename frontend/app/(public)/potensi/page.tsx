import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHeading } from "@/components/ui/page-heading";
import { MapPin, Navigation } from "lucide-react";
import { getRegion, mapUrls, type Place } from "@/lib/region";
import {
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  MotionHoverCard,
} from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Potensi lokal dan fasilitas publik",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const kind = raw.kind === "facilities" ? "facilities" : "potentials";
  const search = typeof raw.search === "string" ? raw.search.slice(0, 100) : "";
  const category =
    typeof raw.category === "string" ? raw.category.slice(0, 100) : "";
  const page = Math.min(100000, Math.max(1, Math.floor(Number(raw.page)) || 1));
  const q = new URLSearchParams({
    kind,
    page: String(page),
    limit: "9",
    search,
    ...(category ? { category } : {}),
  });
  let data;
  let failed = false;
  try {
    data = await getRegion<Place>(kind, q);
  } catch {
    failed = true;
  }
  const pageLink = (n: number) => {
    const query = new URLSearchParams(q);
    query.set("page", String(n));
    return `/potensi?${query}`;
  };

  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <MotionFadeIn>
        <PageHeading
          title="Potensi & fasilitas wilayah"
          icon={MapPin}
          description="Jelajahi fasilitas publik, usaha warga, dan potensi kelurahan."
        />
        <form className="public-content-filters mb-8">
          <label>
            Jenis informasi
            <select name="kind" defaultValue={kind} className="cms-input">
              <option value="facilities">Fasilitas publik</option>
              <option value="potentials">Potensi lokal / UMKM</option>
            </select>
          </label>
          <label>
            Cari nama
            <input
              name="search"
              defaultValue={search}
              maxLength={100}
              className="cms-input"
              placeholder="Contoh: Puskesmas, Warung..."
            />
          </label>
          <label>
            Kategori
            <input
              name="category"
              defaultValue={category}
              maxLength={100}
              className="cms-input"
              placeholder="Contoh: Kesehatan, Kuliner..."
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
          Informasi wilayah sementara tidak dapat dimuat.{" "}
          <Link className="underline font-medium" href="/potensi">
            Coba lagi
          </Link>
        </p>
      )}

      {data?.items.length === 0 && (
        <EmptyState
          title="Informasi wilayah belum tersedia"
          description="Potensi dan fasilitas kelurahan akan ditampilkan setelah datanya diterbitkan. Anda juga dapat mencoba kata kunci atau kategori lain."
        />
      )}

      <MotionStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((item) => {
          const map = mapUrls(item.latitude, item.longitude);
          return (
            <MotionStaggerItem key={item.id}>
              <MotionHoverCard className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                {item.photoId && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <Image
                      src={`/api/v1/public/media/${item.photoId}?variant=display`}
                      alt={item.photoAlt}
                      width={480}
                      height={320}
                      unoptimized
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-primary shadow-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="space-y-3">
                    {!item.photoId && (
                      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {item.category}
                      </span>
                    )}
                    <h2 className="break-words text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {item.name}
                    </h2>
                    {item.description.includes("<") ? (
                      <div
                        className="cms-rich text-sm leading-relaxed text-slate-600 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <p className="flex items-start gap-2 text-xs text-muted">
                      <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span className="break-words">{item.location}</span>
                    </p>
                    {map && (
                      <a
                        href={map.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-2"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Lihat lokasi di OpenStreetMap
                      </a>
                    )}
                  </div>
                </div>
              </MotionHoverCard>
            </MotionStaggerItem>
          );
        })}
      </MotionStagger>

      {data && (
        <MotionFadeIn delay={0.2}>
          <nav
            aria-label="Halaman potensi dan fasilitas"
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
              Halaman {page} · {data.total} item
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
    </main>
  );
}
