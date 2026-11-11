"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Icon3D, type Icon3dKey } from "@/components/ui/icons-3d";

interface QuickLinkItem {
  label: string;
  description: string;
  href: string;
  icon3d: Icon3dKey;
  accent: string;
}

const links: QuickLinkItem[] = [
  {
    label: "Anggaran",
    description: "Transparansi keuangan",
    href: "/anggaran",
    icon3d: "anggaran",
    accent: "hover:border-amber-300/80 hover:shadow-amber-100/50",
  },
  {
    label: "PPID",
    description: "Permohonan informasi",
    href: "/ppid",
    icon3d: "ppid",
    accent: "hover:border-sky-300/80 hover:shadow-sky-100/50",
  },
  {
    label: "Wisata",
    description: "Jelajahi sekitar",
    href: "/wisata",
    icon3d: "wisata",
    accent: "hover:border-emerald-300/80 hover:shadow-emerald-100/50",
  },
  {
    label: "UMKM",
    description: "Beli dari kelurahan",
    href: "/belanja",
    icon3d: "umkm",
    accent: "hover:border-orange-300/80 hover:shadow-orange-100/50",
  },
  {
    label: "Peta fasilitas",
    description: "Temukan lokasi",
    href: "/listing",
    icon3d: "fasilitas",
    accent: "hover:border-rose-300/80 hover:shadow-rose-100/50",
  },
  {
    label: "Pengaduan",
    description: "Sampaikan aspirasi",
    href: "/pengaduan",
    icon3d: "pengaduan",
    accent: "hover:border-red-300/80 hover:shadow-red-100/50",
  },
  {
    label: "Pelayanan",
    description: "Alur & persyaratan",
    href: "/pelayanan",
    icon3d: "pelayanan",
    accent: "hover:border-blue-300/80 hover:shadow-blue-100/50",
  },
  {
    label: "Informasi publik",
    description: "Dokumen resmi",
    href: "/informasi-publik",
    icon3d: "dokumen",
    accent: "hover:border-teal-300/80 hover:shadow-teal-100/50",
  },
  {
    label: "Agenda",
    description: "Kegiatan kelurahan",
    href: "/agenda",
    icon3d: "agenda",
    accent: "hover:border-purple-300/80 hover:shadow-purple-100/50",
  },
  {
    label: "Pengumuman",
    description: "Informasi penting",
    href: "/pengumuman",
    icon3d: "pengumuman",
    accent: "hover:border-amber-300/80 hover:shadow-amber-100/50",
  },
  {
    label: "Galeri",
    description: "Cerita dalam foto",
    href: "/galeri",
    icon3d: "galeri",
    accent: "hover:border-pink-300/80 hover:shadow-pink-100/50",
  },
  {
    label: "Statistik",
    description: "Data wilayah",
    href: "/statistik",
    icon3d: "statistik",
    accent: "hover:border-cyan-300/80 hover:shadow-cyan-100/50",
  },
];

export function QuickLinks() {
  const reduced = useReducedMotion();
  return (
    <section
      id="akses-cepat"
      aria-label="Akses cepat"
      className="portal-quick-links relative z-20"
    >
      <div className="container">
        <div className="portal-section-index">
          <span>01 / TERHUBUNG LEBIH MUDAH</span>
          <span>
            Ruang digital warga <ArrowUpRight size={13} />
          </span>
        </div>
        <motion.div
          initial={reduced ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-20px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {links.map((item, index) => (
            <motion.div
              key={item.href}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={
                reduced
                  ? undefined
                  : { y: -5, rotateX: 3, transition: { duration: 0.3 } }
              }
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <Link
                href={item.href}
                className={`portal-card portal-quick-card group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition-all duration-300 hover:shadow-xl sm:p-5 ${item.accent}`}
              >
                <div className="flex items-start justify-between">
                  <div className="relative -ml-1 -mt-1 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-110">
                    <Icon3D
                      name={item.icon3d}
                      size={48}
                      className="drop-shadow-xs"
                    />
                  </div>
                  <span className="grid size-7 place-items-center rounded-full border border-slate-100 bg-slate-50 text-slate-400 transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-amber-300">
                    <ArrowUpRight
                      size={13}
                      className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
                <span className="portal-card-index" aria-hidden="true">
                  0{index + 1}
                </span>
                <div className="mt-4">
                  <h2 className="text-sm font-bold text-primary transition-colors group-hover:text-primary">
                    {item.label}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
