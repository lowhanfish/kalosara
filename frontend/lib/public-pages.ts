export const publicPages = [
  {
    href: "/",
    title: "Beranda",
    description: "Pintu masuk informasi kelurahan dan panduan pelayanan.",
  },
  {
    href: "/profil",
    title: "Profil",
    description: "Kenali kelurahan, aparatur, dan arah pembangunan bersama.",
  },
  {
    href: "/berita",
    title: "Berita",
    description: "Kabar kegiatan dan perkembangan di lingkungan kelurahan.",
  },
  {
    href: "/pengumuman",
    title: "Pengumuman",
    description: "Informasi penting yang perlu Anda ketahui.",
  },
  {
    href: "/agenda",
    title: "Agenda",
    description: "Jadwal kegiatan kelurahan dan pertemuan warga.",
  },
  {
    href: "/galeri",
    title: "Galeri",
    description: "Dokumentasi kegiatan dan kehidupan masyarakat.",
  },
  {
    href: "/informasi-publik",
    title: "Informasi publik",
    description: "Akses dokumen, publikasi, dan keterbukaan informasi.",
  },
  {
    href: "/statistik",
    title: "Statistik",
    description: "Gambaran wilayah melalui data agregat yang bersumber.",
  },
  {
    href: "/kontak",
    title: "Kontak",
    description: "Temukan alamat, kontak, dan jam pelayanan kelurahan.",
  },
  {
    href: "/pelayanan",
    title: "Pelayanan",
    description: "Pelajari alur dan persyaratan sebelum datang ke kantor.",
  },
] as const;
export type PublicPath = (typeof publicPages)[number]["href"];
export function searchPages(query: string) {
  const normalized = query.trim().toLocaleLowerCase("id").slice(0, 100);
  return normalized
    ? publicPages.filter((page) =>
        `${page.title} ${page.description}`
          .toLocaleLowerCase("id")
          .includes(normalized),
      )
    : [];
}
