# Checkpoint KALOSARA — setelah Prompt 04

Tanggal: 16 Oktober 2026 (Asia/Makassar). Repo tunggal: `https://github.com/lowhanfish/kalosara`, branch `main`. Pengguna memilih satu repo untuk `frontend/` dan `backend/`, meskipun dokumen awal menyebut dua repo. Setiap prompt yang selesai harus diuji, di-commit, dan di-push sebelum berhenti untuk review. Jangan otomatis lanjut ke prompt berikutnya.

## Status implementasi

| Prompt | Status | Commit |
| --- | --- | --- |
| 01 — fondasi Next.js, Express, Prisma, Docker Compose, Nginx | Selesai dan di-push | `13e62d0` |
| 02 — skema akun, role, sesi, RBAC, provisioning staf | Selesai dan di-push | `9468293` |
| 03 — API auth berbasis cookie, rotasi refresh, logout, profil | Selesai dan di-push | `68007ad` |
| 04 — bootstrap auth frontend | Selesai; lihat commit terbaru `feat: bootstrap frontend cookie authentication` | commit Prompt 04 |

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

## Prompt 04 selesai — berhenti untuk review

Implementasi dan laporan lengkap tersedia di `frontend/docs/auth-bootstrap.md`. Jangan melanjutkan Prompt 05 tanpa instruksi pengguna. Spesifikasi acuan Prompt 04: PDF1 halaman 6 meminta HTTP client dengan timeout, `AbortSignal`, error standar dan `requestId`; bootstrap `GET /auth/me`; satu refresh lalu satu retry saat access 401; single-flight untuk 10 request paralel; cleanup Zustand dan TanStack Query saat refresh definitif invalid; pertahankan sesi pada gangguan jaringan/502/503; cache per pengguna; AuthProvider dan RouteGuard. Tampilkan diagram state `INITIALIZING`, `AUTHENTICATED`, `GUEST`, `TEMPORARY_ERROR`. Uji reload access expired, refresh revoked, error jaringan, 10 respons 401 paralel, dan isolasi cache pengguna A/B. Jangan membuat dashboard atau Prompt 05.

## Batasan yang diketahui

- `POST /auth/forgot-password` saat ini rate-limited tetapi selalu mengembalikan `503 RESET_UNAVAILABLE` tanpa membedakan email. Pengiriman email dan penyelesaian reset password belum dibuat.
- UI login/registrasi, CMS, berita, dan layanan surat belum dibuat. Backend tetap menjadi otoritas akses; RouteGuard frontend pada Prompt 04 hanya membantu UX.
- Dokumentasikan hasil prompt dengan format PDF: keputusan, file berubah, cara menjalankan, migrasi/env, lint/typecheck/test/build, uji manual, risiko/tertunda, dan status SIAP REVIEW atau BELUM SIAP. Push commit prompt yang selesai ke `origin/main` sesuai instruksi pengguna.

## Verifikasi Prompt 04

Frontend lint/typecheck/test (16 kasus)/build dan backend lint/typecheck/test (6 kasus)/build lulus. Kasus negatif mencakup expiry, revocation, jaringan/502/503, 10 request paralel (refresh sukses maupun gagal), batas retry, timeout/abort, isolasi A/B dan respons identitas lama. Build perlu cache Turbopack bersih di volume macOS dan izin socket worker; supertest perlu socket lokal. Uji manual browser lengkap belum dijalankan; langkah reviewer ada di dokumentasi frontend. Tidak ada migration/env/dependency baru.
