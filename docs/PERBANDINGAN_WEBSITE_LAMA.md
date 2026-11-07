# Perbandingan dan penambahan fitur website lama

Pemeriksaan sumber: https://watundehoa.digitaldesa.id/, 7 November 2026. Website sumber memuat data melalui JavaScript; keadaan awal kosong pada HTML bukan bukti bahwa konten tidak tersedia. Pemeriksaan dilakukan pada halaman yang selesai dimuat serta API publik sumber pada migrasi sebelumnya.

Perubahan desain sebelumnya telah dipush ke `origin/main` pada commit `7b6bad8` sebelum pekerjaan penambahan fitur ini.

| Bagian sumber | Kondisi sebelumnya | Implementasi sekarang |
|---|---|---|
| Berita, profil, galeri | Sudah tersedia; konten sudah dimigrasikan | Dipertahankan |
| Wisata | Digabung dalam potensi tanpa halaman khusus | `/wisata`, pencarian, 4 konten lama dan halaman detail lengkap |
| Belanja / UMKM | Digabung dalam potensi tanpa halaman khusus | `/belanja`, pencarian, 6 produk dan detail; harga tetap diberi konteks referensi lama |
| Detail potensi | Deskripsi hanya terpotong pada kartu | `/potensi/[id]`, teks lengkap, gambar, sumber dan metadata judul |
| Listing / peta | Tautan lokasi masing-masing fasilitas | `/listing`, pencarian dan pilihan lokasi yang mengubah peta OpenStreetMap; `/fasilitas` dan detail fasilitas |
| Infografis | Hanya halaman statistik penduduk | `/infografis` sebagai indeks; `/anggaran`, `/bansos`, `/stunting` |
| Anggaran | Tidak ada modul khusus | Editor agregat pendapatan, belanja dan pembiayaan, periode, sumber, penjelasan dan status publikasi |
| Bansos | Tidak ada modul khusus | Editor rekapitulasi agregat dan tautan Cek Bansos Kemensos; tidak mempublikasikan identitas penerima |
| Stunting | Tidak ada modul khusus | Editor data agregat, periode dan sumber; tidak mempublikasikan data medis perorangan |
| PPID | Hanya daftar dokumen umum | `/ppid` dengan klasifikasi berkala/serta-merta/setiap-saat serta dokumen peraturan/kebijakan |
| Permohonan informasi | Belum ada formulir | `/ppid/permintaan`; tersimpan privat dengan nomor referensi |
| Pengaduan | Belum ada formulir | `/pengaduan`; tersimpan privat dengan nomor referensi |
| Pengelolaan pesan | Belum ada | `/admin/kotak-masuk`, filter jenis/status, detail, catatan internal, status baru/diproses/selesai/arsip |
| Pengelolaan infografis | Belum ada | `/admin/infografis`; draft/terbit/arsip serta pemeriksaan versi agar perubahan tidak saling menimpa |
| Pengelolaan wisata/UMKM | Kategori bebas dalam potensi | Filter jenis konten serta saran kategori `Wisata`/`Produk UMKM` pada editor wilayah |
| Menu, pencarian dan akses cepat | Tidak memuat kanal tambahan | Tautan menu, pencarian halaman, akses cepat beranda, sorotan wisata/UMKM, footer dan sitemap diperbarui |
| Rute infografis lama | Tidak tersedia | `/infografis/penduduk`, `/infografis/apbdes`, `/infografis/bansos`, `/infografis/stunting` mengarah ke halaman terkait |

## Data dan batas fungsi

