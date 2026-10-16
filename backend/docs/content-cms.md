# Prompt 09 — kanal informasi KALOSARA

Tanggal laporan: 17 Oktober 2026 (Asia/Makassar). Audit dimulai pada HEAD `867f095`, branch main, working tree bersih. Acuan: kedua PDF Tahap 01, README, CHECKPOINT, frontend/AGENTS.md serta dokumentasi terpasang Next.js 16.4.0 tentang forms, fetching data dan caching. Prompt 10 dan Tahap 02 tidak dikerjakan.

## 1. Ringkasan keputusan

Empat kanal memakai ContentItem untuk lifecycle bersama, dengan payload satu-ke-satu Announcement, Event, Gallery dan PublicDocument. Album memiliki GalleryPhoto berelasi MediaAsset; database hanya menyimpan metadata/path/relasi. Semua mutasi dibatasi ADMIN_KELURAHAN aktif dengan sesi, Origin/CSRF, optimistic version, transaksi serializable dan audit. LURAH tetap tanpa izin kelola tambahan. Penghapusan dilakukan melalui ARCHIVED dengan konfirmasi; tidak ada hard-delete publik.

Pengumuman disortir pinned lebih dahulu, menyaring startsAt mendatang dan expiredAt yang telah lewat pada server setiap request. Agenda berupa daftar dengan filter mendatang/berlangsung (end >= sekarang) atau lampau. Galeri publik maksimal 4 album per halaman, setiap album maksimal 12 foto PUBLIC aktif dengan alt per-foto, thumbnail WebP 480px, lazy-load dan tautan display 1200px. API paginasi default 10, maksimum 50 item. Isi teks ditampilkan melalui escaping React, tidak dieksekusi sebagai HTML.

Dokumen draft/arsip boleh menunjuk PDF privat milik pengunggah. Publikasi memerlukan PDF PUBLIC aktif yang sudah disetujui pengelola; memilih PUBLISHED tidak pernah mengubah visibilitas file secara otomatis. File PUBLIC memang dapat diunduh langsung melalui endpoint media meskipun item CMS kemudian diarsipkan; admin harus memilih PRIVATE saat upload untuk materi sensitif. Media privat hanya lewat endpoint terautentikasi milik pengunggah. Arsip media yang masih dirujuk album/dokumen ditolak, termasuk referensi draft/arsip, agar tidak memutus konten.

Beranda mengikat panel pengumuman/agenda/galeri ke CMS, mempertahankan susunan, hero, token, CSS dan aset desain `961c540`. Pemberitahuan statistik/ilustrasi contoh tetap terlihat; statistik belum dikembangkan. Tidak ada publikasi resmi, angka, agenda atau dokumen seed baru. Identitas tetap Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe; Lurah AMIRULAH, S.Si.

## 2. Struktur/file berubah

- `backend/prisma/schema.prisma` dan migration `20261016040000_public_content`: ContentKind, lifecycle, empat model kanal, foto album, foreign key media dan indeks.
- `backend/src/modules/cms/content.ts`, `src/app.ts`: router publik/admin, validasi terpisah per kanal, interval, publikasi, media, konflik versi, pencarian/filter/pagination.
- `backend/src/modules/cms/media.ts`, `storage.ts`, `cache-invalidation.ts`: proteksi referensi baru, asal upload tervalidasi dan tag invalidasi baru.
- `backend/src/tests/content.test.ts`, `content.db.test.ts`, `db-safety.ts`, lima suite DB lama, `scripts/test-db.mjs`, `package.json`: pengujian kanal dan pengaman database; ekspektasi storageKey suite lama disesuaikan dengan penyimpanan disk yang sudah berlaku.
- `frontend/app/admin/konten/page.tsx`: CRUD empat kanal, pemilih media dengan pencarian, konfirmasi arsip, versi edit, state loading/error/empty, notice invalidasi tertunda; cache query per user.
- `frontend/lib/content.ts`, `features/content/public-list.tsx`, empat halaman publik, `app/page.tsx`: pembacaan server, filter, pagination, state kosong/error dan integrasi beranda.
- `frontend/features/cms/admin-access.tsx`, `media-library.tsx`, `lib/cache-signature.ts`, `tests/news.test.cjs`: navigasi editor, asal upload baru dan validasi HMAC/tag.
- README dan CHECKPOINT diperbarui. CSS publik, gambar desain, Docker/Redis dan file env tidak diubah.

## 3. Cara menjalankan dan kontrak API

Runtime utama yang terverifikasi: frontend manual localhost:3001, backend manual localhost:4000, Redis KALOSARA healthy localhost:6380. Port 3000/proses lain tidak disentuh. Jalankan backend dari backend (`npm run dev`), frontend dari frontend (`pnpm dev --port 3001`). Gunakan Node 22.12+ untuk backend.

