# Panduan update dan deployment KALOSARA ke VPS Cloudra

Dokumentasi untuk operator dan AI pendamping, termasuk Gemini. Ditulis 8 November 2026 berdasarkan pemasangan yang berhasil dilakukan. Panduan ini menjelaskan **update server yang sudah terpasang**, bukan instalasi ulang OS.

## 1. Informasi instalasi saat ini

| Hal | Nilai |
| --- | --- |
| Website | https://watundehoa.digital |
| Repo | https://github.com/lowhanfish/kalosara.git |
| Proyek lokal | `/Users/dinaskominfo/kiken/Project/next/kalosara` |
| SSH | `ssh -p 37523 root@103.155.224.225` |
| SSH key komputer ini | `/Users/dinaskominfo/.ssh/kalosara_cloudra` |
| Alamat privat VPS | `10.1.0.132` |
| Sistem | Ubuntu 26.04, Linux x86_64, 2 core, RAM 2 GB |
| Node server | 24.22.1, `/opt/node-v24.22.1-linux-x64/bin` |
| Node systemd | `/usr/bin/node` menunjuk Node 24 tersebut |
| pnpm server | `/opt/node-v24.22.1-linux-x64/bin/pnpm`, versi 10.18.3 |
| Akun proses | `kalosara` |
| Frontend | `kalosara-frontend.service`, `127.0.0.1:3001` |
| Backend | `kalosara-backend.service`, `127.0.0.1:4000` |
| Proxy | Nginx, `10.1.0.132:80` |
| Konfigurasi proxy aktif | `/etc/nginx/conf.d/kalosara-bootstrap.conf` — namanya masih bootstrap, isinya sudah konfigurasi website aktif |
| Secret server | `/etc/kalosara/backend.env` dan `/etc/kalosara/frontend.env` |
| Database | Neon, menggunakan konfigurasi server yang sudah ada |
| Unggahan bersama | `/srv/kalosara/shared/uploads` |
| Rilis aktif | Symlink `/srv/kalosara/current` |
| Semua rilis | `/srv/kalosara/releases/<commit-40-karakter>` |
| Tool deployment | `/srv/kalosara/tooling/ops/` |
| Backup server | `/srv/kalosara/backups/` |

Rilis aplikasi pada pemasangan pertama: `a92d6d50f31c7fe37ec9e2282ed47e9a776a1f2b`. **Selalu baca symlink dan manifest terbaru; jangan menganggap commit ini selamanya aktif.**

Cloudra mengurus HTTPS publik dan meneruskan permintaan lewat jaringan privat ke HTTP port 80 VPS. Jangan memasang redirect HTTPS di Nginx privat memakai template `ops/nginx-production.conf`; itu dapat membuat redirect berulang. Template yang sesuai adalah `ops/nginx-cloudra.conf`. Port frontend/backend tidak perlu dibuka ke publik. Redis belum dipasang karena aplikasi sekarang belum menggunakannya.

## 2. Instruksi penting untuk Gemini/operator

1. Baca file ini, `ops/docs/cloudra-deployment.md`, `ops/README.md`, dan `AGENTS.md` yang berlaku sebelum bekerja. Untuk perubahan kode Next, baca panduan Next versi terpasang sesuai `frontend/AGENTS.md`.
2. Pastikan target commit, perubahan kode, dan status Git jelas. Jangan menimpa perubahan lokal pengguna. Commit perubahan yang memang hendak dirilis; jangan commit secret, upload, atau backup. Paket harus sesuai commit itu.
3. Pertahankan file secret server. Jangan menggantinya dengan `.env.example` atau `.env` development. Jangan mencetak password, URL database, cookie, token, atau kunci ke chat/log/perintah shell.
4. Jangan mengulang provisioning, mengganti OS, mereset password, mengubah DNS/SSH, membuka port Node, atau memasang panel hosting untuk update biasa.
5. Jangan menjalankan `prisma migrate dev`, `prisma migrate reset`, atau seed terhadap database produksi. Migration baru harus dibaca, diuji terisolasi, dibackup, dan mendapat persetujuan pengguna sebelum diterapkan.
6. Jangan memalsukan receipt backup, mengabaikan checksum, atau melewati guard `ops/deploy.mjs` agar deployment terlihat berhasil.
7. Jangan mengubah data demo menjadi informasi resmi atau menghapus label demo tanpa arahan pengguna dan konten yang sudah diperiksa.
8. Build dilakukan di komputer lokal atau runner Linux yang memadai. Hindari kompilasi frontend di VPS RAM 2 GB. Proses aplikasi tetap native systemd; jangan menggantinya menjadi container.

