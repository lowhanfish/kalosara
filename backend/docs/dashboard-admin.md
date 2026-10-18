# Prompt 11 — dashboard admin/lurah, pengguna dan audit

## 1. Ringkasan keputusan

Hanya Prompt 11 Tahap 01. Audit awal: HEAD `d2a0546`, main bersih/sinkron origin. Kedua PDF Tahap 01, README, CHECKPOINT, frontend/AGENTS dan dokumentasi data-security/CSS Next.js 16.4 terpasang menjadi acuan. Desain navy/kuning, hero, potret dan lambang pilihan pengguna dipertahankan. Identitas tetap Watundehoa/Puriala/Konawe; AMIRULAH, S.Si. Tidak ada seed atau konten resmi buatan.

Dashboard `/admin` membaca hitungan riil berita terbit/draft, pengumuman/agenda semua status, seluruh media termasuk arsip dan pengguna terdaftar. Ringkasan sepuluh aktivitas CMS tidak menampilkan identitas akun, IP, isi file atau aktivitas pengelolaan akun. Tidak ada metrik pelayanan surat. API autentikasi memakai cookie HttpOnly yang sudah ada; seluruh data dashboard private/no-store dan query frontend dipisahkan berdasarkan user ID.

| Kemampuan | ADMIN_KELURAHAN | LURAH | MASYARAKAT/anonim |
| --- | --- | --- | --- |
| Ringkasan `/admin`, hitungan dan aktivitas CMS terbatas | Ya | Monitoring | Ditolak; anonim mendapat form login |
| CMS profil/settings, berita, kanal informasi, wilayah | Kelola sesuai validasi modul | Ditolak | Ditolak |
| Daftar pengguna, audit rinci, inventory upload | Ya | Ditolak | Ditolak |
| Aktif/nonaktif, cabut sesi, reset password akun lain | Verifikasi ulang password + identitas + CSRF | Ditolak | Ditolak |
| Perubahan role akun lain | Operasi backend SET_ROLE; izin/verifikasi/transaksi/audit sama | Ditolak | Ditolak |
| File PRIVATE | Hanya milik sendiri, termasuk antar-admin | Tidak memperoleh akses admin media | Tidak memperoleh akses admin media |
| Profil akun sendiri `/auth/me` | Baca sendiri | Baca sendiri | Masyarakat baca sendiri; anonim ditolak |
| Approval konten | Belum diaktifkan | Belum diaktifkan | Tidak ada |

Tidak ada dropdown role dalam UI. Registrasi publik tetap tidak dapat memilih role. Operasi backend menerima hanya tiga role yang sah. Self access change ditolak: minta admin lain; pemeriksaan admin aktif terakhir dan serialisasi perubahan hak akses mencegah kehilangan seluruh admin. Dashboard masyarakat/edit profil adalah Prompt 12 dan belum dikerjakan.

## 2. Struktur/file berubah

- `backend/prisma/schema.prisma` dan migration `20261018000000_dashboard_audit`: dua kolom nullable AuditLog.
- `backend/src/modules/dashboard.ts`: ringkasan, pagination/search akun/audit/upload, tindakan akses tervalidasi.
- `backend/src/modules/auth/account-lock.ts`, `session-service.ts`: login/refresh/perubahan akses berbagi row lock akun, membaca ulang state dalam transaksi Read Committed. Perubahan administratif berbagi advisory lock untuk pemeriksaan admin terakhir. Reset mencabut sesi yang baru dibuat oleh refresh bersamaan.
- `backend/src/lib/audit-context.ts`, `prisma.ts`, `app.ts`: request context AsyncLocalStorage dan query extension hanya untuk audit create, termasuk transaksi CMS yang sudah ada. Log HTTP hanya ID/metode/path tanpa query/header/raw IP.
- `backend/src/tests/dashboard.db.test.ts`, `region.db.test.ts`, `scripts/test-db.mjs`: pengujian izin langsung, audit CMS, akses dan concurrency; runner memasukkan suite baru.
- `frontend/app/admin/page.tsx`, `admin/pengguna/page.tsx`, `features/cms/admin-access.tsx`, `cms.css`: dashboard, login/navigation berbasis peran, form perubahan akses, daftar/audit/upload dan state responsif.
- README/CHECKPOINT dan laporan ini.

