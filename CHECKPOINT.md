# Checkpoint KALOSARA — setelah Prompt 07

Tanggal: 16 Oktober 2026 (Asia/Makassar). Repo tunggal: `https://github.com/lowhanfish/kalosara`, branch `main`. Pengguna memilih satu repo untuk `frontend/` dan `backend/`, meskipun dokumen awal menyebut dua repo. Setiap prompt yang selesai harus diuji, di-commit, dan di-push sebelum berhenti untuk review. Jangan otomatis lanjut ke prompt berikutnya.

## Status implementasi

| Prompt | Status | Commit |
| --- | --- | --- |
| 01 — fondasi Next.js, Express, Prisma, Docker Compose, Nginx | Selesai dan di-push | `13e62d0` |
| 02 — skema akun, role, sesi, RBAC, provisioning staf | Selesai dan di-push | `9468293` |
| 03 — API auth berbasis cookie, rotasi refresh, logout, profil | Selesai dan di-push | `68007ad` |
| 04 — bootstrap auth frontend | Selesai dan di-push | `8b05260` |
| 05 — design system dan layout publik | Selesai dan di-push; desain pilihan pengguna | `961c540` |
| 06 — konfigurasi, profil dan aparatur | Selesai dan di-push | `359bea8` |
| 07 — CMS berita, kategori dan media | Selesai; lihat laporan terbaru di bawah | commit Prompt 07 |

Sumber kebutuhan adalah `reff/KALOSARA_PDF1_Prompt_Website_Tahap_01.pdf` (prompt berurutan) dan `reff/KALOSARA_PDF2_Buku_Petunjuk_Website_Tahap_01.pdf`. Dokumen Tahap 02 ada di `reff/`, tetapi pekerjaan belum mencapai tahap itu.

## Kondisi kode

- `frontend/`: Next.js App Router dengan TypeScript strict, Tailwind, shadcn/ui dasar, TanStack Query, dan Zustand terpasang. Bootstrap sesi, AuthProvider, RouteGuard, HTTP client, store auth minimal dan query cache tersedia. Login khusus editor tersedia; UI akun umum belum dibuat. **Sebelum mengubah frontend, baca `frontend/AGENTS.md` dan dokumentasi Next yang dirujuk di sana.**
- `backend/`: Express, Prisma/PostgreSQL, Zod, Pino. Model akun dan sesi sudah bermigrasi. API auth ada di `/api/v1/auth`; daftar endpoint, contoh request, dan error ada di `backend/docs/auth-api.md`. Lifecycle, RBAC, cookie, dan key rotation ada di `backend/docs/auth-design.md`.
- `compose.yaml`: proxy Nginx, frontend, backend, PostgreSQL, serta volume database dan upload. Hanya proxy dipublikasikan. File `.env` berisi rahasia lokal dan tidak boleh di-commit.
- Migrasi terbaru: `backend/prisma/migrations/20261016020000_news_media/`. Terapkan sebelum menjalankan versi Prompt 07. Backend memerlukan Node >=22.12; Docker backend Node 22.

## Verifikasi terakhir

Prompt 03 lulus `npm run lint`, `npm run typecheck`, `npm run build`, 6 tes unit/HTTP dasar, dan 5 tes integrasi PostgreSQL. Tes integrasi memakai `supertest` agent dengan cookie persisten dan mencakup register → login → me → refresh → me → logout → me gagal, logout-all, akun nonaktif, batas masa hidup refresh, replay token, Origin/CSRF, dan rate limit. Image backend produksi berjalan; `/api/v1/ready` memberi HTTP 200. Cookie dengan origin HTTPS terverifikasi memiliki flag `Secure`. Image runtime melaporkan 0 temuan audit; dependency development masih melaporkan 16 temuan. Kontainer dan volume uji sementara sudah dibersihkan.

Perintah pemeriksaan backend:

```bash
cd backend
npm ci
npm run db:generate
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run test:db` memerlukan PostgreSQL yang sudah dimigrasi dan `DATABASE_URL` yang benar. Saat dijalankan dalam Compose, gunakan image `migrate` setelah `docker compose run --rm migrate`. Pada host yang membatasi pembukaan socket HTTP, tes `supertest` bisa dijalankan di kontainer.

## Konfigurasi penting

