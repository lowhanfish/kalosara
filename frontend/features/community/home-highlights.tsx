import Link from "next/link";
import Image from "next/image";
import { getRegion, type Place } from "@/lib/region";
export async function CommunityHighlights() {
  const categories = [
    { category: "Wisata", title: "Wisata sekitar kelurahan", href: "/wisata" },
    { category: "Produk UMKM", title: "Beli dari kelurahan", href: "/belanja" },
  ];
  const results = await Promise.allSettled(
    categories.map((c) =>
      getRegion<Place>(
        "potentials",
        new URLSearchParams({ category: c.category, limit: "3" }),
      ),
    ),
  );
  return (
    <>
      {categories.map((c, i) => {
        const result = results[i];
        const items = result.status === "fulfilled" ? result.value.items : [];
        return (
          <section key={c.href} className="container py-10 sm:py-14">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">JELAJAHI WATUNDEHOA</p>
                <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
                  {c.title}
                </h2>
              </div>
              <Link
                href={c.href}
                className="text-sm font-semibold text-primary"
              >
                Lihat semua →
              </Link>
            </div>
            {items.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/potensi/${item.id}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-primary"
                  >
                    {item.photoId && (
                      <Image
                        width={480}
                        height={300}
                        unoptimized
                        loading="lazy"
                        src={`/api/v1/public/media/${item.photoId}?variant=thumb`}
                        alt={item.photoAlt}
                        className="aspect-[16/10] w-full object-cover"
                      />
                    )}
                    <div className="p-6">
                      <p className="text-xs text-muted">{item.category}</p>
                      <h3 className="mt-2 text-lg font-bold">{item.name}</h3>
                      <p className="mt-4 text-sm font-semibold text-primary">
                        Lihat selengkapnya →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-muted">
                {result.status === "rejected"
                  ? "Informasi sementara tidak dapat dimuat."
                  : "Konten belum dipublikasikan."}
              </p>
            )}
          </section>
        );
      })}
    </>
  );
}
