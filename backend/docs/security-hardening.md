# Prompt 13 — Hardening, pengujian sistem dan observabilitas

Tanggal 18 Oktober 2026, Asia/Makassar. Baseline `e3aff03` di main, working tree awal bersih. Audit membaca CHECKPOINT, README, kedua PDF Tahap 01, frontend/AGENTS dan panduan Next.js 16.4 terpasang (headers, CSP, image, proxy body, authentication/data security). Scope hanya Prompt 13. Identitas Watundehoa/Puriala/Konawe, AMIRULAH, S.Si, desain navy/kuning, hero/potret/lambang dipertahankan. Tidak menjalankan deployment, CI/CD, load test Prompt 14 atau pelayanan Tahap 02.

## 1. Keputusan dan threat model

Aset: akun/profil minimum warga, password hash, cookie/sesi, kontak pending, media PRIVATE, konten resmi, audit dan backup. Pelaku: anonim, akun warga, petugas dengan izin terbatas, pemilik konten berbahaya, penyerang yang memalsukan header/query/file. Batas kepercayaan: browser → proxy lokal → API → Prisma/Neon dan storage disk. Server/operator yang sepenuhnya diretas berada di luar jaminan kontrol aplikasi.

| Ancaman | Mitigasi dan bukti |
| --- | --- |
| Auth bypass/broken access control | Cookie bertanda tangan + sesi DB/akun aktif/role terkini; tampered token, guest401, warga/lurah403, self/last-admin guards dan pencabutan sesi diuji. |
| IDOR | Profil mengambil ID dari sesi; field userId/role ditolak. PRIVATE hanya pengunggah, termasuk terhadap admin lain. Regresi account/CMS dan browser. |
| SQL/query injection | Parameter Prisma + Zod, tak ada interpolasi SQL dari input HTTP; payload SQL menjadi search literal, duplicate query/pagination rusak400. Nama DB pada fixture hanya allowlist lokal. |
| XSS editor/profil/SEO | Sanitizer allowlist dua lintasan, media internal PUBLIC, React escaping dan JSON-LD escape; payload script/iframe/SVG/URL encoding diuji. CSP membatasi sumber dan embedding. |
| CSRF | Origin persis + double-submit token acak/timing-safe; semua mutasi auth/CMS/account. Cookie HttpOnly/SameSite Strict, Secure saat APP_ORIGIN HTTPS. CORS tidak diperlukan untuk proxy same-origin, tidak ditambahkan. |
| Brute force/header spoof | Rate limit auth/upload; `trust proxy=false`, API bind127.0.0.1, forwarding palsu tidak mengganti key socket. Tes11 request berbeda X-Forwarded-For tetap429. |
| Upload/traversal/storage leak | 20MiB/file, satu file/request, dua job, signature/MIME/ekstensi/isi, gambar25MP re-encode, PDF valid attachment/sandbox; path allowlist/UUID dan akses DB. Batas tepat20MiB/+1byte, disguise, traversal, PRIVATE/antar-admin diuji ulang. |
| Open redirect/SSRF optimizer | Slug ketat, alias ke siteOrigin konfigurasi, return URL eksternal tidak dipakai, unit canonical dan browser hostile next. Optimizer menolak remote URL dan seluruh API termasuk file privat. |
| DoS/resource exhaustion | JSON100KiB, multipart Nginx21MiB, batas Multer/fields, socket timeout/64connections, pool3; optimizer concurrency1/cache128MiB/input25MP, Sharp concurrency1/cache16MiB. Tidak menyatakan kapasitas pengunjung tanpa load test. |
| Kebocoran log/cache | Auth/account/admin no-store sebelum parser/guard; log metode/status/requestId/durasi tanpa URL/header/body/IP mentah. Error internal hanya kode kejadian, serializer err tidak memuat pesan/stack DB. Log QA diperiksa terhadap email/password/alamat fixture. |

CSP frontend mempertahankan `unsafe-inline` untuk hydration statis/ISR dan style editor; `unsafe-eval` hanya development. Ini **bukan strict nonce CSP** dan tidak menggantikan sanitizer. Frame hanya OpenStreetMap setelah consent yang sudah ada; object/media/frame-ancestors diblokir. HTTPS HSTS hanya saat origin HTTPS, sehingga localhost HTTP tidak dipaksa upgrade. Helmet API memakai default policy; response PDF tetap sandbox/attachment.

