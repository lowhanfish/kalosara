import {
  LayoutDashboard,
  FileText,
  Newspaper,
  CalendarDays,
  Images,
  ChartColumn,
  MapPin,
  Settings,
  Users,
} from "lucide-react";
export const adminLinks = [
  {
    label: "Ringkasan",
    href: "/admin",
    icon: LayoutDashboard,
    group: "Ruang kerja",
  },
  {
    label: "Beranda & kontak",
    href: "/admin/profil#pengaturan",
    icon: Settings,
    group: "Konten website",
  },
  {
    label: "Profil kelurahan",
    href: "/admin/profil#halaman-profil",
    icon: FileText,
  },
  { label: "Pelayanan", href: "/admin/pelayanan", icon: FileText },
  { label: "Berita & media", href: "/admin/berita", icon: Newspaper },
  { label: "Pengumuman", href: "/admin/konten#announcements", icon: FileText },
  { label: "Agenda", href: "/admin/konten#events", icon: CalendarDays },
  { label: "Galeri", href: "/admin/konten#galleries", icon: Images },
  {
    label: "Informasi publik",
    href: "/admin/konten#documents",
    icon: FileText,
  },
  { label: "Statistik", href: "/admin/wilayah#statistics", icon: ChartColumn },
  { label: "Potensi", href: "/admin/wilayah#potentials", icon: MapPin },
  {
    label: "Fasilitas publik",
    href: "/admin/wilayah#facilities",
    icon: MapPin,
  },
  {
    label: "Pengguna & audit",
    href: "/admin/pengguna",
    icon: Users,
    group: "Administrasi",
  },
  { label: "Verifikasi kontak", href: "/admin/verifikasi-kontak", icon: Users },
];
