# API autentikasi — Prompt 03

Prefix seluruh endpoint: `/api/v1/auth`. Respons selalu memuat `success` dan `requestId`. Token autentikasi hanya berada di cookie HttpOnly.

| Method | Path | Hasil | Syarat |
| --- | --- | --- | --- |
| GET | `/csrf` | 200, token CSRF dan cookie | Tidak ada |
| POST | `/register` | 201, identitas akun MASYARAKAT | Origin + CSRF; 5/jam/IP |
| POST | `/login` | 200, identitas akun dan cookie access/refresh | Origin + CSRF; 10/15 menit/IP |
| POST | `/refresh` | 200, cookie baru | Origin + CSRF + refresh cookie |
| POST | `/logout` | 200, cookie dibersihkan | Origin + CSRF; idempoten |
| POST | `/logout-all` | 200, seluruh sesi dicabut | Origin + CSRF + access cookie aktif |
| GET | `/me` | 200, profil dan role terkini | Access cookie aktif |
| POST | `/forgot-password` | 503, RESET_UNAVAILABLE | Origin + CSRF; 5/jam/IP |

Ambil CSRF dahulu dengan `GET /api/v1/auth/csrf`. Kirim nilai `data.csrfToken` sebagai header `X-CSRF-Token` pada setiap POST. Browser mengirim cookie dari origin yang sama. Contoh body register:

```json
{"email":"warga@example.invalid","password":"<password-kuat-min-12-karakter>","displayName":"Warga Contoh"}
```

Respons register:

```json
{"success":true,"data":{"user":{"id":"<uuid>","email":"warga@example.invalid","role":"MASYARAKAT"}},"requestId":"<uuid>"}
```

Contoh body login:

```json
{"email":"warga@example.invalid","password":"<password-kuat-min-12-karakter>"}
```

Respons login tidak berisi token:

```json
{"success":true,"data":{"user":{"id":"<uuid>","email":"warga@example.invalid","role":"MASYARAKAT"}},"requestId":"<uuid>"}
```

`GET /me` mengembalikan `id`, `email`, `phone`, `role`, `isActive`, `verifiedAt`, `createdAt`, dan `profile.displayName`. Respons error berbentuk `{"success":false,"error":{"code":"UNAUTHENTICATED","message":"..."},"requestId":"<uuid>"}`.

## Pengujian negatif

| Kondisi | Hasil |
| --- | --- |
| Role `LURAH` pada body register | Diabaikan; akun tetap MASYARAKAT |
| Email atau telepon duplikat | 409 ACCOUNT_EXISTS |
| Password login salah | 401 UNAUTHENTICATED |
| Origin hilang/berbeda | 403 ORIGIN_FORBIDDEN |
| Cookie/header CSRF hilang atau tidak cocok | 403 CSRF_INVALID |
| Access token habis | 401 TOKEN_EXPIRED |
| Sesi dicabut atau logout-all | 401 SESSION_REVOKED |
| Akun nonaktif | 403 ACCOUNT_INACTIVE |
| Refresh paralel dengan token lama | 409 REFRESH_RACE |
| Pemakaian ulang token rotasi lewat masa tenggang | 401 SESSION_REVOKED; semua sesi dicabut |
| Percobaan login melewati batas | 429 RATE_LIMITED |

Frontend pada Prompt 04 perlu menyimpan CSRF di memori dan mengambil ulang setelah reload, mengirim `credentials: 'include'`, serta memakai satu permintaan refresh untuk beberapa request yang gagal bersamaan.
