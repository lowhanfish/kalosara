# Prompt 12 — dashboard masyarakat dan profil akun

## 1. Ringkasan keputusan

Hanya Prompt12 Tahap01. Audit awal HEAD `0641a3a`, main bersih/sinkron origin. Kedua PDF Tahap01, README/CHECKPOINT, frontend/AGENTS dan panduan authentication/data-security Next16.4 terpasang dibaca. Tidak membaca/mengerjakan spesifikasi pelayanan Tahap02. Desain publik/navy-kuning/hero/potret/lambang dan identitas Watundehoa/Puriala/Konawe, AMIRULAH,S.Si dipertahankan.

Tiga halaman `/masyarakat/dashboard`, `/masyarakat/profil`, `/masyarakat/keamanan` memakai bootstrap sesi, login/daftar publik dan guard role MASYARAKAT. HTML shell tidak memuat data pribadi; API memeriksa sesi, role dan status aktif setiap request. Profil berasal dari session userId, tidak menerima userId dari body/query/URL. Query pribadi dipisahkan per user ID, tidak dipersist ke localStorage. Logout terkonfirmasi membersihkan cache query/mutasi/store sebelum kembali ke website utama. Pengunjung baru dengan cookie kedaluwarsa/dicabut tetap dapat membuka form login; kehilangan sesi dari identitas yang sudah aktif menghapus data lalu kembali ke beranda.

Profil hanya nama, alamat opsional dan kontak akun; tanpa NIK/KK/KTP/foto identitas/upload. Kontak penting tidak ditimpa langsung. Karena pengiriman email/SMS belum tersedia, masyarakat mengajukan perubahan lalu petugas memverifikasi identitas **dan kepemilikan kontak baru secara nyata melalui prosedur kantor**. Admin mengonfirmasi dengan password/CSRF sebelum menerapkan. Ini bukan pengiriman kode/email palsu: UI menunjukkan pending, kontak lama tetap berlaku, masa berlaku7hari, dan setelah disetujui semua sesi dicabut. Permintaan dapat diganti/dibatalkan pemilik. Admin bisa menolak tanpa menyatakan kepemilikan kontak telah terverifikasi.

| Kemampuan | MASYARAKAT | ADMIN_KELURAHAN | LURAH/anonim |
| --- | --- | --- | --- |
| GET/PATCH profil masyarakat | Akun sendiri dari sesi | Ditolak | Ditolak |
| Ajukan/batalkan kontak | Akun sendiri, reauth saat mengajukan | Ditolak | Ditolak |
| Ganti password sendiri | Password lama + pilihan cabut sesi lain | Ditolak pada API masyarakat | Ditolak |
| Daftar/review permintaan kontak | Ditolak | Izin admin + reauth + verifikasi nyata | Ditolak |
| Website publik | Terbuka | Terbuka | Terbuka |
| Katalog/status pengajuan | Penanda belum aktif | Tidak ada endpoint pelayanan baru | Tidak ada endpoint pelayanan baru |

Ganti password mempertahankan sesi saat ini; default UI mencabut sesi lain, pengguna dapat memilih mempertahankannya. Semua token reset lama dan permintaan kontak yang belum diverifikasi dibatalkan. Reset admin/nonaktif/perubahan role Prompt11 juga membatalkan pending kontak. Lock akun yang sama dengan login/refresh/reset mencegah perubahan keamanan saling mendahului tanpa pemeriksaan ulang. Audit tidak berisi alamat/kontak/password/token.

## 2. Struktur/file berubah

