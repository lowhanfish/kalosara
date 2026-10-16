import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LeaderSection } from "@/components/site/leader-section";
import { siteIdentity } from "@/lib/site-identity";
export const metadata: Metadata = { title: "Profil Kelurahan Watundehoa" };
export default function Page() {
  return (
    <main id="konten" tabIndex={-1}>
      <div className="container">
        <Breadcrumb
          items={[
            { label: "Beranda", href: "/" },
            { label: "Profil kelurahan" },
          ]}
        />
        <div className="border-b border-border pt-5 pb-9">
          <p className="eyebrow">Mengenal wilayah kita</p>
          <h1 className="display-title mt-4 text-4xl sm:text-5xl">
            Kelurahan Watundehoa
          </h1>
          <p className="mt-4 text-muted">
            Kecamatan Puriala, Kabupaten Konawe.
          </p>
        </div>
      </div>
      <LeaderSection />
      <section className="container grid items-center gap-8 pb-16 md:grid-cols-2">
        <div className="relative aspect-[2/1] overflow-hidden rounded-xl">
          <Image
            src={siteIdentity.officeSignPhoto}
            alt="Papan nama Kantor Kelurahan Watundehoa"
            fill
            unoptimized
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="eyebrow">Kantor kelurahan</p>
          <h2 className="display-title mt-3 text-3xl">
            Hadir di tengah masyarakat.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            Kelurahan Watundehoa berada di Kecamatan Puriala, Kabupaten Konawe.
            Informasi sejarah, visi dan misi, serta susunan aparatur akan
            dilengkapi setelah materi resmi tersedia.
          </p>
        </div>
      </section>
    </main>
  );
}
