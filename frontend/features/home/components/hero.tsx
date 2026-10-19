import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import type { SiteSettings } from "@/lib/site-settings";
import type { Official } from "@/lib/profile";
export function HomeHero({
  settings,
  leader,
}: {
  settings: SiteSettings;
  leader?: Official;
}) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-[#0b2c4d]"
    >
      <Image
        src={settings.heroUrl ?? siteIdentity.officePhoto}
        alt={`Kantor ${settings.name}`}
        fill
        unoptimized
        preload
        sizes="100vw"
        className="object-cover object-center opacity-55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-[#092843] via-[#092843]/85 to-[#092843]/10"
      />
      <div className="container relative grid min-h-[520px] items-center gap-8 py-14 sm:min-h-[560px] sm:py-16 lg:grid-cols-[1.2fr_.8fr]">
        <div className="relative z-10 max-w-xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-200">
            <span className="size-1.5 rounded-full bg-amber-300" />
            Selamat datang di {settings.name}
          </p>
          <h1
            id="hero-title"
            className="text-[42px] font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-[66px]"
          >
            Lebih dekat.
            <br />
            Lebih mudah.
            <br />
            <span className="text-amber-300">Untuk warga.</span>
          </h1>
          <p className="mt-6 max-w-[420px] text-[15px] leading-7 text-slate-200 sm:text-base">
            Akses informasi kelurahan, kabar terbaru, dan panduan pelayanan.
            Satu tempat untuk kebutuhan informasi Anda.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pelayanan"
              className="inline-flex min-h-12 items-center gap-4 rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-400"
            >
              Panduan pelayanan
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/profil"
              className="inline-flex min-h-12 items-center gap-4 rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Kenali kelurahan
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-7 flex items-center gap-2 text-[13px] text-slate-300">
            <MapPin size={13} />
            {settings.district}, {settings.regency}
          </p>
        </div>
        <div className="relative mx-auto hidden h-[450px] w-full max-w-[360px] self-end lg:block">
          <div
            aria-hidden="true"
            className="absolute bottom-2 left-1/2 size-80 -translate-x-1/2 rounded-full border border-white/10 bg-white/5"
          />
          <Image
            src={leader?.photoUrl ?? siteIdentity.leaderPhoto}
            alt={leader?.name ?? siteIdentity.leader}
            fill
            unoptimized
            sizes="360px"
            className="object-cover object-top"
          />
          <div className="absolute -bottom-1 inset-x-0 rounded-xl border border-white/50 bg-white/95 px-6 py-4 shadow-xl backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lurah {settings.name.replace(/^Kelurahan /, "")}
            </p>
            <p className="mt-1 text-lg font-bold text-primary">
              {leader?.name ?? siteIdentity.leader}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
