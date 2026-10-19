"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Landmark,
  FileText,
  CalendarDays,
  Images,
  ChartColumn,
  Megaphone,
} from "lucide-react";
import { motion } from "motion/react";

const links = [
  {
    label: "Pelayanan",
    description: "Alur & persyaratan",
    href: "/pelayanan",
    icon: Landmark,
    accent: "hover:border-blue-300",
  },
  {
    label: "Informasi publik",
    description: "Dokumen resmi",
    href: "/informasi-publik",
    icon: FileText,
    accent: "hover:border-emerald-300",
  },
  {
    label: "Agenda",
    description: "Kegiatan kelurahan",
    href: "/agenda",
    icon: CalendarDays,
    accent: "hover:border-purple-300",
  },
  {
    label: "Pengumuman",
    description: "Informasi penting",
    href: "/pengumuman",
    icon: Megaphone,
    accent: "hover:border-amber-300",
  },
  {
    label: "Galeri",
    description: "Cerita dalam foto",
    href: "/galeri",
    icon: Images,
    accent: "hover:border-pink-300",
  },
  {
    label: "Statistik",
    description: "Data wilayah",
    href: "/statistik",
    icon: ChartColumn,
    accent: "hover:border-cyan-300",
  },
];

export function QuickLinks() {
  return (
    <section
      aria-label="Akses cepat"
      className="relative z-20 -mt-6 border-b border-slate-200/80 bg-slate-50/50 py-4 sm:-mt-8 sm:py-6"
    >
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-20px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.06,
              },
            },
          }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {links.map((item) => (
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
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <Link
                href={item.href}
                className={`group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/60 sm:p-5 ${item.accent}`}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-amber-300 group-hover:shadow-md group-hover:shadow-primary/20">
                    <item.icon size={20} strokeWidth={1.8} />
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </div>
                <div className="mt-4">
                  <h2 className="text-sm font-bold text-primary transition-colors group-hover:text-primary">
                    {item.label}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