- Untuk Docker, salin `.env.example` menjadi `.env`, isi `POSTGRES_PASSWORD`, `AUTH_SIGNING_KEYS`, dan `APP_ORIGIN`. `AUTH_SIGNING_KEYS` wajib pada backend produksi: `kid:base64url-key` dengan kunci acak minimal 32 byte; kunci pertama aktif, sisanya untuk verifikasi selama rotasi. Jangan menyimpan kunci nyata di Git.
- `APP_ORIGIN` harus sama persis dengan origin browser tanpa slash penutup. HTTPS mengaktifkan cookie `Secure`. Semua POST auth butuh Origin tersebut dan header `X-CSRF-Token` dari `GET /api/v1/auth/csrf`.
- Access cookie HttpOnly maksimal 15 menit; refresh cookie HttpOnly 7 hari tanpa perpanjangan batas absolut. Frontend tidak boleh menyimpan token auth di `localStorage`.

## Prompt 04 — acuan implementasi

Implementasi dan laporan lengkap tersedia di `frontend/docs/auth-bootstrap.md`. Spesifikasi acuan Prompt 04: PDF1 halaman 6 meminta HTTP client dengan timeout, `AbortSignal`, error standar dan `requestId`; bootstrap `GET /auth/me`; satu refresh lalu satu retry saat access 401; single-flight untuk 10 request paralel; cleanup Zustand dan TanStack Query saat refresh definitif invalid; pertahankan sesi pada gangguan jaringan/502/503; cache per pengguna; AuthProvider dan RouteGuard. Tampilkan diagram state `INITIALIZING`, `AUTHENTICATED`, `GUEST`, `TEMPORARY_ERROR`. Uji reload access expired, refresh revoked, error jaringan, 10 respons 401 paralel, dan isolasi cache pengguna A/B. Dashboard tetap menunggu prompt terkait.

## Batasan yang diketahui

- `POST /auth/forgot-password` saat ini rate-limited tetapi selalu mengembalikan `503 RESET_UNAVAILABLE` tanpa membedakan email. Pengiriman email dan penyelesaian reset password belum dibuat.
- UI akun umum dan layanan surat belum dibuat. CMS profil dan berita tersedia; frontend berita published menunggu Prompt 08. Backend tetap menjadi otoritas akses; RouteGuard frontend pada Prompt 04 hanya membantu UX.
- Dokumentasikan hasil prompt dengan format PDF: keputusan, file berubah, cara menjalankan, migrasi/env, lint/typecheck/test/build, uji manual, risiko/tertunda, dan status SIAP REVIEW atau BELUM SIAP. Push commit prompt yang selesai ke `origin/main` sesuai instruksi pengguna.

## Verifikasi Prompt 04

Frontend lint/typecheck/test (16 kasus)/build dan backend lint/typecheck/test (6 kasus)/build lulus. Kasus negatif mencakup expiry, revocation, jaringan/502/503, 10 request paralel (refresh sukses maupun gagal), batas retry, timeout/abort, isolasi A/B dan respons identitas lama. Build perlu cache Turbopack bersih di volume macOS dan izin socket worker; supertest perlu socket lokal. Uji manual browser lengkap belum dijalankan; langkah reviewer ada di dokumentasi frontend. Tidak ada migration/env/dependency baru.

## Prompt 05 selesai — berhenti untuk review

Laporan lengkap: `frontend/docs/public-layout.md`. Design tokens dan 12 komponen UI tersedia, header/footer membaca endpoint whitelist `GET /api/v1/public/settings` dari AppSetting lama. Sepuluh halaman publik, pencarian menu, 404/500/maintenance, skeleton/loading dan error boundaries tersedia. Tidak ada migration/env/dependency baru. Data identitas fallback jelas bertanda contoh; editor dan konten resmi belum dibuat.

Lint/typecheck/build frontend dan backend lulus; frontend 19/19 tes, backend 8/8 tes. Browser QA menguji semua 10 rute pada 360, 768 dan 1440 px (30 kombinasi tanpa overflow), dialog/keyboard, pencarian, form kontak, toast, skip link dan halaman sistem. Smoke produksi homepage 200 dan tanpa log error browser. Native dialog diperkuat focus trap. Guest anonim biasa kini boleh tetap pada deep link publik; RouteGuard dan invalidasi identitas lama tetap mengalihkan bila diperlukan.

**Berikutnya hanya setelah diminta: Prompt 06 — konfigurasi kelurahan, profil dan aparatur.** Jangan otomatis melanjutkan atau memulai dashboard, CMS berita maupun pelayanan surat.

## Revisi desain Watundehoa — 16 Oktober 2026

Pengguna mengonfirmasi website untuk **Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe**, dengan Lurah **AMIRULAH, S.Si**, serta memberikan tiga foto. Identitas contoh diganti data tersebut; fallback/backend seed lama `Kelurahan Contoh` dinormalisasi tanpa menimpa konfigurasi instansi lain. Nomor telepon, email, jam pelayanan, alamat jalan rinci, sejarah, visi-misi dan sambutan belum diberikan: jangan mengarangnya.

