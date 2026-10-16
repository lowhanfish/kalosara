# Checkpoint KALOSARA — setelah Prompt 05

Tanggal: 16 Oktober 2026 (Asia/Makassar). Repo tunggal: `https://github.com/lowhanfish/kalosara`, branch `main`. Pengguna memilih satu repo untuk `frontend/` dan `backend/`, meskipun dokumen awal menyebut dua repo. Setiap prompt yang selesai harus diuji, di-commit, dan di-push sebelum berhenti untuk review. Jangan otomatis lanjut ke prompt berikutnya.

## Status implementasi

| Prompt | Status | Commit |
| --- | --- | --- |
| 01 — fondasi Next.js, Express, Prisma, Docker Compose, Nginx | Selesai dan di-push | `13e62d0` |
| 02 — skema akun, role, sesi, RBAC, provisioning staf | Selesai dan di-push | `9468293` |
| 03 — API auth berbasis cookie, rotasi refresh, logout, profil | Selesai dan di-push | `68007ad` |
| 04 — bootstrap auth frontend | Selesai dan di-push | `8b05260` |
| 05 — design system dan layout publik | Selesai; lihat commit `feat: add responsive public portal and design system` | commit Prompt 05 |

Sumber kebutuhan adalah `reff/KALOSARA_PDF1_Prompt_Website_Tahap_01.pdf` (prompt berurutan) dan `reff/KALOSARA_PDF2_Buku_Petunjuk_Website_Tahap_01.pdf`. Dokumen Tahap 02 ada di `reff/`, tetapi pekerjaan belum mencapai tahap itu.

## Kondisi kode

- `frontend/`: Next.js App Router dengan TypeScript strict, Tailwind, shadcn/ui dasar, TanStack Query, dan Zustand terpasang. Bootstrap sesi, AuthProvider, RouteGuard, HTTP client, store auth minimal dan query cache tersedia. UI login belum dibuat. **Sebelum mengubah frontend, baca `frontend/AGENTS.md` dan dokumentasi Next yang dirujuk di sana.**
- `backend/`: Express, Prisma/PostgreSQL, Zod, Pino. Model akun dan sesi sudah bermigrasi. API auth ada di `/api/v1/auth`; daftar endpoint, contoh request, dan error ada di `backend/docs/auth-api.md`. Lifecycle, RBAC, cookie, dan key rotation ada di `backend/docs/auth-design.md`.
- `compose.yaml`: proxy Nginx, frontend, backend, PostgreSQL, serta volume database dan upload. Hanya proxy dipublikasikan. File `.env` berisi rahasia lokal dan tidak boleh di-commit.
- Tidak ada migrasi baru pada Prompt 03. Migrasi terakhir: `backend/prisma/migrations/20261013010000_accounts_and_sessions/`.

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
- UI login/registrasi, CMS, berita, dan layanan surat belum dibuat. Backend tetap menjadi otoritas akses; RouteGuard frontend pada Prompt 04 hanya membantu UX.
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