## 3. Akses dan pemeriksaan awal

**Di komputer lokal:**

```bash
cd /Users/dinaskominfo/kiken/Project/next/kalosara
git status --short
ssh -i /Users/dinaskominfo/.ssh/kalosara_cloudra -p 37523 \
  -o BatchMode=yes -o StrictHostKeyChecking=yes root@103.155.224.225
```

Jangan menonaktifkan pemeriksaan identitas SSH. Bila key/komputer berubah, minta operator memasang public key yang sesuai; jangan meminta private key/password di chat.

**Di sesi SSH VPS:**

```bash
export PATH=/opt/node-v24.22.1-linux-x64/bin:$PATH
node -v
pnpm -v
readlink -f /srv/kalosara/current
systemctl is-active kalosara-backend kalosara-frontend nginx
systemctl is-enabled kalosara-backend kalosara-frontend nginx
df -h /
free -m
curl -fsS http://127.0.0.1:4000/api/v1/ready
```

Catat commit lama, lokasi arsip rilis lama dan checksum-nya. Jangan membersihkan rilis lama sebelum versi baru benar-benar sehat.

## 4. Pilihan paket rilis

**Pilihan utama:** jalankan workflow `.github/workflows/native-release.yml` melalui `workflow_dispatch`, isi `site_origin=https://watundehoa.digital`, tunggu seluruh pemeriksaan sukses, lalu unduh artefak `kalosara-native-<commit>`. Cocokkan commit, Linux x64 dan Node major dengan VPS. Workflow tidak melakukan SSH/deployment otomatis. Jangan memasukkan secret produksi ke build CI.

Pemasangan pertama menggunakan alternatif di bawah karena artefak CI tidak digunakan. Ini merakit paket Linux dari JavaScript hasil build lokal dan dependensi yang dipasang ulang di Linux. Jangan mengganti label platform pada manifest macOS atau menyalin native module macOS ke server.

### Alternatif yang sudah dipakai: build lokal, paketkan di Linux

Contoh mengasumsikan source commit bersih dan dipilih dengan sengaja. Bila ada perubahan yang belum di-commit, selesaikan pemilihan commit dulu. Gunakan direktori staging baru setiap rilis.

**Di komputer lokal**, gunakan Node 24.22.1. Komputer saat ini memiliki Node tersebut melalui nvm:

```bash
export PATH=/Users/dinaskominfo/.nvm/versions/node/v24.22.1/bin:$PATH
cd /Users/dinaskominfo/kiken/Project/next/kalosara
node -v
pnpm -v
npm ci --prefix backend
npm --prefix backend run db:generate
pnpm --dir frontend install --frozen-lockfile

npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run build
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend test
SITE_ORIGIN=https://watundehoa.digital \
API_INTERNAL_URL=http://127.0.0.1:4000 pnpm --dir frontend build
node --test ops/tests/*.test.mjs
```

Tes HTTP lokal memerlukan izin membuka port lokal. Jika muncul `listen EPERM`, perbaiki izin eksekusi pengujian; jangan mengubah kode agar tes diabaikan. Jika build Next tertahan, cari proses pemegang `frontend/.next/lock` dan hentikan hanya proses build proyek ini. Jangan menghentikan Node milik proyek lain atau menjalankan dua build bersamaan.

Jika perubahan menyentuh database/auth/media, jalankan regresi database dan browser terisolasi sesuai `ops/README.md`. Jangan memakai Neon produksi sebagai database tes.

Setelah semua lulus:

