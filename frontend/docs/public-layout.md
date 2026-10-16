# Prompt 05 — design system dan layout publik

## 1. Ringkasan keputusan

Audit dilakukan dari working tree bersih `8b05260` pada `main`; Prompt 01–04 telah tersedia. CHECKPOINT, README, PDF1 Prompt 05 dan panduan Tahap 01 menjadi acuan. `frontend/AGENTS.md` serta dokumentasi Next terpasang 16.4.0 tentang layout/page, server/client components, error/retry, not-found, loading, dan fetch/revalidate dibaca. Dependency tidak ditambah.

Arah visual: hijau pemerintahan, latar hangat, aksen emas, tipografi Georgia untuk judul dan Arial untuk isi; seluruh font tersedia lokal. Konten dibatasi 72rem. Ilustrasi SVG orisinal diberi penanda bahwa gambar bukan lokasi sesungguhnya. Tidak ada nama pejabat, alamat, statistik, atau berita rekaan yang disajikan sebagai fakta.

Token warna, tipografi, spacing dasar, radius, focus dan shadow berada di `app/globals.css`. Komponen tersedia: Button, Badge, Card, Input, Select, Table, Dialog, Breadcrumb, Skeleton, EmptyState, Toast. Dialog memakai elemen native, focus trap Tab/Shift+Tab, Escape dan pengembalian fokus ke trigger; tabel dapat digulir dalam region berlabel. Skip link mengarah ke main yang dapat menerima fokus; icon dekoratif disembunyikan dari pembaca layar. Animasi menghormati reduced motion.

Header/footer membaca identitas dari satu adapter backend. Endpoint baca `GET /api/v1/public/settings` menggunakan AppSetting yang sudah ada dan hanya memproyeksikan whitelist field publik dengan validasi. Editor/CMS tetap Prompt 06. Fetch server timeout 3 detik dan revalidasi 60 detik. Kegagalan backend memakai identitas contoh yang jelas ditandai, tanpa nomor telepon atau alamat palsu.

Pencarian pada tahap ini mencari nama/deskripsi menu, bukan berita yang belum tersedia. Form kontak hanya menavigasi topik; tidak mengirim pesan. Tombol salin tautan benar-benar menyalin alamat dan memberi feedback toast. Pelayanan menjelaskan bahwa pengajuan surat belum tersedia.

Penyesuaian auth yang diperlukan untuk halaman publik: guest biasa (UNAUTHENTICATED tanpa identitas sebelumnya) tidak dialihkan ke beranda. RouteGuard tetap mengalihkan guest pada area protected; sesi yang dicabut atau identitas yang sebelumnya dikenal tetap dibersihkan dan dialihkan. Regresi 16 kasus Prompt 04 dipertahankan dan ditambah uji konteks guest.

## 2. Struktur/file berubah

- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`: shell bersama, metadata, homepage dan token.
- `app/{profil,berita,pengumuman,agenda,galeri,informasi-publik,statistik,kontak,pelayanan}/page.tsx`: sembilan halaman kerangka dengan empty state yang jujur.
- `app/pencarian/page.tsx`, `app/maintenance/page.tsx`, `app/500/page.tsx`, `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/loading.tsx`: pencarian, loading dan pemulihan error. Boundary menggunakan `retry` sesuai Next versi terpasang.
- `components/site/`: header/footer, search form, ilustrasi, halaman kerangka bersama, contact guide, share button, system state.
- `components/ui/`: komponen design system; Button yang sudah ada diperluas.
- `lib/public-pages.ts`, `lib/site-settings.ts`: registry navigasi, pencarian dan adapter identitas tervalidasi.
- `features/auth/{runtime.ts,auth-provider.tsx}`, `tests/auth.test.cjs`: konteks invalidasi/guest publik dan styling recovery tanpa menghapus fitur refresh Prompt 04.
- `tests/public-site.test.cjs`, `tsconfig.test.json`: pengujian pencarian dan URL pengaturan.
- `backend/src/modules/public-settings.ts`, `backend/src/app.ts`, `backend/src/tests/public-settings.test.ts`, `backend/package.json`: endpoint baca settings publik dan tes.
- README, CHECKPOINT, dokumen ini dan catatan integrasi pada dokumentasi auth.

## 3. Cara menjalankan

Ikuti setup database/backend pada README root. Jalankan backend dengan `npm run dev`, frontend dengan `pnpm dev`; buka `http://localhost:3000`. APP_ORIGIN backend harus sesuai origin browser. Semua halaman publik dapat dibaca tanpa akun. Untuk pemeriksaan ini preview lokal memakai `http://127.0.0.1:3100` dan APP_ORIGIN yang sama; proses preview sementara dihentikan sesudah QA.

