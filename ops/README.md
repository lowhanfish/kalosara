# Rilis native KALOSARA — Prompt 14

Hanya Redis boleh memakai Docker. Frontend standalone dan Express compiled JS berjalan sebagai proses Node, database tetap Neon, proxy Nginx di host. `compose.yaml` tidak menambah aplikasi/PostgreSQL/proxy. Desain dan seluruh fitur website tetap seperti Prompt13; tidak membuat modul Tahap02.

**Status: SIAP REVIEW untuk pengembangan dan rehearsal lokal.** Pengguna menetapkan bahwa deployment VPS belum diperlukan dan pekerjaan dimatangkan di lokal dahulu. Konfigurasi host/offsite hanya persiapan untuk nanti; tidak perlu meminta domain/SSH untuk menutup lingkup lokal ini. HTTPS publik, deployment remote, restore offsite, CI hosted dan kapasitas VPS tidak diklaim terverifikasi. Laporan rinci: `docs/prompt14-report.md`.

## Isi paket dan build CI

`.github/workflows/native-release.yml` menjalankan lint/typecheck/test/build kedua aplikasi, guard operasi, regresi PostgreSQL native, browser pada artefak standalone, load baca terbatas dan drill backup terenkripsi. Tidak ada PostgreSQL Docker. Workflow menggunakan action SHA terverifikasi dan Node24.19/pnpm10.18.3. Push/PR hanya pemeriksaan; **workflow_dispatch** menerima `site_origin` HTTPS dan menghasilkan arsip native+checksum sesuai commit, tanpa SSH/deploy otomatis. Workflow harus benar-benar sukses sebelum artefaknya dipakai. Jangan memasukkan secret produksi ke job build.

`node ops/package-release.mjs OUTPUT_BARU` setelah build, dengan SITE_ORIGIN/API_INTERNAL_URL yang sama seperti build, membuat:

- Backend `dist`, dependency runtime dari lock, generated Prisma client/engine sesuai platform, schema/migration tanpa seed. Prisma CLI/TypeScript/linter/test runner tidak disertakan, termasuk optional peers yang npm sempat memasukkan.
- Frontend `server.js` standalone, traced dependencies, `.next/static`, dan `public`.
- `release.json`: commit40hex, origin, Node major/platform/arsitektur, SHA256/ukuran setiap file dan target symlink. Secret/env/upload/cache/Git tidak disalin. Symlink keluar root dan known configured secret dalam JS/JSON/HTML ditolak.

Jalankan `node ops/verify-release.mjs RELEASE_DIR` **sebelum pertama kali menjalankan paket**. Gunakan artefak Linux yang dibangun pada runner cocok dengan arsitektur/libc/OpenSSL VPS; artefak pengujian macOS arm64 bukan rilis Linux. Pin checksum tar melalui channel CI terpercaya dan commit, bukan `latest`; manifest checksum bukan tanda tangan yang melindungi dari penggantian seluruh manifest oleh penyerang. Operator harus memverifikasi asal artifact dan akses pemilik direktori. Uji ulang di staging platform target sebelum produksi.

Next dapat mengubah cache/halaman ISR di `.next` saat berjalan. Verifikasi checksum lengkap ditujukan untuk salinan **fresh dari arsip CI**; jangan memaketkan ulang direktori runtime yang sudah digunakan. Untuk rollback yang bisa diverifikasi, ekstrak lagi arsip rilis lama yang checksum-nya sudah dipercaya saat servis berhenti. Jangan menghapus shared uploads atau mengembalikan database hanya untuk mengganti aplikasi.

## Provision host (belum dijalankan)

1. Siapkan OS Linux yang masih didukung, Node24 yang dipatch (`/usr/bin/node` pada contoh unit), Nginx yang dipatch, client pg_dump/pg_restore cocok versi PostgreSQL Neon, sertifikat ACME untuk domain nyata, dan akun `kalosara` tanpa login istimewa. Tidak memasang server PostgreSQL lokal produksi. User/host/domain/firewall belum diubah sesi ini.
2. Direktori root `/srv/kalosara/releases/<commit40hex>` dimiliki operator, tidak writable oleh aplikasi. Shared upload `/srv/kalosara/shared/uploads` dimiliki user layanan mode0700, file0600. Cache runtime frontend `.next` perlu writable oleh layanan; kode backend dan manifest tetap read-only. Current adalah symlink yang dikelola operator. Rahasia di `/etc/kalosara/{backend,frontend}.env` mode0600 root; contoh field di `ops/*.env.example` bukan kredensial nyata. Systemd membaca EnvironmentFile; jangan `source` file dari pengguna sebagai shell.
3. Salin unit `ops/systemd/*.service`, sesuaikan path Node dan lakukan `systemd-analyze verify`/`systemctl daemon-reload`. Contoh heap API384MiB/frontend512MiB, MemoryMax512/768MiB, CPUQuota80% per servis, TasksMax64, loopback3001/4000. Batas ini titik awal, **belum benchmark VPS**; native memory Sharp/Prisma berada di luar JS heap. Sisakan RAM untuk OS, Nginx dan Redis. Jangan menjalankan build/kompilasi di VPS1vCPU/2GB.
4. `ops/nginx-production.conf` berada di konteks http{}. Ganti `__DOMAIN__`, pasang cert terlebih dahulu, jalankan `nginx -t`, baru reload. Proxy mengarah3001/4000 loopback. Port publik hanya80/443, SSH dibatasi operator;4000/3001/6380 dan port database tidak dibuka publik. Redirect memakai domain konfigurasi, tidak Host arbitrer. Internal HMAC `/api/internal/` ditutup dari publik. Nginx cap body1MiB/khusus upload21MiB dan buffering request upload off; API tetap validasi20MiB. Log akses tanpa IP/URL/query; error log Nginx masih mungkin berisi alamat/path ketika fatal, batasi akses/retensi. Jangan static serve backend/public.
5. Redis tetap Compose sendiri di localhost6380; belum dipakai auth/CMS, tidak menambah queue Tahap02. Rotasi log10MiB×3 sudah di Compose. Tidak menjalankan/recreate Redis di sesi ini. Host journald/logrotate perlu retensi7hari/maxdisk disahkan dan dipasang; template logrotate sudah ada.