```bash
RELEASE_SHA=$(git rev-parse HEAD)
STAGE_LOCAL=$(mktemp -d /private/tmp/kalosara-update.XXXXXX)
git bundle create "$STAGE_LOCAL/source.bundle" HEAD
git bundle verify "$STAGE_LOCAL/source.bundle"
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$STAGE_LOCAL/backend-dist.tgz" -C backend dist
COPYFILE_DISABLE=1 tar --no-xattrs --exclude=node_modules --exclude='.env*' \
  -czf "$STAGE_LOCAL/frontend-build.tgz" -C frontend \
  .next/standalone .next/static .next/routes-manifest.json public

ssh -i /Users/dinaskominfo/.ssh/kalosara_cloudra -p 37523 \
  root@103.155.224.225 "install -d -m 700 /root/kalosara-build/$RELEASE_SHA"
scp -i /Users/dinaskominfo/.ssh/kalosara_cloudra -P 37523 \
  "$STAGE_LOCAL/source.bundle" "$STAGE_LOCAL/backend-dist.tgz" \
  "$STAGE_LOCAL/frontend-build.tgz" \
  "root@103.155.224.225:/root/kalosara-build/$RELEASE_SHA/"
```

`--no-xattrs` digunakan oleh tar macOS; sesuaikan bila build lokal memakai Linux. Untuk update biasa **jangan menyalin unggahan lokal ke server**: unggahan produksi yang sudah ada adalah sumber utama.

**Di VPS**, isi commit target yang sama (ganti teks contoh):

```bash
export PATH=/opt/node-v24.22.1-linux-x64/bin:$PATH
RELEASE_SHA=GANTI_DENGAN_COMMIT_40_KARAKTER
STAGE_SERVER=/root/kalosara-build/$RELEASE_SHA
git clone "$STAGE_SERVER/source.bundle" "$STAGE_SERVER/source"
cd "$STAGE_SERVER/source"
test "$(git rev-parse HEAD)" = "$RELEASE_SHA"
npm ci --prefix backend --no-audit --no-fund
npm --prefix backend run db:generate
pnpm --dir frontend install --prod --frozen-lockfile
tar -xzf "$STAGE_SERVER/backend-dist.tgz" -C backend
tar -xzf "$STAGE_SERVER/frontend-build.tgz" -C frontend
cp -a frontend/node_modules frontend/.next/standalone/node_modules
node --test ops/tests/*.test.mjs

SITE_ORIGIN=https://watundehoa.digital \
API_INTERNAL_URL=http://127.0.0.1:4000 \
node ops/package-release.mjs "/srv/kalosara/releases/$RELEASE_SHA"
node ops/verify-release.mjs "/srv/kalosara/releases/$RELEASE_SHA"
```

Output harus menyatakan `release_verified` untuk commit dan origin yang benar. `package-release.mjs` membutuhkan direktori output yang belum ada. Bila percobaan gagal, simpan dan periksa direktori percobaan; jangan menghapus direktori rilis aktif agar bisa mencoba ulang.

## 5. Izin berkas dan arsip rilis asli

**Di VPS**, setelah paket diverifikasi dan sebelum mulai dipakai:

```bash
chmod -R a+rX "/srv/kalosara/releases/$RELEASE_SHA"
chown -R kalosara:kalosara "/srv/kalosara/releases/$RELEASE_SHA/frontend/.next"
tar -czf "/srv/kalosara/releases/$RELEASE_SHA.tgz" \
  -C "/srv/kalosara/releases/$RELEASE_SHA" .
sha256sum "/srv/kalosara/releases/$RELEASE_SHA.tgz" \
  > "/srv/kalosara/releases/$RELEASE_SHA.tgz.sha256"
```

Arsip ini dibuat **sebelum proses Next menulis cache**. Simpan checksum melalui kanal yang dipercaya dan salinan rilis di luar VPS jika memungkinkan. Jangan membuat arsip rilis pengganti dari direktori runtime yang sudah berubah lalu menganggapnya setara dengan rilis asli.

Kode backend/dependensi tetap root-owned dan read-only untuk layanan. Hanya cache frontend dan shared uploads yang boleh ditulis aplikasi. Secret tetap root 0600. Upload tetap milik `kalosara`, direktori 0700 dan berkas 0600. Jangan menjalankan `chmod 777`.

## 6. Backup baru sebelum setiap aktivasi

Receipt pemasangan pertama **bukan izin untuk semua deployment berikutnya**. `ops/deploy.mjs` memerlukan backup terverifikasi berumur kurang dari 24 jam dan `approvedForCommit` yang cocok dengan target.

