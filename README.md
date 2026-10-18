# KALOSARA — fondasi Tahap 01

KALOSARA (Kanal Layanan Online Surat dan Administrasi Rakyat) dimulai sebagai website kelurahan untuk satu kelurahan. Tahap 01 hanya mencakup website, CMS, dan akun; pengajuan surat dikerjakan pada Tahap 02. Dokumen acuan ada di `reff/`.

Untuk melanjutkan pekerjaan di sesi baru, mulai dari [CHECKPOINT.md](CHECKPOINT.md).

## Struktur

- `frontend/`: Next.js App Router, TypeScript strict, Tailwind CSS, fondasi shadcn/ui, TanStack Query, dan Zustand. Folder `app`, `components`, `features`, `hooks`, `lib`, `services`, dan `store` disiapkan untuk modul berikutnya.
- `backend/`: Express TypeScript, Prisma/PostgreSQL, Zod, dan Pino. Folder `modules`, `controllers`, `services`, `repositories`, `routes`, `middlewares`, `validators`, `config`, `lib`, dan `tests` disiapkan.
- `compose.yaml`: hanya Redis lokal. Frontend/backend manual dan PostgreSQL Neon.
- `backend/docs/auth-design.md`: relasi akun, aturan akses, lifecycle sesi, dan provisioning staf.
- `backend/docs/auth-api.md`: tabel endpoint autentikasi, contoh payload, dan error.

Frontend dan backend berada dalam satu repo Git `kalosara`. Keduanya tetap aplikasi independen yang berkomunikasi melalui API.

## Jalankan tanpa Docker

Butuh Node.js 22.12+ untuk backend, pnpm 10, dan koneksi Neon yang sudah tersedia di `backend/.env`. Jangan menimpa file env yang telah dikonfigurasi. Untuk instalasi baru saja, salin `.env.example` dan isi sendiri rahasianya.

```bash
cd backend
npm ci
npm run db:generate
npm run db:deploy
npm run dev
```

Di terminal lain:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev --port 3001
```

Buka `http://localhost:3001`; API manual berada pada `http://localhost:4000`. Frontend memproksikan `/api/v1`. `APP_ORIGIN`, `SITE_ORIGIN`, dan `FRONTEND_INTERNAL_URL` lokal harus memakai origin frontend yang sama. `/api/v1/health` memeriksa aplikasi dan `/api/v1/ready` memeriksa database. Jangan menjalankan reset atau seed pada database pengguna.

## Runtime manual + Neon + Redis

Frontend/backend berjalan manual; PostgreSQL memakai Neon dari `backend/.env` (`DATABASE_URL`). URL database tidak masuk Git. Migration: `cd backend && npm run db:deploy`, tanpa reset/seed database yang sudah berisi data. Backend `npm run dev`, frontend `pnpm dev`. Produksi: backend `npm run build && npm start`, frontend `pnpm build && pnpm start`. Isi APP_ORIGIN, SITE_ORIGIN dan secret invalidasi sesuai env aplikasi.

Compose hanya menjalankan Redis: `docker compose up -d redis`, lalu `docker compose exec -T redis redis-cli ping`. Port `127.0.0.1:6380` (REDIS_PORT dapat diubah), volume redis_data, AOF aktif. Tidak ada container aplikasi/PostgreSQL/proxy. Redis disiapkan; auth/CMS saat ini belum memakai Redis. Tidak ada integrasi queue/cache baru.

## Penyimpanan upload

File fisik berada di `backend/public/uploads/<asal>/<images|documents>/`. UPLOAD_ROOT default public/uploads, jalankan backend dari folder backend. Asal tervalidasi pada pustaka media: news, profile, officials, settings, general, announcements, events, galleries, documents, facilities, potentials. Turunan gambar berada bersama original. File lama dipindahkan ke legacy tanpa mengubah ID/URL database. Upload diabaikan Git; backup file bersama database Neon.

Database hanya menyimpan metadata, path dan relasi, tanpa blob/base64 gambar/PDF. Public ini folder backend, bukan Next.js. API tetap memeriksa PUBLIC/PRIVATE, owner dan arsip; jangan pasang static server tanpa pembatasan pada seluruh folder karena akan membuka file privat.

## Perintah pemeriksaan