Trust proxy API tetap false. Nginx menambah batas login/register per alamat socket pengunjung, tetapi limiter aplikasi masih berbagi kuota proxy lokal. Batasan Prompt13 ini **belum terselesaikan untuk trafik publik banyak akun**; validasi kebijakan per-IP/per-akun sebelum peluncuran. Jangan mengaktifkan trust proxy hop bebas untuk mengatasinya.

## Backup, offsite dan persiapan migration

Sebelum perubahan produksi, baca `backend/docs/data-backup-policy.md`. Tidak ada migration baru pada Prompt14. Jangan reset/seed Neon. Cek `prisma migrate status` dari tooling source tepercaya sesuai commit dengan DATABASE_URL runtime yang ada; `migrate deploy` hanya setelah review dan izin yang relevan, bukan otomatis saat boot. CLI migrasi dipisah dari artefak runtime. Jangan migrate dev produksi. Pastikan schema kompatibel aplikasi lama sebelum mengizinkan rollback otomatis.

Backup konsisten memerlukan jendela maintenance: hentikan semua mutasi/jobs dan proses API sebelum dump/filesnapshot. Env backup disiapkan operator melalui file rahasia/proses terlindungi, tanpa URL/password dalam command line/log/history:

- BACKUP_DATABASE_URL eksplisit; tidak otomatis membaca DATABASE_URL/.env. Remote wajib TLS dan channel_binding dari URL dipertahankan.
- UPLOAD_ROOT absolute shared uploads; SOURCE_COMMIT menunjuk versi sumber yang sedang dibackup (bukan otomatis versi target).
- BACKUP_KEY_FILE file32byte acak mode0600, di media terpisah. Kunci hilang berarti backup tidak dapat dipulihkan. Simpan salinan kunci dan secret yang diperlukan secara terenkripsi terpisah.
- MAINTENANCE_CONFIRMED=1 merupakan attestation operator bahwa mutasi/jobs telah dihentikan, bukan mekanisme pause otomatis. Siapkan TMPDIR private/terenkripsi dan ruang cukup untuk dump+salinan upload+tar sementara; proses gagal bila disk penuh, tidak menghapus sumber/backup baik. SHA file memakai chunk1MiB, bukan memuat dump besar ke RAM.

Command: `node ops/backup.mjs /path-private/snapshot.kalosara-backup`. Satu set mengandung custom pg_dump, original/varian/legacy upload, manifest/checksum, lalu AES256GCM dengan nonce acak/tag autentikasi. Direktori sementara private dibersihkan setelah selesai; crash/power loss dapat meninggalkan plaintext sementara, operator perlu membersihkan setelah memeriksa proses. Jangan membuat backup tidak terenkripsi di SSD umum. Receipt hanya metadata dan `offsiteVerified:false`.

Transfer artefak terenkripsi ke tujuan offsite terotorisasi, baca kembali/checksum di tujuan dan lakukan restore drill. **Belum ada transfer/offsite nyata dalam sesi ini.** Operator menyalin receipt terverifikasi ke file terpisah, menetapkan `offsiteVerified:true` dan `approvedForCommit:<commit target>` setelah verifikasi. Jangan mengedit flag hanya agar deployment lolos. Receipt bukan bukti kriptografis offsite; ini catatan persetujuan operator yang harus ditopang log transfer/restore. Target usulan RPO24jam/RTO4jam belum diuji dengan volume produksi.

`ops/restore-test.mjs` sengaja hanya menerima TEST_DATABASE_URL localhost bernama `kalosara_*_test`, tanpa query. Tidak dapat restore ke Neon. Gunakan DB baru/kosong dan RESTORE_UPLOAD_ROOT baru di `/tmp/kalosara-*`, BACKUP_KEY_FILE yang cocok, lalu `node ops/restore-test.mjs BACKUP`. Tag GCM salah/arsip tampered, path traversal, link dan checksum salah ditolak sebelum pg_restore. Tidak memakai --clean. Restore produksi memerlukan prosedur/otorisasi terpisah; script ini tidak dimaksudkan melewati guard tersebut.

