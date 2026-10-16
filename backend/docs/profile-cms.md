# Prompt 06 — konfigurasi kelurahan, profil dan aparatur

Tanggal: 16 Oktober 2026 (Asia/Makassar).

## 1. Ringkasan keputusan dan audit awal

Working tree awal bersih, branch `main`, HEAD `961c540`. CHECKPOINT, README dan kedua PDF Tahap 01 dibaca. Audit menemukan Next.js 16.4.0 / React 19.3.0, Express 5.1, Prisma 6.19, Zod 4; endpoint settings lama hanya membaca whitelist AppSetting, profil masih statis, belum ada model Page/Official maupun editor. Panduan `frontend/AGENTS.md` dan dokumentasi Next lokal tentang server/client components, fetching data dan metadata dibaca sebelum perubahan frontend.

Hanya Prompt 06 dikerjakan. CSS, tokens, komposisi dan aset pilihan pengguna pada `961c540` dipertahankan. Identitas awal tetap Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe; Lurah AMIRULAH, S.Si. Data kontak, sejarah, visi-misi, koordinat dan masa tugas tidak dikarang.

SiteSetting singleton (`id=site`) menyimpan pengaturan tervalidasi, Page memakai lima slug tetap, Official memiliki jabatan/unit sederhana, urutan, foto opsional, aktif, masa tugas dan status. Tidak ada tenant. Unit organisasi berupa field `unit`, struktur organisasi berupa halaman teks. Settings berlaku langsung setelah disimpan; Page/Official memakai DRAFT/PUBLISHED/ARCHIVED. Mengarsip menggantikan penghapusan permanen.

ADMIN_KELURAHAN memiliki permission eksplisit mengelola koleksi profil institusi ini. Ini bukan pemberian ownership otomatis atas resource lain: router terpisah memeriksa access token, sesi DB, akun aktif dan role terbaru pada setiap request. LURAH tidak memperoleh izin mutasi/draft tanpa kesepakatan tambahan; masyarakat dan tamu hanya membaca published. Audit setiap simpan dibuat dalam transaksi yang sama. CSRF cookie diperluas dari `/api/v1/auth` ke `/api/v1` agar dikirim ke CMS; tetap SameSite Strict dan Secure pada HTTPS. Editor memakai bootstrap/query per pengguna serta refresh client yang sudah ada; validasi sesi dijalankan sebelum meminta CSRF untuk penyimpanan.

Editor/preview memakai teks biasa yang di-escape React, tanpa HTML mentah atau editor berita. Media sementara hanya empat aset lokal yang diizinkan backend. Peta berupa tautan OpenStreetMap yang dibuat dari koordinat numerik tervalidasi. Metadata profil dinamis, breadcrumb tersedia, area editor noindex. Fetch settings/profil `no-store`: reload/navigasi baru membaca perubahan tanpa deploy. Endpoint settings tetap mendukung AppSetting lama bila singleton belum tersimpan; setelah disimpan singleton menjadi otoritas.

## 2. Struktur/file berubah

- `backend/prisma/schema.prisma` dan `migrations/20261016010000_profile_cms/migration.sql`: tiga tabel baru.
- `backend/src/modules/profile.ts`: validasi, proyeksi publik, CRUD simpan/arsip, RBAC dan audit.
- `backend/src/app.ts`, `modules/public-settings.ts`: pemasangan router dan sumber identitas.
- `backend/src/modules/auth/routes.ts`, `cookies.ts`: reuse guard dan cakupan cookie CSRF.
- `backend/src/tests/profile.test.ts`, `profile.db.test.ts`, `public-settings.test.ts`, `backend/package.json`: validasi, regresi dan tes integrasi.
- `frontend/app/admin/profil/page.tsx`, `layout.tsx`: login admin terbatas modul ini, editor settings/halaman/aparatur, preview, logout, noindex.
- `frontend/lib/profile.ts`, `site-settings.ts`: pembacaan data dan fallback.
- `frontend/app/profil/page.tsx`: bagian profil published, aparatur, masa tugas, alamat/peta, metadata.
- `frontend/app/page.tsx`, `components/site/header.tsx`, `footer.tsx`, `leader-section.tsx`, `public-section.tsx`: pengikatan identitas/media ke backend dengan layout yang sama.
- `README.md`, `CHECKPOINT.md`, laporan ini: petunjuk dan hasil verifikasi.

