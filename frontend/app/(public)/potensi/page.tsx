import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHeading } from "@/components/ui/page-heading";
import { MapPin } from "lucide-react";
import { getRegion, mapUrls, type Place } from "@/lib/region";
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
      <PageHeading
        title="Potensi & fasilitas wilayah"
        icon={MapPin}
        description="Jelajahi fasilitas publik, usaha warga, dan potensi kelurahan."
      />
      <form className="public-content-filters">
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
          />
        </label>
        <label>
          Kategori
          <input
            name="category"
            defaultValue={category}
            maxLength={100}
            className="cms-input"
          />
        </label>
        <button className="yellow-button">Tampilkan</button>
      </form>
      {failed && (
        <p
          role="alert"
          className="my-6 rounded-xl border border-red-200 bg-red-50 p-5 text-[15px] text-red-800"
        >
          Informasi wilayah sementara tidak dapat dimuat.{" "}
          <Link className="underline" href="/potensi">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((item) => {
          const map = mapUrls(item.latitude, item.longitude);
          return (
            <article
              key={item.id}
              className="min-w-0 overflow-hidden rounded-xl border border-border bg-white"
            >
              {item.photoId && (
                <Image
                  src={`/api/v1/public/media/${item.photoId}?variant=display`}
                  alt={item.photoAlt}
                  width={480}
                  height={320}
                  unoptimized
                  loading="lazy"
                  className="aspect-[3/2] w-full object-cover"
                />
              )}
              <div className="space-y-3 p-5">
                <p className="text-[15px] text-muted">{item.category}</p>
                <h2 className="break-words text-xl font-bold">{item.name}</h2>
                <p className="whitespace-pre-wrap break-words">
                  {item.description}
                </p>
                <p className="break-words text-[15px]">
                  Lokasi: {item.location}
                </p>
                {map && (
                  <a
                    href={map.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block underline"
                  >
                    Lihat lokasi di OpenStreetMap
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {data && (
        <nav
          aria-label="Halaman potensi dan fasilitas"
          className="mt-8 flex flex-wrap gap-5"
        >
          {page > 1 && <Link href={pageLink(page - 1)}>Sebelumnya</Link>}
          <span>
            Halaman {page} · {data.total} item
          </span>
          {page * data.limit < data.total && (
            <Link href={pageLink(page + 1)}>Berikutnya</Link>
          )}
        </nav>
      )}
    </main>
  );
}