## 3. Cara menjalankan dan prosedur akses

Backend Node >=22.12 dari folder backend: `npm run db:generate`, setelah migrasi disetujui `npm run db:deploy`, kemudian `npm run dev`. Frontend: `pnpm dev --port 3001`. Login staf terprovisi di `http://localhost:3001/admin`; pengelolaan akun di `/admin/pengguna`. Lurah memakai dashboard yang sama dengan akses monitoring.

Pilih akun tujuan, verifikasi identitas/permintaannya melalui prosedur kantor, pilih tindakan, masukkan password admin dan centang verifikasi. Dialog konfirmasi dapat dibatalkan. Reset password membutuhkan kata sandi baru minimal 12 karakter/maksimal 72 byte UTF-8. Sampaikan secara privat kepada pemilik; sistem tidak mengirim email atau mengklaim reset email tersedia. Nilai password tidak dikembalikan API/dicatat audit. Form membersihkan input setelah submit dan variabel mutasi dibersihkan setelah request selesai. Tidak ada reset akun sendiri melalui form ini.

Kontrak API (semua awalan `/api/v1/admin/dashboard`):

| Metode/path | Hasil |
| --- | --- |
| GET `/` | Hitungan dan aktivitas terbatas; admin/lurah |
| GET `/users?page=1&limit=10&search=...` | DTO akun minimal, search email, tanpa hash/telepon/sesi |
| GET `/audit?page=1&limit=10&search=USER_` | Siapa/kapan/action/entity ID/requestId/IP pseudonim; search action |
| GET `/uploads?page=1&limit=10&search=...` | Media PUBLIC atau PRIVATE milik admin sendiri, termasuk arsip; search nama file |
| POST `/users/:id/access` | Aktif/nonaktif/reset/cabut sesi/role; admin saja, CSRF+Origin, rate limit 10/15 menit/IP |

Body akses strict: `action` salah satu ACTIVATE/DEACTIVATE/REVOKE_SESSIONS/RESET_PASSWORD/SET_ROLE, `currentPassword`, `identityVerified: true`, `expectedUpdatedAt` dari DTO terakhir. Hanya RESET_PASSWORD menerima/wajib `newPassword`; hanya SET_ROLE menerima/wajib `role` salah satu ADMIN_KELURAHAN/LURAH/MASYARAKAT. Field lain ditolak. Untuk perubahan role, operator pengembang menggunakan klien API internal yang sudah login admin dengan CSRF dari `/auth/csrf`, setelah verifikasi identitas dan kewenangan. Jangan menaruh password/cookie dalam argumen CLI, URL, log, Git, tiket atau screenshot. Tidak ada endpoint role generik tanpa izin. Provisioning staf baru tetap melalui prosedur CLI terpisah yang sudah tersedia.

Semua perubahan akun mencabut seluruh refresh session dan menandai reset token lama terpakai dalam transaksi yang sama dengan audit. JWT akses aktif ikut ditolak karena autentikasi selalu memeriksa sesi DB. Aktivasi ulang tidak menghidupkan sesi lama. Konflik updatedAt menghasilkan 409 dan meminta muat ulang.

## 4. Migration/env dan runtime

Migration hanya `ALTER TABLE AuditLog ADD COLUMN requestId VARCHAR(36), ADD COLUMN ipHash CHAR(64)` nullable. Log lama/CLI tetap valid dengan nilai null. Tidak ada tabel konten/akun baru, reset, seed, env atau dependency aplikasi baru.

