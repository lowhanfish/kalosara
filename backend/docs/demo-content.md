# Konten demo lengkap

Jalankan `npm run db:seed:demo` dari direktori backend dengan Node.js yang didukung aplikasi dan konfigurasi database/upload yang sama dengan API. Script menolak NODE_ENV=production, membutuhkan admin aktif, serta tidak membuat atau mengubah akun dan kata sandi.

Paket mencakup 8 berita terbit dengan sampul, 1 draft, 6 halaman profil/pelayanan, 4 aparatur bergambar, 4 pengumuman, 4 agenda, 2 album dengan 8 foto, 3 dokumen PDF, statistik bulan berjalan dan bulan sebelumnya, 3 fasilitas, serta 4 potensi wilayah. Ilustrasi aparatur tambahan merupakan gambar vektor orisinal berlabel data contoh; potret lurah dan foto kantor terkonfirmasi tetap digunakan. Aset kegiatan demo yang tersedia digunakan untuk berita, galeri, fasilitas dan potensi.

ID deterministik mencegah duplikasi saat dijalankan ulang. Record konten yang ada dipertahankan. Script hanya melengkapi foto kosong aparatur contoh yang dikenal, menjadwalkan ulang agenda contoh yang isinya masih sama dan versinya masih 1, serta memulihkan berkas gambar/turunan/PDF demo yang hilang. Data statistik lama tidak dihapus. Mode demo ditandai pada portal melalui site.demoContent.

Berkas runtime disimpan di UPLOAD_ROOT dan tidak disertakan ke Git; sumber gambar dan PDF demo berada dalam repository. Sesudah checkout pada mesin lain, jalankan script ini dengan database dan UPLOAD_ROOT yang sesuai agar media tersedia. Jangan menganggap push Git menyalin database atau upload.

Verifikasi 6 November 2026: 8 berita terbit + 1 draft, 4 aparatur tanpa foto kosong, 4 agenda mendatang, 15 media publik dapat diakses, dan pengisian ulang tanpa duplikasi. Seluruh 36 tes backend, lint, dan typecheck lulus. Tidak ada kredensial akun dalam fixture.
