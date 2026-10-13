# Identitas dan sesi KALOSARA — Prompt 02

Skema ini berlaku untuk satu kelurahan. Email adalah identitas login utama dan selalu dinormalisasi menjadi huruf kecil oleh layanan. Database juga mempunyai indeks unik `lower(email)` agar penulisan langsung tidak dapat membuat duplikat beda kapital. Telepon opsional memakai format E.164 dan unik bila ada. Profil hanya menyimpan nama tampilan; NIK tidak disimpan.

## Relasi

```text
User (role, isActive, passwordHash, verifiedAt)
  ├── 0..1 UserProfile (displayName)
  ├── 0..n RefreshSession (tokenHash, expiry, revocation, rotation)
  ├── 0..n PasswordResetToken (tokenHash, expiry, usedAt)
  └── 0..n AuditLog as actor (action and resource reference only)

AppSetting is independent: one kelurahan, no tenant table.
```

`UserProfile`, `RefreshSession`, dan `PasswordResetToken` dihapus ketika user dihapus. `AuditLog` tetap ada dan `actorId` menjadi null. Tindakan penting dicatat tanpa password, token, NIK, atau isi dokumen pribadi.

## Peran dan akses

Role hanya `LURAH`, `ADMIN_KELURAHAN`, dan `MASYARAKAT`. Layanan registrasi publik membuang field yang tidak dikenal dan secara eksplisit menulis role `MASYARAKAT`. Tidak ada endpoint registrasi pada Prompt 02; route autentikasi dibuat pada Prompt 03.

Middleware `loadActivePrincipal` menerima `req.auth.userId` hanya dari middleware token terverifikasi yang akan ditambahkan pada Prompt 03. Ia membaca role dan `isActive` terbaru dari database pada setiap request terproteksi. Akun nonaktif ditolak dengan `ACCOUNT_INACTIVE`; role yang tidak diizinkan dan resource milik user lain ditolak dengan `FORBIDDEN`. Route harus memasang `loadActivePrincipal` sebelum `requireRoles` atau `requireOwnership`.

## Lifecycle sesi

```text
registrasi publik -> User(MASYARAKAT, unverified)
login -> access cookie 15 menit + refresh cookie 7 hari
refresh -> validasi tokenHash dan expiry -> rotasi token
        -> sesi lama revokedAt/rotatedAt, sesi baru dibuat
logout / logout-all -> revokedAt diisi, cookie dihapus
reset password (Prompt 03+) -> token reset disimpan sebagai hash, digunakan sekali
```

Token mentah tidak masuk database atau log. `RefreshSession` menyimpan hash SHA-256, metadata `userAgent`, serta indeks `userId` dan `expiresAt`. Refresh token adalah nilai acak 32 byte. Rotasi menyalin `expiresAt` lama sehingga login baru memiliki masa hidup absolut 7 hari tanpa perpanjangan tak terbatas. Permintaan paralel dengan token lama dalam 3 detik menerima `REFRESH_RACE` tanpa cookie baru; pemakaian ulang setelah itu mencabut semua sesi user dan mengembalikan `SESSION_REVOKED`. Klien perlu melakukan refresh tunggal (single flight).

Access token JWT HS256 memuat `sub`, `sid`, `iss`, `aud`, `iat`, dan `exp`. Masa berlaku maksimal 15 menit dan dipotong jika sesi akan habis lebih dulu. Setiap request terlindungi memeriksa tanda tangan, sesi yang belum dicabut, status akun, dan role terbaru dari database. `AUTH_SIGNING_KEYS` berisi daftar `kid:base64url-key` dipisahkan koma. Kunci pertama menandatangani token baru; kunci berikutnya tetap diterima untuk masa transisi. Setiap kunci minimal 32 byte. Produksi menolak startup tanpa konfigurasi ini; development memakai kunci acak sementara per proses.

Cookie access (`/api/v1`) dan refresh (`/api/v1/auth`) memakai HttpOnly dan SameSite=Strict. Cookie Secure aktif ketika `APP_ORIGIN` HTTPS. Semua mutasi auth mewajibkan Origin yang persis sama dengan `APP_ORIGIN` dan header `X-CSRF-Token` yang sama dengan cookie CSRF. `GET /auth/csrf` menerbitkan keduanya; token CSRF boleh dibaca oleh klien, sedangkan token auth tidak dikembalikan di JSON. Di depan proxy, Express mempercayai satu hop untuk IP rate limit. Login dibatasi 10 percobaan per 15 menit per IP; register dan forgot-password masing-masing 5 per jam. Penyimpanan limiter ada di memori proses untuk instalasi satu VPS.

`POST /auth/forgot-password` saat ini mengembalikan `RESET_UNAVAILABLE` untuk semua email dan tetap memiliki rate limit. Pengiriman email serta penyelesaian reset belum tersedia; endpoint ini tidak mengungkap apakah email terdaftar.

## Provisioning staf

Seed development hanya berisi nama kelurahan dummy dan tidak membuat akun staf. Akun `LURAH` atau `ADMIN_KELURAHAN` dibuat oleh operator berwenang melalui `npm run staff:provision` dengan variabel sementara `PROVISION_ROLE`, `PROVISION_EMAIL`, `PROVISION_PASSWORD`, dan `PROVISION_ACK_VERIFIED=true`. Operator harus memverifikasi identitas pemilik akun di luar sistem sebelum menjalankan perintah. Password minimal 12 karakter dan maksimal 72 byte UTF-8, lalu di-hash bcrypt dengan cost `PASSWORD_BCRYPT_COST` (12–14, default 12). Jangan menaruh password pada riwayat shell, `.env.example`, Git, atau log.

Perintah ini menulis audit `STAFF_PROVISIONED` secara atomik bersama akun. Tidak ada endpoint publik yang dapat memilih role staf.
