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

## Lifecycle sesi yang disiapkan

```text
registrasi publik -> User(MASYARAKAT, unverified) -> verifikasi kontak
login (Prompt 03) -> access cookie 15 menit + refresh cookie 7 hari
refresh (Prompt 03) -> validasi tokenHash dan expiry -> rotasi token
                    -> sesi lama revokedAt/rotatedAt, sesi baru dibuat
logout (Prompt 03) -> revokedAt diisi, cookie dihapus
reset password (Prompt 03+) -> token reset disimpan sebagai hash, digunakan sekali
```

Token mentah tidak boleh masuk database atau log. `RefreshSession` menyimpan hash token SHA-256 sepanjang 64 karakter, metadata perangkat minimum (`userAgent` dan hash IP opsional), serta indeks `userId` dan `expiresAt`. Implementasi penerbitan token dan cookie dilakukan pada Prompt 03.

## Provisioning staf

Seed development hanya berisi nama kelurahan dummy dan tidak membuat akun staf. Akun `LURAH` atau `ADMIN_KELURAHAN` dibuat oleh operator berwenang melalui `npm run staff:provision` dengan variabel sementara `PROVISION_ROLE`, `PROVISION_EMAIL`, `PROVISION_PASSWORD`, dan `PROVISION_ACK_VERIFIED=true`. Operator harus memverifikasi identitas pemilik akun di luar sistem sebelum menjalankan perintah. Password minimal 12 karakter dan maksimal 72 byte UTF-8, lalu di-hash bcrypt dengan cost `PASSWORD_BCRYPT_COST` (12–14, default 12). Jangan menaruh password pada riwayat shell, `.env.example`, Git, atau log.

Perintah ini menulis audit `STAFF_PROVISIONED` secara atomik bersama akun. Tidak ada endpoint publik yang dapat memilih role staf.