1. Siapkan jendela maintenance. Hentikan semua proses/pekerjaan yang dapat memutasi database dan unggahan, termasuk instalasi lokal bila masih memakai database Neon yang sama.
2. Di VPS hentikan `kalosara-frontend` dan `kalosara-backend`. Situs dapat sementara memberi 502 selama jendela ini; hindari mengubah konfigurasi domain/Nginx hanya untuk update biasa.
3. Jalankan `ops/backup.mjs` dari sumber tepercaya. Gunakan **commit yang sedang aktif** sebagai `SOURCE_COMMIT`, bukan commit baru.
4. Ambil `DATABASE_URL` dengan parser environment di dalam proses Node dari `/etc/kalosara/backend.env`; jangan memakai `source`, mencetaknya, atau menaruh URL di argumen command. Berikan sebagai `BACKUP_DATABASE_URL` hanya di environment proses backup.
5. Set `UPLOAD_ROOT=/srv/kalosara/shared/uploads`, `MAINTENANCE_CONFIRMED=1`, serta `BACKUP_KEY_FILE` yang berisi 32 byte acak dengan mode 0600. Gunakan utility `pg_dump` yang kompatibel dengan versi PostgreSQL Neon.
6. Pilih nama output baru `/srv/kalosara/backups/<timestamp>.kalosara-backup`. Jangan menimpa set backup baik sebelumnya.
7. Transfer backup **terenkripsi** ke komputer operator/media offsite, baca kembali dan cocokkan SHA256. Simpan kunci pemulihan secara privat dan terpisah; jangan memasukkan kunci ke arsip backup atau Git.
8. Uji dekripsi, manifest dan restore pada database native disposable lokal sesuai `ops/restore-test.mjs`. Script hanya menerima `TEST_DATABASE_URL` localhost dengan nama `kalosara_*_test` dan direktori upload baru `/tmp/kalosara-*`. Jangan restore drill ke Neon produksi. Hapus hanya database/role/unggahan disposable yang memang dibuat untuk drill dan hentikan layanan PostgreSQL uji setelahnya.
9. Setelah bukti checksum offsite dan restore berhasil, buat salinan receipt terpisah dengan `offsiteVerified:true`, `approvedForCommit:<target commit>`, dan catatan hasil verifikasi. Jangan sekadar mengubah flag tanpa melakukan verifikasinya.

Backup awal, salinan konfigurasi produksi dan kunci pemulihan yang sudah ada pada komputer ini berada di:

```text
/Users/dinaskominfo/kiken/Project/next/kalosara/reports/deployment-20261108/
```

Folder itu privat dan diabaikan Git. Kunci sementara backup awal di VPS sudah dibersihkan; jangan menganggap `/root/kalosara-build/recovery.key` masih ada. Catatan backup awal ada di `ops/docs/cloudra-deployment.md`. Jika backup baru gagal, jangan deploy; pulihkan layanan lama bila tidak ada migrasi/perubahan data yang menghalangi.

## 7. Tinjau database dan migration

Gunakan Prisma CLI dari source staging commit target dengan konfigurasi database produksi dibaca aman dalam proses. Jalankan `prisma migrate status`, cocokkan daftar migration dan checksum. Jangan menjalankan migrasi otomatis hanya karena ada file migration baru.

- **Tidak ada migration baru:** catat bahwa schema sesuai target dan kompatibel dengan rilis lama.
- **Ada migration baru:** baca SQL, uji pada database terisolasi, evaluasi kehilangan data/lock/kompatibilitas rollback, siapkan backup baru, dan minta persetujuan sebelum `prisma migrate deploy` di produksi.
- **Schema tidak kompatibel versi lama:** jangan mengisi `ROLLBACK_SCHEMA_COMPATIBLE=1`. Rencanakan maintenance dan pemulihan secara khusus; alur rollback otomatis biasa tidak boleh dipaksakan.

Migration tidak dilakukan oleh `ops/deploy.mjs` atau saat boot layanan. Jangan memperbarui secret atau kunci signing saat update biasa; perubahan itu dapat memutus sesi pengguna.

## 8. Aktivasi

