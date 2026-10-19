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
