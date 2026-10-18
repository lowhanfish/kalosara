# Prompt 14 — paket rilis native dan serah terima Tahap 01

Tanggal 18 Oktober 2026 (Asia/Makassar), baseline `6a437cf`, main/working tree awal bersih. Acuan kedua PDF Tahap 01, README/CHECKPOINT, frontend/AGENTS dan panduan Next 16.4 terpasang (self-hosting/standalone/output) dibaca. Persetujuan pengguna melanjutkan sisa Tahap 01 disertai penegasan **hanya Redis boleh menggunakan Docker**. Scope PDF diadaptasi ke rilis native; tidak menghidupkan kembali Docker aplikasi/PostgreSQL/Nginx. Tahap 02 tidak disentuh.

## 1. Ringkasan keputusan

Rilis frontend standalone dan Express compiled JS dipaketkan di mesin build/CI, tanpa env/upload/seed/compiler/dev tools backend. Pool Prisma 3, timeout, batas20MiB, identitas Watundehoa/Puriala/Konawe, AMIRULAH,S.Si, desain/hero/potret/lambang tetap. Neon DATABASE_URL/env pengguna tidak diubah/ditampilkan; semua mutasi QA pada PostgreSQL native disposable.

Paket menyertakan manifest commit/platform/Node/SHA256 dan guard symlink/secret. Prisma CLI/TypeScript yang sempat terbawa optional peer npm dibersihkan memakai closure dependency runtime dari lockfile, sambil mempertahankan binary Sharp dan generated Prisma client sesuai build platform. Artefak216MiB pada pengujian macOS ini tidak dipakai sebagai rilis Linux.

Deployment operator memakai SHA40hex, receipt backup offsite terverifikasi dan konfirmasi review migrasi/schema, switch current atomik, start/health dan fallback aplikasi sebelumnya. Tidak ada deploy/migration otomatis dari CI atau saat boot. HTTPS host Nginx dan unit systemd dipersiapkan sebagai konfigurasi, bukan diklaim sudah terpasang pada VPS.

## 2. File/struktur berubah

- `.github/workflows/native-release.yml`: checks push/PR; dispatch origin HTTPS untuk artefak pinned commit+checksum, action SHA, dependency lock, Node 24/pnpm10, native DB regression/rehearsal dan evidence audit. Tanpa Docker PostgreSQL/SSH/production secrets.
- `ops/package-release.mjs`, `verify-release.mjs`, `lib/release.mjs`, `lib/runtime-deps.mjs`: pemaketan/closure/manifest/verification.
- `ops/deploy.mjs`, `systemd/*.service`, `nginx-production.conf`, `*.env.example`: aktivasi native, guard/fallback, loopback, resource budgets, host TLS/proxy dan field konfigurasi tanpa credential.
- `ops/backup.mjs`, `restore-test.mjs`, `lib/backup.mjs`: satu set custom dump+upload+manifest, SHA file chunk1MiB, AES256GCM, key0600, remote TLS/channel binding, restore hanya local disposable, verifikasi tag/path/link/checksum.
- `ops/load-test.mjs`, `qa-run.mjs`, `tests/release.test.mjs`, `tests/proxy-tls.mjs`: guard operasi, browser dari artefak produksi, load terbatas/CPU/RSS/koneksi, backup/restore/visibilitas media dan TLS/cap proxy terisolasi.
- `ops/README.md`, laporan ini dan `local-rehearsal.json`, README/CHECKPOINT/.gitignore: handoff, prosedur, bukti dan batas penerimaan.

Tidak mengubah source aplikasi/Prisma schema/asset desain, dependency/lock aplikasi atau compose Redis.

## 3. Cara menjalankan

Panduan lengkap `ops/README.md`. Runtime pengguna tetap manual3001/4000, Neon dan Redis Docker6380 saja. Build di luar VPS: `npm ci`/Prisma generate/lint/typecheck/test/build backend dan `pnpm install --frozen-lockfile`/lint/typecheck/test/build frontend. Pakai Node 24 LTS. Artefak production memerlukan SITE_ORIGIN HTTPS nyata/API_INTERNAL_URL loopback4000 pada build; Next rewrite/header dibekukan saat build. Jangan mempromosikan build QA localhost3002 menjadi produksi.

Command operator setelah provision/backup offsite/migration review: `sudo MIGRATIONS_REVIEWED_COMMIT=<sha> ROLLBACK_SCHEMA_COMPATIBLE=1 BACKUP_RECEIPT_FILE=<receipt-terverifikasi> /usr/bin/node ops/deploy.mjs /srv/kalosara/releases/<sha>`. Nilai pada command adalah metadata/path, bukan password/URL DB. Verifikasi tar+manifest melalui channel CI terpercaya, origin, platform, Node dan secret file terlebih dahulu. Runtime cache Next membuat direktori aktif mutable; verification ditujukan pada arsip fresh. Rollback direncanakan harus mengekstrak ulang arsip lama terverifikasi, tanpa menurunkan schema/menghapus upload.