IP audit adalah HMAC-SHA256 dengan domain dan tanggal UTC, memakai secret invalidasi server yang sudah ada (fallback key acak per proses pada dev). Bukan IP mentah; pseudonim berubah tiap hari. RequestId UUID dibuat backend, bukan dipercaya dari header klien. Audit tidak mencatat body/password/cookie/token. Pembersihan/retensi audit otomatis belum ditentukan pengelola; ini bukan implementasi backup/retensi Prompt 13/14.

Upload tetap backend/public/uploads per source/images|documents, legacy kompatibel, API PUBLIC/PRIVATE/owner dan optimasi/signature PDF/gambar tetap berlaku. Quota yang benar-benar ditegakkan adalah **20 MiB per file, dua upload bersamaan**. Inventory menunjukkan jumlah byte file fisik seluruh original/varian/legacy/temp, tidak mengikuti symlink. Kuota total disk belum dikonfigurasi (`totalLimitBytes: null`), tidak mengklaim ruang disk tak terbatas/tersedia. Admin hanya mendapat metadata privat miliknya, meskipun angka byte agregat mencakup seluruh folder. Tidak ada pembukaan static folder.

Audit runtime awal: hanya port3000 proyek lain aktif; frontend3001/backend4000/Redis6380 tidak listening. Konfigurasi utama diperiksa tanpa mengungkap kredensial: APP_ORIGIN/SITE_ORIGIN/FRONTEND_INTERNAL_URL=3001, API=4000, secret HMAC cocok. Docker tidak dioperasikan. QA terpisah memakai frontend3002/backend4002, PostgreSQL native18.4 port55439 dan dua DB disposable lokal, bukan Neon/Docker PostgreSQL.

**Aktivasi Neon selesai pada18 Oktober2026 setelah persetujuan khusus pengguna untuk Prompt11.** Preflight memastikan hanya migrasi ini yang tertunda; `prisma migrate deploy` menerapkannya dan `prisma migrate status` menyatakan skema mutakhir. Query baca-saja memastikan kedua kolom AuditLog tersedia/nullable dan riwayat migrasi selesai. Tidak ada reset/seed/tes DB/akun atau konten QA pada Neon; URL/kredensial tidak ditimpa atau ditampilkan.

## 5. Hasil lint/typecheck/test/build

Hasil akhir 18 Oktober 2026:

| Pemeriksaan | Hasil |
| --- | --- |
| Backend lint/typecheck/build | Lulus |
| Backend unit/HTTP | 30/30, 8 suite |
| Backend database terisolasi | 41/41, 8 suite; termasuk 9 tes dashboard/akses |
| Frontend lint/typecheck/build | Lulus; build QA dan konfigurasi utama |
| Frontend test | 34/34 |
| Browser QA | 13 pemeriksaan lulus: peran, konfirmasi batal/terima, audit, quota, error/retry, mobile |
| Diff whitespace | Lulus |

