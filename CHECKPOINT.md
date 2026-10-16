# Checkpoint KALOSARA — Prompt 09 siap review

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
| 07 — CMS berita, kategori dan media | Selesai dan di-push | `b6ecc46` |
| 08 — berita publik dan SEO | Selesai dan di-push | `a56c58e` |
| Revisi runtime manual/Neon/upload | Selesai dan di-push | `867f095` |
| 09 — pengumuman, agenda, galeri, informasi publik | Selesai; migrasi Neon diterapkan dengan persetujuan | lihat laporan Prompt 09 |

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


## Revisi runtime manual dan upload — 16 Oktober 2026

Instruksi pengguna menggantikan rencana Docker sebelumnya: frontend/backend manual, PostgreSQL Neon dari backend/.env, Compose hanya Redis pada localhost:6380 (6379 sudah terpakai). Dockerfile aplikasi/proxy dihapus. Image KALOSARA backend/proxy dibersihkan. Image postgres:17-alpine juga dihapus setelah pengguna memberi persetujuan spesifik; daftar image kini hanya redis. Volume data lama dipertahankan.

Upload file fisik pada backend/public/uploads/<source>/<images|documents>/; source allowlist news/profile/officials/settings/general dari form media. File lama dipindah ke legacy dan storageKey/URL lama tetap terbaca. Database hanya metadata/path/relasi, tanpa blob/base64 file. Akses PUBLIC/PRIVATE tetap via API, tanpa static mount seluruh public. Tidak ada migration schema baru. Jangan jalankan tes database destruktif pada Neon pengguna. Tidak memulai Prompt 09.

Verifikasi revisi: lima migration berhasil diterapkan ke Neon; backend lint/typecheck/build dan 26 tes lulus memakai Node >=22.12; frontend lint/typecheck/build dan 30 tes lulus. QA upload nyata di Neon membuktikan direktori news/images dan settings/documents, file fisik dan WebP turunan, proteksi file privat serta penolakan source traversal. Akun/file QA sementara dibersihkan tanpa reset atau penghapusan konten pengguna. Redis healthy/PONG pada localhost:6380. Cache Turbopack yang rusak dibersihkan sebelum build ulang.

Runtime lokal aktif: frontend http://localhost:3001 (3000 milik proses lain), backend http://localhost:4000, Redis localhost:6380. Origin/URL internal dan shared secret server di env lokal diselaraskan; DATABASE_URL pengguna dipertahankan dan tidak masuk Git.

## Prompt 09 selesai untuk review kode — 17 Oktober 2026

Audit awal HEAD `867f095`, working tree bersih. Kedua PDF Tahap 01, README, checkpoint, frontend/AGENTS.md dan panduan Next.js terpasang 16.4.0 sudah dibaca. Laporan delapan bagian: `backend/docs/content-cms.md`.

CMS `/admin/konten` mengelola pengumuman, agenda daftar, album foto dan dokumen publik dengan draft/publish/arsip, search/filter/pagination, Origin/CSRF, role ADMIN_KELURAHAN aktif, optimistic version, transaksi/audit. Model ContentItem + Announcement/Event/Gallery/GalleryPhoto/PublicDocument berelasi media. Pengumuman pinned menyaring future/expired setiap request tanpa job. Empat halaman publik dan panel beranda membaca CMS no-store. Dokumen PUBLISHED wajib PDF PUBLIC aktif; privat tetap hanya pengunggah. Gambar galeri PUBLIC ber-alt, maksimal 12/album dan 4 album/halaman, thumb480/display1200/lazy. Media yang dirujuk tidak dapat diarsipkan. Tidak ada seed konten resmi.

Upload menambah source allowlist announcements/events/galleries/documents, pola `<asal>/<images|documents>/` tetap pada backend/public/uploads; legacy kompatibel. API tetap menjaga akses tanpa static folder public. File PUBLIC memang bisa diakses lewat URL media walau item CMS diarsipkan; arsip konten bukan pencabutan visibilitas file. PRIVATE tidak dipromosikan otomatis. Validasi signature/isi/MIME/ekstensi, batas tepat 20 MiB, optimasi dan proteksi lama dipertahankan. Tag HMAC public-content ditambah dengan retry/outbox lama. Tidak ada env/dependency aplikasi baru atau perubahan Docker.