Pemeriksaan:

```sh
cd frontend
pnpm lint
pnpm typecheck
pnpm test
pnpm build

cd ../backend
npm run lint
npm run typecheck
npm test
npm run build
```

Build Turbopack pada volume macOS ini membutuhkan cache generated bersih (`.next/cache/turbopack`, karena AppleDouble) dan izin socket worker. Supertest backend membutuhkan izin socket lokal. Tidak ada perubahan konfigurasi produksi untuk mengatasi pembatasan lingkungan tersebut.

## 4. Migration/env dan kontrak identitas

Tidak ada migration, env, rahasia, atau dependency baru. Endpoint memakai DATABASE_URL dan API_INTERNAL_URL yang sudah ada. AppSetting tetap skema lama; hanya key berikut yang dapat dibaca publik:

| Key | Bentuk nilai JSON |
| --- | --- |
| `site.name` | string nama kelurahan |
| `site.address` | string alamat resmi |
| `site.phone` | string telepon dengan digit, spasi, +, tanda kurung atau minus |
| `site.email` | string alamat email valid |
| `site.hours` | string jam pelayanan |
| `site.logoUrl` | path internal `/...` atau URL HTTPS |
| `site.relatedLinks` | array maksimal 10 objek `{label, href}`; href internal atau HTTPS |
| `site.isExample` | boolean; default true, false hanya untuk identitas resmi terverifikasi |

Envelope: `{success:true,data:{settings:{name,address,phone,email,hours,logoUrl,relatedLinks,isExample}},requestId}`. Nilai invalid diabaikan; field belum diisi menjadi null (atau [] untuk tautan). Jangan memasukkan rahasia ke key publik. Endpoint ini tidak menulis pengaturan; manajemen identitas menunggu Prompt 06.

## 5. Hasil lint/typecheck/test/build

| Pemeriksaan | Frontend | Backend |
| --- | --- | --- |
| Lint | Lulus | Lulus |
| Typecheck | Lulus | Lulus |
| Test | 19/19 lulus | 8/8 lulus |
| Build | Lulus; 10 rute utama + pencarian dan state sistem | Lulus |

Tes baru memeriksa URL script/protocol-relative, field privat tidak ikut keluar, envelope requestId, pencarian kosong/case/teks berbahaya, serta pembedaan guest awal dan invalidasi identitas lama. Endpoint backend dites dengan Prisma spy tanpa mengubah database. Regresi auth termasuk single-flight, gangguan jaringan dan isolasi A/B tetap lulus.

## 6. Pengujian browser/manual yang dijalankan

