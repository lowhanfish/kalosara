import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
export function LeaderSection() {
  return (
    <section className="container py-14 sm:py-20" aria-labelledby="lurah-title">
      <div className="grid overflow-hidden rounded-2xl border border-border bg-[#f0f5fa] md:grid-cols-[.85fr_1.15fr]">
        <div className="relative isolate min-h-80 overflow-hidden bg-[#dfebf5] md:min-h-[440px]">
          <div
            aria-hidden="true"
            className="absolute top-14 left-1/2 size-72 -translate-x-1/2 rounded-full border-[40px] border-white/45 sm:size-96"
          />
          <Image
            src={siteIdentity.leaderPhoto}
            alt="AMIRULAH, S.Si, Lurah Watundehoa, mengenakan seragam Korpri biru"
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover object-top pt-6"
          />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#c8dbea]/70 to-transparent" />
        </div>
        <div className="flex flex-col items-start justify-center px-7 py-10 sm:p-12 lg:p-16">
          <p className="eyebrow">Lurah Watundehoa</p>
          <h2
            id="lurah-title"
            className="display-title mt-4 text-3xl sm:text-4xl"
          >
            Melayani warga.
            <br />
            Membangun kebersamaan.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted">
            Kenali Kelurahan Watundehoa dan aparatur yang melayani masyarakat di
            Kecamatan Puriala, Kabupaten Konawe. KALOSARA menjadi ruang untuk
            mengakses informasi kelurahan dan panduan pelayanan.
          </p>
          <div className="mt-7 border-l-2 border-accent pl-4">
            <p className="text-lg font-bold tracking-wide text-foreground">
              {siteIdentity.leader}
            </p>
            <p className="mt-1 text-xs text-muted">Lurah Watundehoa</p>
          </div>
          <Link
            href="/profil"
            className="mt-7 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary"
          >
            Kenali kelurahan dan aparatur{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