Setelah migration diizinkan/diterapkan, buka `/admin/konten`, login admin terprovisi, pilih kanal, buat draft, pilih media yang sesuai, simpan, buka ulang untuk edit/publish/arsip. Search media mencari nama file server-side; hasil pemilih dibatasi 50 file per pencarian. Upload satu file per request, pilih asal dan akses eksplisit; default PRIVATE. Pilihan tanggal editor mengikuti waktu lokal perangkat, disimpan ISO UTC; tampilan publik eksplisit WITA. PDF resmi dapat dikategorikan Standar pelayanan, Maklumat, Kontak atau kategori lain dari admin. Halaman informasi publik juga menautkan kontak kelurahan.

| Endpoint | Akses / perilaku |
| --- | --- |
| `GET /api/v1/admin/content/:kind` | Admin; search, status, page, limit; semua lifecycle |
| `PUT /api/v1/admin/content/:kind/:id` | Admin + Origin/CSRF; create expectedVersion=0 atau update versi terkini |
| `GET /api/v1/public/content/:kind` | Anonim; hanya PUBLISHED yang memenuhi jadwal/media |
| `GET /api/v1/public/media/:id` | Hanya PUBLIC aktif; PDF attachment, nosniff, sandbox/no-store |
| `GET /api/v1/admin/media/:id/file` | Admin; PRIVATE hanya pengunggah |

`kind`: announcements, events, galleries, documents. Payload dasar: kind, title (1–200), content (maksimal 30.000), status, expectedVersion. Pengumuman: pinned, startsAt/expiredAt nullable. Agenda: start/end ISO ber-offset dan location (1–300), end >= start. Galeri: photos 1–12 entri unik `{mediaId,alt}` (alt 1–300). Dokumen: category (1–120), fileId PDF. Field asing ditolak. Query event period upcoming/past; dokumen category exact-match. Respons envelope/requestId tetap berlaku. Konflik 409 meminta muat ulang; input/media salah 400, guest 401, role/CSRF/inactive 403.

## 4. Migration/env

Migration hanya menambah tabel/enum/foreign key/indeks, tidak mereset atau menimpa tabel lama. Telah diterapkan dan diuji pada dua database disposable PostgreSQL native 18.4 di 127.0.0.1:55439, terpisah dari Neon dan Docker.

**Belum diterapkan ke Neon.** Auto-review menolak tindakan migrate deploy ke database persisten karena menilai otorisasi tersebut belum ada; tidak ada eksekusi/bypass. Aktivasi runtime utama memerlukan persetujuan eksplisit untuk menjalankan `cd backend && npm run db:deploy` memakai DATABASE_URL yang ada. Sebelum itu endpoint empat kanal pada runtime utama belum siap digunakan; UI publik menampilkan state gangguan. Tidak ada reset, seed, tes atau akun QA di Neon.

Tidak ada env/dependency aplikasi baru. APP_ORIGIN dan FRONTEND_INTERNAL_URL backend serta SITE_ORIGIN frontend sudah menunjuk http://localhost:3001; API_INTERNAL_URL http://localhost:4000. Shared secret invalidasi diperiksa cocok tanpa ditampilkan atau diubah. Mutasi menulis invalidasi `public-content` dalam transaksi dan memakai pengiriman HMAC/retry yang ada; receiver mengekspirasi layout publik. Pembacaan kanal dan beranda no-store agar expiry tidak menunggu TTL.

Upload baru memakai allowlist asal announcements/events/galleries/documents selain asal lama, dengan pola `<asal>/<images|documents>/`. Contoh PDF informasi publik: `documents/documents/<uuid>.pdf`. Root tetap backend/public/uploads; legacy dan API URL lama dipertahankan. Tidak ada static mount folder public. Ukuran maksimal tepat 20 MiB (20.971.520 byte), signature/MIME/ekstensi, parse PDF, batas gambar 25MP, re-encode, varian dan batas satu file/dua proses tetap berlaku. Pengujian memakai folder upload sementara terisolasi yang dibersihkan runner.

## 5. Hasil lint/typecheck/test/build

| Pemeriksaan akhir | Hasil |
| --- | --- |
| Backend lint / typecheck / build, Node 22.12 | Lulus |
| Backend unit/HTTP `npm test` | 28/28 lulus |
| Backend `TEST_DATABASE_URL=... npm run test:db` | 25/25 lulus, 6 suite |
| Seluruh enam migration pada database kosong native | Lulus |
| Frontend lint / typecheck / build Next 16.4.0 | Lulus |
| Frontend `pnpm test` | 31/31 lulus |
| `git diff --check` | Lulus |
| CSS/aset desain | Tidak diubah |

Runner tes DB wajib TEST_DATABASE_URL eksplisit, host localhost/127.0.0.1, nama `kalosara_*_test`, tanpa query. Tidak mengambil URL Neon dari .env. Pengaman setiap suite juga menolak invokasi Vitest langsung terhadap database lain. Tanpa URL, runner terverifikasi berhenti sebelum menjalankan migration/tes. Gunakan database **kosong disposable khusus tiap run** karena assertion publik mengasumsikan tidak ada fixture proses QA lain.

