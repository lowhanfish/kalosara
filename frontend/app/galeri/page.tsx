import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { siteIdentity } from "@/lib/site-identity";
export const metadata: Metadata = { title: "Galeri Kelurahan Watundehoa" };
export default function Page() {
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <Breadcrumb
        items={[{ label: "Beranda", href: "/" }, { label: "Galeri kelurahan" }]}
      />
      <div className="border-b border-border pt-5 pb-8">
        <p className="eyebrow">Dokumentasi kantor</p>
        <h1 className="display-title mt-4 text-4xl sm:text-5xl">
          Galeri Kelurahan Watundehoa
        </h1>
        <p className="mt-4 text-sm text-muted">
          Kenali kantor dan lingkungan Kelurahan Watundehoa melalui dokumentasi
          yang tersedia.
        </p>
      </div>
      <div className="grid gap-6 py-8 md:grid-cols-2">
        {[
          {
            src: siteIdentity.officePhoto,
            title: "Kantor Kelurahan Watundehoa",
            description: "Tampak depan gedung kantor kelurahan.",
          },
          {
            src: siteIdentity.officeSignPhoto,
            title: "Halaman dan papan nama kantor",
            description: "Identitas Kantor Kelurahan Watundehoa.",
          },
        ].map((photo) => (
          <figure
            key={photo.src}
            className="overflow-hidden rounded-xl border border-border bg-white"
          >
            <div className="relative aspect-[2/1]">
              <Image
                src={photo.src}
                alt={photo.description}
                fill
                unoptimized
                sizes="(max-width:768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <figcaption className="p-5">
              <h2 className="font-bold">{photo.title}</h2>
              <p className="mt-2 text-xs text-muted">{photo.description}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
