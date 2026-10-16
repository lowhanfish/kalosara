# Prompt 07 — CMS berita, kategori, editor kaya dan media

Tanggal: 16 Oktober 2026 (Asia/Makassar).

## 1. Ringkasan keputusan dan audit

Audit awal: working tree bersih, branch main, HEAD `359bea8`, Prompt 06 telah di-push. CHECKPOINT/README, ketentuan PDF Tahap 01 dan `frontend/AGENTS.md` dibaca. Dokumentasi Next 16.4 lokal tentang server/client components dan fetching data dibaca sebelum perubahan frontend. Repo memiliki auth/RBAC/CSRF, Prisma 6.19/Zod 4, CMS profil dan volume upload, tetapi belum memiliki model berita atau pipeline media. Nginx semula membatasi seluruh request 1 MiB.

Implementasi hanya Prompt 07. Desain beranda `961c540`, CSS publik dan aset referensi tetap dipertahankan. Identitas Watundehoa/Puriala/Konawe dan AMIRULAH, S.Si tetap berlaku. Halaman berita publik/SEO per artikel merupakan Prompt 08: halaman contoh yang sudah ada tidak diubah menjadi publikasi resmi pada pekerjaan ini. CMS menyediakan preview terautentikasi dan kontrak baca API published, tanpa halaman detail/sitemap/ISR baru.

Model: News, NewsCategory, NewsRevision, MediaAsset dan join NewsMedia. Slug berita/kategori stabil setelah dibuat. News menyimpan judul, ringkasan, HTML yang telah disanitasi, author dari sesi, kategori, cover, status, tanggal publikasi, version dan timestamps. Setiap simpan membuat snapshot revisi serta audit dalam transaksi serializable. expectedVersion mencegah perubahan lama menimpa simpanan baru; konflik memperoleh 409. Rollback memeriksa revision milik berita yang sama, membuat revisi baru dan selalu DRAFT agar pemulihan tidak menerbitkan konten tanpa pemeriksaan. publishedAt pertama dipertahankan sebagai histori; status menjadi penentu akses publik. Menyimpan DRAFT/ARCHIVED menarik berita dari API publik, tanpa revisi published paralel.

ADMIN_KELURAHAN diberi izin eksplisit mengelola koleksi berita/kategori institusi dan media publik. LURAH/masyarakat tidak memperoleh bypass. Semua endpoint admin memeriksa token, sesi DB, akun aktif dan role terbaru; mutasi memeriksa Origin/CSRF. Media PRIVATE hanya boleh dilihat/diubah admin pengunggah, termasuk penolakan admin lain. PUBLIC merupakan keputusan sadar saat upload; default UI PRIVATE. Visibilitas tidak dapat diubah setelah upload. News hanya boleh menggunakan gambar PUBLIC aktif sebagai cover/embed. File di disk tidak dilayani sebagai direktori statis.

Tiptap 3.32.0: StarterKit menyediakan document/paragraph/text, heading H2/H3, bold, italic, strike, blockquote, bullet/ordered list, hard break, undo/redo dan Link bawaan v3; Image ditambah terpisah. Code/codeBlock/horizontalRule/underline dinonaktifkan agar sesuai whitelist backend; tabel opsional tidak diaktifkan. `immediatelyRender: false` menghindari SSR mismatch. Toolbar menyediakan format, tautan HTTP(S)/mailto/tel serta gambar pustaka publik. Simpan manual dipilih, dengan indikator perubahan belum disimpan, peringatan browser unload dan konfirmasi pergantian editor/tab. Preview hanya mengambil hasil sanitasi server yang sudah tersimpan; HTML form belum tersanitasi tidak dipasang sebagai preview.

Sanitizer memakai allowlist tag/attribute, membuang script/iframe/SVG/MathML/style/event handler, data URL dan gambar eksternal. Gambar hanya URL media internal berbentuk UUID; setiap ID diverifikasi ke DB. HTML disanitasi lagi pada preview/baca published, termasuk saat rollback. Link mendapatkan noopener/noreferrer/nofollow. Versi awal dependency sanitizer terkena advisory XSS; diperbarui menjadi sanitize-html 2.18.1 yang memerlukan Node >=22.12. Backend/Docker memakai Node 22, sementara frontend tetap kompatibel Node 20.19+.