Rate limit kini **berbagi kuota per socket proxy lokal**, bukan per-IP pengunjung: login10/15menit, daftar5/jam. Ini mencegah bypass forwarding tetapi berpotensi membatasi pengguna bersama. Sebelum akses publik, rancangan trusted edge yang menimpa forwarding dan limit per-IP/per-akun harus diuji; jangan mengubah trust proxy ke angka hop sembarangan. Store limit masih memori satu proses, reset saat restart, belum lintas instance. Hash IP audit pada jalur proxy sekarang merepresentasikan alamat proxy; bukan identitas unik pengunjung.

## 2. Struktur/file berubah

- `src/app.ts`: Helmet, private no-store awal, trust boundary, requestId/log aman dan uptime health.
- `src/server.ts`: loopback, timeout/keepalive/64connections; shutdown tetap drain/disconnect.
- `src/lib/prisma.ts`: runtime URL pool3, pool/connect timeout10detik tanpa mengedit DATABASE_URL.
- `src/lib/logger.ts`, `middlewares/error-handler.ts`, `modules/cms/cache-invalidation.ts`: minimisasi error/log.
- `modules/cms/media.ts`: CPU/cache Sharp, semua kebijakan upload lama dipertahankan.
- `frontend/next.config.ts`: headers/CSP/HSTS, powered-by off, cache RAM16MiB, optimizer allowlist/batas dan proxy buffer21MiB.
- `nginx/default.conf`: referensi opsional host manual3001/4000, body21MiB khusus upload/default1MiB, timeout dan forwarding overwrite. Tidak mengaktifkan Nginx/container baru.
- `compose.yaml`: tetap hanya Redis6380, rotasi json-file10MiB×3.
- `scripts/monitor.mjs`, `ops/kalosara.logrotate`: pemeriksaan operator baca-saja dan contoh rotasi log manual.
- `scripts/qa-fixture.mjs`, `frontend/scripts/security-e2e.mjs`, tests app/dashboard/security, runner DB: regresi reproducible/fixture disposable.
- Package/lock backend: Helmet8.1, Vitest5.0.5, typescript-eslint8.71, tipe Node22. Frontend tidak menambah dependency.
- README/CHECKPOINT/laporan ini dan kebijakan data/backup diperbarui.

## 3. Cara menjalankan dan mengulang pemeriksaan

Runtime pengguna tetap frontend manual3001/backend4000, DATABASE_URL Neon yang ada, Docker hanya Redis6380. Jangan menimpa env, reset/seed Neon atau menjalankan fixture/tes DB di sana. Tidak ada Docker PostgreSQL. Untuk tooling terbaru gunakan Node24 LTS atau Node22.13+; runtime API tetap minimum22.12 (eslint transitif terbaru memberi engine warning pada22.12). Build di mesin pengembang, bukan klaim lulus pada VPS2GB.