**Migration `20261016040000_public_content` BELUM diterapkan ke Neon.** Auto-review menolak migrate deploy ke database persisten karena menganggap belum ada otorisasi eksplisit. Jangan mencoba bypass. Perlu persetujuan pengguna khusus untuk menerapkan migration additive memakai DATABASE_URL yang sudah ada; tidak ada reset/seed/tes pada Neon. Sebelum itu kanal baru pada runtime utama belum aktif dan UI menunjukkan error state. URL/rahasia .env tidak diubah/ditampilkan.

Runtime utama diperiksa: manual frontend3001/backend4000; APP_ORIGIN/SITE_ORIGIN/FRONTEND_INTERNAL_URL3001, API4000 dan shared secret cocok; Redis6380 healthy/PONG. Tidak mengganggu port3000/proyek lain. CSS/aset desain pilihan `961c540` dipertahankan, angka statistik/ilustrasi lama tetap berlabel contoh. Identitas Watundehoa/Puriala/Konawe dan AMIRULAH, S.Si dipertahankan. Prompt 10/Tahap 02 tidak dimulai.

Verifikasi: backend lint/typecheck/build dan 28 tes unit/HTTP lulus; frontend lint/typecheck/build dan 31 tes lulus; 25 tes PostgreSQL dalam 6 suite lulus, keenam migration pada DB kosong berhasil. PostgreSQL **native 18.4 disposable** pada55439, tanpa image/container PostgreSQL, dengan database regresi dan browser terpisah. `npm run test:db` kini wajib TEST_DATABASE_URL localhost dengan nama kalosara_*_test dan tanpa query; setiap suite menolak Neon/non-test bahkan bila dipanggil langsung. Upload tes terisolasi sementara. Tes mencakup role/inactive/CSRF, draft/archive/future/expired, expiry segera, pinned/filter/pagination/konflik, acara mendatang/lampau, PDF PUBLIC/PRIVATE tepat20MiB, +1byte413, disguise/traversal, private owner vs admin lain, static URL404, thumbnail480 dan referensi media.

QA Chrome build produksi 3002/backend4002 dengan DB/akun/file terisolasi: login, publish empat kanal, upload gambar/PDF, HTML SSR escaped, 18 kombinasi enam halaman pada360/768/1440 tanpa overflow/gambar rusak/pageerror. HMAC nyata7 terkirim/0 pending. Browser QA mengarahkan request API sesinya ke backend uji karena rewrite build tetap4000; tidak menguji mutasi Neon. Cache Turbopack rusak/konflik build dengan server QA diselesaikan dengan menghentikan hanya server QA dan rebuild. Fixture browser sempat tercampur suite regresi; rerun di DB kedua yang kosong lulus seluruhnya.

**SIAP REVIEW kode Prompt 09; aktivasi Neon tertunda persetujuan.** Jangan lanjut Prompt 10 atau surat Tahap 02. Lihat laporan untuk SOP reviewer dan batasan. Commit/push setelah pemeriksaan lulus, lalu berhenti.

Cleanup akhir: frontend QA3002, backend QA4002 dan PostgreSQL native55439 telah dihentikan; database, akun, file, fixture dan kredensial uji sementara dibersihkan. Proses utama frontend3001/backend4000 serta Redis6380 tetap berjalan.

## Aktivasi Neon Prompt 09 — 17 Oktober 2026

Pengguna memberi izin eksplisit menerapkan migrasi Prompt 09 dengan DATABASE_URL yang ada tanpa reset/seed. `prisma migrate deploy` berhasil menerapkan `20261016040000_public_content`; `prisma migrate status` melaporkan skema mutakhir. Catatan penundaan di bagian sebelumnya adalah riwayat, bukan status terkini. URL/rahasia tidak ditimpa atau ditampilkan. Tidak ada konten/akun seed maupun tes destruktif di Neon.

Frontend/backend sempat berhenti di antara sesi; keduanya dijalankan kembali manual pada3001/4000 untuk smoke test baca-saja. Prompt 10/Tahap 02 tetap tidak dimulai.

Verifikasi aktivasi Neon (17 Oktober 2026): readiness dan empat API kanal langsung pada4000 serta melalui proxy3001 HTTP200; beranda, pengumuman, agenda, galeri, informasi-publik dan admin/konten HTTP200 tanpa state gangguan konten. Keempat kanal masih kosong (total0), tidak diisi seed. Cache Turbopack dev rusak saat startup dibersihkan hanya pada .next/dev/cache/turbopack; frontend kemudian berjalan normal. Tidak ada perubahan kode aplikasi atau pengujian destruktif. **SIAP REVIEW Prompt 09 termasuk aktivasi Neon.**