Gunakan tooling yang telah dibaca dan diperiksa. Tooling instalasi pertama ada di `/srv/kalosara/tooling/ops`. Bila commit baru mengubah tooling, review perubahan tersebut sebelum memakainya; jangan menyalin perubahan tooling secara buta.

**Di VPS**, setelah backup/schema/izin/arsip sudah siap:

```bash
cd /srv/kalosara/tooling
MIGRATIONS_REVIEWED_COMMIT="$RELEASE_SHA" \
ROLLBACK_SCHEMA_COMPATIBLE=1 \
BACKUP_RECEIPT_FILE=/srv/kalosara/backups/GANTI_RECEIPT_TERVERIFIKASI.json \
/usr/bin/node ops/deploy.mjs "/srv/kalosara/releases/$RELEASE_SHA"
```

Ganti path receipt dengan file nyata dari backup baru. Flag di atas adalah pernyataan hasil review, bukan cara mengabaikan review. Script memverifikasi paket/config/backup, menghentikan layanan, mengganti symlink secara atomik, memulai layanan, lalu mengecek backend/frontend. Jika gagal, script berusaha mengembalikan aplikasi lama; **database tidak di-rollback**. Tetap periksa kesehatan versi lama, jangan menganggap rollback pasti berhasil.

Nginx, systemd, firewall dan DNS tidak perlu diubah untuk update kode biasa. Jika unit systemd berubah dan sudah direview, pasang unit yang sesuai, jalankan `systemd-analyze verify` dan `systemctl daemon-reload` sebelum aktivasi.

## 9. Verifikasi setelah aktivasi

**Di VPS:**

```bash
readlink -f /srv/kalosara/current
systemctl is-active kalosara-backend kalosara-frontend nginx
curl -fsS http://127.0.0.1:4000/api/v1/ready
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3001/
systemctl show kalosara-backend kalosara-frontend -p Id -p NRestarts -p MemoryCurrent
ss -lntp
```

**Melalui domain publik:**

```bash
curl -I https://watundehoa.digital/
curl -fsS https://watundehoa.digital/api/v1/ready
curl -s -o /dev/null -w '%{http_code}\n' https://watundehoa.digital/berita
curl -s -o /dev/null -w '%{http_code}\n' https://watundehoa.digital/sitemap.xml
curl -s -o /dev/null -w '%{http_code}\n' https://watundehoa.digital/api/internal/revalidate
curl -s -o /dev/null -w '%{http_code}\n' https://watundehoa.digital/api/v1/admin/dashboard
```

Harapan: homepage/ready/berita/sitemap 200, endpoint internal 404, API admin tanpa login 401. HTTP harus mengarah ke HTTPS, sertifikat valid tanpa `curl -k`. Jika cache DNS komputer tertinggal, diagnosis dapat memakai `--resolve watundehoa.digital:443:103.155.224.225` sambil tetap memvalidasi sertifikat.

Buka browser: periksa homepage, foto/gambar, berita, halaman yang diubah, tampilan ponsel dan formulir masuk. Uji login hanya dengan akun uji yang diotorisasi; jangan membuat akun penduduk fiktif di produksi. Untuk perubahan media, periksa akses PUBLIC dan penolakan PRIVATE tanpa login. Jangan mencetak token cookie saat memeriksa Secure/SameSite.

Jika Nginx berubah, jalankan `nginx -t` sebelum reload. Pada pemasangan awal, perubahan listener wildcard ke alamat privat membutuhkan restart Nginx agar konfigurasi benar-benar berganti. Jangan menyatakan selesai hanya karena reload diterima; verifikasi respons nyata. Untuk update aplikasi biasa, Nginx tidak perlu restart.

## 10. Rollback aplikasi