- Prisma: alamat nullable UserProfile dan satu ContactChange pending per user; migration `20261018010000_citizen_account`.
- `backend/src/modules/account.ts`: profil sendiri, permintaan kontak, password, daftar/review admin, validasi, rate limit, lock/transaksi/audit.
- `app.ts`: mount `/api/v1/account`, `/api/v1/admin/contact-changes`.
- `modules/dashboard.ts`: pending dibatalkan pada tindakan akses sensitif; audit profil/kontak warga tidak masuk ringkasan CMS lurah.
- `auth/validation.ts`, `tests/auth.test.ts`: panjang email <=254 sebelum persistence.
- `tests/account.db.test.ts`, `scripts/test-db.mjs`: sembilan tes integrasi baru dalam runner lokal terisolasi.
- `frontend/app/masyarakat/`, `features/account/`: tiga halaman, layout noindex, login/daftar, client aman, placeholder layanan.
- `app/admin/verifikasi-kontak/`, `admin/pengguna/page.tsx`: daftar/review admin dan tautan masuk.
- `features/auth/runtime.ts`, `auth-provider.tsx`, `tests/auth.test.cjs`: logout/clear cache/redirect dan login dengan cookie dicabut.
- Footer: satu tautan akun masyarakat; robots mengecualikan area masyarakat; README/CHECKPOINT dan laporan ini.

## 3. Cara menjalankan dan review

Setelah migrasi disetujui/diterapkan: backend Node>=22.12, dari backend `npm run db:generate && npm run dev`; frontend `pnpm dev --port 3001`. API4000. Jangan menimpa env/URL Neon. Buka `http://localhost:3001/masyarakat/dashboard` atau tautan Akun masyarakat di footer. Daftar dengan nama/email/password; sesudah sukses, masuk. Membaca website publik tetap tanpa akun.

Profil: simpan nama/alamat opsional. PATCH memakai expectedUpdatedAt; konflik409 meminta muat ulang. Form alamat punya label aksesibilitas eksplisit agar nilai tersimpan tidak ikut menjadi label. Email/telepon sekarang ditampilkan terpisah dari form permintaan perubahan. Telepon baru format E.164 seperti +62…; isikan hanya kontak yang diubah dan password saat ini. Permintaan berlaku7hari; permintaan baru menggantikan yang lama. Pembatalan memerlukan konfirmasi dan hanya pemilik boleh membatalkannya.

Admin: `/admin/pengguna` → Verifikasi perubahan kontak masyarakat → `/admin/verifikasi-kontak`. Cari email akun, tinjau, lakukan verifikasi identitas dan penguasaan kontak baru sesuai prosedur kantor, masukkan password admin, centang bukti verifikasi dan konfirmasi keputusan. Jangan unggah/catat foto identitas, kode OTP atau bukti sensitif ke aplikasi. Approve memeriksa kedaluwarsa, baseline kontak, status aktif/role target dan keunikan kontak, lalu mencabut semua sesi. Kontak duplikat menghasilkan409 tanpa perubahan parsial. Pemilik masuk kembali menggunakan email baru bila email ikut berubah.

Keamanan: masukkan password saat ini dan password baru minimal12 karakter/maksimal72 byte UTF-8, ulangi password baru, pilih cabut sesi lain (default aktif), konfirmasi. Password sama ditolak. Logout menghapus state/cache dan menuju beranda hanya setelah server mengonfirmasi; kegagalan logout ditampilkan sebagai error, bukan sukses palsu.

## 4. Migration/env dan kontrak API

Migration menambah `UserProfile.address VARCHAR(500)` nullable dan tabel `ContactChange` (UUID, userId unik/FK cascade, newEmail/newPhone nullable, baseContactHash64, requestedAt/expiresAt, indeks expiry, constraint minimal satu kontak). Hash baseline hanya metadata internal untuk mendeteksi kontak yang berubah sejak permintaan; tidak diekspos DTO/audit. Tidak ada blob/upload, perubahan data lama/reset/seed, env atau dependency aplikasi baru. Permintaan lama otomatis terhapus saat akun dihapus; yang kedaluwarsa belum punya job retensi otomatis, bisa dibatalkan/diganti/ditolak.

