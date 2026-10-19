import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PrismaClient, type Prisma } from '@prisma/client';
import {
  filePath,
  storageKey,
  variantKey,
} from '../src/modules/cms/storage.js';
import {
  demoNotice,
  profilePages,
  newsItems,
  announcements,
  events,
  facilities,
  potentials,
} from './fixtures/demo-data.js';

const prisma = new PrismaClient();
const sourceRoot = dirname(fileURLToPath(import.meta.url));
const imageRoot = resolve(sourceRoot, '../../frontend/public/images');
const id = (key: string) => {
  const value = createHash('sha256')
    .update(`kalosara-demo-v1:${key}`)
    .digest('hex');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-5${value.slice(13, 16)}-a${value.slice(17, 20)}-${value.slice(20, 32)}`;
};
const html = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const today = new Date();
const relativeDate = (days: number, hour = 9) => {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour - 8, 0, 0, 0);
  return date;
};
async function imageAsset(name: string, ownerId: string) {
  const mediaId = id(`image:${name}`);
  if (await prisma.mediaAsset.findUnique({ where: { id: mediaId } }))
    return mediaId;
  const source = resolve(
    imageRoot,
    name.includes('kantor') ? 'watundehoa' : 'reference',
    name,
  );
  const key = storageKey('general', mediaId, 'webp', true);
  const original = await sharp(await readFile(source))
    .webp({ quality: 88 })
    .toBuffer();
  await mkdir(dirname(filePath(key)), { recursive: true });
  await writeFile(filePath(key), original);
  for (const [variant, width] of [
    ['thumb', 480],
    ['display', 1200],
  ] as const) {
    await writeFile(
      filePath(variantKey(key, variant)),
      await sharp(original)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer(),
    );
  }
  await prisma.mediaAsset.create({
    data: {
      id: mediaId,
      storageKey: key,
      originalName: `contoh-${name}`,
      mimeType: 'image/webp',
      size: original.length,
      alt: 'Ilustrasi kegiatan dan lingkungan untuk konten contoh KALOSARA',
      caption:
        'Foto referensi visual; bukan dokumentasi terverifikasi dari kegiatan dalam narasi dummy.',
      visibility: 'PUBLIC',
      ownerId,
    },
  });
  return mediaId;
}
interface DemoDocument {
  slug: string;
  title: string;
  category: string;
  intro: string;
  sections: { title: string; text: string }[];
}
async function documentAsset(document: DemoDocument, ownerId: string) {
  const mediaId = id(`pdf:${document.slug}`);
  if (await prisma.mediaAsset.findUnique({ where: { id: mediaId } }))
    return mediaId;
  const bytes = await readFile(
    resolve(sourceRoot, 'fixtures/documents', `${document.slug}.pdf`),
  );
  const key = storageKey('documents', mediaId, 'pdf', false);
  await mkdir(dirname(filePath(key)), { recursive: true });
  await writeFile(filePath(key), bytes);
  await prisma.mediaAsset.create({
    data: {
      id: mediaId,
      storageKey: key,
      originalName: `contoh-${document.slug}.pdf`,
      mimeType: 'application/pdf',
      size: bytes.length,
      alt: '',
      caption: demoNotice,
      visibility: 'PUBLIC',
      ownerId,
    },
  });
  return mediaId;
}
try {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Seed demo hanya untuk lingkungan pengembangan.');
  const owner = await prisma.user.findFirst({
    where: { role: 'ADMIN_KELURAHAN', isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!owner)
    throw new Error(
      'Buat akun admin terlebih dahulu. Seed demo tidak membuat atau mengubah akun.',
    );
  const images = new Map<string, string>();
  for (const name of [
    'kantor.webp',
    'papan-kantor.webp',
    'news-main.webp',
    'news-2.webp',
    'gallery-1.webp',
    'gallery-2.webp',
    'gallery-3.webp',
    'gallery-4.webp',
    'gallery-5.webp',
  ])
    images.set(name, await imageAsset(name, owner.id));
  const documents = JSON.parse(
    await readFile(resolve(sourceRoot, 'fixtures/documents.json'), 'utf8'),
  ) as DemoDocument[];
  const files = new Map<string, string>();
  for (const document of documents)
    files.set(document.slug, await documentAsset(document, owner.id));
  await prisma.$transaction(
    async (tx) => {
      const defaults = {
        name: 'Kelurahan Watundehoa',
        district: 'Kecamatan Puriala',
        regency: 'Kabupaten Konawe',
        address:
          'Jl. Pelayanan Warga No. 1 (alamat contoh), Watundehoa, Kecamatan Puriala, Kabupaten Konawe',
        phone: '+62 000 0000 0000',
        email: 'layanan@watundehoa.example',
        hours:
          'Senin-Kamis 08.00-15.00 WITA; Jumat 08.00-11.30 WITA (jadwal contoh)',
        latitude: -4.0556,
        longitude: 122.1139,
        logoUrl: '/images/watundehoa/konawe.png',
        heroUrl: '/images/watundehoa/kantor.webp',
        relatedLinks: [],
      };
      const current = await tx.siteSetting.findUnique({
        where: { id: 'site' },
      });
      const configured = (
        current?.value &&
        typeof current.value === 'object' &&
        !Array.isArray(current.value)
          ? current.value
          : {}
      ) as Record<string, Prisma.JsonValue>;
      const settings = {
        ...defaults,
        ...Object.fromEntries(
          Object.entries(configured).filter(
            ([, value]) => value !== null && value !== '',
          ),
        ),
      };
      await tx.siteSetting.upsert({
        where: { id: 'site' },
        create: { value: settings },
        update: { value: settings },
      });
      await tx.appSetting.upsert({
        where: { key: 'site.demoContent' },
        create: { key: 'site.demoContent', value: true },
        update: { value: true },
      });
      for (const page of profilePages)
        await tx.page.upsert({
          where: { slug: page.slug },
          update: {},
          create: { ...page, status: 'PUBLISHED' },
        });
      const officials = [
        {
          name: 'AMIRULAH, S.Si',
          position: 'Lurah',
          unit: 'Kelurahan Watundehoa',
          photoUrl: '/images/watundehoa/amirulah.webp',
        },
        {
          name: 'Petugas Sekretariat (Contoh)',
          position: 'Sekretaris',
          unit: 'Sekretariat kelurahan',
          photoUrl: null,
        },
        {
          name: 'Petugas Pelayanan (Contoh)',
          position: 'Koordinator Pelayanan',
          unit: 'Pelayanan administrasi',
          photoUrl: null,
        },
        {
          name: 'Petugas Pemberdayaan (Contoh)',
          position: 'Koordinator Pemberdayaan',
          unit: 'Pemberdayaan masyarakat',
          photoUrl: null,
        },
      ];
      for (const [index, official] of officials.entries())
        await tx.official.upsert({
          where: { id: id(`official:${index}`) },
          update: {},
          create: {
            id: id(`official:${index}`),
            ...official,
            sortOrder: index,
            status: 'PUBLISHED',
            active: true,
          },
        });
      for (const [index, item] of newsItems.entries()) {
        const categoryId = id(`category:${item.category}`);
        await tx.newsCategory.upsert({
          where: { id: categoryId },
          update: {},
          create: {
            id: categoryId,
            name: item.category,
            slug: `contoh-${item.category.toLowerCase().replaceAll(' ', '-')}`,
          },
        });
        const newsId = id(`news:${item.slug}`);
        const coverId = images.get(item.image)!;
        const bodyHtml =
          `<p>${html(item.excerpt)}</p>` +
          item.sections
            .map(
              ([title, text]) => `<h2>${html(title)}</h2><p>${html(text)}</p>`,
            )
            .join('') +
          `<blockquote><p>${html(demoNotice)}</p></blockquote>`;
        const data = {
          title: item.title,
          slug: `contoh-${item.slug}`,
          excerpt: item.excerpt,
          bodyHtml,
          status: 'PUBLISHED' as const,
          publishedAt: relativeDate(-index - 1),
          authorId: owner.id,
          categoryId,
          coverId,
        };
        await tx.news.upsert({
          where: { id: newsId },
          update: {},
          create: { id: newsId, ...data },
        });
        await tx.newsMedia.upsert({
          where: { newsId_mediaId: { newsId, mediaId: coverId } },
          update: {},
          create: { newsId, mediaId: coverId },
        });
        await tx.newsRevision.upsert({
          where: { newsId_version: { newsId, version: 1 } },
          update: {},
          create: {
            newsId,
            version: 1,
            editorId: owner.id,
            snapshot: {
              ...data,
              publishedAt: data.publishedAt.toISOString(),
              id: newsId,
              version: 1,
            },
            mediaIds: [coverId],
          },
        });
      }
      const draftId = id('news:draft-rencana-lingkungan');
      const draftCover = images.get('kantor.webp')!;
      const draft = {
        title: 'Draft rencana kegiatan lingkungan bulan berikutnya',
        slug: 'contoh-draft-rencana-lingkungan',
        excerpt:
          'Materi contoh yang masih disiapkan pengelola dan belum tampil pada halaman publik.',
        bodyHtml: `<p>Contoh draft ini menjadi ruang untuk menyiapkan informasi kegiatan berikutnya sebelum ditinjau dan diterbitkan.</p><h2>Gagasan awal</h2><p>Materi memuat usulan kegiatan kebersihan lingkungan, diskusi kebutuhan warga, dan penyampaian panduan pelayanan. Tanggal serta penanggung jawab akan dilengkapi setelah proses pembahasan.</p><h2>Catatan pengelola</h2><p>Periksa kembali judul, kategori, gambar, dan kelengkapan informasi sebelum memilih status Terbit.</p><blockquote><p>${demoNotice}</p></blockquote>`,
        status: 'DRAFT' as const,
        authorId: owner.id,
        categoryId: id('category:Lingkungan'),
        coverId: draftCover,
      };
      await tx.news.upsert({
        where: { id: draftId },
        update: {},
        create: { id: draftId, ...draft },
      });
      await tx.newsMedia.upsert({
        where: { newsId_mediaId: { newsId: draftId, mediaId: draftCover } },
        update: {},
        create: { newsId: draftId, mediaId: draftCover },
      });
      await tx.newsRevision.upsert({
        where: { newsId_version: { newsId: draftId, version: 1 } },
        update: {},
        create: {
          newsId: draftId,
          version: 1,
          editorId: owner.id,
          snapshot: { ...draft, id: draftId, version: 1, publishedAt: null },
          mediaIds: [draftCover],
        },
      });
      for (const [index, item] of announcements.entries()) {
        const contentId = id(`announcement:${index}`);
        await tx.contentItem.upsert({
          where: { id: contentId },
          update: {},
          create: {
            id: contentId,
            kind: 'announcements',
            title: item.title,
            content: `${item.content}\n\n${demoNotice}`,
            status: 'PUBLISHED',
            announcement: {
              create: {
                pinned: item.pinned,
                startsAt: relativeDate(-2),
                expiredAt: relativeDate(90),
              },
            },
          },
        });
      }
      for (const [index, item] of events.entries()) {
        const contentId = id(`event:${index}`);
        const start = relativeDate(item.days, item.hour);
        const end = new Date(start.getTime() + 2 * 3600000);
        await tx.contentItem.upsert({
          where: { id: contentId },
          update: {},
          create: {
            id: contentId,
            kind: 'events',
            title: item.title,
            content: `${item.content}\n\n${demoNotice}`,
            status: 'PUBLISHED',
            event: { create: { start, end, location: item.location } },
          },
        });
      }
      for (const [index, title] of [
        'Kebersamaan dan kegiatan lingkungan',
        'Ruang pelayanan dan keseharian warga',
      ].entries()) {
        const contentId = id(`gallery:${index}`);
        const names =
          index === 0
            ? [
                'gallery-1.webp',
                'gallery-2.webp',
                'gallery-3.webp',
                'gallery-4.webp',
                'gallery-5.webp',
              ]
            : ['kantor.webp', 'papan-kantor.webp', 'news-main.webp'];
        await tx.contentItem.upsert({
          where: { id: contentId },
          update: {},
          create: {
            id: contentId,
            kind: 'galleries',
            title,
            content: `Kumpulan foto referensi untuk memperlihatkan susunan galeri kegiatan. Foto tidak dimaksudkan sebagai bukti dari narasi atau jadwal contoh pada portal.\n\n${demoNotice}`,
            status: 'PUBLISHED',
            gallery: {
              create: {
                photos: {
                  create: names.map((name, sortOrder) => ({
                    mediaId: images.get(name)!,
                    sortOrder,
                    alt: `Foto ilustrasi ${sortOrder + 1}: ${index === 0 ? 'kegiatan warga' : 'lingkungan kantor'} untuk pratinjau KALOSARA`,
                  })),
                },
              },
            },
          },
        });
      }
      for (const document of documents)
        await tx.contentItem.upsert({
          where: { id: id(`document:${document.slug}`) },
          update: {},
          create: {
            id: id(`document:${document.slug}`),
            kind: 'documents',
            title: document.title,
            content: `${document.intro}\n\n${demoNotice}`,
            status: 'PUBLISHED',
            document: {
              create: {
                category: document.category,
                fileId: files.get(document.slug)!,
              },
            },
          },
        });
      for (const [index, period] of ['2026-10', '2026-09'].entries())
        await tx.statisticSnapshot.upsert({
          where: { period },
          update: {},
          create: {
            id: id(`statistics:${period}`),
            period,
            source:
              'Data simulasi KALOSARA - angka dummy, bukan statistik resmi',
            referenceDate: new Date(`${period}-01T00:00:00Z`),
            population: 2846 - index * 18,
            male: 1421 - index * 10,
            female: 1425 - index * 8,
            households: 738 - index * 4,
            rt: 12,
            rw: 4,
            status: 'PUBLISHED',
          },
        });
      for (const [index, item] of facilities.entries())
        await tx.facility.upsert({
          where: { id: id(`facility:${index}`) },
          update: {},
          create: {
            id: id(`facility:${index}`),
            name: item.name,
            description: `${item.description}\n\n${demoNotice}`,
            category: item.category,
            location: item.location,
            latitude: -4.0556 + index * 0.002,
            longitude: 122.1139 + index * 0.002,
            photoId: images.get(item.image),
            photoAlt: 'Foto ilustrasi fasilitas untuk data contoh',
            status: 'PUBLISHED',
          },
        });
      for (const [index, item] of potentials.entries())
        await tx.potential.upsert({
          where: { id: id(`potential:${index}`) },
          update: {},
          create: {
            id: id(`potential:${index}`),
            name: item.name,
            description: `${item.description}\n\n${demoNotice}`,
            category: item.category,
            location: item.location,
            latitude: -4.0556 - index * 0.002,
            longitude: 122.1139 - index * 0.002,
            photoId: images.get(item.image),
            photoAlt: 'Foto ilustrasi potensi untuk data contoh',
            status: 'PUBLISHED',
          },
        });
      await tx.auditLog.create({
        data: {
          actorId: owner.id,
          action: 'DEMO_CONTENT_SEEDED',
          resourceType: 'DemoContent',
          resourceId: 'kalosara-demo-v1',
        },
      });
      await tx.cacheInvalidation.create({
        data: {
          tags: ['site-settings', 'public-profile', 'news', 'public-content'],
        },
      });
    },
    { timeout: 30000 },
  );
  console.log(
    JSON.stringify({
      message:
        'Konten demo berhasil disiapkan. Data contoh tidak menggantikan record konten yang sudah ada.',
      news: newsItems.length,
      drafts: 1,
      profilePages: profilePages.length,
      officials: 4,
      announcements: announcements.length,
      events: events.length,
      galleries: 2,
      documents: documents.length,
      statistics: 2,
      facilities: facilities.length,
      potentials: potentials.length,
      media: images.size + files.size,
    }),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Seed demo gagal.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
