import Image from "next/image";
import { Sparkles } from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import { getPublicProfile } from "@/lib/profile";
import { MotionFadeIn } from "@/components/ui/motion";

export async function LeaderSection() {
  const profile = await getPublicProfile();
  const leader = profile.officials.find(
    (o) => o.position.toLowerCase() === "lurah",
  );
  return (
    <section className="container pb-12" aria-labelledby="lurah-title">
      <MotionFadeIn direction="up">
        <div className="grid overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#f1f6fa] to-[#e4eef7] shadow-sm md:grid-cols-[.85fr_1.15fr]">
          <div className="relative isolate min-h-80 overflow-hidden bg-gradient-to-t from-[#c8dbea]/80 to-[#dfebf5] md:min-h-[460px]">
            <div
              aria-hidden="true"
              className="absolute top-12 left-1/2 size-72 -translate-x-1/2 rounded-full border-[36px] border-white/50 blur-[1px] sm:size-96"
            />
            <div className="absolute top-6 left-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-3.5 py-1 text-xs font-bold text-primary backdrop-blur-md shadow-xs">
              <Sparkles size={13} className="text-amber-500" />
              Pimpinan Wilayah
            </div>
            <Image
              src={leader?.photoUrl ?? siteIdentity.leaderPhoto}
              alt={leader?.name ?? siteIdentity.leader}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-top pt-6 drop-shadow-xl"
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#b8d2e6]/90 to-transparent" />
          </div>
          <div className="flex flex-col items-start justify-center p-8 sm:p-12 lg:p-16">
            <span className="eyebrow inline-block rounded-full bg-primary/10 px-3 py-1 font-bold tracking-wider text-primary">
              Lurah Watundehoa
            </span>
            <h2
              id="lurah-title"
              className="display-title mt-4 text-3xl font-extrabold text-primary sm:text-4xl"
            >
              Melayani warga.
              <br />
              Membangun kebersamaan.
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-muted">
              Kenali Kelurahan Watundehoa dan aparatur yang melayani masyarakat di
              Kecamatan Puriala, Kabupaten Konawe. KALOSARA menjadi ruang terpadu untuk
              mengakses informasi kelurahan dan panduan pelayanan publik yang transparan.
            </p>
            <div className="mt-8 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-xs backdrop-blur-md">
              <p className="text-lg font-extrabold text-primary">
                {leader?.name ?? siteIdentity.leader}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lurah Kelurahan Watundehoa
              </p>
            </div>
          </div>
        </div>
      </MotionFadeIn>
    </section>
  );
}