**Migrasi Prompt12 telah diterapkan ke Neon pada18 Oktober2026 setelah persetujuan khusus pengguna, tanpa reset/seed.** Preflight memastikan hanya migrasi yang diizinkan tertunda; deploy berhasil dan status Prisma mutakhir. Metadata baca-saja memastikan alamat nullable dan seluruh kolom ContactChange tersedia. Seluruh tes mutasi hanya pada PostgreSQL native sementara lokal; tidak ada akun/data QA atau tes destruktif pada Neon. Runtime utama sempat dihentikan agar operasi versi baru tidak memakai skema lama, lalu dijalankan kembali manual3001/4000 setelah migrasi. Origin/CSRF/invalidation dan secret cocok; env/URL tidak ditimpa atau ditampilkan, Redis6380/Docker tidak dioperasikan.

| API | Kontrak |
| --- | --- |
| GET `/api/v1/account/profile` | DTO akun sendiri + nama/alamat/pending; query userId ditolak |
| PATCH `/api/v1/account/profile` | Strict displayName, address nullable, expectedUpdatedAt; bukan email/role/userId |
| POST `/api/v1/account/contact-change` | currentPassword + newEmail/newPhone;202 menandakan pending, bukan kontak berubah; MANUAL_OFFICE |
| DELETE `/api/v1/account/contact-change/:id` | Hanya pending milik session user;404 jika milik orang lain |
| POST `/api/v1/account/password` | currentPassword, newPassword, revokeOtherSessions boolean; sesi ini tetap |
| GET `/api/v1/admin/contact-changes` | Admin saja, pagination/search email, DTO tanpa baseline hash |
| POST `/api/v1/admin/contact-changes/:id/review` | Strict decision APPROVE/REJECT, currentPassword, identityVerified:true, contactOwnershipVerified wajibtrue untuk approve |

Semua mutasi memeriksa Origin+CSRF, sesi aktif/role DB, body strict dan transaksi. Kontak/password/review maksimal10 percobaan per15menit/IP. Semua API account/review private,no-store termasuk penolakan autentikasi. Log/audit menggunakan konteks requestId/IP pseudonim harian dari Prompt11; tidak mencatat body kontak/password/alamat. LURAH tidak mendapatkan akses review atau data akun warga lewat dashboard CMS.

Kontrak extension Tahap02: `ServiceCatalogPlaceholder` dan `SubmissionStatusPlaceholder` hanya menerima `availability: {state:'NOT_ACTIVE'}`. Komponen tidak fetch API, tidak membuat status/jumlah/katalog resmi dan tidak menampilkan tombol pengajuan. Integrasi kelak harus mengganti boundary ini dengan adapter backend yang benar-benar diaktifkan, identitas selalu dari session, DTO minimum, ownership tiap pengajuan, status resmi dari server, query key per user, serta loading/empty/error yang membedakan belum aktif dari daftar kosong. Belum ada path API layanan yang dijanjikan; endpoint services/submissions saat ini404 untuk warga terautentikasi. Tidak ada form builder/surat/arsip berkas warga/tabel permohonan/jobPDF Tahap02.

## 5. Hasil lint/typecheck/test/build

Hasil akhir18 Oktober2026:

| Pemeriksaan | Hasil |
| --- | --- |
| Backend lint/typecheck/build | Lulus |
| Backend unit/HTTP |31/31,8suite |
| Backend database terisolasi |50/50,9suite, termasuk9 tes akun |
| Frontend lint/typecheck/build | Lulus, build QA dan konfigurasi utama |
| Frontend tes |36/36, termasuk logout clear-cache dan gagal logout |
| Browser Chrome QA |18 pemeriksaan lulus |
| Smoke utama setelah migrasi |9 endpoint/halaman sesuai ekspektasi |
| git diff --check | Lulus |

Perintah backend: `npm run lint && npm run typecheck && npm test && npm run build`, serta `TEST_DATABASE_URL=postgresql://test:test@127.0.0.1:55439/kalosara_prompt12_test npm run test:db`. Frontend: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Kredensial contoh hanya untuk DB lokal disposable.

