# KALOSARA Frontend

Next.js App Router untuk website kelurahan KALOSARA. Petunjuk menjalankan seluruh sistem ada di [`../README.md`](../README.md).

Untuk pengembangan lokal, salin `.env.example` ke `.env.local`, jalankan backend pada port 4000, lalu jalankan `pnpm dev`. `GET /api/v1/health` di alamat frontend diteruskan ke backend.

## Struktur UI

Pola kode mengikuti komponen per fitur dan styling Tailwind langsung di JSX:

```text
app/
  layout.tsx                 # Provider, metadata, dan CSS dasar
  (public)/layout.tsx        # Header/footer website publik
  (public)/.../page.tsx      # Menu publik; URL tetap /profil, /berita, dst.
  admin/layout.tsx           # Shell dan pembatas akses admin
  admin/.../page.tsx         # Entry route tipis
components/
  admin/                     # Sidebar, login, judul halaman, dan feedback
  site/                      # Header/footer serta elemen website publik
  ui/                        # Tombol, field, dialog, dan judul halaman bersama
features/
  admin/<fitur>/workspace.tsx # Daftar, pencarian, query, dan aksi fitur
  admin/<fitur>/editor.tsx    # Form editor, terpisah dari daftar
  home/components/           # Bagian beranda: hero, pintasan, judul seksi
  auth/                      # Sesi, refresh, dan pemisahan cache pengguna
```

Gunakan `AdminPageHeader` dan komponen feedback di `components/admin` untuk fitur admin baru. Gunakan `PageHeading` dan `EmptyState` untuk halaman publik. Layout, warna, dan spasi ditulis dengan Tailwind pada komponennya. `features/cms/cms.css` hanya menampung primitive editor/list yang masih dipakai bersama; jangan menambah stylesheet override untuk mengubah halaman tertentu.

Izin tetap diperiksa backend. Menyembunyikan menu atau membatasi tampilan di frontend hanya membantu alur pengguna.

Validasi: `npm run typecheck`, `npm run lint`, dan `npm test`. Saat memindahkan route, jalankan `next typegen` sebelum typecheck. Periksa juga menu publik dan admin pada lebar ponsel serta desktop, termasuk menu modal, formulir, status kosong, dan pesan kesalahan.

## Tipografi dan data contoh

Font Manrope variable disimpan lokal di `app/fonts/` dan dimuat melalui `next/font/local` dengan `display: swap`. Sumber: [Google Fonts Manrope](https://github.com/google/fonts/tree/main/ofl/manrope), lisensi OFL tersedia bersama berkas font. Teks isi menggunakan ukuran 15-16px, input 16px dengan tinggi minimal 48px, dan metadata 12-14px. Gunakan skala spacing Tailwind yang konsisten, bukan memperkecil teks untuk memuat konten panjang.

Isi konten demo dari folder `backend` dengan `npm run db:seed:demo`. Seed ini menambahkan profil/pelayanan, aparatur, berita, pengumuman, agenda, galeri, PDF, statistik, fasilitas, dan potensi. Akun tidak dibuat atau diubah. Record konten yang sudah ada dipertahankan. ID tetap mencegah duplikasi saat seed dijalankan ulang; waktu agenda awal dihitung relatif terhadap saat pertama seed dijalankan.

Seed menyalakan penanda publik `site.demoContent` agar halaman menampilkan banner data contoh. Jangan gunakan contoh kontak, angka, jadwal, atau dokumen tersebut sebagai informasi resmi. Dokumen sumber untuk seed tersedia di `backend/prisma/fixtures/`; salinan PDF yang mudah dibaca tersedia di `output/pdf/` pada root proyek. Media yang dipakai aplikasi disalin ke penyimpanan upload backend sesuai `UPLOAD_ROOT`.
