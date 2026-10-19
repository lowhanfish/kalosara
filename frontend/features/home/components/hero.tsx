"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { motion } from "motion/react";
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
      className="relative isolate overflow-hidden bg-[#08233d]"
    >
      {/* Background Image with Overlay */}
      <Image
        src={settings.heroUrl ?? siteIdentity.officePhoto}
        alt={`Kantor ${settings.name}`}
        fill
        unoptimized
        preload
        sizes="100vw"
        className="object-cover object-center opacity-40 transition-transform duration-1000 scale-102"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-[#061c32] via-[#061c32]/90 to-[#061c32]/25"
      />

      {/* Ambient Glow Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 size-96 rounded-full bg-amber-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-10 size-[32rem] rounded-full bg-sky-500/10 blur-3xl"
      />

      <div className="container relative grid min-h-[540px] items-center gap-10 py-14 sm:min-h-[600px] sm:py-20 lg:grid-cols-[1.25fr_.75fr]">
        <div className="relative z-10 max-w-xl">
          {/* Welcome Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-100 backdrop-blur-md shadow-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-amber-300" />
              </span>
              Selamat datang di {settings.name}
            </p>
          </motion.div>

          {/* Headline */}
          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[42px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[68px]"
          >
            Lebih dekat.
            <br />
            Lebih mudah.
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent">
              Untuk warga.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-[440px] text-[15px] leading-7 text-slate-200 sm:text-base sm:leading-8"
          >
            Akses informasi kelurahan resmi, kabar terbaru, data wilayah, dan
            panduan pelayanan masyarakat dalam satu kanal terpadu.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3.5"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/pelayanan"
                className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-amber-300 px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-300/20 transition-colors hover:bg-amber-400"
              >
                Panduan pelayanan
                <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/profil"
                className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                Kenali kelurahan
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Location Bar */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex items-center gap-2 text-[13px] font-medium text-slate-300/90"
          >
            <MapPin size={14} className="text-amber-300" />
            {settings.district}, {settings.regency}
          </motion.p>
        </div>

        {/* Lurah Portrait Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto hidden h-[480px] w-full max-w-[360px] self-end lg:block"
        >
          {/* Subtle Circular Glow Background */}
          <div
            aria-hidden="true"
            className="absolute bottom-6 left-1/2 size-80 -translate-x-1/2 rounded-full border border-white/15 bg-radial from-white/10 via-white/5 to-transparent backdrop-blur-sm"
          />

          {/* Floating Badge */}
          <div className="absolute top-8 -left-6 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-primary shadow-xl backdrop-blur-md">
            <Sparkles size={13} className="text-amber-500" />
            Aparatur Kelurahan
          </div>

          <Image
            src={leader?.photoUrl ?? siteIdentity.leaderPhoto}
            alt={leader?.name ?? siteIdentity.leader}
            fill
            unoptimized
            sizes="360px"
            className="object-cover object-top drop-shadow-2xl"
          />

          {/* Glassmorphism Floating Nameplate */}
          <div className="absolute -bottom-2 inset-x-0 rounded-2xl border border-white/60 bg-white/95 px-6 py-4.5 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lurah {settings.name.replace(/^Kelurahan /, "")}
            </p>
            <p className="mt-1 text-lg font-extrabold text-primary">
              {leader?.name ?? siteIdentity.leader}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

