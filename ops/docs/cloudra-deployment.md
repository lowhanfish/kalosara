# Deployment Cloudra — 8 November 2026

Domain: `https://watundehoa.digital`. Cloudra NAT meneruskan HTTPS publik ke
`10.1.0.132:80` melalui HTTP privat. Gunakan `ops/nginx-cloudra.conf`, bukan
template HTTPS langsung `ops/nginx-production.conf`, untuk jalur ini.

## Susunan instalasi

- Ubuntu 26.04, x86_64; Node resmi 24.22.1 di `/opt/node-v24.22.1-linux-x64`.
- Frontend dan backend sebagai layanan `kalosara-frontend` dan
  `kalosara-backend`, dengan akun sistem `kalosara`.
- Proses Node hanya mendengarkan loopback 3001 dan 4000. Nginx hanya memakai
  alamat privat VPS untuk website. Database tetap Neon yang sudah dikonfigurasi.
- Rahasia produksi baru di `/etc/kalosara/{backend,frontend}.env`, root mode 0600.
  Jangan mencetak, memasukkan ke Git, atau mengirimkannya melalui chat.
- Unggahan di `/srv/kalosara/shared/uploads`, direktori 0700/file 0600 milik
  layanan. Nginx tidak menyajikan direktori tersebut sebagai berkas statis.
- Redis belum dipasang karena fitur aplikasi saat ini tidak memakainya.

Rilis aplikasi: `a92d6d50f31c7fe37ec9e2282ed47e9a776a1f2b`.
Sumber dipindahkan lewat Git bundle dari checkout lokal. TypeScript/backend dan
Next dibangun di komputer lokal dengan Node 24.22.1; dependensi produksi dan
Prisma client dipasang/dibuat ulang di Linux sesuai lockfile. Dependensi macOS
tidak disalin. Paket akhir dirakit dan manifest diverifikasi di VPS Linux.
Ini bukan artefak dari GitHub Actions; keberhasilan workflow hosted tidak diklaim.

Direktori rilis `/srv/kalosara/releases/<commit>`, symlink aktif
`/srv/kalosara/current`. Arsip rilis asli dan checksum berada di direktori
`releases`, di luar direktori runtime. Gunakan arsip asli ketika memverifikasi
ulang/rollback, sebab Next mengubah cache runtime.

## Backup sebelum peluncuran

Tidak ada reset, seed atau migrasi produksi baru. Sepuluh migrasi database
sudah sesuai sumber. API lokal proyek tidak berjalan saat snapshot; situs VPS
masih dalam pemeliharaan sehingga tidak menerima mutasi aplikasi saat backup.

Backup AES-256-GCM:
`/srv/kalosara/backups/prelaunch-20261108.kalosara-backup`.
Salinan di luar VPS, kunci pemulihan, serta salinan konfigurasi produksi berada
di folder lokal privat dan diabaikan Git:
`reports/deployment-20261108/`.

SHA256 backup:
`f227763063c5c881281c4df73dd4e08351c404acf021604799054a8778fdc82d`.
Checksum salinan lokal cocok. Dekripsi, manifest, 209 berkas unggahan dan
pemulihan database diuji pada database native lokal disposable
`kalosara_prelaunch_test`. Sepuluh migrasi terpulihkan. Database/role/unggahan
drill dihapus sesudahnya dan layanan PostgreSQL lokal dihentikan; database
produksi tetap Neon. Receipt terverifikasi:
`/srv/kalosara/backups/verified-prelaunch-receipt.json`.

Backup terjadwal, penyimpanan immutable, pemisahan kunci ke media lain, serta
target RPO/RTO belum disahkan/dijalankan. Jaga folder pemulihan lokal tersebut.

## Pengoperasian

Periksa layanan dengan `systemctl status kalosara-backend kalosara-frontend nginx`.
Readiness: `http://127.0.0.1:4000/api/v1/ready`.
Layanan aplikasi diaktifkan untuk boot otomatis. Log journald dibatasi 100 MB
dan retensi maksimal tujuh hari. Nginx mencatat status/durasi/request ID tanpa
URL, query, atau alamat pengunjung pada log akses khusus aplikasi.

Aktivasi memakai `ops/deploy.mjs` dengan receipt terverifikasi dan commit
migrasi yang telah ditinjau, seperti pada `ops/README.md`. Jangan memalsukan
receipt atau menjalankan seed/reset untuk memperbaiki deployment.

## Batas validasi

Tes backend 46, frontend 39, serta empat tes alat rilis lulus. Lint/typecheck
dan build lulus; lint frontend memiliki satu warning lama pada konfigurasi
PostCSS. Manifest paket Linux diverifikasi sebelum aktivasi.

Kebijakan limiter backend masih memakai socket lokal (`trust proxy=false`),
sehingga kuota login/register dibagi antar pengunjung. Nginx Cloudra juga
membatasi berdasarkan alamat proxy sampai identitas edge tepercaya diverifikasi.
Ini membatasi banyak pengguna yang login bersamaan; jangan mengaktifkan
kepercayaan forwarding header secara bebas untuk mengatasinya.

Login dengan akun nyata, reboot host, pengujian beban/kapasitas penuh, dan
perpanjangan sertifikat otomatis belum diklaim teruji. HTTPS dikelola Cloudra.

## Hasil pemeriksaan publik

Homepage, berita, sitemap, readiness, media publik dan pengolahan gambar Next
memberi HTTP 200 melalui HTTPS. Endpoint internal invalidasi ditolak 404 dan
API admin anonim ditolak 401. Cookie CSRF memiliki Secure dan SameSite.
HTTP dialihkan 308 ke HTTPS. Browser menampilkan homepage beserta gambar hero
dan formulir masuk panel pengelola; tidak dilakukan login dengan akun nyata.
Data yang sudah tersedia tetap berlabel **mode demo**; deployment tidak
mengesahkan angka/konten contoh sebagai informasi resmi.

Layanan aplikasi berhasil dimulai ulang setelah aktivasi dan diaktifkan saat
boot. Host tidak direboot. Memori awal backend sekitar 85 MiB dan frontend
106 MiB, dengan sekitar 1,3 GiB RAM masih tersedia; ini observasi idle/smoke,
bukan benchmark kapasitas produksi. Kunci backup sementara di VPS dibersihkan
sesudah drill; salinan pemulihan tetap di folder privat komputer operator.