Rehearsal lokal memakai native PostgreSQL 18.4 di55439, DB regresi/browser/restore terpisah. pg_dump/pg_restore18.4 dan Nginx 1.28.0 **hanya utility sementara pengujian** dibangun dari sumber resmi ke `/tmp`; bukan instalasi host/versi produksi yang direkomendasikan. Gunakan software patched yang didukung saat provisioning target. `ops/qa-run.mjs` memulai paket3002/4002 dengan credential acak/test data example.invalid dan secret/upload terisolasi, berhenti sebelum snapshot, lalu restore ke DB baru. `ops/tests/proxy-tls.mjs` menggunakan upstream mock4101/4103 dan port3080/3443, dengan cert lokal SANlocalhost yang dipercaya eksplisit; tidak meneruskan request ke runtime utama.

## 4. Migration/env/infrastruktur

Tidak ada migration/env aplikasi wajib baru, reset/seed atau mutasi data Neon. Field ops hanya template terpisah. Native deploy mengharuskan UPLOAD_ROOT shared absolute, SITE_ORIGIN/APP_ORIGIN sama HTTPS, frontend bind127.0.0.1:3001 dan backend4000 loopback, HMAC secret sama. Prisma migrate status/deploy dilakukan terpisah/terkendali dengan tooling tepercaya, tidak dibawa dalam runtime dan tidak dijalankan oleh script deployment. Skema harus kompatibel rollback sebelum operator menyatakan ROLLBACK_SCHEMA_COMPATIBLE.

Budget awal systemd: heap384/512MiB, MemoryMax512/768MiB API/frontend, CPUQuota80% per servis. Ini konfigurasi awal untuk target1 CPU/2 GB, **belum benchmark pada VPS**. Neon meniadakan kebutuhan tuning PostgreSQL lokal produksi; pool aplikasi tetap3 dan timeout10detik. Native PostgreSQL hanya untuk tes. Docker/Redis/proses proyek lain tidak dioperasikan.

Backup memakai BACKUP_DATABASE_URL eksplisit, tanpa fallback ke .env/DATABASE_URL. Key32byte mode0600; AES256GCM/tag, plaintext temp private dan dibersihkan normal/finally (crash tetap risiko). MAINTENANCE_CONFIRMED adalah konfirmasi operator, bukan lock mutasi otomatis. Receipt default offsiteVerifiedfalse; operator harus memverifikasi transfer/remote checksum dan restore sebelum attestation true/approvedForCommit target. Belum transfer offsite nyata. Restore script hanya DB localhost `kalosara_*_test`, tanpa query/--clean dan upload temp baru; produksi tidak dapat dipulihkan dengan script uji ini.

## 5. Hasil lint/typecheck/test/build dan report

| Pemeriksaan | Hasil |
| --- | --- |
| Backend lint/typecheck/unit/build | Lulus;35 tes |
| Frontend lint/typecheck/unit/build | Lulus;36 tes; build akhir env utama |
| Native DB regression | 52/52,10 suite,9 migrasi pada DB baru |
| Guard release/backup/runtime closure/deploy | 4/4 tes |
| Artefak compiled API+standalone | Lulus browser6 kelompok, bukan hanya source dev |
| Nginx config/TLS lokal/proxy | 6 pemeriksaan lulus |
| Backup/restore | AES-GCM roundtrip ke DB lain, tampered archive ditolak,4 file asli/varian, PRIVATE404anonim/pemilik200 dan PUBLIC200 lulus |
| Hosted CI/remote deploy/systemd target | Belum dijalankan/dikonfirmasi |
| HTTPS domain publik/offsite aktual | Belum tersedia; tidak diklaim lulus |

Bukti final: `local-rehearsal.json`, macOS arm64 (Apple M2, 8 logical CPU, RAM 8 GiB), Node 24.19, Chrome, DB native lokal. Pengukuran load warm cache GET bergantian `/`, `/berita`, `/api/v1/public/news`, `/api/v1/ready`: **500 request,concurrency 4,pause100 ms/worker,15,25detik,500×200,0error; p50=19,32ms,p95=31,95ms,p99=34,33ms**. Pause di luar latency request. CPU/RSS17 sampel per proses; API peak168,19MiB/23%, frontend279,52MiB/40,5%. `ps` CPU adalah snapshot/average proses, bukan profiling interval/CPU cgroup1 core. Maksimum4 koneksi termasuk1 observer; pool aplikasi tetap3. Tidak mengukur kapasitas VPS, trafik uncached/besar, login banyak akun atau upload berat bersamaan. Dump+restore fixture kecil0,27detik termasuk verifikasi/tamper test, bukan RTO produksi; offsitefalse.