Perintah: `npm run lint && npm run typecheck && npm test && npm run build` dari backend; `TEST_DATABASE_URL=postgresql://test:test@127.0.0.1:55439/kalosara_prompt11_test npm run test:db`; frontend `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Kredensial contoh hanya untuk DB disposable lokal. Tidak ada akun/konten QA pada Neon.

Selama implementasi, query advisory lock awal mengembalikan tipe void yang tidak didukung Prisma; hasil query diganti menjadi integer. Tes socket ephemeral sempat terputus; suite baru menggunakan server persisten sepanjang suite. Keduanya diperbaiki dan seluruh rangkaian final lulus, termasuk barrier refresh/reset. Seluruh tes DB hanya melalui TEST_DATABASE_URL localhost/kalosara_*_test dengan upload sementara; runner menolak Neon/non-test. Kegagalan socket EPERM sandbox pada unit test diselesaikan dengan menjalankan ulang izin socket lokal. Tidak dianggap lulus sebelum pengulangan berhasil.

## 6. Daftar manual testing/review

QA browser Chrome headless pada runtime dan akun sementara terisolasi; bukan akun/data Neon:

1. Login admin → angka nol riil dan state aktivitas kosong, navigasi CMS tersedia.
2. Cari email target → kelola akses → konfirmasi batal mempertahankan akun; konfirmasi nonaktif mengubah status daftar.
3. Audit setelah perubahan menampilkan pelaku/entity/requestId dan IP pseudonim; tidak menampilkan password.
4. Upload kosong tetap menampilkan penggunaan/batas upload dan keterangan kuota total belum ditetapkan.
5. Simulasi API503 menampilkan error/retry; pemulihan endpoint dan Coba lagi memuat daftar kembali.
6. Lurah dapat monitoring dan ditolak di halaman pengelolaan; menu pengelolaan tidak tersedia.
7. Masyarakat melihat penolakan `/admin`; API dashboard403, tidak ada data admin yang dirender. Shell/login HTML tetap200, data hanya diambil setelah guard dan backend selalu memeriksa izin.
8. Desktop1440 dan mobile390: inspeksi screenshot, kontrol/tab/pagination mengikuti CSS CMS, tidak ada overflow horizontal.
9. Untuk review pengguna: ulangi dengan akun staf sah setelah migrasi disetujui, tanpa memakai data warga nyata untuk tes. Jangan membuat akun/konten QA pada Neon.

API otomatis juga menguji Origin/CSRF, reauthentication salah, body role ilegal, self change, stale update, pagination/search/empty, akses privat antar-admin, pemisahan LURAH/ADMIN/MASYARAKAT, akun nonaktif/refresh lama, perubahan role/reset password, serta refresh yang bersamaan dengan reset menggunakan barrier lock PostgreSQL nyata. Regresi CMS mencakup draft/expired tersembunyi dan PDF tepat20MiB/oversize/MIME palsu/PRIVATE tidak terbuka.

## 7. Risiko/pekerjaan tertunda

Approval lurah belum diaktifkan karena belum ada kebijakan resmi. Tidak ada MFA/reset email/forced-change-password; reset dimediasi admin dengan verifikasi ulang dan penyerahan privat. Operasi role disediakan melalui backend aman, tanpa UI role umum. Kuota total/retensi log/backup offsite belum ditetapkan; angka penggunaan file memerlukan scan filesystem saat admin meminta inventory. Jangan membuka UPLOAD_ROOT lewat static server. Tidak ada dashboard masyarakat/layanan surat/P12/Tahap02 atau redesign publik pada perubahan ini.

## 8. Status

**SIAP REVIEW Prompt11 termasuk aktivasi Neon.** Seluruh pemeriksaan implementasi final lulus; commit kode `8d38f94` sudah di origin/main. Runtime QA3002/4002 dan PostgreSQL native55439/data sementara dibersihkan. Setelah migrasi disetujui/diterapkan, frontend/backend dijalankan manual3001/4000 dan tetap aktif untuk review; konfigurasi Origin/CSRF/invalidation cocok. Cache Turbopack dev sempat rusak (`invalid digit found in string`), hanya `.next/dev/cache/turbopack` dibersihkan dan startup/smoke diulang hingga lulus. Redis6380 tetap tidak aktif, Docker tidak dioperasikan. Port3000 proyek lain tetap dibiarkan.

Smoke aktivasi baca-saja: readiness backend dan proxy frontend200; shell `/admin` dan `/admin/pengguna`200; empat API dashboard/users/audit/uploads anonim401; `/uploads/test.pdf`404; statistik publik melalui proxy200. Tidak melakukan perubahan akun/role/reset password pada Neon atau memakai kredensial staf. Pengujian matriks izin/autentikasi penuh tetap hasil database terisolasi yang dilaporkan pada bagian5. Berhenti setelah commit/push dokumentasi aktivasi untuk review; tidak mulai Prompt12/Tahap02.
