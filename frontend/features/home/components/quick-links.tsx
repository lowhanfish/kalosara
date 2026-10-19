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
const links = [
  {
    label: "Pelayanan",
    description: "Alur & persyaratan",
    href: "/pelayanan",
    icon: Landmark,
  },
  {
    label: "Informasi publik",
    description: "Dokumen resmi",
    href: "/informasi-publik",
    icon: FileText,
  },
  {
    label: "Agenda",
    description: "Kegiatan kelurahan",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    label: "Pengumuman",
    description: "Informasi penting",
    href: "/pengumuman",
    icon: Megaphone,
  },
  {
    label: "Galeri",
    description: "Cerita dalam foto",
    href: "/galeri",
    icon: Images,
  },
  {
    label: "Statistik",
    description: "Data wilayah",
    href: "/statistik",
    icon: ChartColumn,
  },
];
export function QuickLinks() {
  return (
    <section
      aria-label="Akses cepat"
      className="border-b border-slate-200 bg-white"
    >
      <div className="container grid grid-cols-2 divide-x divide-y divide-slate-100 py-5 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0 lg:py-7">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex flex-col items-start gap-3 rounded-lg p-4 transition-colors hover:bg-slate-50 sm:p-5"
          >
            <item.icon size={22} strokeWidth={1.6} className="text-primary" />
            <ArrowUpRight
              size={13}
              className="absolute right-4 top-5 text-slate-300 transition group-hover:text-primary"
            />
            <div>
              <h2 className="text-xs font-bold text-primary">{item.label}</h2>
              <p className="mt-1 text-[10px] text-slate-500">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