Perbaikan QA: optional peer Prisma/TypeScript ditemukan dalam paket dan dibuang melalui closure lock; artefak kemudian benar-benar menjalankan Sharp/Prisma/HTTP/browser. Build pg_dump awal perlu generated headers, lalu client native berhasil. Guard fixture `/tmp` sempat menolak tmpdir macOS di `/var/folders`, runner diperbaiki memakai `/tmp/kalosara-*` secara eksplisit. Semua stage akhir lulus; tidak melemahkan guard agar bisa memakai Neon. Tidak ada perubahan source aplikasi yang memerlukan migrasi atau skenario baru di Tahap 02.

Temuan dependency Prompt 13 tetap tercatat (4high terkait Prisma CLI/config/optional peer pada tooling source;1high braces frontend lint tooling); runtime release backend membuang CLI/compiler, tetapi tidak mengklaim seluruh artefak bebas vulnerability tanpa audit/SBOM tersendiri. CSP unsafe-inline, shared login limiter proxy, kuota total media belum tersedia dan verifikasi kontak manual tetap batasan. Workflow menampilkan audit evidence, tidak menyatakan zero finding.

## 6. Manual testing dan operasi

Browser artefak: hero/header360/768/1440, optimizer/private/remote ditolak, guest401/no-store, warga login/edit/reload/escaping/IDOR/RBAC/logout/hostile next, admin kategori/draft404/publish/SEO HTML sebelum JS, CMS360 tanpa overflow/pageerror/CSP violation. Regresi52DB termasukPRIVATEantar-admin,20MiB/+1byte/disguise/traversal/draft/expiry/session/race. Screenshot artikel desktop dan CMS seluler diperiksa.

Proxy native: `nginx -t`; TLS lokal dipercaya explicit CA; webhook internal404; redirect308 ke domain tetap walauHostattacker; body umum1MiB+1→413; upload20MiB+8192→200 dan21MiB+1→413 terhadap upstream mock. Uji ini menegakkan konfigurasi cap/proxy, bukan pengganti validasi Multer atau sertifikat domain publik. Script tidak memakai insecure TLS bypass.

Operator harus menguji systemd resource/permissions/restart/reboot/failed-start rollback, Nginx patched target/cert renew/firewall, private storage dan RPO/RTO/offsite pada staging/VPS. Monitor/log rotation/kebijakan data mengacu Prompt 13. Jangan menjalankan load/fixture/restore pada Neon pengguna. Cleanup QA menghentikan hanya proses yang dibuat, menghapus credential/key/upload/DB disposable dan tool source sementara setelah bukti disimpan. Build akhir dikembalikan ke API4000/origin3001 dan runtime utama tetap manual.

## 7. Risiko/pekerjaan tertunda

**Pengguna menetapkan deployment VPS ditunda dan pematangan dilakukan di lokal dahulu.** Karena itu provisioning/deploy remote, sertifikat publik, firewall eksternal, Linux/systemd rollback rehearsal, CI hosted terkonfirmasi dan restore offsite bukan klaim hasil lokal; konfigurasi yang disediakan merupakan persiapan untuk tahap operasional nanti. GitHub CLI lokal tidak mempunyai sesi login; workflow disiapkan di repo, bukan diklaim telah lulus di GitHub. Linux artefak harus dibangun/diperiksa pada runner yang cocok dan workflow benar-benar hijau sebelum digunakan.

Rollout memiliki downtime singkat karena satu proses/port tetap; tidak menjanjikan zero downtime. Rollback aplikasi tidak membalik database. Receipt hanyalah attestation operator, bukan bukti offsite otomatis; jangan memalsukannya. Script backup perlu disk cukup untuk snapshot sementara dan maintenance nyata. Arsip aktif yang cache-nya sudah berubah harus direkonstruksi dari tar tepercaya untuk verification ulang. Private data backup tetap memerlukan operator terotorisasi/kunci terpisah/retensi disahkan. Shared rate limit di proxy dan lima temuan advisory tooling masih perlu keputusan sebelum peluncuran publik. Tidak menjanjikan kapasitas pengunjung dari benchmark lokal kecil.

## 8. Status dan handoff

**SIAP REVIEW paket native dan hasil pengujian lokal Prompt 14 sesuai lingkup terbaru pengguna.** Deployment VPS sengaja ditunda, bukan diminta sebagai persyaratan penyelesaian pekerjaan lokal. Seluruh paket/checks/rehearsal lokal telah dibuat dan diuji; commit/push origin/main lalu berhenti untuk review. Kesiapan produksi baru dinyatakan setelah gate operasional nanti benar-benar diuji. Tidak mengubah Docker selain mempertahankan hanya Redis; tidak menyentuh Tahap 02.

Handoff fondasi: auth cookie/refresh dan tiga role, CMS published/draft/SEO, media PUBLIC/PRIVATE/pipeline fisik dan dashboard/profil warga tersedia. Tidak menambah master layanan, form builder, pengajuan/berkas warga, alur persetujuan surat, template, QR penerbitan atau queue. Checklist antartahap hanya dokumentasi kesiapan integrasi yang sudah ada.