- Lurah aktif tetap **AMIRULAH, S.Si**. Aparatur/sambutan/bagan lama yang belum sesuai tetap draft.
- Sumber tidak menyediakan data anggaran yang dapat dipakai; bagian stunting dan bansos juga menampilkan belum ada data saat diperiksa. Tidak dibuat angka resmi baru. Angka kosong dibedakan dari nol, dan penerbitan mensyaratkan periode serta sumber.
- Data penduduk sumber belum disalin karena total 512 tidak sesuai dengan rincian laki-laki 255 + perempuan 248. Tidak melakukan koreksi perkiraan.
- Katalog UMKM berupa informasi produk, tanpa pembayaran, keranjang atau pemesanan palsu. Kontak penjual contoh tidak dijadikan tombol transaksi.
- Pengaduan/permohonan saat ini menerima teks dan kontak, **belum menerima lampiran**. Petugas menindaklanjuti melalui kontak yang diberikan; tidak ada pengiriman email/WhatsApp otomatis atau pelacakan publik berdasarkan identitas.
- Statistik kunjungan dan perangkat bantu aksesibilitas milik platform lama tidak dipindahkan sebagai data/komponen lokal. Angka kunjungan lama bukan angka pengunjung KALOSARA. Ini bukan penyalinan platform pihak ketiga secara utuh.
- Konten contoh yang sebelumnya ada tetap tersimpan dan penanda mode demo tetap berlaku.

## Penyimpanan dan keamanan

Migrasi `20261107090000_community_requests` menambah tabel `PublicRequest` untuk pesan privat dan kolom `classification` pada `PublicDocument`. Klasifikasi lima dokumen hasil migrasi dipulihkan dari metadata sumber yang sudah tersimpan. Tidak ada reset/seed atau perubahan akun, kata sandi, peran dan layanan surat Tahap 02.

Informasi agregat disimpan sebagai JSON tervalidasi pada kunci `community.section.<slug>` di `AppSetting`. Hanya status published yang dibaca API publik. Pesan privat tidak disimpan sebagai pengumuman/dokumen yang dapat diterbitkan.

Formulir mensyaratkan persetujuan dan setidaknya satu kontak, dibatasi panjang/format, memakai Origin/CSRF dan pembatasan kirim. Respons penerimaan hanya berisi nomor referensi. Kotak masuk/detail/catatan internal memerlukan sesi ADMIN_KELURAHAN aktif dan respons no-store; LURAH dan MASYARAKAT tidak memiliki akses. Pembukaan detail serta perubahan dicatat pada audit. Perubahan pesan dan agregat memeriksa versi terakhir. Konten detail fasilitas/potensi disanitasi sebelum keluar melalui API publik.

Untuk instalasi lain, jalankan `npm run db:generate` dan `npm run db:deploy` dari backend sebelum menjalankan versi aplikasi ini. Migrasi telah diterapkan pada database terkonfigurasi untuk aplikasi lokal ini.

## Verifikasi

- Uji backend mencakup validasi persetujuan/kontak, metadata penerbitan, klasifikasi PPID, penyaringan draft/arsip, autentikasi/izin, konflik versi, CSRF/Origin, pembatasan kirim, respons penerimaan tanpa identitas dan sanitasi detail.
- Uji HTTP fitur baru memakai penyimpanan tiruan terisolasi. Tidak menyisipkan pesan/akun uji ke database pengguna.
- Pemeriksaan baca-saja pada aplikasi berjalan mencakup 19 halaman/rute, penolakan akses anonim pada 2 API admin, 3 bagian agregat yang belum dipublikasikan dan lima PDF PPID terklasifikasi.
- Pemeriksaan browser meliputi direktori/detail, dokumen PPID, peta interaktif, formulir publik, editor infografis dan kotak masuk admin.

Hasil akhir: build backend dan frontend, pemeriksaan TypeScript/lint pada modul yang berubah, 46 pengujian backend (termasuk 10 pengujian kanal baru), serta 39 pengujian frontend lulus. Pemeriksaan baca-saja menghasilkan 25 pemeriksaan berhasil. Browser memastikan peta berpindah ke Puskesmas Puriala, editor agregat tersedia, detail wisata terbaca, dan formulir 390px tidak melebar; pengiriman tanpa kontak ditolak sebelum mengirim pesan. Screenshot disimpan lokal pada `reports/legacy-feature-parity/`.
