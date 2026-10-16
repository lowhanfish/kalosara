# Prompt 08 — Berita publik, SEO dan berbagi

Tanggal: 16 Oktober 2026 (Asia/Makassar).

## 1. Ringkasan keputusan dan audit

Audit dimulai dari main bersih pada `b6ecc46` (Prompt 07). CHECKPOINT, README, kedua PDF Tahap 01, frontend/AGENTS.md dan dokumentasi Next 16.4 terpasang dibaca. CMS sudah menyediakan publikasi dan media tervalidasi, tetapi halaman publik masih contoh, slug belum dapat berubah dan belum ada invalidasi cache. Pekerjaan hanya Prompt 08; tidak memulai Prompt 09 atau Tahap 02.

Berita publik sekarang berasal dari data PUBLISHED. Desain pilihan `961c540`, hero, identitas Watundehoa/Puriala/Konawe dan AMIRULAH, S.Si dipertahankan. Beranda tetap memakai susunan satu berita utama dan empat berita samping. Tidak ada berita resmi yang dikarang atau di-seed. Daftar/kategori memakai cache 60 detik; detail SSR mengambil publikasi terbaru dan metadata server sebelum JavaScript. Halaman lain tetap dapat statis/ISR. Tidak ada data sesi atau pribadi di cache publik.

Alias slug disimpan permanen dan dicadangkan untuk berita asal. Semua alias langsung menuju slug terkini dengan HTTP 301 tanpa rantai. Rollback konten mempertahankan slug terkini dan menghasilkan DRAFT. Pemeriksaan publikasi dalam proxy mendahului streaming agar draft/missing benar-benar HTTP 404; gangguan resolver menghasilkan 503 noindex/Retry-After, bukan dianggap artikel hilang. `htmlLimitedBots` menahan metadata di head untuk semua user agent.

Invalidasi dicatat dalam transaksi database bersama mutasi. Backend mengirim body HMAC SHA-256 bertimestamp ke frontend internal, lalu mengulang event tertunda setiap 30 detik dengan backoff maksimum 5 menit. Hanya tiga tag publik diizinkan. Secret tidak masuk bundle browser; Nginx menutup `/api/internal/`. Simpan yang telah committed tidak menjadi gagal bila notifikasi cache tertunda; editor menampilkan peringatan. Event berhasil dibersihkan setelah tujuh hari.

## 2. Struktur/file berubah

- Backend Prisma: model NewsSlugAlias dan CacheInvalidation serta migration `20261016030000_news_publication`.
- `backend/src/modules/cms/public-news.ts`: daftar, detail aman, kategori, related, resolver dan indeks sitemap published saja.
- `cache-invalidation.ts`, `news.ts`, `media.ts`, `profile.ts`, `server.ts`: transaksi invalidasi, retry, alias, metadata media dan gambar turunan.
- `frontend/app/berita/`, `features/news/`, `lib/news*.ts`: daftar/cari/pagination, detail, kategori, breadcrumb, related, berbagi dan kartu beranda.
- `frontend/proxy.ts`, `app/berita-tidak-ditemukan/`: HTTP 301/404/503 sebelum streaming.
- `app/api/internal/revalidate/`, `lib/cache-signature.ts`: verifikasi HMAC, body maksimum 2 KiB, masa berlaku lima menit dan invalidasi tag/path.
- `app/sitemap.xml/`, `app/robots.ts`, `app/layout.tsx`, `next.config.ts`: metadata absolut, sitemap/robots dan head nonstreaming.
- Env examples, Compose, frontend Dockerfile dan Nginx: origin publik, URL internal dan secret server. Tes regresi backend/frontend ditambah tanpa dependency baru.

## 3. Cara menjalankan

Gunakan Node >=22.12 backend, frontend >=20.19 dan PostgreSQL 17. Jalankan `npm run db:generate`, `npm run db:deploy`, lalu build/start backend dan frontend. Frontend bisa memakai pnpm sesuai lockfile. Isi secret yang sama pada kedua aplikasi. Buka `/admin/berita`, simpan DRAFT lalu PUBLISHED; publik `/berita`, `/berita/[slug]` dan `/berita/kategori/[slug]`.

Endpoint publik di bawah `/api/v1/public/news`: `/` menerima page/limit/search/category, `/articles/:slug` detail+related, `/categories`, `/sitemap`, `/resolve/:slug`, `/resolve-category/:slug`. Alias hanya resolve untuk berita published. Endpoint lama `/:slug` tetap tersedia; frontend memakai namespace articles agar slug seperti sitemap tidak bertabrakan dengan endpoint sistem.

## 4. Migrasi dan environment

Terapkan migration `20261016030000_news_publication` sebelum versi ini. Tidak ada penghapusan data lama. Slug lama baru dicatat ketika slug diedit sesudah migrasi. Backup database dan upload tetap harus berpasangan.

