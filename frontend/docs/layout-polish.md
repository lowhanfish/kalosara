# Perbaikan layout dan keterbacaan — 17 Oktober 2026

Revisi atas permintaan pengguna setelah Prompt 09, meliputi CMS/admin dan website publik. Tidak memulai Prompt 10/Tahap 02. Desain navy/kuning, hero, aset, isi resmi dan identitas Watundehoa tetap dipertahankan.

## Masalah dan perubahan

Stylesheet `.cms-input` semula hanya dimuat pada layout admin/berita. Admin/konten dan filter publik memakai kelas yang sama tanpa styling kontrol, sehingga input tidak terlihat jelas, textarea/tanggal tidak konsisten dan form tampak mentah. Stylesheet bersama kini diimpor oleh root layout; seluruh admin berada dalam `.cms-shell` dengan gaya yang terisolasi dari halaman publik. Tidak ada perubahan API, permission, upload atau database.

Editor kanal diberi heading/keterangan, navigasi aktif, tab kanal dengan state terpilih, filter sejajar, daftar berupa kartu dengan badge status dan tombol edit singkat, pagination, serta editor dua kolom desktop/satu kolom seluler. Pustaka media menjadi panel lipat tertutup secara default supaya daftar dan editor tidak tenggelam di antara form/file panjang. Upload memakai grid responsif; seluruh input memakai font16px dan tinggi minimal46px. Judul, label, catatan, tombol, batas form dan focus memakai hierarki konsisten.

`readability.css` dimuat setelah CSS referensi untuk menaikkan ukuran navigasi, tombol, isi kartu, tanggal, footer dan catatan yang sebelumnya sering 8–12px. Teks utama 14–16px, metadata 12–13px sesuai konteks; heading mengikuti komposisi yang dipilih. Header dapat membungkus navigasi saat ruang sempit. Empty state galeri/agenda kini memenuhi lebar panel; pesan kosong galeri sebelumnya masuk ke satu sel grid foto sempit. Filter kanal publik ditata sebagai panel responsif dengan input berlabel jelas. Tidak mengganti font ke layanan eksternal atau mengarang konten resmi.

## File

- `app/layout.tsx`, `app/admin/layout.tsx`, `app/admin/berita/layout.tsx`: pemuatan stylesheet konsisten dan shell admin.
- `features/cms/cms.css`, `components/site/readability.css`: kontrol bersama, layout CMS dan skala tipografi publik.
- `app/admin/konten/page.tsx`, `features/cms/admin-access.tsx`, `media-library.tsx`: struktur visual/tab/badge/editor/panel media.
- `features/content/public-list.tsx`: tata letak filter publik.
- README dan CHECKPOINT: hasil serta batas pemeriksaan.

## Verifikasi

Frontend lint, typecheck, 31 tes dan build produksi lulus. Cache produksi Turbopack pada volume macOS sempat rusak seperti sesi sebelumnya; hanya `.next/cache/turbopack` dibersihkan sebelum build ulang yang berhasil. Tidak ada perubahan dependency/env/migration dan tidak perlu menjalankan ulang tes database untuk revisi presentasi ini.

Browser Chrome pada 13 halaman (10 publik + 3 admin), lebar 360/768/1024/1440: 52 kombinasi tanpa overflow horizontal atau pageerror; input `.cms-input` seluruhnya 16px. Screenshot sebelum/sesudah editor, beranda dan filter diperiksa visual, termasuk panel media dibuka dan menu seluler dibuka/ditutup dengan Escape. Browser memakai fixture admin hanya melalui intersepsi GET untuk melihat tampilan editor; mutasi API fixture diblokir. Tidak membuat akun atau konten contoh di Neon. Pemeriksaan ini memvalidasi layout, bukan mengulang acceptance test fungsional yang telah selesai di Prompt 09.

Server frontend utama 3001/backend 4000 tetap manual. Tidak ada perubahan Docker/Redis, konten resmi atau desain hero. Perubahan ini memperbaiki tampilan yang terlihat; review akhir pengguna tetap diperlukan untuk memastikan ukuran dan kepadatan sesuai kenyamanan mereka.

Smoke visual tambahan pada build produksi sementara3002:6 kombinasi beranda/agenda/editor CMS pada360 dan1440 lulus tanpa overflow atau pageerror; stylesheet, tanggal dua kolom dan panel upload terbuka diperiksa. Server QA3002 telah dihentikan setelah pemeriksaan; runtime utama tetap berjalan.

## Koreksi hero setelah review pengguna

Hero desktop sebelumnya masih menampilkan komposit referensi, bukan foto kantor asli yang menjadi latar seluler. Komposit dihapus; satu foto kantor (`/images/watundehoa/kantor.webp`, atau pengaturan hero yang disetujui admin) menjadi latar bersama pada semua layar. Potret AMIRULAH, S.Si (`/images/watundehoa/amirulah.webp`, atau foto aparatur published) adalah gambar terpisah dengan caption nama/jabatan. CSS hero khusus mengembalikan potret desktop yang sebelumnya disembunyikan, menjaga rasio gambar dan menata ulang posisi responsif. Kutipan belum disahkan dari desain tidak lagi ditampilkan. Tidak mengedit atau menghasilkan ulang gambar sumber.

Lint/typecheck/31 tes/build frontend lulus. QA browser hero pada360/768/1024/1440: foto kantor dan potret memakai file yang tepat, tidak ada komposit, caption terlihat, nol overflow/gambar rusak/pageerror/overlap teks dan potret. Tampilan desktop dan seluler diperiksa visual. Tidak ada migration, mutasi database atau perubahan backend.
