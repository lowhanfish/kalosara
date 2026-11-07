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
    href: "/potensi",
    title: "Potensi dan fasilitas",
    description:
      "Potensi lokal, UMKM terpublikasi, dan fasilitas publik wilayah.",
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
  {
    href: "/wisata",
    title: "Wisata",
    description: "Destinasi wisata di sekitar kelurahan dan detailnya.",
  },
  {
    href: "/belanja",
    title: "Beli dari kelurahan",
    description: "Katalog produk UMKM dan potensi ekonomi lokal.",
  },
  {
    href: "/listing",
    title: "Peta fasilitas",
    description: "Peta interaktif fasilitas dan usaha di sekitar kelurahan.",
  },
  {
    href: "/infografis",
    title: "Infografis",
    description: "Data penduduk, anggaran, bansos dan stunting.",
  },
  {
    href: "/anggaran",
    title: "Anggaran",
    description: "Pendapatan, belanja dan pembiayaan kelurahan.",
  },
  {
    href: "/bansos",
    title: "Bantuan sosial",
    description: "Rekapitulasi program dan cek bansos resmi.",
  },
  {
    href: "/stunting",
    title: "Stunting",
    description: "Data agregat penanganan stunting kelurahan.",
  },
  {
    href: "/ppid",
    title: "PPID",
    description:
      "Informasi berkala, serta-merta, setiap saat dan permohonan informasi.",
  },
  {
    href: "/pengaduan",
    title: "Pengaduan",
    description: "Sampaikan pengaduan dan masukan kepada pengelola.",
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