Beranda kini memakai foto kantor sebagai hero, palet biru tua/putih/emas, bagian potret lurah, foto papan kantor dan akses cepat. Profil dan kontak menampilkan identitas/foto nyata. Aset WebP ada di `frontend/public/images/watundehoa/`; potret transparan dipertahankan dan ruang transparan luar dipangkas, tanpa retouch wajah. Komponen gambar memakai aset WebP yang sudah dikompresi agar tidak bergantung pada optimizer runtime. Sumber identitas frontend: `frontend/lib/site-identity.ts`. Revisi ini tetap perbaikan Prompt 05, belum memulai CMS/Prompt 06.

Verifikasi revisi Watundehoa: lint/typecheck/test/build frontend dan backend lulus (19 tes frontend, 8 tes backend). Beranda, profil dan kontak diperiksa pada 360, 768, 1440 px: 9 kombinasi tanpa overflow atau gambar rusak. Tidak ada migrasi/env/dependency baru. Nomor kontak dan jam pelayanan tetap belum diisi.

## Revisi mengikuti referensi modern — 16 Oktober 2026

Pengguna memilih gambar `Beranda Kelurahan Watundehoa Modern.png` sebagai arah desain. Beranda disusun ulang dengan warna navy/kuning, identitas berlatar kuning, search langsung di header, hero foto kantor dengan potret lurah dan kartu identitas, tujuh akses cepat, panel berita/pengumuman, band panduan pelayanan, fakta identitas, agenda, galeri kantor dan banner kontak. Komposisi responsif berada di `frontend/components/site/public-portal.css`; token umum tetap di globals.css. Halaman galeri sekarang menampilkan dua dokumentasi kantor yang diberikan pengguna.

Kabupaten tetap **Konawe** sesuai instruksi tertulis pengguna. Nama wilayah lain, logo, angka statistik, artikel, tanggal agenda, sambutan/kutipan, dan layanan pengajuan yang muncul dalam gambar referensi tidak dijadikan fakta. Logo resmi tetap memakai slot backend; fallback berupa ikon gedung generik. Angka statistik yang belum tersedia diganti fakta identitas terkonfirmasi. Tombol pelayanan membuka panduan, dan pengajuan online tetap dinyatakan belum tersedia. Tidak ada implementasi CMS/Prompt 06, perubahan backend, migrasi, env, atau dependency.

Verifikasi: frontend lint/typecheck dan 19 tes lulus. Semua 10 rute publik diperiksa pada 360, 768, dan 1440 px (30 kombinasi tanpa overflow atau gambar rusak). Menu/search seluler dengan kata “kontak” mengarah ke hasil yang benar. Build produksi lulus. Hasil backend dari revisi sebelumnya tetap berlaku karena tidak ada perubahan backend.

## Koreksi mengikuti unggahan pengguna — 16 Oktober 2026

Pengguna menolak interpretasi desain sebelumnya dan meminta komposisi gambar unggahan dipakai langsung. Beranda disesuaikan dengan susunan referensi: hero, tujuh akses cepat, satu berita utama + empat berita samping, empat pengumuman, enam layanan, profil/statistik, agenda/galeri, banner kontak dan footer. Potongan visual dari gambar pengguna disimpan di `frontend/public/images/reference/`, termasuk komposit hero, crest, foto ilustrasi berita/galeri dan panel monumen. Konten dan navigasi tetap HTML; halaman bukan satu gambar penuh. Desktop menggunakan komposit hero dari unggahan; seluler memakai foto kantor dan potret asli yang diberikan sebelumnya. Kabupaten tetap Konawe sesuai instruksi pengguna.

Audit berita: rute `/berita` sudah ada tetapi sebelumnya hanya kerangka. Tidak ditemukan model Prisma, endpoint, seed atau artikel tersimpan. Pengguna sudah dimintai lokasi sumber berita. Sementara sumber belum diberikan, `frontend/lib/reference-content.ts` memuat contoh dari gambar, dengan pemberitahuan terlihat pada beranda dan halaman berita. Angka statistik, pengumuman, agenda serta dokumentasi kegiatan dalam gambar belum diverifikasi sebagai fakta; jangan menganggapnya publikasi resmi. Halaman detail contoh tidak diindeks. Logo dari gambar hanya fallback desain; konfigurasi logo backend tetap didahulukan di header.

Perubahan tidak menambah CMS, tabel, env, dependency atau dashboard. Laporan dan batasan ada di `frontend/docs/public-layout.md`.