1. Pertahankan backup dan catat commit gagal serta commit lama yang dituju.
2. Pastikan schema saat ini masih kompatibel dengan aplikasi lama. Jika tidak, hentikan alur rollback otomatis dan susun rencana pemulihan data yang disetujui.
3. Verifikasi SHA256 arsip rilis lama terhadap checksum yang dipercaya. Jangan memakai manifest dari direktori Next runtime yang sudah berubah sebagai sumber rilis baru.
4. Jika direktori commit lama sudah pernah dijalankan, pastikan direktori itu **tidak sedang aktif**, pindahkan ke nama karantina, lalu ekstrak arsip asli ke direktori commit yang semestinya. Jangan menimpa rilis aktif atau menghapus shared uploads.
5. Verifikasi manifest fresh dengan Node/platform yang cocok, atur kembali izin dan kepemilikan cache `.next`, kemudian gunakan `ops/deploy.mjs` seperti di atas dengan target commit lama dan receipt baru/masih valid yang disetujui untuk commit tersebut.
6. Ulangi seluruh pemeriksaan kesehatan dan HTTPS publik. Rollback aplikasi tidak berarti restore database. Jangan restore Neon secara spontan untuk membatalkan perubahan kode.

## 11. Diagnosis singkat

| Gejala | Pemeriksaan |
| --- | --- |
| HTTPS 502 | `systemctl status` backend/frontend/nginx; port 3001/4000; respons ready; Nginx menuju port yang benar |
| Readiness 503 | Koneksi Neon, konfigurasi server dan status migration; jangan seed/reset |
| `Release platform/Node mismatch` | Paket harus Linux x64/Node major yang cocok; buat ulang paket, jangan edit manifest |
| `Release checksum ... mismatch` | Bisa karena Next telah menulis cache atau artefak berubah; gunakan ekstraksi fresh dari arsip terpercaya |
| Modul Sharp/Prisma gagal | Dependensi harus native Linux, Prisma generate di Linux; jangan copy node_modules macOS |
| Login 429 | Ada pembatasan bersama di backend/proxy; lihat batas operasi di bawah |
| Gambar hilang | Izin/path shared uploads dan metadata database; jangan membuat direktori upload menjadi publik |
| Berulang redirect HTTPS | Pastikan memakai jalur Cloudra HTTP privat, bukan konfigurasi HTTPS langsung |

Log layanan dapat diperiksa dengan `journalctl -u kalosara-backend -u kalosara-frontend --since '10 minutes ago' --no-pager`. Tinjau secara privat dan ringkas error yang relevan; jangan menempelkan log mentah yang mungkin berisi informasi sensitif ke chat.

## 12. Batas operasi yang masih perlu diingat

- Konten masih berlabel demo. Itu bukan informasi resmi yang sudah disahkan.
- Backend memakai `trust proxy=false`, sehingga batas login/register dibagi antar pengunjung. Nginx NAT juga melihat alamat proxy sampai identitas edge diverifikasi. Perlu perbaikan dan pengujian sebelum penggunaan banyak akun bersamaan. Jangan mengaktifkan trust proxy bebas.
- Backup awal dan restore drill berhasil, tetapi backup berkala/offsite otomatis belum diatur. Buat backup baru pada setiap update dan sepakati jadwal operasional terpisah.
- Boot otomatis layanan sudah diaktifkan; restart layanan diuji. Reboot host dan pembaruan sertifikat otomatis Cloudra belum diuji secara sengaja.
- Jangan menganggap pemakaian RAM saat idle sebagai bukti kapasitas trafik produksi.

## 13. Teks penugasan untuk Gemini

> Tolong deploy pembaruan KALOSARA ke VPS Cloudra yang sudah ada, dengan domain https://watundehoa.digital. Baca `docs/DEPLOY_VPS_CLOUDRA.md`, `ops/docs/cloudra-deployment.md`, `ops/README.md`, serta AGENTS.md yang berlaku. Periksa perubahan dan commit target, jalankan pemeriksaan, build di luar VPS, dan buat paket dengan dependensi Linux yang cocok. Pertahankan secret serta shared uploads produksi. Siapkan backup terenkripsi baru, salinan offsite, dan restore drill terisolasi sebelum aktivasi. Jangan reset/seed database; jika ada migration produksi baru, jelaskan SQL/risiko dan minta persetujuan sebelum menerapkannya. Aktifkan melalui guard deployment yang tersedia, verifikasi HTTPS/frontend/backend/media/akses admin, lalu laporkan commit lama dan baru, hasil uji, lokasi backup, serta cara rollback. Jangan menyatakan berhasil sebelum domain benar-benar melayani aplikasi yang sehat. Jangan mengubah DNS, OS, SSH, atau memasang panel hosting untuk update biasa.