## 3. Cara menjalankan dan kontrak API

Ikuti setup README. Backend: `npm ci`, `npm run db:generate`, `npm run db:deploy`, `npm run dev`. Frontend: `pnpm install --frozen-lockfile`, `pnpm dev`. Pastikan APP_ORIGIN sama dengan origin frontend. Provision akun admin menggunakan CLI yang telah ada, tanpa seed akun staf. Buka `/admin/profil`, login, pilih bagian, simpan draft, preview, lalu ubah status PUBLISHED dan simpan. Gunakan ARCHIVED untuk menarik konten; Official juga harus aktif agar tampil publik. Muat ulang halaman publik sesudah penyimpanan.

| Metode/path (prefix `/api/v1`) | Akses | Hasil |
| --- | --- | --- |
| GET `/public/settings` | Publik | Identitas tervalidasi, whitelist saja |
| GET `/public/profile` | Publik | Page PUBLISHED; Official PUBLISHED dan aktif, berurutan |
| GET `/admin/profile` | Admin aktif | Settings dan seluruh status profil/aparatur; no-store |
| PUT `/admin/profile/settings` | Admin + Origin/CSRF | Ganti singleton settings dan audit |
| PUT `/admin/profile/pages/:slug` | Admin + Origin/CSRF | Simpan salah satu lima slug profil dan audit |
| PUT `/admin/profile/officials/:uuid` | Admin + Origin/CSRF | Buat/perbarui aparatur dan audit |

Semua respons memakai envelope dan requestId yang telah ada. Invalid input 400; tamu/sesi invalid 401; role/Origin/CSRF ditolak 403. Tidak ada endpoint preview publik. Preview privat dibentuk dari state form; draft tersimpan hanya dapat dimuat lewat endpoint admin.

Settings wajib menyertakan name/district/regency, address/phone/email/hours nullable, latitude/longitude nullable berpasangan, logoUrl/heroUrl nullable dan relatedLinks maksimal 10 HTTPS. Media hanya `/images/watundehoa/{amirulah,kantor,papan-kantor}.webp` dan `/images/reference/crest.webp`. Page: title, content teks maksimal 30.000 karakter, status. Official: name, position, unit, sortOrder 0–10000, photoUrl nullable, active, termStart/termEnd berupa YYYY-MM-DD atau null, status. Untuk kartu lurah pilih jabatan `Lurah`. Foto/identitas terkonfirmasi tetap fallback jika belum ada data lurah published.

## 4. Migration/env

Migration `20261016010000_profile_cms` menambah SiteSetting, Page, Official; tidak menghapus data lama. Seluruh tiga migrasi berhasil diterapkan pada PostgreSQL 17 sementara. Tidak ada env, dependency atau rahasia baru. Belum diterapkan ke database produksi. Seed akun admin tetap dilarang; data uji dan akun browser hanya ada pada database sementara yang dibersihkan setelah QA.

## 5. Hasil lint/typecheck/test/build

- Backend lint, typecheck, build: lulus.
- Backend unit/HTTP: 10/10 lulus.
- Backend PostgreSQL: 6/6 lulus (termasuk alur CMS lengkap).
- Frontend lint, typecheck, build: lulus.
- Frontend: 19/19 lulus.
- `git diff --check`: lulus.

