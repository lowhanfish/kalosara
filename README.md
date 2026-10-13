# KALOSARA — fondasi Tahap 01

KALOSARA (Kanal Layanan Online Surat dan Administrasi Rakyat) dimulai sebagai website kelurahan untuk satu kelurahan. Tahap 01 hanya mencakup website, CMS, dan akun; pengajuan surat dikerjakan pada Tahap 02. Dokumen acuan ada di `reff/`.

## Struktur

- `frontend/`: Next.js App Router, TypeScript strict, Tailwind CSS, fondasi shadcn/ui, TanStack Query, dan Zustand. Folder `app`, `components`, `features`, `hooks`, `lib`, `services`, dan `store` disiapkan untuk modul berikutnya.
- `backend/`: Express TypeScript, Prisma/PostgreSQL, Zod, dan Pino. Folder `modules`, `controllers`, `services`, `repositories`, `routes`, `middlewares`, `validators`, `config`, `lib`, dan `tests` disiapkan.
- `nginx/` dan `compose.yaml`: proxy, dua aplikasi, PostgreSQL, dan volume persisten.
- `backend/docs/auth-design.md`: relasi akun, aturan akses, lifecycle sesi, dan provisioning staf.

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
# Ganti POSTGRES_PASSWORD di .env
docker compose build
docker compose up -d db
docker compose run --rm migrate
docker compose up -d
```

Buka `http://localhost:8080`. Hanya proxy dipublikasikan; backend dan database tetap di jaringan Compose. `db_data` dan `uploads` adalah named volume. Konfigurasi ini menyediakan HTTP lokal; TLS/HTTPS dan domain produksi dikerjakan saat tahap deployment.

## Perintah pemeriksaan

```bash
cd backend && npm run lint && npm run typecheck && npm test && npm run build
cd frontend && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Migrasi pertama membuat `AppSetting`; migrasi kedua menambah akun, profil, sesi, token reset, dan audit. Seed development mengisi nama dummy `Kelurahan Contoh` tanpa akun staf. Provisioning admin/lurah dilakukan hanya melalui CLI terpisah, sesuai [rancangan identitas](backend/docs/auth-design.md). Jangan pakai data pribadi atau rahasia di seed maupun Git.

## Batasan tahap ini

Belum ada endpoint registrasi/login, berita, CMS, atau layanan surat. Skema akun dan RBAC tersedia sejak Prompt 02; endpoint autentikasi dibuat pada Prompt 03. Library frontend sudah terpasang; integrasi state management dimulai saat fitur antarmuka dibuat.