Verifikasi koreksi: frontend lint/typecheck/19 tes/build lulus; 44 kombinasi browser tanpa overflow/gambar rusak. **SIAP REVIEW desain**, integrasi berita resmi menunggu sumber pengguna.

## Prompt 06 selesai — berhenti untuk review

Laporan delapan bagian: `backend/docs/profile-cms.md`. Tiga tabel baru SiteSetting (singleton), Page dan Official dengan unit organisasi sederhana. Editor `/admin/profil` menyediakan login admin, settings, lima bagian profil, draft/publish/arsip, preview teks aman, aparatur, dan logout. Backend memeriksa sesi/akun aktif/role ADMIN_KELURAHAN serta Origin/CSRF pada mutasi; LURAH tetap tanpa izin kelola. Audit dicatat dalam transaksi. Cookie CSRF kini path `/api/v1` agar berlaku untuk CMS.

Identitas Watundehoa/Puriala/Konawe dan AMIRULAH, S.Si dipertahankan. Desain, CSS dan aset `961c540` dipertahankan; frontend mengikat identitas/profil/media ke data backend tanpa deploy ulang. Profil punya metadata dinamis, breadcrumb, state kosong/error, aparatur published dan alamat/peta. Media sementara hanya empat aset lokal; upload dan CMS berita belum dibuat. Migration baru: `20261016010000_profile_cms`; tanpa env/dependency baru. Terapkan migration sebelum menjalankan versi ini.

Verifikasi: backend lint/typecheck/build, 10 tes unit/HTTP dan 6 tes PostgreSQL lulus; frontend lint/typecheck/build dan 19 tes lulus. Browser login/settings/nama navbar-footer-profil, draft/preview/publish, XSS sebagai teks, aparatur UI, SEO dan 12 kombinasi responsif (360/768/1440) lulus tanpa overflow/gambar rusak/pageerror. Database dan akun uji sementara dibersihkan. Batasan: editor plain text, last-write-wins, menyimpan DRAFT menarik halaman dari publik (belum revisi paralel), komposit hero default tetap gambar pilihan pengguna. Belum deployment produksi.

**SIAP REVIEW Prompt 06. Jangan mulai Prompt 07 sebelum instruksi pengguna berikutnya.**

## Prompt 07 selesai — berhenti untuk review

Laporan lengkap delapan bagian: `backend/docs/news-cms.md`. CMS `/admin/berita` menyediakan kategori, daftar berita dengan cari/filter/sort/pagination, Tiptap 3.32, cover/gambar publik, draft/publish/arsip, preview tersimpan yang terautentikasi, riwayat dan rollback sebagai draft baru. Slug stabil, author berasal dari sesi, expectedVersion/transaksi serializable mencegah konflik edit, dan audit dibuat bersama simpanan. Model baru News/NewsCategory/NewsRevision/MediaAsset/NewsMedia. Tidak ada seed berita resmi atau akun baru.

Upload satu JPG/PNG/WebP/PDF maksimal 20 MiB per request, dua job bersamaan, signature/MIME/ekstensi harus cocok, gambar decode/re-encode maksimal 25 MP, PDF parse valid tanpa enkripsi. File di luar web root, nama UUID, default UI private; private hanya admin pengunggah. Publik hanya file PUBLIC aktif; PDF attachment, nosniff/CSP. Media terpakai oleh cover/embed/revisi/settings/aparatur tidak dapat diarsipkan. Alt/caption tersimpan. Pemilih gambar Prompt 06 sekarang membaca upload publik tervalidasi. CSS/aset publik dan beranda desain `961c540` tidak diubah.

Migration `20261016020000_news_media`; env opsional `UPLOAD_ROOT` (default uploads, Compose memakai volume yang sudah ada). Backend minimum Node 22.12 dan image Node 22 untuk sanitizer perbaikan keamanan. Dependency baru tercatat di laporan/lockfiles. Nginx khusus endpoint upload menerima multipart 21 MiB, file tetap maksimum 20 MiB. Backup database dan upload harus berpasangan; volume lama harus writable oleh user node tanpa menghapus datanya.

Perbaikan pendukung: error bisnis CMS tidak lagi mengubah status auth; editor tetap ada saat recovery jaringan, cache/state editor diisolasi per identitas dan reset ketika admin berganti. Enam tes regresi auth baru lulus. Media URL/UUID dinormalisasi agar perbedaan huruf besar tidak memutus pemeriksaan referensi.