## Satu command aktivasi dan rollback

Setelah host/proxy/secrets/backup offsite/schema review tersedia, ekstrak arsip **terpercaya** ke direktori SHA, periksa checksum eksternal dan manifest, simpan commit lama serta backup baik. Dari source tooling yang tepercaya:

```bash
sudo MIGRATIONS_REVIEWED_COMMIT=COMMIT40HEX \
  ROLLBACK_SCHEMA_COMPATIBLE=1 \
  BACKUP_RECEIPT_FILE=/path-private/verified-receipt.json \
  /usr/bin/node ops/deploy.mjs /srv/kalosara/releases/COMMIT40HEX
```

Ganti placeholder dengan nilai nyata, tidak memuat credential. Script memeriksa platform/Node/checksum/origin/env/shared upload/receipt<24jam dan konfirmasi review migrasi, berhenti jika tidak cocok, menghentikan dua servis, switch symlink atomik, start dan cek readiness+frontend. Tidak build, migrate, dump, mengubah firewall atau mengirim secret. Jika start/health gagal, servis dihentikan dan symlink versi sebelumnya dipulihkan bila ada; database tidak di-rollback. Bila restore servis lama gagal, eskalasi manual/maintenance; jangan mengklaim rollback berhasil hanya karena command start diterima. First deploy tidak mempunyai fallback lama. Rollback manual yang direncanakan memakai command yang sama dengan arsip versi lama fresh, receipt/review yang sesuai. Tidak menghapus rilis/backup/upload otomatis.

**Aktivasi/rollback systemd belum diuji pada VPS nyata.** Sebelum go-live lakukan rehearsal Linux/staging termasuk failed-start/readiness, izin direktori, sertifikat/renewal, restart layanan/reboot host, media20MiB, akses role, cache HMAC dan audit. Smoke lokal saja tidak menguji domain/firewall/chain sertifikat publik.

## Pengujian ulang terisolasi

`node --test ops/tests/*.test.mjs` menguji tampering manifest, symlink escape, key permissions, guard Neon dan closure runtime. `NGINX_BIN=/path/native/nginx node ops/tests/proxy-tls.mjs` menguji template dengan sertifikat lokal yang dipercaya eksplisit dan upstream mock4101/4103, proxy3080/3443; tidak menyentuh API utama.

Sediakan PostgreSQL **native** (bukan Docker) dan tiga DB disposable terpisah untuk regresi, browser dan restore. `npm run test:db` memakai DB pertama. Build QA dengan SITE_ORIGIN=http://localhost:3002/API_INTERNAL_URL=http://127.0.0.1:4002 lalu package ke direktori baru. `ops/qa-run.mjs` memerlukan TEST_DATABASE_URL, TEST_RESTORE_DATABASE_URL, QA_RELEASE_DIR, PLAYWRIGHT_MODULE (tooling Playwright1.62.1), CHROME_PATH opsional, pg_dump/pg_restore di PATH atau PG_DUMP_BIN/PG_RESTORE_BIN, serta QA_REPORT_FILE bila ingin menyimpan laporan. Script menolak URL non-test dan origin selain localhost3002, membuat fixture acak example.invalid pada DB browser, menjalankan paket produksi3002/4002, browser, load, upload PRIVATE/PUBLIC, berhenti sebelum snapshot, backup/restore ke DB kedua, dan memverifikasi akses media hasil restore. Temp credential/upload/key/archive dibersihkan saat selesai. Database disposable harus dihentikan/dihapus operator setelah laporan; jangan arahkan fixture ke Neon.

Load hanya GET publik/ready, maksimal500request/concurrency10. LOAD_REQUESTS/LOAD_CONCURRENCY/LOAD_PAUSE_MS mengatur uji terbatas; pause tidak dihitung sebagai latency request, tetapi masuk elapsed run. Sampling `ps` CPU/RSS dan pg_stat_activity per1detik (plus awal/akhir); CPU ps adalah snapshot/average proses, bukan profiler CPU interval. Koneksi mencakup satu observer. Cache dipanaskan terpisah. Tidak menguji brute force, beban upload20MiB bersamaan atau volume data produksi. Hasil lokal macOS tidak boleh diklaim sebagai kapasitas VPS1vCPU/2GB.

## Gate serah terima Tahap01 / batas Tahap02

- Kode: API auth, sesi, tiga role, CMS publik, SEO, media privat/publik, akun/dashboard dan audit tersedia/teruji; batasan verifikasi kontak/reset email/kuota total/CSP/limiter/advisory ada di checkpoint.
- Operasi yang harus ditutup: domain/VPS/SSH/arsitektur, build Linux CI sukses, staging systemd+rollback, HTTPS publik/renewal/firewall, backup offsite+restore aktual, kebijakan retensi/operator, benchmark VPS dan smoke akun uji yang diotorisasi.
- Tahap02 **tidak dimulai**: tidak menambah master layanan/form builder/permohonan/berkas warga/workflow surat/QR/template/persetujuan surat/queue. Checklist ini hanya mencatat fondasi yang kelak dapat dipakai, tanpa membuat implementasinya.