- Semua 10 rute utama dibuka pada 360×800, 768×1024, dan 1440×1000: 30 kombinasi, `documentElement.scrollWidth === innerWidth` pada semuanya.
- Tabel pelayanan pada 360 px: lebar tabel 576 px berada dalam region 320 px yang dapat digulir; tidak memperlebar halaman.
- Menu seluler dibuka; Tab/Shift+Tab tetap dalam dialog, Escape menutup, fokus kembali ke Menu. Dialog penjelasan pelayanan juga diuji.
- Search seluler dikirim dengan kata “pelayanan”, menghasilkan halaman terkait. Kasus kosong/tidak cocok/teks script diuji otomatis sebagai pencarian literal.
- Form kontak: pilihan topik “Informasi publik” dan tombol Buka informasi membuka halaman yang benar.
- Salin tautan menampilkan toast berhasil; tombol dismiss tersedia.
- Skip link lewat keyboard memindahkan fokus ke `#konten`; outline solid terlihat. Tidak ada input/select tanpa label atau img tanpa alt pada pemeriksaan DOM semua rute desktop.
- 404 untuk path tidak dikenal, `/500` dan `/maintenance` dibuka. Loading skeleton terlihat saat navigasi. Runtime exception pada root/error boundary tidak diinjeksi; fallback 500 ditinjau melalui rute tampilan dan build/typecheck.
- Backend offline pada awal QA: portal publik tetap tampil, AuthRecovery menawarkan retry, fallback identitas ditandai contoh. Dengan endpoint auth backend aktif, pengunjung tanpa cookie tetap berada di halaman publik saat reload.
- Smoke test build produksi: homepage HTTP 200, halaman terbuka di browser, log error browser kosong pada pemeriksaan itu. Screenshot desktop/mobile produksi disimpan sebagai artefak QA lokal.
- Perhitungan kontras token utama: isi 13.01:1, muted 5.82:1, tombol putih/hijau 8.01:1, teks footer 8.87:1. Ini pemeriksaan token, bukan audit WCAG menyeluruh.

## 7. Risiko/pekerjaan tertunda

Belum ada konten resmi, editor pengaturan/profil/aparatur, CMS berita, pencarian isi, UI akun, dashboard, atau pengajuan surat. Tidak ada pengiriman form kontak palsu. Maintenance adalah halaman tampilan, bukan switch operasional global. Identitas nyata memerlukan data terverifikasi melalui pengelolaan pada Prompt 06; pengujian rendering dengan data DB resmi belum dilakukan (QA memakai fallback dan endpoint test dengan spy). Perubahan pengaturan publik dapat memerlukan revalidasi hingga 60 detik dan refresh navigasi penuh untuk layout yang sudah terbuka. Review tambahan pembaca layar, lintas browser dan exception root aktual tetap disarankan sebelum produksi.

## 8. Status

SIAP REVIEW untuk Prompt 05. Commit dan push ke origin/main mengikuti gerbang lint/typecheck/test/build yang telah lulus. Jangan melanjutkan Prompt 06 tanpa instruksi pengguna.

## Revisi identitas dan desain Watundehoa

Pada 16 Oktober 2026 pengguna mengganti identitas contoh dengan Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe dan mengonfirmasi Lurah AMIRULAH, S.Si. Foto `Lurah Watundehoa.png`, `Papan Kantor Kelurahan Watundehoa.png`, dan `Kantor Kelurahan.png` dipakai sebagai aset WebP lokal. Foto tidak digenerasi ulang; transparansi potret dipertahankan, ruang transparan luar dipangkas dan resolusi/kompresi disesuaikan.

Palet menjadi biru tua, putih dan emas. Foto kantor menggantikan ilustrasi generik di hero, potret lurah diberi crop tubuh bagian atas, dan papan nama kantor tampil pada bagian lokasi. Header, metadata, footer, profil dan kontak menggunakan identitas nyata. Belum ada logo resmi terpisah; ikon gedung tetap penanda visual, bukan lambang pemerintah yang direka. Tidak dibuat kutipan/sambutan atas nama lurah.

Fallback yang telah dikonfirmasi pengguna dan nilai development `Kelurahan Contoh` dinormalisasi ke Watundehoa; konfigurasi backend lain tetap dihormati. Seed hanya mengubah nilai default untuk database baru, tidak menjalankan pembaruan database yang ada. Tidak ada migrasi/env/dependency baru. Fitur auth, menu, dan pembatasan scope CMS tetap berlaku.

Verifikasi revisi Watundehoa: lint/typecheck/test/build frontend dan backend lulus (19 tes frontend, 8 tes backend). Beranda, profil dan kontak diperiksa pada 360, 768, 1440 px: 9 kombinasi tanpa overflow atau gambar rusak. Tidak ada migrasi/env/dependency baru. Nomor kontak dan jam pelayanan tetap belum diisi.