```bash
cd backend && npm run lint && npm run typecheck && npm test && npm run build
cd frontend && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Migrasi pertama membuat `AppSetting`; migrasi kedua menambah akun, profil, sesi, token reset, dan audit. Seed mengisi identitas awal `Kelurahan Watundehoa` sesuai konfirmasi pengguna, tanpa akun staf. Provisioning admin/lurah dilakukan hanya melalui CLI terpisah, sesuai [rancangan identitas](backend/docs/auth-design.md). Jangan pakai data pribadi atau rahasia di seed maupun Git.

## Batasan tahap ini

Endpoint autentikasi dasar tersedia sejak Prompt 03. Pengiriman dan penyelesaian reset password, UI akun umum dan layanan surat belum dibuat. CMS berita tersedia sejak Prompt 07. Login khusus editor profil tersedia sejak Prompt 06. Bootstrap autentikasi frontend tersedia sejak Prompt 04; lihat [rancangan, diagram state, pengujian dan kontrak pemakaian](frontend/docs/auth-bootstrap.md). Dashboard admin/lurah tersedia sejak Prompt 11; UI akun umum dan dashboard masyarakat masih menunggu Prompt 12.

## Layout publik — Prompt 05

Sepuluh halaman publik, design system responsif, pencarian menu, dan state loading/404/500/maintenance sudah tersedia. Identitas dibaca dari `GET /api/v1/public/settings` dengan fallback yang bertanda contoh. Kontrak pengaturan, daftar file, hasil tes, dan batasan tersedia di [laporan Prompt 05](frontend/docs/public-layout.md). CMS tersedia sejak Prompt 06–10; konten resmi diisi pengelola setelah disetujui.

Revisi desain memakai foto kantor dan Lurah **AMIRULAH, S.Si** untuk Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe. Foto lokal yang sudah dikompresi tersedia di `frontend/public/images/watundehoa/`; sumber identitas frontend berada di `frontend/lib/site-identity.ts`.

Desain terbaru mengikuti referensi navy/kuning pilihan pengguna: header dengan pencarian, hero kantor dan lurah, akses cepat, panel informasi, panduan pelayanan, profil dan galeri kantor. Informasi yang belum tersedia tetap ditampilkan sebagai state kosong.

## Profil dan konfigurasi — Prompt 06

Editor settings, lima bagian profil, serta aparatur tersedia pada `/admin/profil` untuk ADMIN_KELURAHAN. Gunakan migrasi `20261016010000_profile_cms` melalui `cd backend && npm run db:deploy` sebelum menjalankan versi ini. Konten draft/arsip tidak terbuka melalui API publik. Sejak Prompt 07, pilihan gambar juga membaca upload publik tervalidasi dari pustaka media. Laporan, kontrak API, kebijakan akses, hasil tes dan langkah review: [Prompt 06](backend/docs/profile-cms.md).

## CMS berita dan media — Prompt 07

Buka `/admin/berita` dan login menggunakan akun ADMIN_KELURAHAN terprovisi. Buat kategori, unggah media (default privat), buat berita DRAFT, simpan lalu preview. Status PUBLISHED/ARCHIVED serta pemulihan revisi tersedia. Sejak Prompt 08, beranda dan `/berita` membaca publikasi resmi dari CMS; bila belum ada publikasi, ditampilkan state kosong.

Sebelum menjalankan versi ini: `cd backend && npm ci && npm run db:generate && npm run db:deploy`. Migrasi baru `20261016020000_news_media` menambah model berita, kategori, revisi dan media. Backend memerlukan Node >=22.12 karena sanitizer versi perbaikan keamanan. Install frontend dengan `pnpm install --frozen-lockfile`.

`UPLOAD_ROOT` default `public/uploads` relatif folder backend. File fisik dikelompokkan menurut asal upload, tanpa blob/base64 di database. API mempertahankan izin PUBLIC/PRIVATE. Backup file upload dan database Neon harus berpasangan; tidak ada volume upload Docker atau proxy Nginx untuk runtime lokal.

Kontrak API, keputusan permission, extension Tiptap, perintah tes dan hasil review: [laporan Prompt 07](backend/docs/news-cms.md). Belum ada upload surat/berkas warga Tahap 02.

## Berita publik dan SEO — Prompt 08

Daftar, detail dan kategori berita tersedia pada `/berita`, `/berita/[slug]`, `/berita/kategori/[slug]`, dengan metadata server, NewsArticle/BreadcrumbList, sitemap dan robots. Slug berita dapat diedit; slug lama menjadi alias 301 ke slug terbaru selama artikel published. Draft/arsip tetap 404.

Terapkan migration `20261016030000_news_publication`. Isi `SITE_ORIGIN` frontend dengan origin publik sebenarnya, `FRONTEND_INTERNAL_URL` backend dengan origin frontend internal, serta `CACHE_INVALIDATION_SECRET` acak minimal 32 karakter yang sama pada kedua aplikasi. Secret wajib produksi dan tidak boleh NEXT_PUBLIC. Jalankan backend dari folder backend dan frontend dari folder frontend. Webhook memerlukan HMAC; bila kelak memakai reverse proxy publik, tutup `/api/internal/` pada proxy. Notifikasi invalidasi disimpan dalam transaksi dan dicoba ulang; editor memperingatkan bila masih tertunda. Lihat [laporan delapan bagian Prompt 08](frontend/docs/news-public.md) untuk hasil pemeriksaan dan batasan operasi.

## Kanal informasi — Prompt 09

CMS `/admin/konten` mengelola pengumuman, agenda, album galeri, dan informasi publik. ADMIN_KELURAHAN dapat membuat, mencari, memfilter status, menyunting, menerbitkan dan mengarsipkan; LURAH dan MASYARAKAT tetap tidak memiliki izin kelola. Arsip merupakan penghapusan aman. Setiap simpan memeriksa versi terakhir dan mencatat audit dalam transaksi.

Pengumuman mendukung pinned, awal berlaku dan kedaluwarsa; publikasi yang belum berlaku atau kedaluwarsa disaring oleh server setiap request. `/agenda` menyediakan daftar mendatang/berlangsung dan lampau. `/galeri` memuat maksimal 4 album per halaman, masing-masing 12 foto ber-alt, thumbnail 480px dan lazy loading. `/informasi-publik` menyediakan pencarian/kategori serta unduhan PDF resmi. Isi standar pelayanan, maklumat dan dokumen resmi harus diisi pengelola setelah disetujui; tidak ada konten resmi buatan atau seed.

Gunakan pustaka media dalam CMS untuk mengunggah file. PRIVATE tetap default dan hanya dapat dibuka pengunggah melalui API; PDF privat hanya dapat ditautkan sebagai draft/arsip oleh pengunggah. Penerbitan dokumen mensyaratkan PDF PUBLIC aktif; tidak ada perubahan visibilitas otomatis. Galeri hanya menerima gambar PUBLIC aktif. Simpanan CMS tidak mengubah file publik menjadi privat saat konten diarsipkan: pilihan PUBLIC pada upload berarti URL media memang boleh diakses anonim. Media yang masih dirujuk tidak dapat diarsipkan. File maksimal **20 MiB (20.971.520 byte)**, signature/MIME/ekstensi dan isi tetap divalidasi. File lama pada legacy tetap kompatibel.

Migrasi tambahan: `20261016040000_public_content`; jalankan `npm run db:generate && npm run db:deploy` dari backend. Tidak ada env atau dependency aplikasi baru. Pembacaan empat kanal publik dan beranda memakai no-store agar batas waktu berlaku tepat; simpanan tetap mengantrekan invalidasi HMAC `public-content` beserta retry persisten.

### Tes database terisolasi

`npm run test:db` sekarang **wajib** memakai `TEST_DATABASE_URL` eksplisit menuju database lokal disposable bernama `kalosara_*_test`; runner menolak URL nonlokal, query parameter, dan nama lain. Tidak pernah mengambil DATABASE_URL Neon dari `.env`. Gunakan instance PostgreSQL native terpisah (bukan Docker), dengan port bebas dan upload tes sementara. Runner menerapkan migrasi hanya ke database uji dan membersihkan folder upload tes setelah selesai.

```bash
cd backend
TEST_DATABASE_URL=postgresql://test:test@127.0.0.1:55439/kalosara_prompt09_test npm run test:db
```

Kredensial di contoh hanya milik instance tes disposable. Jangan menggantinya dengan URL Neon. Laporan implementasi, kontrak API, hasil pemeriksaan, SOP review dan batasan tersedia pada [laporan Prompt 09](backend/docs/content-cms.md).

Perbaikan tampilan 17 Oktober 2026: stylesheet kontrol dimuat konsisten pada CMS dan filter publik, editor/admin memakai layout responsif dan input 16px, pustaka media dapat dilipat, tipografi publik lebih terbaca dan state galeri kosong diperbaiki. Desain hero/navy/kuning tetap dipertahankan. Lihat [catatan perbaikan layout](frontend/docs/layout-polish.md) untuk cakupan dan hasil QA.

## Statistik, potensi, fasilitas dan kontak — Prompt 10

CMS `/admin/wilayah` menyediakan snapshot statistik agregat per tahun/bulan dengan sumber/tanggal, serta fasilitas publik dan potensi lokal/UMKM. ADMIN_KELURAHAN mengelola draft/terbit/arsip dengan pemeriksaan role, CSRF dan versi. Publik membaca `/statistik` (tabel ber-caption, filter periode), `/potensi` (pilih fasilitas/potensi, kategori/cari/pagination), dan kontak dari pengaturan resmi. Beranda tidak lagi menampilkan angka demografi contoh; hanya snapshot terbit terbaru atau tanda belum tersedia. Tidak ada data NIK/nomor KK/daftar penduduk perorangan, tidak ada seed angka resmi buatan.

Peta kantor memakai koordinat dari `/admin/profil` dan dimuat setelah pengunjung menyetujui koneksi OpenStreetMap; alamat dan tautan menjadi fallback. Tidak ada API key atau pengiriman pesan kontak. Form pemilih topik hanya navigasi, tidak mengirim pesan. Statistik berisi markup tabel server, tetapi pembukaan streaming dinamis Next.js masih memerlukan JavaScript.

Migration `20261017000000_region_information` menambah StatisticSnapshot/Facility/Potential. Migrasi telah diterapkan ke Neon setelah persetujuan khusus Prompt 10 pada 17 Oktober 2026; jangan menjalankan reset/seed/tes DB pada Neon. Source upload facilities/potentials tervalidasi, file tetap fisik dan akses PUBLIC/PRIVATE tidak berubah. Tidak ada env/dependency aplikasi baru. Rincian delapan bagian dan hasil pemeriksaan: [laporan Prompt 10](backend/docs/region-cms.md).


## Dashboard admin/lurah, pengguna dan audit — Prompt 11

Buka `/admin`: ADMIN_KELURAHAN dan LURAH melihat hitungan CMS dan aktivitas terbatas. Admin membuka `/admin/pengguna` untuk search/pagination akun, aktif/nonaktif, cabut sesi/reset password setelah verifikasi identitas/password admin/CSRF, audit rinci dan inventory upload. Lurah hanya monitoring; approval belum diaktifkan. Masyarakat ditolak dari admin/API dashboard; profil akun sendiri tetap melalui `/auth/me`, tanpa dashboard/edit profil Prompt12.

Perubahan role memakai operasi backend khusus yang memeriksa izin, tanpa dropdown role bebas. Semua perubahan akses diaudit dalam transaksi dan mencabut seluruh sesi/token reset lama, sehingga JWT akses aktif ikut ditolak. Lock akun bersama login/refresh mencegah sesi baru tertinggal saat reset bersamaan. Audit menyimpan requestId dan IP pseudonim harian; tidak menyimpan password/cookie/token atau IP mentah. Log HTTP juga tidak memuat header/query/IP mentah.

Inventory mempertahankan PRIVATE milik sendiri; batas upload tetap20MiB/file dan dua upload serentak. Penggunaan fisik original/varian/legacy dihitung; kuota total storage belum ditetapkan, ditampilkan jujur sebagai belum tersedia. Tidak membuka static folder backend/public.

Migrasi `20261018000000_dashboard_audit` menambah dua kolom nullable AuditLog, tanpa reset/seed/env/dependency baru. **Aktivasi Neon Prompt11 menunggu izin khusus pengguna**, jangan menyamakan dengan izin Prompt09/10 atau menjalankan backend baru untuk mutasi sebelum migrasi. Tes memakai PostgreSQL native sementara lokal, bukan Neon/Docker. Hasil akhir: backend30 unit +41 tes DB, frontend34 tes, lint/typecheck/build dan13 pemeriksaan browser lulus. Matriks izin, kontrak/prosedur role/reset, delapan bagian laporan dan batasan: [laporan Prompt 11](backend/docs/dashboard-admin.md). Berhenti untuk review, tidak mulai Prompt12 atau Tahap02.
