# Bukti HTML server Prompt 08

Diambil dengan curl anonim dari hasil build produksi lokal pada 16 Oktober 2026, tanpa menjalankan JavaScript. Artikel dan akun uji sudah dihapus setelah QA. URL localhost adalah origin pengujian, bukan deployment publik.

```bash
curl -fsS -D headers.txt http://localhost:3001/berita/SLUG_UJI
```

HTTP 200; berikut tag yang benar-benar berada di antara `<head>` dan `</head>` dalam respons:

```html
<title>Kegiatan Warga Watundehoa — Uji SEO | KALOSARA</title>
<meta name="description" content="Ringkasan kegiatan warga untuk pengujian metadata server."/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="http://localhost:3001/berita/seo-7f3af180-28e7-4103-9a72-e4f26736cfd2"/>
<meta property="og:title" content="Kegiatan Warga Watundehoa — Uji SEO"/>
<meta property="og:description" content="Ringkasan kegiatan warga untuk pengujian metadata server."/>
<meta property="og:url" content="http://localhost:3001/berita/seo-7f3af180-28e7-4103-9a72-e4f26736cfd2"/>
<meta property="og:site_name" content="Kelurahan Watundehoa"/>
<meta property="og:locale" content="id_ID"/>
<meta property="og:image" content="http://localhost:3001/api/v1/public/media/f0870a72-da46-414d-9e52-44412608bf22?variant=display"/>
<meta property="og:image:alt" content="Dokumentasi uji SEO"/>
<meta property="og:type" content="article"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="Kegiatan Warga Watundehoa — Uji SEO"/>
<meta name="twitter:description" content="Ringkasan kegiatan warga untuk pengujian metadata server."/>
<meta name="twitter:image" content="http://localhost:3001/api/v1/public/media/f0870a72-da46-414d-9e52-44412608bf22?variant=display"/>
```

JSON-LD pada respons server yang sama:

```json
[{"@context":"https://schema.org","@type":"NewsArticle","headline":"Kegiatan Warga Watundehoa — Uji SEO","description":"Ringkasan kegiatan warga untuk pengujian metadata server.","datePublished":"2026-10-16T15:36:44.343Z","dateModified":"2026-10-16T15:36:44.344Z","image":["http://localhost:3001/api/v1/public/media/f0870a72-da46-414d-9e52-44412608bf22?variant=display"],"mainEntityOfPage":"http://localhost:3001/berita/seo-7f3af180-28e7-4103-9a72-e4f26736cfd2","author":{"@type":"Organization","name":"Kelurahan Watundehoa"},"publisher":{"@type":"GovernmentOrganization","name":"Kelurahan Watundehoa"}},{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Beranda","item":"http://localhost:3001/"},{"@type":"ListItem","position":2,"name":"Berita","item":"http://localhost:3001/berita"},{"@type":"ListItem","position":3,"name":"Kegiatan Warga Watundehoa — Uji SEO","item":"http://localhost:3001/berita/seo-7f3af180-28e7-4103-9a72-e4f26736cfd2"}]}]
```

Uji lifecycle juga membuktikan DRAFT/ARCHIVED HTTP 404; kedua alias lama HTTP 301 langsung ke slug terakhir; title daftar berubah setelah update cache hangat; sitemap menghapus artikel arsip. Instance frontend terisolasi dengan backend tidak tersedia mengembalikan HTTP 503, Cache-Control no-store, Retry-After 60 dan X-Robots-Tag noindex.