Verifikasi: backend lint/typecheck/build dan 19 tes unit/HTTP lulus; 14 tes PostgreSQL lulus; frontend lint/typecheck/build dan 25 tes lulus. Browser dev dan hasil build produksi menguji login, kategori, upload public/private, Tiptap bold/gambar, preview, publish/arsip/rollback, XSS, konflik/muat ulang, hero upload dan pergantian admin A/B. Enam kombinasi editor/media pada 360/768/1440 px tanpa overflow/pageerror/hydration mismatch. Nginx proxy menerima PDF valid tepat 20 MiB (201), menolak +1 byte (413). Image runtime Node 22.23.3 lulus sanitizer/Sharp/query DB; prune runtime melaporkan 0 vulnerability, dependency development masih memiliki 16 temuan audit. Semua database/akun/upload uji serta kontainer sementara dibersihkan setelah QA.

Batasan: halaman `/berita` dan beranda masih contoh desain berlabel; frontend published, detail SEO/sitemap/cache invalidation menunggu Prompt 08. Tidak ada jadwal publish/autosave otomatis, antivirus, quota total/purge media/retensi otomatis atau deployment HTTPS/load test produksi. Riwayat mempertahankan media; storage perlu dimonitor. LURAH tetap tanpa izin CMS tambahan. Tidak ada layanan surat Tahap 02.

**SIAP REVIEW Prompt 07. Jangan mulai Prompt 08 sebelum instruksi pengguna berikutnya.**

## Prompt 08 selesai — berhenti untuk review

Laporan delapan bagian: `frontend/docs/news-public.md`; bukti HTML server anonim: `frontend/docs/news-server-html.md`. Daftar/detail/kategori sekarang membaca berita PUBLISHED, dengan pencarian/pagination, metadata absolut di head sebelum hidrasi, NewsArticle/BreadcrumbList, sitemap/robots, related dan berbagi/salin URL. Beranda mempertahankan susunan desain pilihan `961c540` dan memakai publikasi CMS; belum ada berita resmi seed. CSS publik/hero/aset sumber tidak diubah. Identitas Watundehoa/Puriala/Konawe dan AMIRULAH, S.Si tetap berlaku.

Slug berita dapat diedit; NewsSlugAlias mencadangkan histori dan mengarahkan semua alias langsung dengan HTTP 301 ke slug terkini. Rollback mempertahankan slug dan tetap DRAFT. Proxy memeriksa publikasi sebelum streaming agar draft/arsip/missing benar-benar HTTP 404; gangguan resolver HTTP 503 noindex/Retry-After. Daftar/cache publik 60 detik, detail SSR live, halaman umum tetap statis/ISR. CacheInvalidation ditulis dalam transaksi mutasi; HMAC internal mengekspirasi tag/path, retry database tiap 30 detik/backoff maksimum 5 menit, peringatan editor bila notifikasi tertunda. Tidak ada secret/data pribadi di bundle/cache publik.

Migration `20261016030000_news_publication`. Env baru: frontend SITE_ORIGIN (juga build arg), backend FRONTEND_INTERNAL_URL, CACHE_INVALIDATION_SECRET sama di kedua aplikasi dan wajib produksi minimal 32 karakter. Compose memakai APP_ORIGIN untuk SITE_ORIGIN; Nginx menutup webhook internal. Upload gambar publik baru membuat thumb WebP 480 px/display 1200 px; upload lama fallback original terkompresi. Tidak ada dependency baru.

Verifikasi akhir: backend lint/typecheck/build, 21 tes unit/HTTP dan 18 tes PostgreSQL lulus; frontend lint/typecheck/build dan 30 tes lulus. QA standalone produksi/curl menguji metadata sebelum JavaScript, HMAC invalid/expired/tampered/oversize, publish/update/archive cache hangat, draft404, alias301 langsung, sitemap/robots, gambar/fallback OG, related/share/copy, kategori/cari/pagination dan retry persisten. Dua belas kombinasi responsif 360/768/1440 tanpa overflow/gambar rusak/pageerror/hydration mismatch. Gangguan backend diuji lewat instance terisolasi dan menghasilkan503. Secret tidak ada di static browser.

Batasan lingkungan: disk sistem sempat penuh, Docker read-only. Setelah pengguna mengosongkan disk dan menyetujui restart, PostgreSQL/QA aplikasi pulih. Build image tambahan belum berhasil (frontend exit139 pada corepack base image; backend npm ci tidak maju, dihentikan saat ruang menyusut). Validasi ulang image Docker di lingkungan sehat sebelum deployment. Belum uji scraper eksternal/domain HTTPS atau cache bersama multi-instance. Rincian batasan ada di laporan.

**SIAP REVIEW Prompt 08 untuk kode dan build produksi lokal. Jangan mulai Prompt 09 sebelum instruksi pengguna berikutnya.**
