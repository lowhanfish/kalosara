import Link from "next/link";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import {
  Compass,
  ShoppingBag,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { getRegion, type Place } from "@/lib/region";
import {
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/ui/motion";

function cleanSnippet(text?: string, max = 110) {
  if (!text) return "";
  const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > max ? plain.slice(0, max) + "…" : plain;
}

export async function CommunityHighlights() {
  const sections = [
    {
      category: "Wisata",
      title: "Wisata Sekitar Kelurahan",
      eyebrow: "JELAJAHI WATUNDEHOA",
      subtitle:
        "Pesona bentang alam, panorama perbukitan, dan destinasi rekreasi khas Konawe yang menanti Anda.",
      href: "/wisata",
      icon: Compass,
      cta: "Lihat semua wisata",
      itemCta: "Jelajahi",
      bgClass: "bg-gradient-to-b from-transparent via-slate-50/70 to-transparent",
    },
    {
      category: "Produk UMKM",
      title: "Beli dari Kelurahan",
      eyebrow: "POTENSI & KREASI LOKAL",
      subtitle:
        "Dukung kemandirian warga Watundehoa melalui hasil bumi, komoditas tani, dan olahan produk unggulan.",
      href: "/belanja",
      icon: ShoppingBag,
      cta: "Lihat semua produk",
      itemCta: "Lihat produk",
      bgClass: "bg-transparent",
    },
  ];

  const results = await Promise.allSettled(
    sections.map((c) =>
      getRegion<Place>(
        "potentials",
        new URLSearchParams({ category: c.category, limit: "3" }),
      ),
    ),
  );

  return (
    <>
      {sections.map((c, i) => {
        const result = results[i];
        const items = result.status === "fulfilled" ? result.value.items : [];
        const Icon = c.icon;

        return (
          <section key={c.href} className={`py-12 sm:py-16 ${c.bgClass}`}>
            <div className="container">
              <MotionFadeIn direction="up">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-md bg-amber-100 text-amber-800">
                        <Icon size={13} aria-hidden="true" />
                      </span>
                      <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">
                        {c.eyebrow}
                      </p>
                    </div>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                      {c.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {c.subtitle}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 sm:hidden">
                      Geser kartu →
                    </span>
                    <Link
                      href={c.href}
                      className="group inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-primary shadow-2xs transition-all hover:border-amber-400 hover:bg-amber-50/60 hover:text-amber-800 sm:min-h-10 sm:px-4 sm:py-2"
                    >
                      <span>{c.cta}</span>
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </div>
              </MotionFadeIn>

              {items.length ? (
                <MotionStagger className="flex overflow-x-auto pb-4 pt-1 gap-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0 sm:pt-0 sm:gap-6 sm:snap-none">
                  {items.map((item) => (
                    <MotionStaggerItem
                      key={item.id}
                      className="w-[270px] max-w-[80vw] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink"
                    >
                      <Link
                        href={`/potensi/${item.id}`}
                        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xs transition-all duration-400 ease-out hover:-translate-y-1.5 hover:border-amber-300/80 hover:shadow-xl sm:rounded-3xl"
                      >
                        {/* Media showcase */}
                        {item.photoId ? (
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                            <SkeletonImage
                              width={600}
                              height={375}
                              unoptimized
                              loading="lazy"
                              src={`/api/v1/public/media/${item.photoId}?variant=display`}
                              alt={item.photoAlt || item.name}
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-75 transition-opacity duration-500 group-hover:opacity-45" />
                            <div className="absolute top-3 left-3 z-10 sm:top-3.5 sm:left-3.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-slate-950/65 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 shadow-xs backdrop-blur-md sm:px-3 sm:py-1 sm:text-[11px]">
                                <Icon size={12} className="text-amber-300" />
                                {item.category}
                              </span>
                            </div>
                            <div className="absolute top-3 right-3 z-10 sm:top-3.5 sm:right-3.5">
                              <span className="grid size-7 place-items-center rounded-full border border-white/25 bg-slate-950/45 text-white shadow-xs backdrop-blur-md transition-all duration-300 group-hover:rotate-45 group-hover:bg-amber-400 group-hover:text-slate-950 sm:size-8">
                                <ArrowUpRight size={13} className="sm:size-[14px]" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c233c] via-[#133355] to-[#081b2f] p-3.5 text-white sm:p-4">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]" />
                            <div className="relative z-10 flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-slate-950/65 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-md sm:px-3 sm:py-1 sm:text-[11px]">
                                <Icon size={12} className="text-amber-300" />
                                {item.category}
                              </span>
                              <span className="grid size-7 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:rotate-45 group-hover:bg-amber-400 group-hover:text-slate-950 sm:size-8">
                                <ArrowUpRight size={13} className="sm:size-[14px]" />
                              </span>
                            </div>
                            <div className="relative z-10 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-300 sm:text-[10px]">
                              <Sparkles size={11} className="text-amber-400 sm:size-3" />
                              <span>Keunggulan Wilayah</span>
                            </div>
                          </div>
                        )}

                        {/* Card body */}
                        <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                          <div>
                            <h3 className="line-clamp-1 text-base font-bold tracking-tight text-slate-900 transition-colors group-hover:text-primary sm:text-xl">
                              {item.name}
                            </h3>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:mt-2">
                              {cleanSnippet(item.description) ||
                                "Kenali potensi dan keunggulan destinasi lokal Kelurahan Watundehoa."}
                            </p>
                          </div>

                          {/* Footer strip */}
                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:mt-5 sm:gap-3 sm:pt-3.5">
                            <p className="flex max-w-[65%] items-center gap-1.5 truncate text-[11px] font-medium text-slate-500">
                              <MapPin
                                size={12}
                                className="shrink-0 text-amber-600 sm:size-[13px]"
                              />
                              <span className="truncate">
                                {item.location || "Watundehoa"}
                              </span>
                            </p>
                            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary transition-colors group-hover:text-amber-700 sm:gap-1.5 sm:text-xs">
                              <span>{c.itemCta}</span>
                              <ArrowRight
                                size={13}
                                className="transition-transform duration-300 group-hover:translate-x-1 sm:size-[14px]"
                              />
                            </span>
                          </div>
                        </div>

                        {/* Bottom animated golden accent bar */}
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-amber-400 via-amber-200 to-transparent transition-transform duration-500 group-hover:scale-x-100"
                        />
                      </Link>
                    </MotionStaggerItem>
                  ))}
                </MotionStagger>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-muted">
                  <p>
                    {result.status === "rejected"
                      ? "Informasi destinasi sementara tidak dapat dimuat."
                      : "Belum ada konten yang dipublikasikan pada kategori ini."}
                  </p>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