Upload: satu file per request, maksimum 20 MiB (20 × 1024 × 1024), tiga field metadata, total file per batch 20 MiB. Dua request upload dapat diproses bersamaan, rate limit 30/15 menit per IP. Multipart ditulis ke disk sementara; signature, MIME dan ekstensi harus cocok JPG/PNG/WebP/PDF. Sharp benar-benar decode/rotate/re-encode gambar, membatasi 25 megapiksel dan membuang metadata sumber. PDF harus dapat diparse, tidak terenkripsi, memiliki 1–1000 halaman, header/EOF valid. PDF selalu attachment, dengan CSP sandbox dan nosniff; ini validasi struktur, bukan pemindaian antivirus. Nama storage UUID, direktori objek/temp mode 0700, file gambar mode 0600. Temp dibersihkan saat berhasil/gagal/abort yang tertangani. Upload gagal sebelum transaksi DB dibersihkan dari disk.

Arsip menggantikan delete permanen. Cover/embed, media pada semua revisi, logo/hero settings dan foto aparatur melindungi aset dari arsip yang akan memutus referensi; konflik 409 MEDIA_IN_USE. Metadata alt/caption dapat diperbarui. Snapshot revisi mempertahankan ID media, sehingga file untuk rollback tetap tersedia. Pemilihan media Prompt 06 kini juga membaca upload gambar publik (pencarian, maksimal 50 hasil), tanpa menerima PDF/private sebagai logo/hero/foto.

Perbaikan regresi auth yang ditemukan melalui QA: error bisnis CMS 400/403/404/409/413 tidak lagi mengubah sesi menjadi TEMPORARY_ERROR. Network/server error tetap mendapat recovery, sementara editor dengan identitas yang masih dikenal dipertahankan. Child editor diberi key per identitas agar pergantian admin mereset state form. Media URL/UUID dinormalisasi ke huruf kecil agar pemeriksaan referensi tidak dapat terlewat hanya karena variasi kapitalisasi. Cache server tetap memakai query key per user.