## Revisi layout/font CMS dan publik — 17 Oktober 2026

Pengguna menilai tampilan belum layak dan meminta perbaikan CMS/admin sekaligus publik. Masalah utama ditemukan: stylesheet kontrol CMS hanya diimpor halaman berita, sementara halaman konten dan filter publik memakai kelasnya tanpa stylesheet. Kini stylesheet bersama dimuat root; admin punya shell terisolasi, heading/navigation/tab aktif, form responsif, input 16px/tinggi 46px, badge status, kartu/tombol/pagination konsisten dan pustaka media panel lipat. Tipografi publik8–12px dinaikkan sesuai konteks menjadi teks utama 14–16px/metadata 12–13px. Pesan kosong galeri yang terjepit satu sel grid diperbaiki agar memenuhi panel. Hero, warna navy/kuning, aset, identitas dan isi resmi dipertahankan; tidak memulai Prompt 10 atau Tahap 02.

Laporan: `frontend/docs/layout-polish.md`. Frontend lint/typecheck/31 tes/build lulus; cache build Turbopack macOS sempat rusak dan dibersihkan hanya pada cache produksi. QA Chrome 52 kombinasi, 13 halaman × 4 lebar 360/768/1024/1440 tanpa overflow/pageerror dan semua input CMS 16px. Editor diperiksa memakai fixture hanya di browser; semua mutasi fixture diblokir, tidak ada akun/konten QA atau perubahan database Neon. Menu seluler dan Escape diperiksa. Tidak ada dependency/env/migration/backend baru. Tunggu review visual pengguna setelah commit/push.

Verifikasi tambahan revisi layout:6 kombinasi build produksi pada beranda/agenda/admin-konten,360 dan1440, lulus tanpa overflow/pageerror. Server QA3002 dibersihkan setelah pemeriksaan; runtime utama3001/4000 dipertahankan.

## Koreksi foto hero — 17 Oktober 2026

Pengguna meminta foto lurah dipisahkan dan mempertanyakan foto kantor hero. Penyebabnya: desktop masih memakai komposit `/images/reference/hero-right.webp`, sehingga kantor dari referensi menutupi foto kantor asli dan potret terpisah justru disembunyikan. Komposit dihapus dari markup hero; latar kini memakai settings.heroUrl atau fallback foto kantor yang dikonfirmasi pengguna `/images/watundehoa/kantor.webp`, sedangkan potret dari aparatur published atau `/images/watundehoa/amirulah.webp` tetap elemen gambar tersendiri. Object-fit menjaga rasio tanpa peregangan. Potret/kartu nama kini terlihat pada desktop dan seluler; teks kutipan dari referensi yang belum disahkan dihapus, kartu hanya memuat nama/jabatan. Palet navy/kuning, judul, akses cepat dan susunan halaman tetap dipertahankan.

CSS terisolasi `frontend/components/site/hero.css`, dimuat sesudah CSS referensi. Frontend lint/typecheck/31 tes/build lulus; QA hero Chrome pada360/768/1024/1440 memverifikasi path foto kantor/potret, komposit tidak ada, kartu terlihat, tanpa overflow, gambar rusak, pageerror atau overlap teks/potret. Screenshot desktop/seluler diperiksa visual. Tidak ada perubahan aset biner, backend, database, env atau dependency dan tidak memulai Prompt10/Tahap02.

## Penggantian lambang Konawe — 17 Oktober 2026

Pengguna memberikan PNG lambang Kabupaten Konawe dan meminta penggantian logo. File disalin persis tanpa modifikasi ke `frontend/public/images/watundehoa/konawe.png`; hash sumber dan hasil cocok. Header/footer memakai logo baru dengan rasio asli, alt header diperbarui. Referensi logo lama yang tersimpan sebagai `/images/reference/crest.webp` dinormalisasi pada pembacaan settings ke logo baru; upload logo kustom tetap didahulukan. Pemilih aset CMS profil dan allowlist backend ditambah path baru, path lama tetap kompatibel. Tidak ada perubahan database/env/migration atau fitur prompt berikutnya.

Verifikasi frontend lint/typecheck/31 tes/build dan backend lint/typecheck lulus. Browser header/footer pada360/768/1440: logo baru berhasil dimuat, rasio1:1 sama dengan sumber dan tanpa overflow. Tidak ada seed atau mutasi database.