`SITE_ORIGIN` adalah origin publik absolut tanpa subpath (juga build arg image frontend). `FRONTEND_INTERNAL_URL` backend mengarah langsung ke frontend, default localhost:3000, Compose http://frontend:3000. `CACHE_INVALIDATION_SECRET` minimal 32 karakter wajib produksi dan sama di backend/frontend; jangan memakai prefix NEXT_PUBLIC. Compose mewajibkannya. Gunakan nilai acak sendiri, bukan secret pengujian. APP_ORIGIN tetap origin browser untuk CSRF.

Upload gambar publik baru menghasilkan WebP thumb 480 px dan display 1200 px; gambar lama fallback ke original yang sudah dikompresi. Cover OG absolut memakai display, fallback JPEG lokal 1200×630 dari foto kantor yang diberikan. Tidak ada perubahan aset sumber atau migrasi ulang media lama.

## 5. Hasil pemeriksaan

Backend `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` lulus (21 tes unit/HTTP). `DATABASE_URL=... npm run test:db` lulus 18 tes PostgreSQL nyata, termasuk simpan bersamaan 200/409, alias berulang, reclaim slug sendiri dan rollback/draft. Migration berhasil diterapkan pada PostgreSQL 17 kosong. Frontend `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` lulus (30 tes). Build memperlihatkan halaman umum tetap statis/ISR, sedangkan berita/home SSR dengan data cache sesuai kebutuhan. `git diff --check` lulus. Secret uji tidak ditemukan dalam `.next/static`.

QA Playwright/Chrome terhadap standalone produksi dan curl lulus: boundary HMAC, draft 404, publish/update/archive pada cache hangat, metadata head sebelum hidrasi, cover WebP 480 px, default OG, related, kategori/cari/pagination, salin URL dan tautan berbagi, dua alias 301 langsung, canonical terbaru, sitemap/robots dan delivery ulang event tersimpan. Dua belas kombinasi beranda/daftar/detail/kategori × 360/768/1440 px lulus tanpa overflow/gambar rusak/pageerror/hydration mismatch. Gambar lazy diperiksa setelah scroll bertahap. Screenshot beranda desktop dan detail seluler juga diperiksa visual. Bukti respons server disimpan di [news-server-html.md](news-server-html.md), bukan hanya screenshot. Instance terisolasi menuju backend kosong membuktikan HTTP 503/no-store/Retry-After/noindex.

Docker build tambahan belum lulus: disk sistem sempat penuh dan Docker menjadi read-only. Sesudah ruang dibebaskan dan restart disetujui pengguna, PostgreSQL dan tes aplikasi pulih, tetapi image frontend gagal exit 139 saat `corepack enable` pada base image; build backend dihentikan saat npm ci tidak maju dan ruang kembali menyusut. Konteks tar tanpa xattr dipakai untuk menghindari keterbatasan AppleDouble pada volume eksternal. Ini bukan hasil build image produksi yang berhasil; perlu validasi ulang Docker di lingkungan sehat sebelum deployment.

## 6. Langkah review manual

Publikasikan artikel dengan cover setelah membuka daftar/beranda untuk menghangatkan cache. Pastikan judul baru segera tampil. Periksa curl HTML tanpa JavaScript: title, description, canonical, OG/Twitter berada dalam head; NewsArticle dan BreadcrumbList JSON-LD ada dan ter-escape. Uji fallback tanpa cover, terkait, cari/pagination, kategori, salin tautan dan tautan WhatsApp/Facebook. Jangan mengirim pesan eksternal selama QA.

Ubah slug dua kali: kedua slug lama harus 301 langsung ke slug terbaru. Simpan draft/arsip: detail dan alias 404, hilang dari daftar dan sitemap. Sitemap tidak memuat admin/draft; robots menunjuk sitemap dan menutup admin/API/pencarian. Uji 360/768/1440 px pada beranda/daftar/detail/kategori. Uji webhook tanpa signature, signature rusak/kedaluwarsa, tag tidak dikenal dan body berlebih; semuanya ditolak. Simulasikan frontend offline, simpan tetap berhasil dengan peringatan, event dikirim ulang saat frontend kembali.

## 7. Risiko dan batasan

Belum deployment HTTPS/domain produksi atau pengujian scraper WhatsApp/Facebook dari internet. Origin harus diatur sebelum build/deploy; crawler eksternal memerlukan URL/gambar yang dapat diakses publik. Cache Next bawaan berlaku satu instance; multi-instance membutuhkan cache handler bersama. Daftar dibatasi TTL 60 detik saat notifikasi tertunda; detail/status live. Indeks sitemap menolak lebih dari 49.000 berita dan perlu sitemap index sebelum skala tersebut. Replay webhook yang valid selama lima menit hanya mengulang invalidasi publik yang idempoten. Antivirus, layanan surat dan CMS modul berikutnya di luar lingkup.

## 8. Status

SIAP REVIEW Prompt 08 pada kode dan hasil build produksi lokal; seluruh acceptance criteria wajib lulus. Validasi ulang image Docker tetap tertunda sebelum deployment. Jangan mulai Prompt 09.