Acuan API yang diperiksa: [Tiptap Next.js](https://tiptap.dev/docs/editor/getting-started/install/nextjs), [StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit), README Multer/sanitize-html versi terpasang dan deklarasi tipe paket aktual.

## 2. Struktur/file berubah

- `backend/prisma/schema.prisma`, `migrations/20261016020000_news_media/migration.sql`: enum publikasi/visibilitas, lima tabel, FK, indeks dan versi revisi unik.
- `backend/src/modules/cms/common.ts`: error CMS, pagination, transaksi serializable dan validasi referensi gambar publik.
- `backend/src/modules/cms/sanitize.ts`: whitelist HTML, URL media dan input berita.
- `backend/src/modules/cms/news.ts`: kategori, pencarian/filter/sort/pagination berita, simpan, revisi, rollback, preview admin dan baca published.
- `backend/src/modules/cms/media.ts`: upload, signature/decoder, metadata, permission file, penyajian publik/privat dan arsip aman.
- `backend/src/modules/profile.ts`: integrasi referensi upload dan transaksi konsisten dengan arsip media.
- `backend/src/app.ts`, `config/env.ts`, `middlewares/error-handler.ts`: router, storage root dan envelope error CMS.
- `backend/src/tests/cms.test.ts`, `cms.db.test.ts`, `backend/package.json`, `package-lock.json`: dependency dan tes.
- `backend/Dockerfile`, `backend/.env.example`, `.gitignore`, `nginx/default.conf`: Node 22, storage nonpublik, permission dan limit multipart khusus 21 MiB.
- `frontend/features/cms/{admin-access,rich-editor,categories,media-library,news-editor}.tsx`, `client.ts`, `cms.css`: UI modular dan helper request.
- `frontend/app/admin/berita/{page,layout}.tsx`: workspace berita/kategori/media dan noindex.
- `frontend/app/admin/profil/page.tsx`: tautan CMS, pemilihan upload dan mempertahankan form saat recovery jaringan.
- `frontend/features/auth/runtime.ts`, `frontend/tests/auth.test.cjs`: error bisnis tidak merusak status auth dan enam regresi baru.
- `frontend/package.json`, `pnpm-lock.yaml`: Tiptap; `README.md`, `CHECKPOINT.md`, laporan ini: operasi dan review.

## 3. Cara menjalankan dan kontrak

Backend memerlukan Node >=22.12; jalankan `npm ci`, `npm run db:generate`, `npm run db:deploy`, `npm run dev`. Frontend `pnpm install --frozen-lockfile`, `pnpm dev`. APP_ORIGIN harus persis origin browser. Buka `/admin/berita`, login dengan admin terprovisi, buat kategori, unggah gambar publik atau PDF sesuai kebijakan, buat berita dan simpan DRAFT, preview lalu ubah status dan simpan. Profil/pengaturan tetap di `/admin/profil`. Tidak ada akun staf atau artikel resmi baru di seed.

Prefix seluruh endpoint berikut `/api/v1`:

| Endpoint | Kontrak |
| --- | --- |
| GET `/admin/news` | Admin; page/limit/search/status/categoryId/sort=newest,oldest,title |
| GET `/admin/news/categories` | Admin; page/limit/search |
| PUT `/admin/news/categories/:uuid` | Admin+CSRF; name/slug/archived, slug stabil |
| GET `/admin/news/:uuid` | Admin; objek editor, termasuk version |
| PUT `/admin/news/:uuid` | Admin+CSRF; slug/title/excerpt/bodyHtml/categoryId/coverId/status/expectedVersion; baru expectedVersion=0 |
| GET `/admin/news/:uuid/revisions` | Admin; page/limit, daftar metadata revisi |
| POST `/admin/news/:uuid/rollback` | Admin+CSRF; revisionId/expectedVersion; selalu menghasilkan draft versi baru |
| GET `/admin/news/:uuid/preview` | Admin; preview tersimpan yang disanitasi, no-store |
| GET `/public/news/:slug` | Publik; hanya PUBLISHED, selain itu 404; belum dihubungkan ke frontend publik |
| GET `/admin/media` | Admin; page/limit/search/visibility, public bersama + private milik sendiri |
| POST `/admin/media` | Admin+CSRF; multipart file/visibility/alt/caption, maksimum satu file 20 MiB |
| PATCH `/admin/media/:uuid` | Admin+CSRF; alt/caption/archived; private harus pemilik |
| GET `/admin/media/:uuid/file` | Admin; private harus pemilik, archived 404 |
| GET `/public/media/:uuid` | Tanpa login; PUBLIC aktif saja, lainnya 404 |

Pagination default 10, maksimum 50; urutan memakai tie-breaker ID/versi agar halaman stabil. Semua JSON memakai envelope success/data atau error serta requestId. 400 invalid input/file, 401 sesi tidak valid, 403 role/owner/Origin/CSRF, 404 resource tak tersedia, 409 konflik/referensi, 413 file oversize, 429 rate limit, 503 dua upload sedang sibuk. URL fisik dan storageKey tidak dikirim dalam API daftar media. Upload berhasil 201. Endpoint file memakai no-store, nama download UUID dan nosniff.

## 4. Migration/env/dependency

Migrasi `20261016020000_news_media` berhasil diterapkan setelah tiga migrasi terdahulu pada PostgreSQL 17 sementara. Tidak menghapus tabel/data lama; belum diterapkan pada produksi.

Env baru `UPLOAD_ROOT` opsional, default `uploads` relatif working directory backend. Compose tetap memakai volume `/app/uploads`; jangan memakai folder web statis atau commit objek upload. Image menyiapkan direktori milik user node. Volume lama yang tidak writable perlu koreksi kepemilikan operator, tanpa menghapus data. Backup/restore database harus berpasangan dengan volume objek. Media yang diarsip tetap disimpan; purge/retensi fisik bukan bagian prompt ini.

Backend dependency: multer 2.4.0, sanitize-html 2.18.1, file-type 21.3.4, sharp 0.35.5, pdf-lib 1.17.1 dan tipe Multer/sanitizer. Frontend Tiptap react/pm/starter-kit/extension-image 3.32.0. Backend minimum Node 22.12 dan Docker Node 22 karena requirement sanitizer perbaikan keamanan. Tidak menambah queue, Redis atau layanan cloud.

## 5. Hasil lint/typecheck/test/build

- Backend lint/typecheck/build: lulus; 19/19 tes unit/HTTP (termasuk sembilan sanitizer), 14/14 tes PostgreSQL (delapan CMS).
- Frontend lint/typecheck/build: lulus; 25/25 tes, termasuk enam regresi error bisnis/refresh.
- Empat migrasi berhasil diterapkan pada DB kosong; constraints FK/slug/versi tersedia.
- Image backend Node 22 berhasil dibangun. Runtime v22.23.3 berhasil menjalankan sanitasi, native Sharp dan query PostgreSQL. Tahap prune runtime melaporkan 0 vulnerability; audit instalasi lengkap masih 16 temuan (1 moderate/13 high/2 critical), terutama tooling lama. `npm audit --omit=dev` pada instalasi pengembangan masih memasukkan empat temuan Prisma/tooling peer; hasil itu bukan klaim nol temuan pada seluruh dependency pengembangan.
- Nginx dengan konfigurasi repo: PDF valid tepat 20 MiB mendapat 201 melalui proxy; 20 MiB + 1 byte mendapat 413. Backend juga menguji file tersamar, rusak, multiupload, metadata tak sah serta MIME/ekstensi berbeda.
- `git diff --check` lulus; CSS/aset publik dan kode beranda pilihan pengguna tidak berubah.

Commands: backend `npm run db:generate`, `DATABASE_URL=<uji> npm run db:deploy`, `npm run lint`, `npm run typecheck`, `npm test`, `DATABASE_URL=<uji> UPLOAD_ROOT=<storage-uji> LOG_LEVEL=silent npm run test:db -- --no-file-parallelism`, `npm run build`; frontend `npx next typegen`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Host backend checks memakai bundled Node 24 yang memenuhi minimum; image runtime Node 22 diuji terpisah. Docker build dilakukan dari tar sumber eksplisit tanpa AppleDouble/xattr karena volume macOS menolak pembacaan xattr pada build context biasa. Cache `.next` perlu dibersihkan sebelum build ulang Turbopack di volume ini; route types dibuat ulang lalu build lulus.

## 6. Manual/browser testing

Chrome/Playwright memakai akun dan database sementara, tanpa konten produksi. Teruji: login admin, buat kategori, upload public/private, private URL publik 404, Tiptap bold dan sisip gambar, cover+caption, simpan draft, preview autentikasi, publish API 200, archive API 404, rollback versi 1 menjadi draft versi 4, injeksi script/SVG/event handler tidak dieksekusi, konflik expectedVersion ditolak, muat ulang server mereset form, hero Prompt 06 menerima gambar upload publik, serta pergantian admin A/B mereset editor dan menyembunyikan media privat A. Editor/media diperiksa pada 360/768/1440 px: enam kombinasi tanpa overflow, screenshot mobile/desktop diperiksa visual, tanpa pageerror/hydration mismatch. Smoke alur pada build produksi lokal juga dijalankan; bukan deployment Docker frontend/HTTPS produksi.

Tes API langsung mencakup tamu, masyarakat, LURAH, admin nonaktif; CSRF/Origin; admin lain ditolak mengakses private; MIME/signature/extension; PNG/JPEG/WebP decode; malformed PDF/image; tepat 20 MiB/oversize; public/private download headers; media private/PDF ditolak sebagai gambar profil/cover; draft/arsip 404 publik; revisi salah resource ditolak; slug tetap; konflik versi; pagination/filter/sort; audit serta referensi media mencegah arsip. Tes auth/profile sebelumnya tetap lulus.

Langkah reviewer: provision admin; buat kategori; unggah gambar PUBLIC dan file PRIVATE; pastikan akun lain tidak mendapat private; buat draft dan preview; publish lalu periksa kontrak API publik; edit lalu arsipkan dan pulihkan revisi; uji dua editor untuk konflik 409; ubah alt/caption; coba arsip media terpakai (harus 409); pilih upload untuk hero/logo/foto aparatur; periksa pada mobile dan keyboard. Data berita resmi hanya boleh diisi dari sumber kelurahan, bukan otomatis dari gambar referensi.

## 7. Risiko/pekerjaan tertunda

Prompt 08 belum dimulai: `/berita` dan beranda masih memakai contoh desain berlabel; daftar/detail published frontend, SEO per artikel, sitemap dan cache invalidation menunggu instruksi selanjutnya. Jadwal publikasi opsional dan autosave otomatis tidak dibuat; simpan manual diperlukan. Belum ada duplikasi draft/published paralel. Metadata asset dibagi oleh seluruh referensinya; rollback isi berita tidak mengembalikan perubahan alt/caption asset. Tautan eksternal manual tidak menjadi FK media.

Tidak ada antivirus/sandbox detonation file, quota disk total/retensi otomatis atau purge fisik. PDF tervalidasi dapat mengandung fitur aktif: disajikan attachment dengan CSP, tetap memerlukan review manusia sebelum dipilih PUBLIC. Jangan gunakan modul ini untuk berkas warga/surat Tahap 02. Upload besar dapat menambah CPU/memori; batas dua job bukan bukti kapasitas VPS, load test belum dilakukan. Temp sisa setelah crash mesin perlu diperiksa operator. Media yang dibutuhkan revisi dipertahankan sehingga storage bertambah seiring riwayat. Monitoring kapasitas dan backup tetap diperlukan.

Tabel/fitur editor di luar whitelist tidak diaktifkan. Pustaka pilihan gambar membatasi 50 hasil dengan pencarian. UI akun umum/dashboard penuh dan permission tambahan LURAH tetap menunggu prompt/kesepakatan terkait. Dependency development memiliki temuan audit yang dicatat di atas; tidak dilakukan upgrade major Prisma/ESLint di luar scope. Belum deployment atau uji HTTPS produksi.

## 8. Status

**SIAP REVIEW Prompt 07.** Setelah commit/push ke origin/main, berhenti. Jangan mulai Prompt 08 tanpa instruksi pengguna.