Commands: `npm run db:generate`; `DATABASE_URL=<database-uji> npm run db:deploy`; backend `npm run lint`, `npm run typecheck`, `npm test`, `DATABASE_URL=<database-uji> LOG_LEVEL=silent npm run test:db`, `npm run build`; frontend `npx next typegen`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Tes browser dijalankan melalui Chrome headless/Playwright terhadap backend/frontend lokal pada database terisolasi.

Percobaan awal supertest gagal karena sandbox melarang socket, lalu lulus dengan izin socket. Build frontend awal gagal membaca cache Turbopack lama; `.next` dibersihkan, route types dibuat ulang dengan `next typegen`, pemeriksaan diulang dan lulus. Runner browser disempurnakan untuk menunggu respons dan decode gambar lazy; hasil final di bawah.

## 6. Manual/browser testing

Teruji otomatis melalui browser nyata: login admin; simpan jam kerja/nama; perubahan navbar, footer dan judul profil tanpa coding ulang; simpan sejarah DRAFT (tidak terlihat publik); preview `<script>` sebagai teks tanpa eksekusi; PUBLISHED tampil setelah reload; SEO title dari settings; buat aparatur PUBLISHED melalui UI lalu tampil di profil. Logout UI juga teruji kembali ke beranda. Identitas uji dikembalikan dan data uji dibersihkan. Beranda, profil, kontak dan editor diperiksa pada 360, 768, 1440 px: 12 kombinasi tanpa overflow/gambar rusak; tidak ada pageerror. Screenshot beranda desktop, profil dan editor mobile diperiksa secara visual.

Tes integrasi API mencakup 401 tamu, 403 masyarakat/LURAH, admin nonaktif, Origin/CSRF CMS, validasi URL/koordinat/masa tugas, draft/arsip tidak terbuka publik, aparatur nonaktif tersembunyi, settings langsung berubah dan audit tercatat. Regresi autentikasi/refresh/logout tetap lulus.

Smoke hasil build produksi lokal (`next start --port 3001`) pada `/`, `/profil`, `/admin/profil`: HTTP 200, title/noindex benar, tanpa hydration mismatch/pageerror; fallback/recovery API offline teruji. Ini smoke build lokal, bukan deployment Docker/HTTPS produksi.

Langkah reviewer: login akun admin lokal; isi konten resmi dan foto yang tersedia, simpan DRAFT lalu preview; cek `/profil` sebagai tamu; publish dan reload; ubah identitas/kontak lalu cek navbar/footer/profil; arsipkan dan cek konten hilang; coba akun LURAH/masyarakat (harus ditolak); uji keyboard dan pesan validasi server. Data resmi tambahan harus berasal dari kelurahan.

## 7. Risiko/pekerjaan tertunda

Upload pipeline dan editor kaya berita menunggu Prompt 07; tidak dibuat pada pekerjaan ini. Contoh berita/angka/gambar referensi tetap contoh desain yang sudah diberi penanda pada commit pilihan pengguna. Materi profil resmi, detail kontak, masa tugas dan koordinat belum diberikan. Logo referensi bukan verifikasi logo resmi. Desktop hero fallback adalah komposit gambar pilihan pengguna; mengganti data teks tidak dapat mengedit tulisan yang sudah menjadi piksel komposit. Admin dapat memilih hero lain dari aset yang tersedia.

Editor teks tidak mendukung HTML/rich text. Simpan DRAFT atas halaman yang sebelumnya published menarik versi tersebut dari publik; belum ada salinan revisi published paralel. Penyimpanan memakai perubahan terakhir; belum ada kontrol konflik beberapa editor. Uji ini bukan deployment/HTTPS produksi atau load test. Kebijakan izin tambahan LURAH tetap memerlukan keputusan pengguna. Tidak ada CMS berita, model News, atau pelayanan surat baru.

## 8. Status

**SIAP REVIEW Prompt 06.** Berhenti setelah commit dan push ke `origin/main`; Prompt 07 belum dimulai.
