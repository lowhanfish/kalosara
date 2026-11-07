import { notFound } from "next/navigation";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { mapUrls, type Place } from "@/lib/region";
export const loadPlace = cache(
  async (kind: "facilities" | "potentials", id: string): Promise<Place> => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const r = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/region/${kind}/${id}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) },
    );
    if (r.status === 404 || r.status === 400) notFound();
    if (!r.ok) throw new Error("Detail sementara tidak dapat dimuat.");
    const item: Place = (await r.json()).data.item;
    return item;
  },
);
export default async function PlaceDetail({
  id,
  kind,
}: {
  id: string;
  kind: "facilities" | "potentials";
}) {
  const item = await loadPlace(kind, id);
  const map = mapUrls(item.latitude, item.longitude);
  return (
    <main id="konten" className="container py-10 sm:py-14">
      <Link
        className="text-sm font-semibold text-primary"
        href={
          kind === "facilities"
            ? "/fasilitas"
            : item.category === "Wisata"
              ? "/wisata"
              : item.category === "Produk UMKM"
                ? "/belanja"
                : "/potensi"
        }
      >
        ← Kembali ke direktori
      </Link>
      <article className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {item.photoId && (
          <Image
            width={1200}
            height={680}
            unoptimized
            src={`/api/v1/public/media/${item.photoId}?variant=display`}
            alt={item.photoAlt}
            className="max-h-[520px] w-full object-cover"
          />
        )}
        <div className="p-6 sm:p-10">
          <p className="eyebrow">{item.category}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {item.name}
          </h1>
          <p className="mt-4 text-sm text-muted">{item.location}</p>
          {item.description.includes("<") ? (
            <div
              className="cms-rich mt-8"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          ) : (
            <p className="mt-8 whitespace-pre-wrap">{item.description}</p>
          )}
          {map && (
            <a
              href={map.link}
              target="_blank"
              rel="noopener noreferrer"
              className="navy-button mt-8"
            >
              Buka lokasi di peta
            </a>
          )}
        </div>
      </article>
    </main>
  );
}
