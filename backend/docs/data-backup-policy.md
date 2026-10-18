# Rancangan kebijakan data, backup dan retensi — Prompt 13

Usulan operasional untuk persetujuan kelurahan, belum menjalankan penghapusan/backup Neon. Pemilik keputusan: instansi/pengelola data; pelaksana teknis: operator terbatas, pemegang kunci backup berbeda dari akun admin konten. Tinjau dasar hukum, pemberitahuan privasi, permintaan akses/koreksi/penghapusan dan kewajiban arsip bersama instansi sebelum menerapkan jadwal. Tidak menganggap rancangan ini memenuhi seluruh kewajiban hukum.

## Data dan akses

- Publik: konten terbit/statistik agregat/media berizin PUBLIC. Verifikasi hak publikasi/nama/foto/UMKM sebelum publish. Jangan memasukkan identitas penduduk dalam statistik.
- Akun: nama/email/password hash, telepon/alamat opsional. Tidak mengumpulkan NIK/KK/KTP atau berkas warga Tahap02. Profil hanya pemilik; kontak baru melalui petugas/verifikasi nyata. Monitoring lurah tidak otomatis membuka profil warga.
- PRIVATE: UUID/path fisik dalam backend/public/uploads, metadata/owner di DB, hanya API setelah otorisasi; nama folder “public” bukan izin publik. Jangan expose static folder, menyalin private ke frontend/public atau bucket publik. Backup meliputi original+varian+legacy; DB tidak berisi blob/base64.
- Sesi/reset: hash token saja, batas absolut7hari/expiry/revocation. Jangan menaruh cookie/token/password/plaintext kontak/alamat pada log/error/audit. Akses operator DB/backup tetap dianggap akses data pribadi.
- Data test harus example.invalid pada DB/upload disposable. File fixture mode0600 tidak masuk Git dan dihancurkan bersama DB uji.

## Usulan retensi (belum otomatis/purge)

| Kelas | Usulan dan prasyarat |
| --- | --- |
| HTTP/operational logs | 7hari,10MiB per arsip, akses operator; rotasi dulu, tanpa data pribadi masukan. |
| Audit akses/perubahan | 180hari untuk investigasi, tinjau kewajiban arsip/insiden/legal hold; tanpa kontak/alamat/token. Jangan purge sebelum kebijakan disahkan. |
| Sesi revoked/expired dan reset token expired | Evaluasi purge setelah30hari; token tidak berlaku tetap ditolak sekarang. |
| Pending contact changes | Berlaku7hari; setelah expiry tidak dapat disetujui. Evaluasi purge setelah30hari. Belum job purge otomatis. |
| Akun/profil | Selama tujuan layanan/akun masih berlaku; review tahunan akun tidak aktif. Permintaan penghapusan diverifikasi dan dicek dependensi/arsip/legal hold, bukan SQL delete sembarang. |
| CMS/revisi/media | Sesuai jadwal arsip instansi; media direferensikan tidak boleh dihapus. Arsip CMS tidak mengubah akses file PUBLIC. Belum garbage collection. |
| Backup | 7harian,4mingguan,3bulanan terenkripsi; salinan offsite dan uji kunci. Terapkan expiry terkontrol; penghapusan data ikut hilang saat backup kedaluwarsa, jangan mengubah backup immutable secara parsial. |

## Rencana backup konsisten

Target usulan RPO24jam, RTO4jam, **belum terukur**. Neon retention/PITR bergantung paket operator; tidak diasumsikan otomatis mencakup filesystem.

1. Tentukan jendela pemeliharaan dan hentikan mutasi akun/CMS/upload secara terkontrol (GET publik tetap tersedia bila aman). Pastikan job invalidasi sudah berhenti sebelum snapshot; catat waktu, commit, schema migration terakhir, versi PostgreSQL/tools, ukuran dan origin lingkungan tanpa credential.
2. Operator membuat snapshot/logical dump PostgreSQL format custom dengan akun backup minimum. Ambil credential dari secret manager/PGPASSFILE0600, jangan memasukkan URL/password dalam command line, shell history atau output chat. Jangan menjalankan reset/seed atau dump data warga dalam pengujian agent.
3. Pada jendela yang sama, arsipkan UPLOAD_ROOT lengkap dengan izin file, original/turunan/legacy; snapshot filesystem bila tersedia. Simpan checksum/manifes dua artefak, schema/commit dan waktu. Jangan backup .env/kunci dalam arsip data biasa; salinan secret terenkripsi terpisah dengan akses lebih ketat.
4. Enkripsi sebelum transfer ke tujuan offsite terbatas, idealnya immutable/versioned. Kunci pemulihan disimpan terpisah dan diuji. Verifikasi checksum/ukuran serta keberhasilan transfer sebelum mencatat backup berhasil. Jangan menjadikan SSD VPS satu-satunya salinan. Jangan hapus artefak lama sebelum set baru tervalidasi.
5. Akhiri maintenance, jalankan ready/health dan smoke read-only. Jika backup gagal, simpan set baik terakhir, kirim insiden ke operator yang berwenang dan ulangi setelah perbaikan. Tidak otomatis membuat/menjadwalkan automasi pada sesi ini.

## Drill restore terisolasi

Bulanan atau setelah perubahan schema/storage: ambil set DB+upload dari timestamp yang sama, validasi checksum dan decrypt di host terisolasi. Pakai PostgreSQL native/database disposable, **jangan restore ke Neon produksi** atau mengandalkan PostgreSQL Docker. Nonaktifkan semua koneksi keluar, job pengiriman/invalidation dan gunakan secret QA baru. Data backup nyata tetap sensitif; batasi operator dan storage terenkripsi, jangan membukanya pada browser/agent tanpa mandat.

Pulihkan schema/data dengan tool versi yang kompatibel dan tanpa owner/privilege produksi, pulihkan file/permissions ke root terisolasi. Cocokkan seluruh storageKey/original/varian/legacy yang dirujuk, relasi dan audit; pastikan PRIVATE anonim404, admin lain403, pemilik200, published200/draft404 dan readiness200. Uji login hanya dengan akun uji khusus restore yang diotorisasi, cabut sesi lama pada salinan agar cookie produksi tidak berlaku. Catat durasi/kehilangan data aktual terhadap RPO/RTO dan checksum/hasil, tanpa isi data pribadi. Hancurkan salinan drill setelah penutupan. Pemulihan produksi memerlukan rencana terpisah, persetujuan operator dan backup kondisi sebelum restore; tidak dilakukan pada Prompt13.

## Insiden dan review

Saat ada indikasi bocor: batasi mutasi/akses yang relevan, pertahankan bukti audit/log minimal dan set backup yang diperlukan, cabut sesi/kunci terdampak melalui prosedur terotorisasi, identifikasi cakupan dengan requestId, eskalasi kepada penanggung jawab privasi/keamanan instansi untuk keputusan pemberitahuan sesuai kewajiban yang berlaku. Jangan membagikan profil, cookie, file PRIVATE atau dump dalam tiket/chat publik. Review hak operator/staf dan hasil restore per kuartal; dokumentasikan siapa menyetujui pengecualian/retensi/legal hold. Tidak ada penghapusan data otomatis sampai kebijakan disahkan.