Kegagalan awal yang telah diselesaikan: sandbox menolak socket/shared-memory sehingga tes dijalankan dengan izin lokal; cache build Turbopack macOS rusak dibersihkan; percobaan build saat server QA masih menggunakan artefak menimbulkan konflik cache, diselesaikan dengan menghentikan hanya server QA lalu rebuild. Suite regresi sempat tercampur fixture browser; dijalankan ulang di database disposable kedua dan seluruhnya lulus. Tidak ada kegagalan pemeriksaan kode tersisa.

## 6. Manual/browser testing

Chrome headless pada build produksi, backend 4002 dan frontend 3002 terisolasi, akun admin QA acak hanya di database uji. Proxy browser mengarahkan hanya request API sesi QA ke 4002 karena rewrite build utama tetap menunjuk 4000; SSR memakai API_INTERNAL_URL QA. Proxy runtime utama bukan bagian pengujian mutasi ini.

- Login UI, create/publish pengumuman pinned, agenda, album ber-alt dan dokumen kategori standar pelayanan; upload gambar WebP dan PDF lewat pustaka media berhasil. Draft/edit/arsip, konflik, pagination/filter, role dan private-owner diverifikasi pada suite HTTP terintegrasi.
- Beranda, pengumuman, agenda, galeri, informasi publik dan admin/konten pada 360/768/1440: **18 kombinasi lulus**, tanpa overflow, gambar rusak, pageerror atau eksekusi teks `<script>`. Gambar lazy-load diuji setelah scroll. Screenshot desktop beranda dan mobile admin diperiksa visual.
- HTML server anonim empat kanal memuat publikasi QA dan meng-escape teks berbahaya. Galeri menghasilkan thumbnail 480px; varian diverifikasi via decode Sharp.
- HMAC public-content nyata: 7 event terkirim, 0 pending pada pemeriksaan akhir; tes unit meliputi signature tampered/expired dan retry gagal.
- HTTP integration mencakup anon/citizen/LURAH/inactive, Origin/CSRF, draft/arsip/future/expired, expiry segera setelah daftar dibaca, pinned, pagination, agenda mendatang/lampau dan interval salah.
- PDF PUBLIC dan PRIVATE tepat 20 MiB diterima ke disk; +1 byte 413, disguise/traversal ditolak; PDF public attachment tanpa login, private 404 publik/403 admin lain, owner 200. URL static `/uploads/...` dan `/public/uploads/...` 404. Media terpakai album/dokumen tidak bisa diarsipkan.

Langkah reviewer setelah izin migration Neon: login `/admin/konten`; buat draft di tiap kanal; publish materi yang telah disetujui; cek empat halaman/beranda; set expiry pengumuman yang dekat lalu reload setelah waktunya; cek agenda lampau/mendatang; arsipkan; pastikan file privat tetap 404 untuk guest. Tidak perlu membuat konten resmi palsu untuk review.

## 7. Risiko/pekerjaan tertunda

Aktivasi Neon menunggu persetujuan; migration telah diuji pada PostgreSQL native 18.4, belum diverifikasi terhadap versi Neon pengguna. Tidak ada pengujian destruktif database pengguna, deployment HTTPS, uji beban, antivirus atau quota storage total. Album dibatasi 12 foto dan API maksimal 50 item; situs no-store menambah query baca pada empat kanal tetapi menjamin expiry tanpa job berat. Pustaka media memerlukan pencarian untuk file di luar 50 hasil teratas. Tidak ada reordering drag-and-drop atau FAQ opsional. Tidak ada konten resmi seed. Backup database dan folder upload harus berpasangan.

File PUBLIC merupakan keputusan publikasi file tersendiri; mengarsipkan item CMS tidak mencabut URL file PUBLIC yang sudah disetujui. Untuk rahasia gunakan PRIVATE sejak upload; UI memberi penjelasan ini. Media dengan referensi draft/arsip tetap dilindungi dari arsip sehingga penyimpanan perlu dimonitor.

Statistik/ilustrasi pada desain lama tetap berlabel contoh dan menunggu Prompt 10. Pelayanan surat Tahap 02, dashboard prompt berikutnya dan perubahan infrastruktur Docker tidak dikerjakan.

## 8. Status

**SIAP REVIEW untuk kode Prompt 09 dan hasil pengujian terisolasi. Aktivasi database/runtime utama BELUM SIAP sampai migration Neon disetujui.** Commit dan push hanya kode/dokumentasi setelah pemeriksaan lulus, lalu berhenti untuk review. Tidak melanjutkan Prompt 10.

Cleanup akhir: frontend QA3002, backend QA4002 dan PostgreSQL native55439 telah dihentikan; database, akun, file, fixture dan kredensial uji sementara dibersihkan. Proses utama frontend3001/backend4000 serta Redis6380 tetap berjalan.
