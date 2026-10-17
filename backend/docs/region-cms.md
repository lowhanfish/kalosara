# Prompt 10 — statistik, potensi, fasilitas, lokasi dan kontak

Tanggal: 17 Oktober 2026, Asia/Makassar. Audit awal HEAD `2af2407`, branch main, working tree bersih. Acuan: instruksi global/Prompt 10 PDF1 Tahap 01, PDF2 Tahap 01, README, CHECKPOINT, frontend/AGENTS.md serta panduan fetching/CSS Next.js terpasang 16.4.0. Runtime tetap manual dengan PostgreSQL Neon dan Redis KALOSARA 6380. Desain ditunda sesuai pengguna; hero, potret terpisah dan lambang Konawe dipertahankan. Prompt 11/Tahap 02 tidak dimulai.

## 1. Ringkasan keputusan

StatisticSnapshot menyimpan angka agregat per periode tahun atau bulan, sumber, tanggal data, tanggal pembaruan, status dan versi. Indikator tetap: jumlah penduduk, laki-laki, perempuan, kepala keluarga (jumlah), RT dan RW. Tidak ada tabel/kolom NIK, nomor KK, daftar penduduk atau identitas perorangan. Angka belum tersedia disimpan null, bukan nol. Minimal satu indikator; nilai integer 0–10.000.000; bila total penduduk/laki-laki/perempuan semuanya diisi, jumlah harus cocok. Periode unik, rentang 1900–2200. Tidak mengarang atau seed angka produksi.

Facility dan Potential memuat nama publik, deskripsi, kategori, lokasi, koordinat berpasangan opsional, foto/alt opsional, status dan versi. Tidak menyimpan profil pemilik UMKM, telepon pemilik atau data individu. Foto harus PUBLIC aktif dan benar-benar gambar; relasi foreign key serta pemeriksaan arsip media mencegah referensi putus. Status DRAFT/PUBLISHED/ARCHIVED, soft archive, role ADMIN_KELURAHAN aktif, sesi, Origin/CSRF, optimistic version, transaksi serializable dan audit mengikuti CMS sebelumnya. LURAH tidak mendapat izin kelola tambahan.

`/admin/wilayah` mengelola ketiga modul dengan search/filter/pagination server-side; `/statistik` menampilkan tabel HTML ber-caption/header scope, periode/sumber/tanggal dan filter; `/potensi` menyediakan daftar fasilitas/potensi dengan kategori/cari/pagination, gambar thumbnail lazy dan tautan lokasi. Beranda kini memakai snapshot terbit paling baru; angka contoh 3.842+/1.250+/4 lingkungan/12 RT-RW dihapus, kosong menjadi tanda “—” dan keterangan menunggu data resmi. Data statistik no-store sehingga perubahan muncul tanpa deploy atau TTL.

