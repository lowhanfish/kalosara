# Panduan Instalasi KALOSARA

**Versi dokumentasi:** Tahap 01 sampai Prompt 14, 18 Oktober 2026.

**Sasaran:** pengembang dan operator teknis.

**Lingkup:** instalasi dan pengoperasian lokal. Deployment VPS ditunda sesuai keputusan pengguna.

KALOSARA adalah Kanal Layanan Online Surat dan Administrasi Rakyat untuk Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe. Tahap 01 menyediakan website publik, CMS, akun dan dashboard. Pengajuan surat belum diaktifkan.

Panduan penggunaan tersedia pada [Manual Aplikasi](MANUAL_APLIKASI.md).

## Daftar isi

1. [Arsitektur dan persyaratan](#1-arsitektur-dan-persyaratan)
2. [Menyiapkan repositori](#2-menyiapkan-repositori)
3. [Konfigurasi environment](#3-konfigurasi-environment)
4. [Menjalankan Redis](#4-menjalankan-redis)
5. [Instalasi backend dan database](#5-instalasi-backend-dan-database)
6. [Instalasi frontend](#6-instalasi-frontend)
7. [Menyiapkan akun petugas](#7-menyiapkan-akun-petugas)
8. [Pemeriksaan setelah instalasi](#8-pemeriksaan-setelah-instalasi)
9. [Build dan paket native](#9-build-dan-paket-native)
10. [Pengujian terisolasi](#10-pengujian-terisolasi)
11. [Upload, backup dan pembaruan](#11-upload-backup-dan-pembaruan)
12. [Penanganan kendala](#12-penanganan-kendala)
13. [Checklist serah terima lokal](#13-checklist-serah-terima-lokal)

## 1. Arsitektur dan persyaratan

| Komponen | Teknologi | Alamat lokal |
| --- | --- | --- |
| Frontend | Next.js App Router, React, TypeScript | `http://localhost:3001` |
| Backend | Express, Prisma, TypeScript | `http://localhost:4000` |
| Database utama | PostgreSQL Neon dari `DATABASE_URL` | Tidak menjalankan PostgreSQL Docker |
| Redis | Docker Compose, AOF | `127.0.0.1:6380` |

**Hanya Redis boleh menggunakan Docker.** Frontend/backend berjalan manual. Redis disiapkan sebagai infrastruktur; auth dan CMS saat ini belum bergantung padanya. Jangan menambahkan container aplikasi, PostgreSQL atau Nginx.

Persyaratan:

- Git.
- Node.js 24 LTS untuk pemeriksaan, build dan tooling operasi. Runtime backend minimal 22.12, tetapi tooling lint terbaru memerlukan versi lebih baru; gunakan Node 24 agar konsisten.
- npm yang menyertai Node dan pnpm **10.18.3**.
- Docker dengan Compose untuk Redis saja.
- Akses database Neon yang sah dan koneksi jaringan.
- Browser modern; Chrome dipakai dalam pengujian lokal.
- Untuk tes DB: PostgreSQL **native** disposable yang terpisah dari Neon.
- Untuk drill backup/restore: utility native `pg_dump`/`pg_restore` yang cocok dengan versi database.

Periksa versi tanpa menampilkan environment rahasia:

```bash
node --version
npm --version
pnpm --version
git --version
docker compose version
```

Jika pnpm belum tersedia, pasang versi yang ditetapkan proyek melalui pengelola paket Node yang dipakai operator, misalnya `npm install -g pnpm@10.18.3` pada instalasi Node milik pengguna.

## 2. Menyiapkan repositori

Untuk instalasi baru:

```bash
git clone https://github.com/lowhanfish/kalosara.git
cd kalosara
```

Untuk workspace yang sudah tersedia:

```bash
cd /Volumes/Kiken/Project/nextJs/kalosara
git status -sb
```

Baca [checkpoint](../CHECKPOINT.md) sebelum memperbarui instalasi lama. Jangan menimpa perubahan lokal, `.env` atau direktori upload. Port 3000 mungkin dipakai proyek lain; gunakan 3001 untuk KALOSARA.

Struktur utama:

```text
kalosara/
├── backend/        API, Prisma, validasi dan penyimpanan upload
├── frontend/       Website publik dan antarmuka pengelola/masyarakat
├── ops/            Paket native, rehearsal, backup dan panduan operator
├── docs/           Panduan instalasi dan manual aplikasi
├── compose.yaml    Redis saja
└── CHECKPOINT.md   Status dan batasan implementasi
```

## 3. Konfigurasi environment

### 3.1 Aturan untuk instalasi yang sudah berjalan

Jika `backend/.env` dan `frontend/.env.local` sudah dikonfigurasi, **gunakan file tersebut**. Jangan menggantinya dengan contoh, mencetak isinya ke terminal/chat, atau memasukkannya ke Git. Pastikan secret yang harus sama benar-benar cocok melalui editor/operator yang berwenang.

### 3.2 Instalasi baru saja

Salin contoh hanya jika file tujuan belum ada:

```bash
cd backend
test -e .env || cp .env.example .env
cd ../frontend
test -e .env.local || cp .env.example .env.local
cd ..
```

Buka kedua file menggunakan editor lokal. Contoh bawaan masih dapat memuat port 3000; **sesuaikan ke 3001** seperti tabel berikut. Jangan menjalankan contoh dengan placeholder yang belum diisi.

### 3.3 Backend — `backend/.env`

| Variabel | Nilai/kegunaan lokal |
| --- | --- |
| `NODE_ENV` | `development` |
| `PORT` | `4000` |
| `DATABASE_URL` | URL PostgreSQL Neon yang disediakan operator; pertahankan parameter TLS/koneksi yang diperlukan |
| `APP_ORIGIN` | `http://localhost:3001` |
| `FRONTEND_INTERNAL_URL` | `http://localhost:3001` |
| `UPLOAD_ROOT` | `public/uploads`, relatif terhadap folder backend |
| `LOG_LEVEL` | `info` |
| `PASSWORD_BCRYPT_COST` | `12`, rentang implementasi 12–14 |
| `AUTH_SIGNING_KEYS` | Format `kid:kunci-base64url`; setiap kunci minimal 32 byte acak |
| `CACHE_INVALIDATION_SECRET` | Secret acak minimal 32 karakter, sama dengan frontend |

Kunci autentikasi wajib untuk mode produksi. Development dapat memakai kunci sementara per proses jika tidak dikonfigurasi; restart kemudian dapat mengakhiri sesi lama. Untuk instalasi yang membutuhkan sesi stabil, operator mengisi kunci tetap secara aman. Jangan memakai kata sandi biasa sebagai kunci signing.

### 3.4 Frontend — `frontend/.env.local`

| Variabel | Nilai/kegunaan lokal |
| --- | --- |
| `API_INTERNAL_URL` | `http://localhost:4000` |
| `SITE_ORIGIN` | `http://localhost:3001` |
| `CACHE_INVALIDATION_SECRET` | Sama persis dengan backend; tanpa awalan `NEXT_PUBLIC_` |

Origin tidak memiliki path atau slash penutup. Gunakan hostname yang konsisten: jangan berganti dari `localhost` ke `127.0.0.1` pada browser tanpa menyesuaikan origin/cookie.

Buat secret melalui generator kriptografis/password manager operator, simpan langsung di file rahasia atau pengelola secret. Jangan menuliskannya sebagai argumen command, di history, contoh dokumentasi atau screenshot. URL database dan secret tidak boleh menjadi variabel `NEXT_PUBLIC_*`.

## 4. Menjalankan Redis

Dari root repositori:

```bash
docker compose up -d redis
docker compose ps redis
docker compose exec -T redis redis-cli ping
```

Respons pemeriksaan Redis yang diharapkan: `PONG`.

Konfigurasi proyek memakai port host 6380 karena 6379 dapat dipakai aplikasi lain. Jangan menghapus volume `redis_data` atau memakai `docker compose down -v` sebagai langkah troubleshooting rutin. Jika Redis sudah berjalan sehat, tidak perlu membuat ulang container.

## 5. Instalasi backend dan database

### 5.1 Memasang dependency

```bash
cd backend
npm ci
npm run db:generate
```

`npm ci` mengikuti lockfile. `db:generate` menghasilkan Prisma Client; perintah ini bukan reset database.

### 5.2 Memeriksa migrasi

```bash
npx prisma migrate status
```

Untuk instalasi database baru yang sudah diotorisasi, atau pembaruan dengan migrasi yang telah direview dan disetujui:

```bash
npm run db:deploy
```

**Jangan menjalankan perintah deploy migrasi secara otomatis pada Neon yang sudah dipakai tanpa review/izin yang sesuai.** Pada workspace yang didokumentasikan, migrasi sampai Prompt 12 telah diterapkan; Prompt 13–14 tidak menambah skema. Jangan memakai `migrate reset`, `db push`, `migrate dev`, seed atau tes mutasi sebagai cara memperbaiki Neon pengguna. Seed tidak diperlukan untuk menjalankan instalasi yang sudah memiliki data.

### 5.3 Menjalankan API

Tetap dari folder `backend`:

```bash
npm run dev
```

Biarkan terminal ini berjalan. Backend mendengarkan pada loopback port 4000. Jalankan dari folder yang benar agar dotenv dan path upload relatif ditemukan.

## 6. Instalasi frontend

Buka terminal lain:

```bash
cd /Volumes/Kiken/Project/nextJs/kalosara/frontend
pnpm install --frozen-lockfile
pnpm dev --port 3001
```

Pada hasil clone baru, sesuaikan path pertama ke lokasi folder `frontend` Anda. Buka **http://localhost:3001**. Frontend meneruskan request `/api/v1` ke backend; browser tidak perlu diberi URL database atau secret API.

Sesudah perubahan env, restart proses yang bersangkutan. Rewrite API dan beberapa konfigurasi Next dibekukan saat build; mode hasil build memerlukan build ulang setelah perubahan konfigurasi build.

## 7. Menyiapkan akun petugas

Registrasi publik selalu membuat akun **MASYARAKAT**. Akun admin/lurah dibuat melalui CLI oleh operator berwenang setelah identitas petugas diverifikasi. Tidak ada akun/password admin bawaan.

**Lewati langkah ini jika akun petugas sudah tersedia.** Menjalankan provisioning menambah akun dan audit pada database aktif; jangan menggunakannya sebagai smoke test Neon.

Variabel sementara yang diperlukan:

| Variabel | Ketentuan |
| --- | --- |
| `PROVISION_ROLE` | `ADMIN_KELURAHAN` atau `LURAH` |
| `PROVISION_EMAIL` | Email petugas yang sudah diverifikasi |
| `PROVISION_PASSWORD` | Minimal 12 karakter, maksimal 72 byte UTF-8 |
| `PROVISION_ACK_VERIFIED` | `true` hanya setelah verifikasi nyata |

Blok berikut khusus **Bash**, dijalankan dari folder backend tanpa menulis password ke command history. Jika shell Anda bukan Bash, masuk terlebih dahulu dengan mengetik `bash` dan menekan Enter, baru jalankan blok ini:

```bash
read -r -p "Email petugas: " PROVISION_EMAIL
read -r -s -p "Password awal: " PROVISION_PASSWORD
printf '\n'
export PROVISION_EMAIL PROVISION_PASSWORD
export PROVISION_ROLE=ADMIN_KELURAHAN
export PROVISION_ACK_VERIFIED=true
npm run staff:provision
unset PROVISION_EMAIL PROVISION_PASSWORD PROVISION_ROLE PROVISION_ACK_VERIFIED
```

Untuk akun lurah, ubah role ke `LURAH` sebelum menjalankan provisioning. Jangan membagikan password melalui kanal publik atau menyimpannya dalam dokumen ini. Password tidak boleh dimasukkan ke `.env.example` atau Git.

## 8. Pemeriksaan setelah instalasi

Jalankan pemeriksaan baca-saja:

```bash
curl -f http://localhost:4000/api/v1/health
curl -f http://localhost:4000/api/v1/ready
curl -f http://localhost:3001/api/v1/health
```

| Pemeriksaan | Hasil yang diharapkan |
| --- | --- |
| `/api/v1/health` | HTTP 200, status aplikasi dan uptime |
| `/api/v1/ready` | HTTP 200 bila database dapat dijangkau; 503 bila tidak siap |
| Health melalui frontend | HTTP 200, membuktikan proxy API berjalan |
| Beranda dan menu publik | Bisa dibuka, identitas/tampilan benar |
| `/admin` tanpa login | Form login; tidak menampilkan data admin |
| API admin/profil tanpa login | HTTP 401; ini hasil keamanan yang benar |
| Data resmi belum diisi | State kosong, bukan keharusan menjalankan seed |

Jangan membuat akun/artikel/upload contoh pada Neon untuk sekadar membuktikan instalasi. Uji yang mengubah data dilakukan di lingkungan terisolasi.

## 9. Build dan paket native

Pemeriksaan aplikasi:

```bash
cd backend
npm run lint
npm run typecheck
npm test
npm run build
cd ../frontend
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Jangan menjalankan dua server pada port yang sama. Hentikan proses development milik KALOSARA terlebih dahulu bila ingin menggantinya dengan hasil build.

Backend hasil build, dari folder backend:

```bash
npm start
```

Frontend standalone memerlukan `server.js`, traced dependency, `.next/static` dan `public` dalam satu paket yang benar. Gunakan proses pemaketan yang didokumentasikan pada [panduan operasi native](../ops/README.md); jangan hanya menyalin `server.js`. Paket produksi disiapkan untuk origin HTTPS; paket rehearsal khusus memakai origin localhost3002/API4002.

Build native harus sesuai OS, arsitektur dan library target, terutama Sharp/Prisma. Paket macOS bukan paket Linux. **VPS belum menjadi lingkup pekerjaan saat ini**; template systemd/Nginx/deploy di `ops/` adalah persiapan dan tidak perlu diaktifkan untuk penggunaan lokal.

## 10. Pengujian terisolasi

Tes unit/HTTP backend dan tes frontend dijalankan dengan perintah pada bagian sebelumnya. Tes integrasi DB **wajib** memakai `TEST_DATABASE_URL` eksplisit yang mengarah ke PostgreSQL native disposable:

- Host `localhost` atau `127.0.0.1`.
- Nama database `kalosara_*_test`.
- Tanpa query parameter.
- Terpisah dari Neon dan database pengguna.

Setelah operator menyiapkan variabel tersebut secara aman, jalankan dari backend:

```bash
npm run test:db
```

Runner menerapkan migrasi pada DB uji dan menggunakan upload sementara. Jangan mengganti URL uji dengan Neon atau menghapus guard. Tidak boleh memakai PostgreSQL Docker.

Dari root, guard operasi dapat diuji tanpa DB:

```bash
node --test ops/tests/*.test.mjs
```

Rehearsal lengkap menggunakan port 3002/4002, DB browser dan restore yang berbeda, Playwright, serta utility dump/restore native. Lihat [langkah rehearsal](../ops/README.md#pengujian-ulang-terisolasi). Script fixture/benchmark/restore bukan untuk dijalankan terhadap runtime utama. Data, key, credential dan proses QA harus dibersihkan setelah selesai.

## 11. Upload, backup dan pembaruan

File disimpan pada `backend/public/uploads/<asal>/<images|documents>/`; database menyimpan metadata/path/relasi. File lama dapat berada pada `legacy`. Folder bernama `public` **bukan izin** membuka semua file ke internet. Akses PUBLIC/PRIVATE tetap diperiksa API; jangan memasang static server pada seluruh folder tersebut.

Backup database dan seluruh upload harus berpasangan pada waktu yang konsisten. Backup DB saja tidak mencakup file, dan menyalin file saja tidak mencakup relasinya. Ketika membuat snapshot, hentikan mutasi/jobs sesuai prosedur operator; simpan backup terenkripsi dan key secara terpisah.

- [Kebijakan data dan backup](../backend/docs/data-backup-policy.md).
- [Backup terenkripsi dan restore uji](../ops/README.md#backup-offsite-dan-persiapan-migration).
- [Hasil rehearsal lokal](../ops/docs/prompt14-report.md).

Script restore sengaja hanya menerima DB uji lokal; bukan cara memulihkan Neon produksi. Jangan menghapus upload untuk memperbaiki error tampilan. Belum ada purge otomatis atau kuota total storage.

Untuk pembaruan:

1. Baca checkpoint, catat commit aktif dan pastikan perubahan lokal aman.
2. Siapkan backup yang sesuai sebelum perubahan persisten.
3. Ambil kode rilis yang direview; jangan menimpa `.env` dan upload.
4. Instal dependency sesuai lockfile, generate Prisma Client dan jalankan pemeriksaan.
5. Review status migrasi; terapkan hanya jika diperlukan dan telah diotorisasi.
6. Build/restart proses KALOSARA saja, lalu ulangi smoke baca-saja.

Monitoring lokal: dari backend, `npm run monitor -- PID_API PID_FRONTEND`. Gunakan PID proses KALOSARA yang benar; output berisi health, sumber daya dan alert. Pengukuran memori OS merupakan heuristik, bukan bukti OOM. Snapshot benchmark lokal bukan kapasitas VPS.

## 12. Penanganan kendala

| Gejala | Pemeriksaan/tindakan |
| --- | --- |
| Port 3001/4000 terpakai | Identifikasi proses pemiliknya; jangan menghentikan proyek lain. Hentikan hanya proses KALOSARA yang ingin diganti. |
| API ready 503 | Periksa koneksi jaringan, konfigurasi Neon/TLS dan status migrasi tanpa mencetak URL/credential. Jangan reset/seed. |
| Proxy API gagal | Pastikan API aktif di 4000, API_INTERNAL_URL benar, frontend direstart/dibuild ulang sesuai mode. |
| Login/mutasi 403 | Periksa APP_ORIGIN/SITE_ORIGIN, hostname browser dan cookie/CSRF. Jangan mematikan CSRF atau memperlebar CORS. |
| Login 429 | Tunggu jendela rate limit; jangan mengulang cepat. Saat ini kuota backend dibagi di belakang proxy lokal. |
| Cookie hilang setelah restart | Periksa kestabilan signing key development dan usia/pencabutan sesi; masuk ulang bila sesi sudah invalid. |
| Publikasi belum tercermin | Periksa status/tanggal konten, backend dan kecocokan HMAC secret. Notice invalidasi tertunda perlu ditangani, bukan mengarang data publik. |
| Upload gagal | Periksa JPG/PNG/WebP/PDF, maksimal 20 MiB, alt gambar dan kecocokan signature/MIME/ekstensi. |
| File privat 401/403/404 | Pastikan login sebagai pengunggah; admin lain tidak otomatis boleh membuka file privat. |
| Cache Turbopack rusak | Hentikan proses build/dev terkait. Jika error memang persistence cache, hapus hanya `.next/cache/turbopack` untuk build atau `.next/dev/cache/turbopack` untuk dev, lalu ulangi. Jangan menghapus DB/env/upload. |
| Typecheck/build gagal pada Node lama | Gunakan Node 24 dan dependency sesuai lockfile. |

Jangan membagikan `.env`, password, cookie, token, alamat pribadi atau dump database saat meminta bantuan. Catat langkah, waktu, rute, status HTTP dan requestId bila tersedia.

## 13. Checklist serah terima lokal

- [ ] Node/pnpm sesuai dan dependency lock terpasang.
- [ ] File env asli terlindungi; origin/URL/secret antaraplikasi cocok.
- [ ] Database utama Neon, bukan PostgreSQL Docker.
- [ ] Docker hanya Redis, port host 6380.
- [ ] Backend4000/frontend3001 aktif; health/ready/proxy sesuai.
- [ ] Upload tersimpan fisik dan akses privat tetap melalui API.
- [ ] Akun petugas sah tersedia tanpa akun bawaan/seed otomatis.
- [ ] Lint/typecheck/test/build lulus untuk versi yang dipakai.
- [ ] Tes mutasi dilakukan pada DB native terisolasi dan QA dibersihkan.
- [ ] Pengelola memahami batasan aplikasi dan prosedur backup.
- [ ] VPS ditunda; Tahap 02 belum diaktifkan.
