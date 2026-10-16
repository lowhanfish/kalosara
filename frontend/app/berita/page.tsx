import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { referenceNews } from "@/lib/reference-content";
export const metadata: Metadata = {
  title: "Berita Kelurahan Watundehoa",
  robots: { index: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ contoh?: string }>;
}) {
  const query = await searchParams;
  const article = referenceNews.find((item) => item.slug === query.contoh);
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <Breadcrumb
        items={[
          { label: "Beranda", href: "/" },
          { label: "Berita", href: article ? "/berita" : undefined },
          ...(article ? [{ label: article.title }] : []),
        ]}
      />
      <p className="rounded-lg border border-[#e7cf75] bg-[#fff9e4] p-4 text-sm">
        Contoh konten dari gambar desain yang dipilih. Artikel ini belum
        merupakan publikasi berita dari backend.
      </p>
      {article ? (
        <article className="mx-auto max-w-3xl py-8">
          <p className="text-xs text-muted">{article.date} · Contoh berita</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            {article.title}
          </h1>
          <div className="relative mt-7 aspect-[2/1] overflow-hidden rounded-xl">
            <Image
              src={article.image}
              alt="Ilustrasi artikel pada gambar desain"
              fill
              unoptimized
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <p className="mt-7 text-base leading-8">{article.excerpt}</p>
          <p className="mt-5 text-sm text-muted">
            Isi lengkap dan berita resmi akan ditampilkan setelah sumber
            publikasi dihubungkan.
          </p>
          <Link
            href="/berita"
            className="mt-7 inline-block font-semibold underline"
          >
            Semua contoh berita
          </Link>
        </article>
      ) : (
        <>
          <h1 className="mt-8 text-4xl font-bold">Berita Terbaru</h1>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {referenceNews.map((item) => (
              <Link
                key={item.slug}
                href={`/berita?contoh=${item.slug}`}
                className="overflow-hidden rounded-xl border border-border bg-white"
              >
                <div className="relative aspect-[2/1]">
                  <Image
                    src={item.image}
                    alt="Ilustrasi berita contoh"
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="50vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs text-muted">{item.date} · Contoh</p>
                  <h2 className="mt-3 font-bold">{item.title}</h2>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