Browser awal menemukan label textarea ikut memuat nilai alamat setelah reload; diperbaiki dengan label aksesibilitas eksplisit, lalu alur lengkap diulang lulus. Cookie dicabut pada pengunjung baru kini tetap memungkinkan login; identitas aktif yang kehilangan sesi tetap menghapus cache/redirect. Cache Turbopack dev di volume ini sempat rusak (`invalid digit found in string`); hanya `.next/dev/cache/turbopack` dibersihkan dan startup/smoke diulang lulus. Tidak ada kegagalan pemeriksaan akhir. Database test runner mewajibkan TEST_DATABASE_URL lokal kalosara_*_test, tidak mengambil Neon dari.env, upload sementara dibersihkan. Dua DB native18.4 port55439 memisahkan regresi dan browser; frontend QA3002/backend4002 memakai origin dan secret uji yang terpisah, tanpa mengubah env utama.

## 6. Daftar manual testing

QA browser Chrome headless memakai akun/data palsu **hanya pada DB QA lokal**:

1. Registrasi tanpa KTP → login → identitas minimum, katalog/status berlabel belum aktif, tidak ada tombol pengajuan semu.
2. Ubah nama/alamat opsional, reload memastikan tersimpan; tidak membaca profil warga lain.
3. Ajukan perubahan kontak: konfirmasi batal tidak membuat permintaan; konfirmasi setuju menunjukkan pending dan kontak lama tetap berlaku.
4. Admin meninjau/menyetujui setelah verifikasi nyata; sesi warga dicabut, login ulang dengan email baru.
5. Ubah password (default cabut sesi lain), logout kembali beranda, login password baru.
6. Masyarakat ditolak di admin; API role/IDOR/replay/expiry/duplikat/stale/CSRF/password proof diuji langsung pada DB terisolasi.
7. Simulasi503 profil menunjukkan error/retry tanpa data palsu; pemulihan berhasil. Sesi sementara bermasalah mempertahankan isian pengguna, sesi definitif tidak valid membersihkan data.
8. Screenshot desktop1440/mobile390 diperiksa; tidak ada overflow horizontal atau error JavaScript.

Untuk review pengguna sesudah aktivasi Neon: gunakan akun warga sendiri untuk aktivitas yang memang diinginkan, jangan membuat akun/data QA atau tes destruktif pada database pengguna. Prosedur verifikasi kontak membutuhkan petugas yang sah, bukan simulasi bukti pada Neon.

## 7. Risiko/pekerjaan tertunda

Verifikasi kontak dimediasi petugas; sistem belum mengirim email/SMS/kode, dan kualitas verifikasi nyata bergantung prosedur kantor. Tidak ada unggah bukti identitas. Permintaan pending kedaluwarsa tidak dipakai untuk approve tetapi retensi otomatis belum ditambahkan. Penghapusan telepon belum disediakan; kontak baru harus valid. Password lama admin/warga diverifikasi ulang; MFA, notifikasi perubahan kontak, reset email dan forced password change belum tersedia. Pilihan mempertahankan sesi lain berarti sesi tersebut tetap aktif secara sengaja; default UI mencabutnya.

Tidak ada perubahan kebijakan upload PRIVATE/PUBLIC/legacy/20MiB/optimasi atau Docker. Tidak ada konten resmi buatan. Prompt13/hardening produksi, Prompt14/deployment dan pelayanan Tahap02 belum dimulai.

## 8. Status

**SIAP REVIEW Prompt12 termasuk aktivasi Neon.** Seluruh pemeriksaan akhir lulus. QA3002/4002 dan PostgreSQL native55439 dihentikan; DB/akun/kredensial/upload sementara dibersihkan. Build akhir kembali ke env utama dan proxyAPI4000. Frontend3001/backend4000 manual aktif untuk review, port3000 proyek lain tidak disentuh. README/CHECKPOINT diperbarui; commit/push origin/main kemudian berhenti, tidak memulai Prompt13/Tahap02.

Smoke utama baca-saja setelah migrasi: readiness backend/proxy200; tiga shell masyarakat dan halaman verifikasi kontak admin200; GET profil/review anonim401, profil memakai private,no-store; robots200 mengecualikan `/masyarakat/`. Tidak login akun staf/warga atau mengubah profil/kontak/password pada Neon; seluruh pengujian fungsional penuh tetap pada DB QA lokal sebagaimana bagian5.