Kontak membaca alamat/jam/telepon/email/tautan resmi dari pengaturan yang sudah ada. Koordinat kantor dikelola di profil/pengaturan. Peta embed ringan dimuat hanya setelah tombol persetujuan; pemberitahuan menjelaskan koneksi ke OpenStreetMap/IP/browser. Pengunjung dapat menutup iframe kembali. Alamat dan tautan lokasi menjadi fallback; koordinat yang belum diisi tidak diganti koordinat perkiraan. Tidak ada GIS server, API key, library peta berat atau layanan peta berbayar. Acuan penyedia: [OpenStreetMap](https://www.openstreetmap.org/export).

Tidak membuat formulir pengiriman pesan/ContactMessage. Pemilih topik ContactGuide yang sudah ada hanya navigasi halaman, jelas menyatakan tidak mengirim data pribadi; POST kontak tidak disediakan (404). Karena tidak ada penerimaan pesan, rate limit/honeypot pesan tidak berlaku pada modul ini.

## 2. Struktur/file berubah

- Prisma schema + `20261017000000_region_information`: StatisticSnapshot, Facility, Potential, indeks dan foreign key foto.
- `backend/src/modules/cms/region.ts`, `src/app.ts`: router statistik/fasilitas/potensi publik/admin, validasi ketat, transaksi, DTO whitelist, role dan audit.
- `cms/storage.ts`, `media.ts`: source facilities/potentials dan proteksi arsip relasi foto baru. `scripts/test-db.mjs`, package scripts dan dua suite region: regresi DB/validasi.
- `frontend/lib/region.ts`: kontrak data, format angka/tanggal dan URL peta yang dibatasi koordinat numerik valid.
- `frontend/app/admin/wilayah/page.tsx`, navigasi AdminAccess dan MediaLibrary: CMS tiga modul serta pemilih foto PUBLIC.
- `/statistik`, `/potensi`, `/kontak`, `features/region/location-map.tsx`: kanal publik/table/peta opt-in dan kontak resmi.
- Beranda, menu/search dan sitemap: snapshot terbit, navigasi potensi/fasilitas, indeks rute baru. Tes frontend region dan konfigurasi test TypeScript.
- README/CHECKPOINT/laporan ini. Tidak mengubah gambar desain, CSS utama, upload lama, file env atau Docker.

## 3. Cara menjalankan dan kontrak API

Frontend manual `pnpm dev --port 3001`, backend Node 22.12+ `npm run dev` pada 4000. Buka `/admin/wilayah` dengan admin terprovisi. Pilih Statistik agregat, isi periode/sumber/tanggal dan angka yang diketahui, simpan draft, periksa lalu terbitkan. Data tidak diketahui dibiarkan kosong. Jangan memasukkan data pribadi dalam metadata bebas. Pilih Fasilitas/Potensi untuk lokasi dan foto; gunakan pustaka media (PRIVATE default) dan pilih PUBLIC hanya untuk materi disetujui. Pilihan foto dicari server-side, maksimum 50 hasil per pencarian; unggah satu file/request. Kontak/koordinat kantor tetap di `/admin/profil`.

| Endpoint | Perilaku |
| --- | --- |
| `GET /api/v1/admin/region/statistics` | ADMIN aktif; page/limit/status/period/search sumber |
| `PUT /api/v1/admin/region/statistics/:id` | ADMIN+Origin/CSRF; create expectedVersion 0/update versi terkini |
| `GET /api/v1/public/region/statistics` | PUBLISHED saja; page/limit/period/search sumber, urut periode desc |
| `GET /api/v1/admin/region/:kind` | kind facilities/potentials; page/limit/status/category/search nama |
| `PUT /api/v1/admin/region/:kind/:id` | create/edit/publish/archive, validasi koordinat/foto/versi |
| `GET /api/v1/public/region/:kind` | PUBLISHED saja, foto PUBLIC aktif atau tanpa foto; filter/cari/pagination |

Semua respons memakai envelope/requestId. Limit default10/maksimum 50; halaman publik statistik 5 snapshot dan potensi 9 item. Unknown fields ditolak. Periode YYYY atau YYYY-MM; tanggal data ISO-date; sumber 1–300 karakter. Lokasi 1–300, nama 1–160, kategori 1–100, deskripsi maksimal 10.000; teks dirender sebagai teks biasa. Koordinat latitude ±90/longitude ±180 harus berpasangan. Foto optional uuid dan alt wajib jika dipilih. Guest 401, role/inactive/CSRF 403, input 400, konflik versi/periode 409. Delete melalui ARCHIVED dengan konfirmasi.

## 4. Migration/env dan aktivasi

Migration baru hanya menambah tiga tabel, relasi foto dan indeks. Tidak mengubah data lama. Tidak ada env/dependency aplikasi baru. Source upload baru facilities/potentials tersimpan fisik di backend/public/uploads/<asal>/images atau documents sesuai jenis; UI foto hanya memilih gambarPUBLIC. Database tetap hanya metadata/path/relasi, batas 20 MiB/signature/optimasi/legacy/proteksiPRIVATE tidak berubah. Tidak menyalakan PostgreSQL Docker.

Seluruh tujuh migration berhasil diuji dari database kosong pada PostgreSQL native 18.4 disposable port 55439. Database regresi dan browser dipisahkan. TEST_DATABASE_URL runner wajib local kalosara_*_test; guard Neon/non-test tetap berlaku. Upload/akun/fixture QA diisolasi.

Status aktivasi Neon: **berhasil pada 17 Oktober 2026 setelah pengguna memberikan persetujuan eksplisit untuk Prompt 10**. `prisma migrate deploy` menerapkan `20261017000000_region_information`; `prisma migrate status` melaporkan skema mutakhir. DATABASE_URL yang ada dipakai tanpa ditimpa/ditampilkan. Tidak ada reset, seed, akun/konten QA atau tes destruktif di Neon. Izin migrasi tidak mencakup memulai prompt berikutnya.

APP_ORIGIN/SITE_ORIGIN/FRONTEND_INTERNAL_URL tetap localhost 3001, API 4000; secret invalidasi lokal diperiksa sama tanpa ditampilkan/diubah. Mutasi memakai outbox HMAC tag public-content yang sudah ada, tidak menambah queue/Redis. Retry dan invalidasi layout memperbarui cache kontak/settings; list baru no-store.

## 5. Hasil lint/typecheck/test/build

| Pemeriksaan | Hasil |
| --- | --- |
| Backend lint/typecheck/build Node 22.12 | Lulus |
| Backend unit/HTTP | 30/30 lulus |
| Backend integration PostgreSQL | 32/32, 7 suite lulus |
| Tujuh migration dari DB kosong | Lulus |
| Frontend lint/typecheck/build Next 16.4 | Lulus |
| Frontend tes | 34/34 lulus |
| Diff whitespace | Lulus |

Perintah: backend `npm run lint && npm run typecheck && npm test && npm run build`; `TEST_DATABASE_URL=postgresql://test:test@127.0.0.1:55439/kalosara_prompt10_test npm run test:db`. Frontend `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Contoh password hanya milik database disposable lokal, bukan Neon. Build QA memakai env proses API 4002/SITE 3002 sementara; file env tidak diubah. Build akhir dikembalikan ke konfigurasi utama 4000/3001 sebelum cleanup.

## 6. Pengujian manual/browser

Chrome pada hasil build produksi, frontend 3002/backend 4002, akun/database/file sementara terisolasi:

- Login UI; publish snapshot periode 2026-10 dengan sumber “data dummy terisolasi”; edit 100→120 lewat form; halaman statistik menampilkan 120 tanpa rebuild/restart.
- Tabel ber-caption, header kolom dan scope row; angka belum diketahui tetap “Belum tersedia”, bukan 0. Filter periode dan pagination diuji melalui HTTP; beranda hanya mengambil snapshot terbit terbaru.
- Publish fasilitas/potensi lewat UI; deskripsi berisi teks script tetap tidak dieksekusi. Periode/sumber/tanggal ada pada HTML server.
- Update settings kontak lewat API yang sudah ada pada DB uji: alamat langsung tercermin pada halaman setelah invalidasi HMAC. Lima event terkirim, 0 pending saat diperiksa.
- Peta: nol request OpenStreetMap sebelum tombol persetujuan; tepat satu setelahnya; tutup peta menghapus iframe. Request penyedia diintersep fixture browser sehingga tidak perlu akses luar saat QA. Alamat/tautan tetap ada; unit menolak koordinat invalid dan menerima 0/0 yang valid secara numerik.
- 24 kombinasi enam halaman (beranda/statistik/potensi/fasilitas/kontak/adminwilayah) × empat lebar 360/768/1024/1440: tanpa overflow, gambar rusak, pageerror atau eksekusi teks script. Screenshot tabel desktop dan kontak seluler diperiksa visual.
- Dengan JavaScript dimatikan, kontak/alamat tetap tersedia dan peta tidak dimuat. Markup tabel statistik terkirim dari server, tetapi pembukaan hasil streaming Next.js memerlukan JS (lihat batasan); tidak mengklaim pengalaman statistik sepenuhnya tanpa JavaScript.
- Backend QA dihentikan untuk memeriksa state gangguan statistik/potensi/beranda; tidak ada fallback angka demografi palsu.

Integration mencakup anonymous/citizen/LURAH/inactive, Origin/CSRF, draft/edit/publish/archive, DTO bebas identitas, penolakan NIK/resident/KK fields, sumber/tanggal/periode, konsistensi total/negatif/pecahan, unique period/versi 409, search/filter/pagination, koordinat/foto invalid, upload ke asal baru, private 404 dan pencegahan arsip media terpakai. Regresi PDF 20 MiB dan isolasi media Prompt 09 tetap lulus.

## 7. Risiko/tertunda

Tidak ada data resmi statistik/potensi/fasilitas dari pengguna; database produksi tidak diisi contoh. Kosong/error dipertahankan sampai data disetujui tersedia. Metadata sumber/deskripsi bebas masih memerlukan review admin agar tidak menulis data pribadi di sana; schema/API tidak menyediakan tempat untuk identitas individu.

Koordinat kantor belum boleh dikarang. Ketersediaan peta bergantung penyedia/jaringan, sehingga alamat/tautan fallback tetap penting. Tidak ada pengiriman pesan kontak sehingga tidak ada inbox/notification/rate-limit pesan palsu.

Statistik memakai tabel (tanpa chart/SDK). Streaming Next.js yang sudah ada masih membutuhkan JavaScript untuk membuka konten dinamis walau markup tabel berada di HTML server; perbaikan global no-JS ditunda agar tidak mengubah arsitektur di luar prompt. Tidak ada uji beban/HTTPS produksi, pemulihan backup atau deployment VPS pada prompt ini.

Redis 6380 saat audit tidak aktif; Docker daemon socket tidak ada. Tidak menyalakan daemon, mengubah Redis proyek lain atau membuat image. Prompt 10 tidak memakai Redis sehingga pemeriksaan kode/QA tetap berjalan. Frontend/backend utama tetap manual.

## 8. Status

**SIAP REVIEW Prompt 10; aktivasi Neon berhasil dengan persetujuan pengguna.** Commit/push ke origin/main setelah pemeriksaan lulus, lalu berhenti. Tidak melanjutkan Prompt 11 atau Tahap 02. Penataan/desain besar tetap ditunda sesuai pengguna.

Cleanup akhir: frontend QA 3002, backend QA 4002 dan PostgreSQL native 55439 dihentikan. Database, akun, upload, screenshot/fixture dan kredensial QA sementara dibersihkan; pada tahap QA tidak ada perubahan data Neon. Build akhir memakai environment utama 3001/4000 dan berhasil.

Smoke aktivasi Neon: readiness serta statistics/facilities/potentials pada backend 4000 dan proxy frontend 3001 HTTP 200; ketiga daftar total 0. Beranda, /statistik, /potensi, /kontak dan /admin/wilayah HTTP 200 tanpa state gangguan wilayah. Seluruh pemeriksaan baca-saja; tidak menambahkan data resmi atau contoh. **SIAP REVIEW Prompt 10 termasuk aktivasi Neon.**
