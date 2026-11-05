"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, MapPin, ShieldCheck } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
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
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), {
    stiffness: 90,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 90,
    damping: 24,
  });
  return (
    <section aria-labelledby="hero-title" className="cinema-hero">
      <div className="cinema-backdrop" aria-hidden="true">
        <Image
          src={settings.heroUrl ?? siteIdentity.officePhoto}
          alt=""
          fill
          unoptimized
          preload
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="cinema-light" aria-hidden="true" />
      <div className="cinema-grid" aria-hidden="true" />
      <div className="container cinema-composition">
        <div className="cinema-copy">
          <p className="cinema-eyebrow">
            <span /> DARI WATUNDEHOA, UNTUK WARGA
          </p>
          <h1 id="hero-title" className="cinema-title">
            Lebih dekat.
            <br />
            Lebih mudah.
            <br />
            <span>Lebih bermakna.</span>
          </h1>
          <p className="cinema-description">
            Satu ruang untuk mengenal kelurahan, menemukan informasi, dan
            mengakses panduan pelayanan. Karena kemajuan dimulai dari kedekatan.
          </p>
          <div className="cinema-actions">
            <Link href="/pelayanan" className="cinema-button">
              Jelajahi pelayanan <ArrowUpRight size={18} />
            </Link>
            <Link href="/profil" className="cinema-text-link">
              Kenali kelurahan{" "}
              <span>
                <ArrowUpRight size={17} />
              </span>
            </Link>
          </div>
          <p className="cinema-location">
            <MapPin size={14} />
            {settings.district} <span>·</span> {settings.regency}
          </p>
        </div>
        <div
          className="cinema-stage"
          onPointerMove={(event) => {
            if (reduced || event.pointerType !== "mouse") return;
            const box = event.currentTarget.getBoundingClientRect();
            x.set((event.clientX - box.left) / box.width - 0.5);
            y.set((event.clientY - box.top) / box.height - 0.5);
          }}
          onPointerLeave={() => {
            x.set(0);
            y.set(0);
          }}
        >
          <motion.div
            className="cinema-portrait-scene"
            style={{
              rotateX: reduced ? 0 : rotateX,
              rotateY: reduced ? 0 : rotateY,
            }}
          >
            <div className="cinema-arch">
              <div className="cinema-orbit" />
              <span className="cinema-arch-label">
                MELAYANI DENGAN SEPENUH HATI
              </span>
            </div>
            <div className="cinema-portrait">
              <Image
                src={leader?.photoUrl ?? siteIdentity.leaderPhoto}
                alt={leader?.name ?? siteIdentity.leader}
                fill
                unoptimized
                sizes="(max-width: 768px) 80vw, 440px"
                className="object-contain object-bottom"
              />
            </div>
            <div className="cinema-seal">
              <ShieldCheck size={20} strokeWidth={1.4} />
              <span>
                Dedikasi untuk
                <br />
                <strong>masyarakat.</strong>
              </span>
            </div>
            <div className="cinema-nameplate">
              <span>
                LURAH {settings.name.replace(/^Kelurahan /, "").toUpperCase()}
              </span>
              <strong>{leader?.name ?? siteIdentity.leader}</strong>
              <span className="cinema-nameplate-line" />
            </div>
          </motion.div>
        </div>
      </div>
      <div className="container cinema-bottom">
        <span>INFORMASI TERBUKA. PELAYANAN LEBIH DEKAT.</span>
        <a href="#akses-cepat">
          Gulir untuk menjelajah <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}
