# KALOSARA — fondasi Tahap 01

KALOSARA (Kanal Layanan Online Surat dan Administrasi Rakyat) dimulai sebagai website kelurahan untuk satu kelurahan. Tahap 01 hanya mencakup website, CMS, dan akun; pengajuan surat dikerjakan pada Tahap 02. Dokumen acuan ada di `reff/`.

Untuk melanjutkan pekerjaan di sesi baru, mulai dari [CHECKPOINT.md](CHECKPOINT.md).

## Struktur

- `frontend/`: Next.js App Router, TypeScript strict, Tailwind CSS, fondasi shadcn/ui, TanStack Query, dan Zustand. Folder `app`, `components`, `features`, `hooks`, `lib`, `services`, dan `store` disiapkan untuk modul berikutnya.
- `backend/`: Express TypeScript, Prisma/PostgreSQL, Zod, dan Pino. Folder `modules`, `controllers`, `services`, `repositories`, `routes`, `middlewares`, `validators`, `config`, `lib`, dan `tests` disiapkan.
- `nginx/` dan `compose.yaml`: proxy, dua aplikasi, PostgreSQL, dan volume persisten.
- `backend/docs/auth-design.md`: relasi akun, aturan akses, lifecycle sesi, dan provisioning staf.
- `backend/docs/auth-api.md`: tabel endpoint autentikasi, contoh payload, dan error.

Frontend dan backend berada dalam satu repo Git `kalosara`. Keduanya tetap aplikasi independen yang berkomunikasi melalui API.

## Jalankan tanpa Docker

Butuh Node.js 20.19+, pnpm 10, dan PostgreSQL 17. Buat database `kalosara` dan user lokal sesuai `DATABASE_URL`.

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

## Jalankan dengan Docker Compose

```bash
cp .env.example .env
# Isi POSTGRES_PASSWORD dan AUTH_SIGNING_KEYS di .env; sesuaikan APP_ORIGIN
docker compose build
docker compose up -d db
docker compose run --rm migrate
docker compose up -d
```

Sebelum menjalankan backend produksi, isi `AUTH_SIGNING_KEYS` pada `.env` dengan kunci acak minimal 32 byte dalam format `v1:<base64url-key>`. Atur `APP_ORIGIN` ke origin browser yang sebenarnya (HTTPS di produksi, tanpa slash penutup). Petunjuk endpoint dan CSRF ada di [dokumentasi API](backend/docs/auth-api.md).

Buka `http://localhost:8080`. Hanya proxy dipublikasikan; backend dan database tetap di jaringan Compose. `db_data` dan `uploads` adalah named volume. Konfigurasi ini menyediakan HTTP lokal; TLS/HTTPS dan domain produksi dikerjakan saat tahap deployment.

## Perintah pemeriksaan

```bash
cd backend && npm run lint && npm run typecheck && npm test && npm run build
cd frontend && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Migrasi pertama membuat `AppSetting`; migrasi kedua menambah akun, profil, sesi, token reset, dan audit. Seed development mengisi nama dummy `Kelurahan Contoh` tanpa akun staf. Provisioning admin/lurah dilakukan hanya melalui CLI terpisah, sesuai [rancangan identitas](backend/docs/auth-design.md). Jangan pakai data pribadi atau rahasia di seed maupun Git.

## Batasan tahap ini

Endpoint autentikasi dasar tersedia sejak Prompt 03. Pengiriman dan penyelesaian reset password, antarmuka login, berita, CMS, dan layanan surat belum dibuat. Bootstrap autentikasi frontend tersedia sejak Prompt 04; lihat [rancangan, diagram state, pengujian dan kontrak pemakaian](frontend/docs/auth-bootstrap.md). UI login dan dashboard belum dibuat.