Backend: `npm ci`, `npm run db:generate`, `npm run lint && npm run typecheck && npm test && npm run build`. Frontend: `pnpm install --frozen-lockfile`, `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Jangan migrate deploy ke Neon untuk prompt ini.

Regresi DB: sediakan PostgreSQL **native** disposable localhost port55439, database `kalosara_prompt13_test`; set TEST_DATABASE_URL eksplisit via environment operator, kemudian `npm run test:db` dari backend. Runner menolak nonlokal/nama non-test/query dan memakai upload sementara. Sembilan migrasi diterapkan ke DB kosong uji; tidak ada schema baru. Tes race memakai satu observer terpisah dari pool aplikasi untuk mengamati dua request yang menunggu row lock; pool aplikasi tetap3.

Browser: database kedua `kalosara_prompt13_browser_test`, migrasi hanya ke DB itu dengan override DATABASE_URL proses. Jalankan `TEST_DATABASE_URL=... QA_FIXTURE_FILE=/tmp/kalosara-qa/fixture.json node scripts/qa-fixture.mjs` dari backend; direktori temp harus sudah ada. Guard fixture tidak membaca .env, hanya TEST_DATABASE_URL lokal disposable. File mode0600, kredensial acak, email example.invalid. QA API4002 memakai DB kedua, APP_ORIGIN/FRONTEND_INTERNAL_URL3002, UPLOAD_ROOT sementara dan secret QA terpisah. Build/start frontend3002 dengan API_INTERNAL_URL4002 dan SITE_ORIGIN3002. Jalankan `QA_FIXTURE_FILE=... PLAYWRIGHT_MODULE=... CHROME_PATH=... node frontend/scripts/security-e2e.mjs` dari root. Playwright memakai instalasi tooling yang tersedia; path modul/browser ditentukan operator. Script menolak origin selain localhost3002. Setelah selesai hentikan QA, buang seluruh DB/fixture/upload disposable, lalu build kembali env utama/proxy4000.

## 4. Migration dan env

**Tidak ada migration atau env wajib baru. Neon tidak dimigrasi, di-reset, di-seed atau dipakai tes mutasi.** DATABASE_URL/env utama tidak ditimpa/ditampilkan. Parameter connection_limit3/pool_timeout10/connect_timeout10 ditetapkan hanya pada URL runtime Prisma, mempertahankan parameter TLS/Neon lain; CLI migrasi tetap memakai URL operator. Tetap satu proses API dan satu frontend. Jangan menambah worker/API instance tanpa menghitung ulang total pool. Pooler Neon dapat dipakai sesuai konfigurasi operator; tidak mengganti hostname/credential.

`experimental.proxyClientMaxBodySize=21mb` adalah batas **buffer cloning Next**, bukan penolakan413 total transport. Batas file tetap Multer20MiB; fields/parts dibatasi. Referensi Nginx menerima21MiB (20MiB + overhead); JSON API100KiB dan webhook internal2KiB. Tidak ada static mount backend/public. Image optimizer hanya `/images/**` tanpa query, remotePatterns kosong, redirect0, kualitas75, ukuran terbatas, cache128MiB dan response20MiB; upload publik sudah punya WebP480/1200 sendiri dan memakai unoptimized. Optimizer tidak bisa mengambil API privat.

## 5. Hasil lint/typecheck/test/build dan temuan

| Pemeriksaan | Hasil akhir |
| --- | --- |
| Backend lint/typecheck/build | Lulus |
| Backend unit/HTTP | 35/35 |
| PostgreSQL native18.4,10suite | 52/52 |
| Frontend lint/typecheck/build produksi | Lulus; build akhir memakai env utama |
| Frontend unit/runtime | 36/36 |
| Browser Chrome hasil build QA | 6 kelompok kritis lulus; desktop/tablet/mobile360/768/1440, tanpa pageerror/CSP violation |
| SEO response sebelum JS | Draft404, published200, og:title/og:image/canonical di HTML server |
| Log data sensitif | Tidak mengandung email/password/alamat fixture |
| Smoke runtime utama | Health/ready/proxy200, admin/account anonim401/no-store |

Temuan diperbaiki: tidak ada Helmet/security headers; proxy hop dipercaya terlalu luas; error DB/path HTTP dapat membocorkan masukan; respons auth/guard tidak seluruhnya no-store; pool/optimizer/Sharp/connection tidak eksplisit; rotasi Redis belum dibatasi. Regresi baru membuktikan spoofed forwarding tidak menghindari429 dan injection/tampered token ditolak.

Kegagalan selama QA: sandbox menolak socket/shared-memory PostgreSQL sehingga dijalankan dengan izin lokal; cache Turbopack macOS korup dibersihkan hanya pada cache build/dev. Selector tes awal tidak cocok dengan tombol “Buat berita baru”; diperbaiki. Tes race awal menghabiskan pool karena observer memakai pool3 yang sedang diblokir; observer dipisah. Query bracket unknown pada parser Express sederhana diabaikan (tidak diinterpretasi sebagai operator), sehingga kasus negatif diperjelas menjadi parameter search berulang yang ditolak400. Semua pemeriksaan akhir diulang sesuai perubahan.

Audit dependency backend awal16 (2critical/13high/1moderate) menjadi **4high/0critical/0moderate**, terkait Prisma6.19 CLI/config dan transitif deepmerge-ts/effect. `npm audit --omit=dev` juga menghitung empat ini karena Prisma adalah optional peer dari @prisma/client; jangan melaporkan runtime0 hanya berdasarkan label dev. Tidak ada endpoint yang menerima graph objek/tooling RPC dari pengunjung untuk paket tersebut. Rekomendasi otomatis audit meminta Prisma7 (perubahan besar client/config); migrasi mayor tidak dipaksakan dalam prompt ini. Frontend audit **1high braces3.0.3** dalam eslint-config-next→fast-glob, versi registry terbaru masih3.0.3; `pnpm update braces --depth20` tidak menyediakan perbaikan. Tidak memproses glob dari pengguna publik. Advisory tetap temuan terbuka, bukan klaim aman sempurna.

## 6. Manual review dan observabilitas

Buka3001: homepage/hero/logo, berita/daftar dan akun masyarakat; admin anonim tidak boleh memperoleh data. Gunakan akun uji hanya pada QA untuk login, profil/reload/logout dan CMS draft/publish. Pemeriksaan360/768/1440, screenshot artikel desktop dan CMS360 telah diperiksa visual tanpa perubahan desain/overflow. Uji PDF tepat20MiB/+1byte, disguise, PRIVATE lintas-admin, draft/expired, auth/session/IDOR termasuk regresi DB lengkap.

`cd backend && npm run monitor -- PID_API PID_FRONTEND` memberi satu JSON host load1/5/15, persentase memori/disk, disk bebas, CPU/RSS proses, health/ready/frontend status+latensi dan alerts, exit1 bila ambang terlewati. Tidak membuka endpoint metrics publik atau mencetak env/command line proses. Monitor per menit melalui operator; tiga kegagalan berurutan health/ready atau latensi>2detik membutuhkan investigasi. Disk>=80%warning/90%urgent, memori>=85%warning/95%urgent, load1 di atas jumlah CPU membutuhkan investigasi. Persentase memori OS adalah heuristik (cache/reclaimable macOS/Linux berbeda), bukan diagnosis OOM. Pantau RSS nyata, swap dan memory pressure. Snapshot mesin pengembang menunjukkan alert disk97%/memori99%; tidak dipakai sebagai bukti kapasitas VPS atau alasan menghapus data pengguna.

Pino stdout JSON berisi waktu/level/PID, requestId UUID server, metode/status/durasi. Gunakan requestId UI untuk korelasi audit. Health hanya status/uptime, ready hanya SELECT1/status503 generik. Tidak ada hostname DB/query/credential pada health. Jangan mencetak body/header/query/raw IP atau memperluas err serializer untuk debugging produksi. Log manual arahkan ke direktori operator0600/0640 dengan contoh `ops/kalosara.logrotate`: harian/max10MiB,7arsip terkompresi. Copytruncate memiliki jendela kehilangan baris kecil; gunakan journald terbatas jika pengelola memilih supervisor. Contoh rotasi belum dipasang di host. Compose hanya Redis memakai json-file10MiB×3; belum direcreate untuk menghindari gangguan Redis.

## 7. Risiko dan pekerjaan tertunda

Lihat `data-backup-policy.md`: minimisasi data, hak akses, backup DB+upload berpasangan, offsite terenkripsi, usulan retensi, pemulihan terisolasi dan penanganan insiden. Ini rancangan untuk disahkan instansi, bukan bukti kepatuhan atau backup produksi telah berjalan.

Belum diuji/diaktifkan: TLS/HSTS domain publik, executable Nginx (tidak terpasang; konfigurasi diperiksa statis), rotasi log host/Redis sesudah recreate, backup offsite/restore produksi, load test/VPS2GB, DAST eksternal penuh/penetration test, antivirus/quota total media, MFA/reset email, strict nonce CSP, edge/per-account distributed limiter, final keputusan retensi/hukum instansi. Kuota total tetap “belum tersedia”, PRIVATE tidak otomatis PUBLIC, arsip konten bukan pencabutan URL media PUBLIC. Test report tidak menyatakan keamanan sempurna atau kesiapan deployment.

## 8. Status

**SIAP REVIEW Prompt 13 untuk kode dan pengujian lokal, dengan temuan dependency/operasi di atas tetap terbuka.** Commit/push origin/main kemudian berhenti. Prompt14/Tahap02 tidak dimulai. Runtime utama manual3001/4000 dipertahankan; QA3002/4002, PostgreSQL native55439 dan data/kredensial/upload sementara dibersihkan sesudah pemeriksaan. Tidak ada mutasi data pengguna Neon.
