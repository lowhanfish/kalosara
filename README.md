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

Butuh Node.js 22.12+ untuk backend (frontend mendukung 20.19+), pnpm 10, dan PostgreSQL 17. Image backend menggunakan Node 22. Buat database `kalosara` dan user lokal sesuai `DATABASE_URL`.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cd backend
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Di terminal lain:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Buka `http://localhost:3000` dan `http://localhost:3000/api/v1/health`. Endpoint `ready` di `http://localhost:3000/api/v1/ready` memeriksa koneksi database. Semua respons API memakai `success`, `data` atau `error`, dan `requestId`; respons juga menyertakan header `X-Request-Id`.

## Runtime manual + Neon + Redis

Frontend/backend berjalan manual; PostgreSQL memakai Neon dari `backend/.env` (`DATABASE_URL`). URL database tidak masuk Git. Migration: `cd backend && npm run db:deploy`, tanpa reset/seed database yang sudah berisi data. Backend `npm run dev`, frontend `pnpm dev`. Produksi: backend `npm run build && npm start`, frontend `pnpm build && pnpm start`. Isi APP_ORIGIN, SITE_ORIGIN dan secret invalidasi sesuai env aplikasi.

Compose hanya menjalankan Redis: `docker compose up -d redis`, lalu `docker compose exec -T redis redis-cli ping`. Port `127.0.0.1:6380` (REDIS_PORT dapat diubah), volume redis_data, AOF aktif. Tidak ada container aplikasi/PostgreSQL/proxy. Redis disiapkan; auth/CMS saat ini belum memakai Redis. Tidak ada integrasi queue/cache baru.

## Penyimpanan upload

File fisik berada di `backend/public/uploads/<asal>/<images|documents>/`. UPLOAD_ROOT default public/uploads, jalankan backend dari folder backend. Asal dipilih pada pustaka media: news, profile, officials, settings, general. Turunan gambar berada bersama original. File lama dipindahkan ke legacy tanpa mengubah ID/URL database. Upload diabaikan Git; backup file bersama database Neon.

Database hanya menyimpan metadata, path dan relasi, tanpa blob/base64 gambar/PDF. Public ini folder backend, bukan Next.js. API tetap memeriksa PUBLIC/PRIVATE, owner dan arsip; jangan pasang static server tanpa pembatasan pada seluruh folder karena akan membuka file privat.

## Perintah pemeriksaan

```bash
cd backend && npm run lint && npm run typecheck && npm test && npm run build
cd frontend && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Migrasi pertama membuat `AppSetting`; migrasi kedua menambah akun, profil, sesi, token reset, dan audit. Seed mengisi identitas awal `Kelurahan Watundehoa` sesuai konfirmasi pengguna, tanpa akun staf. Provisioning admin/lurah dilakukan hanya melalui CLI terpisah, sesuai [rancangan identitas](backend/docs/auth-design.md). Jangan pakai data pribadi atau rahasia di seed maupun Git.

## Batasan tahap ini

Endpoint autentikasi dasar tersedia sejak Prompt 03. Pengiriman dan penyelesaian reset password, UI akun umum dan layanan surat belum dibuat. CMS berita tersedia sejak Prompt 07. Login khusus editor profil tersedia sejak Prompt 06. Bootstrap autentikasi frontend tersedia sejak Prompt 04; lihat [rancangan, diagram state, pengujian dan kontrak pemakaian](frontend/docs/auth-bootstrap.md). UI akun umum dan dashboard lengkap belum dibuat.

## Layout publik — Prompt 05

Sepuluh halaman publik, design system responsif, pencarian menu, dan state loading/404/500/maintenance sudah tersedia. Identitas dibaca dari `GET /api/v1/public/settings` dengan fallback yang bertanda contoh. Kontrak pengaturan, daftar file, hasil tes, dan batasan tersedia di [laporan Prompt 05](frontend/docs/public-layout.md). CMS dan konten resmi belum dibuat.

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
