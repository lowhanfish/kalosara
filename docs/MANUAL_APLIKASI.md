# Manual Penggunaan Aplikasi KALOSARA

**Versi dokumentasi:** Tahap 01 sampai Prompt 14, 18 Oktober 2026.

**Sasaran:** pengunjung, masyarakat, admin kelurahan dan lurah.

**Alamat lokal:** http://localhost:3001.

KALOSARA adalah **Kanal Layanan Online Surat dan Administrasi Rakyat**, website Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe. Pada tahap ini aplikasi menyediakan informasi publik, pengelolaan konten dan akun. **Pengajuan surat online belum aktif.**

Manual ini menjelaskan fitur yang telah tersedia, bukan rencana fitur Tahap 02. Instalasi teknis dijelaskan pada [Panduan Instalasi](PANDUAN_INSTALASI.md).

## Daftar isi

1. [Mengenal peran pengguna](#1-mengenal-peran-pengguna)
2. [Membuka informasi publik](#2-membuka-informasi-publik)
3. [Mendaftar dan masuk sebagai masyarakat](#3-mendaftar-dan-masuk-sebagai-masyarakat)
4. [Profil dan perubahan kontak masyarakat](#4-profil-dan-perubahan-kontak-masyarakat)
5. [Password, sesi dan keluar](#5-password-sesi-dan-keluar)
6. [Masuk sebagai petugas](#6-masuk-sebagai-petugas)
7. [Mengelola profil kelurahan](#7-mengelola-profil-kelurahan)
8. [Mengelola berita](#8-mengelola-berita)
9. [Menggunakan pustaka media](#9-menggunakan-pustaka-media)
10. [Pengumuman, agenda, galeri dan informasi publik](#10-pengumuman-agenda-galeri-dan-informasi-publik)
11. [Statistik, fasilitas dan potensi wilayah](#11-statistik-fasilitas-dan-potensi-wilayah)
12. [Pengguna, audit dan verifikasi kontak](#12-pengguna-audit-dan-verifikasi-kontak)
13. [Panduan lurah](#13-panduan-lurah)
14. [Pesan aplikasi dan penyelesaian kendala](#14-pesan-aplikasi-dan-penyelesaian-kendala)
15. [Kebiasaan aman dan checklist publikasi](#15-kebiasaan-aman-dan-checklist-publikasi)
16. [Batas fitur saat ini](#16-batas-fitur-saat-ini)

## 1. Mengenal peran pengguna

| Peran | Kemampuan utama |
| --- | --- |
| Pengunjung | Membaca website dan dokumen PUBLIC tanpa login |
| MASYARAKAT | Mengakses dashboard, profil dan keamanan akun sendiri |
| ADMIN_KELURAHAN | Mengelola CMS, pengaturan, pengguna sesuai izin, audit dan review kontak |
| LURAH | Melihat ringkasan dan monitoring CMS terbatas |

Registrasi publik tidak dapat memilih role admin/lurah. Akun petugas diberikan oleh operator setelah verifikasi. Mengetahui URL sebuah halaman tidak berarti memiliki izin mengakses datanya. Lurah bukan otomatis pemilik semua data warga; admin lain juga tidak otomatis boleh membuka file PRIVATE pengunggah lain.

## 2. Membuka informasi publik

Buka beranda melalui browser. Pada ponsel, gunakan tombol **Menu** untuk membuka navigasi. Pencarian pada header membantu menemukan informasi/halaman yang tersedia.

| Halaman | Isi dan penggunaan |
| --- | --- |
| `/` | Beranda, identitas kelurahan dan ringkasan informasi terbit |
| `/profil` | Profil kelurahan, aparatur dan informasi kelembagaan yang dipublikasikan |
| `/berita` | Cari berita, gunakan kategori/pagination, lalu buka detail |
| `/pengumuman` | Pengumuman terbit yang sudah berlaku dan belum kedaluwarsa |
| `/agenda` | Agenda mendatang/berlangsung dan kegiatan lampau |
| `/galeri` | Album/foto kegiatan yang dipublikasikan |
| `/informasi-publik` | Cari dokumen/kategori dan unduh PDF yang tersedia untuk publik |
| `/statistik` | Statistik agregat beserta periode dan sumber data |
| `/potensi` | Fasilitas publik dan potensi lokal/UMKM yang dipublikasikan |
| `/kontak` | Alamat, kontak dan informasi pelayanan yang sudah diisi pengelola |
| `/pelayanan` | Panduan/pengantar pelayanan; belum menerima pengajuan surat |

Pada detail berita, pengguna dapat membuka tautan berbagi atau menyalin URL. Jika slug berita diubah pengelola, URL lama dapat mengarah ke URL terbaru selama berita masih terbit. Berita draft/arsip tidak boleh dibuka melalui halaman publik.

Peta kontak baru menghubungi OpenStreetMap setelah pengunjung menyetujui pemuatannya. Alamat dan tautan menjadi alternatif. Pemilih topik kontak merupakan navigasi, **bukan formulir pengiriman pesan**.

Pesan “belum tersedia/belum diisi” berarti pengelola belum menyediakan data tersebut. Jangan menafsirkannya sebagai angka nol, publikasi resmi atau bukti kerusakan aplikasi. Membaca informasi publik tidak memerlukan akun.

## 3. Mendaftar dan masuk sebagai masyarakat

1. Pilih **Akun masyarakat** pada footer, atau buka `/masyarakat/dashboard`.
2. Jika belum mempunyai akun, pilih **Belum punya akun? Daftar**.
3. Isi nama, email dan password. Password minimal 12 karakter dan maksimal 72 byte UTF-8; gunakan password yang kuat dan tidak dipakai bersama akun lain.
4. Kirim pendaftaran. Jika berhasil, aplikasi meminta Anda masuk.
5. Masuk menggunakan email dan password tersebut.

Pendaftaran hanya membuat role MASYARAKAT. Akun yang baru didaftarkan tidak otomatis membuktikan kepemilikan kontak. Aplikasi belum mengirim email/SMS verifikasi otomatis.

Halaman akun masyarakat:

| Halaman | Fungsi |
| --- | --- |
| `/masyarakat/dashboard` | Ringkasan akun dan penanda pelayanan belum aktif |
| `/masyarakat/profil` | Nama, alamat opsional, kontak akun dan permintaan perubahan kontak |
| `/masyarakat/keamanan` | Perubahan password dan pilihan mencabut sesi lain |

Penanda katalog/status pengajuan **belum aktif** bukan status surat yang sedang diproses. Jangan menyerahkan berkas identitas atau menganggap pengajuan sudah diterima melalui halaman tersebut.

## 4. Profil dan perubahan kontak masyarakat

### 4.1 Mengubah nama/alamat

1. Buka **Profil saya**.
2. Ubah nama dan, bila diperlukan, alamat.
3. Pilih **Simpan profil**.
4. Pastikan pesan **Profil tersimpan.** muncul.

Alamat bersifat opsional. Jangan mengisi NIK, nomor KK atau menyalin dokumen identitas ke kolom profil. Bila muncul konflik/perubahan data, muat ulang terlebih dahulu dan periksa data terbaru sebelum menyimpan ulang.

### 4.2 Mengajukan perubahan email/nomor kontak

Kontak penting tidak langsung diganti setelah formulir dikirim:

1. Buka bagian perubahan kontak pada halaman profil.
2. Isi hanya kontak yang ingin diubah dan password saat ini. Nomor telepon memakai format internasional E.164, misalnya awalan `+62` untuk Indonesia.
3. Kirim permintaan.
4. Kontak lama tetap berlaku; permintaan berstatus menunggu verifikasi selama maksimal **7 hari**.
5. Ikuti prosedur kantor untuk memverifikasi identitas dan kepemilikan kontak baru kepada petugas.

Tidak ada kode OTP atau email verifikasi otomatis pada alur ini. Jangan memberikan password kepada petugas untuk membuktikan identitas. Permintaan baru dapat menggantikan permintaan sebelumnya; pemilik juga dapat membatalkannya melalui aplikasi.

Jika permintaan disetujui, semua sesi dicabut. Masuk kembali memakai email baru jika email ikut berubah. Jika permintaan ditolak/kedaluwarsa, kontak baru belum diterapkan; periksa informasi dan ajukan kembali bila diperlukan. Kontak duplikat dengan akun lain ditolak.

## 5. Password, sesi dan keluar

### Mengganti password masyarakat

1. Buka **Keamanan**.
2. Isi password saat ini, password baru dan konfirmasi password baru.
3. Periksa pilihan mencabut sesi lain; secara bawaan pilihan ini aktif.
4. Konfirmasi perubahan dan pastikan aplikasi menampilkan hasilnya.

Password baru tidak boleh sama dengan password lama. Sesi yang sedang dipakai dipertahankan; sesi lain dicabut bila opsi tersebut dipilih. Perubahan password juga membatalkan token reset lama dan permintaan perubahan kontak yang belum diverifikasi.

### Mengakhiri penggunaan

Pilih **Keluar**. Pada akun masyarakat, aplikasi kembali ke beranda setelah server mengonfirmasi logout. Bila logout gagal, aplikasi menampilkan error; jangan menganggap sesi sudah berakhir. Coba lagi setelah koneksi pulih.

Akses dapat berakhir karena masa berlaku, pencabutan sesi, perubahan kontak yang disetujui, tindakan admin atau akun dinonaktifkan. Masuk ulang bila diminta. Gangguan jaringan sementara tidak selalu berarti akun keluar; gunakan pemulihan/coba lagi.

Lupa password belum dapat diselesaikan lewat email otomatis. Hubungi petugas berwenang dan ikuti verifikasi identitas untuk bantuan reset. Jangan membagikan password lama atau meminta petugas menonaktifkan pemeriksaan keamanan.

## 6. Masuk sebagai petugas

1. Buka `/admin`.
2. Gunakan akun petugas yang telah diprovisi operator.
3. Setelah masuk, buka modul melalui navigasi sesuai role.

| Area | Rute | Hak akses |
| --- | --- | --- |
| Ringkasan dashboard | `/admin` | Admin dan lurah |
| Profil dan pengaturan | `/admin/profil` | Admin |
| Berita dan media | `/admin/berita` | Admin |
| Kanal informasi | `/admin/konten` | Admin |
| Statistik wilayah | `/admin/wilayah` | Admin |
| Pengguna, audit dan upload | `/admin/pengguna` | Admin |
| Verifikasi kontak | `/admin/verifikasi-kontak` | Admin |

Ringkasan menampilkan hitungan CMS nyata dan aktivitas terbatas; bukan jumlah permohonan surat. Jika menu/aksi tidak tersedia untuk role Anda, minta klarifikasi operator, bukan mencoba mengganti role melalui browser.

## 7. Mengelola profil kelurahan

Buka `/admin/profil` dengan akun admin.

1. Periksa pengaturan identitas, wilayah, alamat, kontak, koordinat, jam kerja dan tautan yang benar-benar disahkan.
2. Pilih logo/hero dari media publik yang valid atau pilihan aset yang tersedia.
3. Kelola bagian profil seperti sejarah, visi-misi, tugas/fungsi, struktur organisasi dan sambutan sesuai formulir yang tersedia.
4. Kelola aparatur: nama/jabatan, urutan, foto opsional dan informasi masa tugas/keaktifan.
5. Gunakan draft/pratinjau sebelum menerbitkan konten.
6. Periksa hasil pada navbar/footer/profil publik.

Jangan mengarang nomor kontak, jam kerja, sejarah atau pernyataan pejabat yang belum disahkan. Identitas yang sudah dikonfirmasi adalah Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe, dengan Lurah AMIRULAH, S.Si.

Pengaturan identitas dapat terlihat tanpa mengubah kode. Bagian konten draft/arsip tetap tidak dibuka publik. Simpanan DRAFT pada bagian profil dapat menarik konten tersebut dari tampilan publik; jangan mengasumsikan ada revisi paralel yang tetap terbit.

## 8. Mengelola berita

### 8.1 Menyiapkan kategori

1. Buka `/admin/berita`, pilih **Kategori**.
2. Isi nama dan slug kategori, lalu **Simpan kategori**.
3. Gunakan slug yang jelas dengan huruf kecil, angka dan tanda hubung.

Slug kategori yang sudah tersimpan tidak dapat diubah melalui formulir. Kategori yang masih dipakai berita aktif tidak dapat diarsipkan sembarangan.

### 8.2 Membuat draft

1. Pilih modul **Berita**, lalu **Buat berita baru**.
2. Isi judul, slug, ringkasan dan kategori aktif.
3. Isi berita melalui editor: heading, bold/italic, kutipan, daftar, tautan dan gambar yang tersedia.
4. Pilih cover/gambar dari media PUBLIC aktif dan isi teks alternatif yang benar.
5. Pilih status **DRAFT**, lalu **Simpan berita**.
6. Gunakan **Preview tersimpan** setelah simpan berhasil.

Pratinjau menampilkan versi yang telah disimpan, bukan perubahan yang masih ada di editor. Jangan menutup editor sebelum memastikan simpan berhasil. Tidak ada jaminan autosave/jadwal publikasi otomatis.

### 8.3 Menerbitkan, memperbarui dan mengarsipkan

| Status | Dampak |
| --- | --- |
| DRAFT | Belum terbuka pada website publik |
| PUBLISHED | Terbuka sebagai berita resmi pada website |
| ARCHIVED | Ditarik dari kanal/detail berita publik |

Setelah pengecekan isi dan kewenangan publikasi, ubah ke PUBLISHED dan simpan. Periksa daftar/detail berita publik, cover dan tautan berbagi. Jika notifikasi invalidasi cache tertunda, simpanan dapat sudah berhasil tetapi tampilan cache belum diperbarui; gunakan informasi error/requestId untuk operator.

Saat menyunting, aplikasi memeriksa versi terakhir. Jika admin lain telah mengubah data, muat ulang dan tinjau ulang; jangan terus mengirim simpanan lama. Jika slug berita diubah, alias URL lama mengarah ke slug terkini selama berita terbit.

Pemulihan melalui riwayat/revisi menghasilkan **draft baru**. Periksa dan terbitkan kembali bila diperlukan; rollback bukan publikasi otomatis. Untuk menarik berita, gunakan arsip daripada menghapus file fisik.

## 9. Menggunakan pustaka media

Pustaka media tersedia pada modul admin yang menampilkannya; pada `/admin/berita` pilih **Media**.

### Mengunggah

1. Pilih satu file JPG/JPEG, PNG, WebP atau PDF.
2. Pilih asal penggunaan, misalnya Berita, Profil kelurahan, Aparatur, Pengaturan, Agenda, Galeri atau Informasi publik.
3. Pilih akses dengan sengaja. Bawaan adalah **PRIVATE**.
4. Isi alt untuk gambar dan caption bila diperlukan.
5. Unggah, tunggu hasil validasi, lalu periksa daftar media.

Batas per file **20 MiB = 20.971.520 byte**, satu file per request dan maksimal dua job upload bersamaan. Sistem memeriksa signature, MIME, ekstensi dan isi; mengganti ekstensi file tidak membuatnya valid. Gambar dibatasi 25 megapiksel dan diolah ulang; PDF harus valid, tanpa enkripsi, dengan 1–1000 halaman. PDF dilayani sebagai attachment, bukan dokumen aktif di dalam halaman.

### Memilih akses dengan benar

| Akses | Konsekuensi |
| --- | --- |
| PRIVATE | Hanya admin pengunggah yang dapat membuka melalui API terautentikasi |
| PUBLIC | Dapat diakses anonim melalui URL media yang sah |

Gambar untuk berita/galeri dan dokumen yang akan diterbitkan harus memenuhi syarat PUBLIC aktif. Aplikasi tidak otomatis mempromosikan file privat menjadi publik. Antarmuka tidak menyediakan perubahan akses otomatis setelah upload; bila keliru, jangan menganggap label konten mengubah izin file—minta penanganan operator/pengelola.

**Mengarsipkan artikel/dokumen bukan pencabutan akses file PUBLIC.** URL media publik dapat tetap dapat diunduh. Karena itu jangan mengunggah materi sensitif sebagai PUBLIC sejak awal. File yang masih dirujuk cover, embed, revisi atau konten lain tidak dapat diarsipkan agar referensi tidak putus. Edit alt/caption melalui kontrol media yang tersedia; jangan menghapus file langsung dari disk.

## 10. Pengumuman, agenda, galeri dan informasi publik

Buka `/admin/konten`, pilih kanal, cari/filter konten bila diperlukan, lalu buat/edit draft dan simpan. Periksa kembali sebelum memilih PUBLISHED. ARCHIVED digunakan untuk menarik konten secara aman.

### Pengumuman

Isi judul/teks, pilihan pinned dan tanggal berlaku/kedaluwarsa. Pinned memberi prioritas urutan. Pengumuman PUBLISHED yang belum mulai atau sudah kedaluwarsa tetap disaring dari publik. Periksa tanggal jika pengumuman tidak muncul.

### Agenda

Isi judul/deskripsi, waktu mulai/akhir dan lokasi. Pastikan akhir tidak mendahului awal. Website memisahkan agenda mendatang/berlangsung dan lampau. Input tanggal mengikuti waktu lokal perangkat, sedangkan penyimpanan memakai UTC dan tampilan publik menggunakan WITA; periksa pengaturan waktu perangkat sebelum mengisi.

### Galeri

Buat album dan pilih foto PUBLIC aktif. Isi alt per foto serta urutan yang sesuai. Satu album maksimal 12 foto; halaman publik menampilkan maksimal 4 album per halaman. Gunakan pagination untuk melihat album berikutnya.

### Informasi publik

Isi judul/keterangan/kategori dan pilih PDF yang tepat. Kategori dapat menjelaskan standar pelayanan, maklumat atau materi resmi lain. Draft/arsip dapat merujuk PDF PRIVATE milik pengunggah, tetapi publikasi mensyaratkan PDF PUBLIC aktif yang memang diizinkan untuk umum. Memilih PUBLISHED tidak mengubah akses file secara otomatis.

Periksa unduhan publik setelah terbit, termasuk versi dan kewenangan publikasi dokumen. Jangan memasukkan identitas warga atau berkas permohonan surat ke kanal informasi publik.

## 11. Statistik, fasilitas dan potensi wilayah

Buka `/admin/wilayah` dengan akun admin.

### Statistik

1. Pilih periode tahun/bulan yang tersedia.
2. Isi sumber data dan tanggal sumber.
3. Isi angka agregat yang benar, misalnya penduduk, laki-laki/perempuan, kepala keluarga, RT/RW sesuai formulir.
4. Simpan draft, periksa konsistensi angka dan terbitkan bila disahkan.
5. Periksa `/statistik` dan ringkasan beranda.

Jangan memasukkan NIK, nomor KK atau daftar penduduk perorangan. Nilai belum diketahui tidak boleh diisi nol hanya agar formulir terlihat lengkap. Data harus memiliki periode/sumber; jangan mengarang angka resmi.

### Fasilitas dan potensi

Isi nama, kategori, deskripsi, lokasi/koordinat opsional dan foto PUBLIC yang sesuai. Gunakan status draft/terbit/arsip dan periksa `/potensi` setelah simpan. Pastikan izin publikasi nama/foto usaha atau pihak terkait telah dipenuhi. Modul ini tidak mengumpulkan basis data kependudukan perorangan.

## 12. Pengguna, audit dan verifikasi kontak

### 12.1 Mengelola pengguna

Buka `/admin/pengguna`. Gunakan pencarian/pagination, pilih akun yang benar dan periksa identitas sebelum tindakan sensitif.

Tindakan yang tersedia mencakup aktif/nonaktif, cabut sesi dan reset password setelah verifikasi identitas/password admin/konfirmasi sesuai formulir. Perubahan akses dapat mencabut seluruh sesi pengguna dan membatalkan permintaan perubahan kontak. Informasikan dampaknya melalui prosedur komunikasi resmi petugas.

Admin tidak dapat melakukan perubahan akses sensitif terhadap dirinya sendiri; gunakan admin lain. Aplikasi juga mencegah hilangnya admin aktif terakhir. Perubahan role bukan dropdown bebas dalam UI; urusan role khusus harus melalui operator/prosedur backend yang berwenang. Jangan mencari cara mengganti role melalui request browser.

### 12.2 Audit dan inventory upload

Audit rinci membantu menelusuri tindakan, waktu dan requestId sesuai informasi yang tersedia. Jangan menyalin data audit ke kanal publik. Inventory upload membantu melihat penggunaan penyimpanan, tetapi tidak memberi admin akses otomatis ke file PRIVATE admin lain.

Kuota total storage belum ditetapkan. Batas 20 MiB/file bukan berarti total kapasitas disk tidak terbatas. Laporkan pertumbuhan storage kepada operator.

### 12.3 Meninjau perubahan kontak

1. Dari halaman pengguna, buka tautan verifikasi kontak atau `/admin/verifikasi-kontak`.
2. Cari akun dan periksa permintaan yang benar serta masa berlakunya.
3. Verifikasi **identitas pemilik dan kepemilikan kontak baru secara nyata** melalui prosedur kantor.
4. Untuk persetujuan, masukkan password admin dan konfirmasi verifikasi yang diwajibkan.
5. Setujui hanya jika kedua pemeriksaan selesai; jika tidak memenuhi syarat, tolak.
6. Ingatkan pemilik bahwa persetujuan mencabut sesi dan dapat mengubah email login.

Jangan mencentang verifikasi hanya untuk meloloskan formulir. Jangan meminta password warga, menyimpan OTP, atau mengunggah foto KTP sebagai bukti ke aplikasi ini. Permintaan kedaluwarsa, konflik kontak atau data yang sudah berubah harus ditangani sesuai pesan aplikasi.

## 13. Panduan lurah

1. Buka `/admin` dan masuk menggunakan akun LURAH yang diprovisi operator.
2. Baca ringkasan konten dan aktivitas CMS terbatas.
3. Gunakan website publik untuk meninjau hasil publikasi.
4. Koordinasikan koreksi kepada admin pengelola.
5. Pilih **Keluar** setelah penggunaan.

Role lurah saat ini untuk monitoring, bukan pengelolaan CMS, audit pengguna rinci, membuka semua profil warga atau approval konten/surat. Tidak adanya tombol persetujuan merupakan batas fitur, bukan gangguan izin yang harus dilewati.

## 14. Pesan aplikasi dan penyelesaian kendala

| Pesan/kondisi | Tindakan pengguna |
| --- | --- |
| Memeriksa sesi/memuat | Tunggu; jangan mengirim formulir berulang kali |
| Gangguan jaringan/pemulihan | Periksa koneksi, gunakan coba lagi; jangan langsung menganggap akun terhapus |
| Harus masuk/sesi dicabut | Masuk ulang; hubungi petugas bila tidak mengharapkan pencabutan |
| Tidak memiliki izin/akun nonaktif | Periksa role/akun dengan petugas; jangan mencoba bypass |
| Terlalu banyak percobaan | Hentikan pengulangan cepat, tunggu jendela pembatasan |
| Konflik/data berubah | Muat ulang data terbaru, periksa lalu ulangi perubahan yang masih diperlukan |
| Draft tidak ditemukan di publik | Periksa status; draft/arsip memang tidak dipublikasikan |
| Pengumuman terbit tetapi tidak muncul | Periksa waktu mulai/kedaluwarsa |
| File ditolak | Periksa format, isi, ukuran, alt dan akses yang disyaratkan |
| Media masih dipakai | Tinjau semua referensi/revisi; jangan hapus file secara manual |
| Cache invalidasi tertunda | Catat pesan/requestId dan hubungi operator; jangan membuat publikasi ganda |
| Lupa password | Hubungi petugas untuk verifikasi; reset melalui email belum aktif |

Saat melapor, sampaikan waktu, halaman, urutan tindakan, pesan dan requestId bila tersedia. Jangan mengirim password, cookie/token, file PRIVATE atau screenshot yang menampilkan data pribadi tanpa kebutuhan dan otorisasi yang jelas.

## 15. Kebiasaan aman dan checklist publikasi

Gunakan akun pribadi, jangan berbagi password dan selalu keluar pada perangkat bersama. Periksa kembali alamat website sebelum login. Jangan memasukkan script/iframe, tautan berbahaya atau data warga ke editor. Jika melihat akses/aktivitas yang tidak dikenal, laporkan kepada operator dan pertimbangkan pencabutan sesi melalui prosedur yang tersedia.

Sebelum menerbitkan konten:

- [ ] Judul, isi dan identitas instansi benar.
- [ ] Angka, waktu, sumber dan kewenangan publikasi telah diperiksa.
- [ ] Foto/PDF benar, terbaca dan memiliki izin publikasi.
- [ ] Alt gambar menjelaskan isi yang relevan.
- [ ] Tidak ada data pribadi/berkas warga yang tidak semestinya dipublikasikan.
- [ ] Akses media dipilih dengan sengaja; PUBLIC memang boleh diakses anonim.
- [ ] Draft sudah disimpan dan diperiksa melalui pratinjau bila tersedia.
- [ ] Status dan tanggal berlaku benar.
- [ ] Hasil publikasi telah dibuka pada website, termasuk pada ponsel.

## 16. Batas fitur saat ini

- Pengajuan surat, upload berkas warga, form builder layanan, persetujuan surat, template/QR penerbitan dan queue pelayanan **belum dibuat**.
- Verifikasi kontak melalui petugas, tanpa email/SMS/OTP otomatis.
- Reset password melalui email dan MFA belum aktif.
- Lurah monitoring; approval konten/surat belum aktif.
- Kontak website tidak mengirim pesan.
- Kuota total media, purge/retensi otomatis dan antivirus upload belum tersedia.
- Backup/restore lokal telah direhearsal, tetapi backup offsite dan operasi produksi belum diklaim aktif.
- Deployment VPS ditunda sesuai keputusan pengguna; fokus saat ini pematangan lokal.

Untuk bantuan teknis, operator merujuk [Panduan Instalasi](PANDUAN_INSTALASI.md), [checkpoint](../CHECKPOINT.md) dan [laporan operasi lokal](../ops/docs/prompt14-report.md).
