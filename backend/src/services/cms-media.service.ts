import type { Request, Response } from 'express';
import { fileTypeFromFile } from 'file-type';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { CmsError } from '../lib/errors.js';
import { idSchema, mediaUrl } from '../validators/common.validator.js';
import {
  mediaListQuerySchema,
  mediaPatchSchema,
  mediaUploadFieldsSchema,
  mediaVariantSchema,
} from '../validators/cms.validator.js';
import {
  createMediaAssetInTx,
  findActiveMediaAssetById,
  findPublicMediaAssetById,
  listMediaAssetsWithCount,
  updateMediaAssetInTx,
} from '../repositories/cms-media.repository.js';
import {
  enqueueInvalidation,
  notifyInvalidation,
} from './cache-invalidation.service.js';
import {
  filePath,
  MAX_FILE_SIZE,
  storageKey as makeStorageKey,
  uploadRoot as root,
  variantKey,
} from './cms-storage.service.js';

// Bound native image CPU/cache in the single API process.
sharp.concurrency(1);
sharp.cache({ memory: 16, files: 0, items: 20 });

let processing = 0;

export async function listAdminMediaService(
  ownerId: string,
  rawQuery: unknown,
) {
  const query = mediaListQuerySchema.parse(rawQuery);
  const [items, total] = await listMediaAssetsWithCount(ownerId, query);
  return {
    items: items.map((item) => ({
      ...item,
      url: item.visibility === 'PUBLIC' ? mediaUrl(item.id) : null,
    })),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function uploadAdminMediaService(
  req: Request,
  res: Response,
  ownerId: string,
) {
  if (processing >= 2)
    throw new CmsError(503, 'UPLOAD_BUSY', 'Upload capacity busy; try again');
  processing++;
  const temporary = resolve(root, 'tmp', randomUUID());
  let stored: string | undefined;
  let committed = false;
  const derivatives: string[] = [];
  try {
    await mkdir(temporary, { recursive: true, mode: 0o700 });
    const parser = multer({
      dest: temporary,
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 4,
        fieldSize: 4000,
        parts: 5,
        headerPairs: 100,
      },
    }).single('file');
    await new Promise<void>((accept, reject) => {
      const abort = () =>
        reject(new CmsError(400, 'UPLOAD_ABORTED', 'Upload interrupted'));
      req.once('aborted', abort);
      parser(req, res, (error) => {
        req.removeListener('aborted', abort);
        if (error) reject(error);
        else accept();
      });
    });
    const { source, ...input } = mediaUploadFieldsSchema.parse(req.body);
    const file = req.file;
    if (!file) throw new CmsError(400, 'FILE_REQUIRED', 'Choose one file');
    if (!file.size || file.size > MAX_FILE_SIZE) {
      throw new CmsError(413, 'FILE_TOO_LARGE', 'Maximum 20 MB per file');
    }
    const detected = await fileTypeFromFile(file.path);
    const supported: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    };
    if (
      !detected ||
      !supported[detected.mime]?.includes(
        extname(file.originalname).toLowerCase(),
      ) ||
      file.mimetype !== detected.mime
    ) {
      throw new CmsError(
        400,
        'INVALID_FILE_TYPE',
        'Signature, MIME and extension must match JPG/PNG/WebP/PDF',
      );
    }
    if (detected.mime.startsWith('image/') && !input.alt) {
      throw new CmsError(400, 'ALT_REQUIRED', 'Image alt text is required');
    }
    const isImage = detected.mime.startsWith('image/');
    const finalExt = isImage ? 'webp' : detected.ext;
    const finalMime = isImage ? 'image/webp' : detected.mime;
    const id = randomUUID();
    const storageKey = makeStorageKey(source, id, finalExt, isImage);
    stored = filePath(storageKey);
    await mkdir(dirname(stored), { recursive: true, mode: 0o700 });
    let size = file.size;
    if (detected.mime === 'application/pdf') {
      try {
        const buffer = await readFile(file.path);
        if (
          !buffer.subarray(0, 8).toString().startsWith('%PDF-') ||
          !buffer.subarray(-1024).toString().includes('%%EOF')
        ) {
          throw new Error('Invalid PDF');
        }
        const pdf = await PDFDocument.load(buffer, {
          ignoreEncryption: false,
          throwOnInvalidObject: true,
          updateMetadata: false,
        });
        if (pdf.getPageCount() < 1 || pdf.getPageCount() > 1000) {
          throw new Error('Invalid page count');
        }
      } catch {
        throw new CmsError(
          400,
          'INVALID_PDF',
          'PDF must be valid, unencrypted and contain 1–1000 pages',
        );
      }
      await rename(file.path, stored);
    } else {
      try {
        const image = sharp(file.path, {
          limitInputPixels: 25_000_000,
          animated: false,
          failOn: 'warning',
        })
          .rotate()
          .resize({
            width: 1920,
            height: 1920,
            fit: 'inside',
            withoutEnlargement: true,
          });
        const buffer = await image.webp({ quality: 85 }).toBuffer();
        size = buffer.length;
        if (size > MAX_FILE_SIZE) throw new Error('Oversized image');
        await writeFile(stored, buffer, { flag: 'wx', mode: 0o600 });
        if (input.visibility === 'PUBLIC') {
          for (const [variant, width] of [
            ['thumb', 480],
            ['display', 1200],
          ] as const) {
            const target = filePath(variantKey(storageKey, variant));
            derivatives.push(target);
            const optimized = await sharp(buffer)
              .resize({ width, withoutEnlargement: true })
              .webp({ quality: 80 })
              .toBuffer();
            await writeFile(target, optimized, { flag: 'wx', mode: 0o600 });
          }
        }
      } catch {
        throw new CmsError(
          400,
          'INVALID_IMAGE',
          'Image cannot be decoded safely (maximum 25 megapixels)',
        );
      }
    }
    const originalName = Array.from(basename(file.originalname))
      .filter((char) => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127)
      .join('')
      .slice(0, 200);
    const asset = await createMediaAssetInTx({
      id,
      storageKey,
      mimeType: finalMime,
      size,
      originalName,
      ownerId,
      ...input,
    });
    committed = true;
    return {
      asset: {
        ...asset,
        url: asset.visibility === 'PUBLIC' ? mediaUrl(asset.id) : null,
      },
    };
  } catch (error) {
    if (error instanceof multer.MulterError) {
      throw new CmsError(
        error.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
        error.code,
        'One file, maximum 20 MB; only visibility, alt, caption and source fields allowed',
      );
    }
    throw error;
  } finally {
    processing--;
    await rm(temporary, { recursive: true, force: true });
    if (stored && !committed) await rm(stored, { force: true });
    if (!committed)
      await Promise.all(derivatives.map((path) => rm(path, { force: true })));
  }
}

export async function updateAdminMediaService(params: {
  rawId: unknown;
  body: unknown;
  actorId: string;
  verifyOwnership: (ownerId: string | null | undefined) => void;
}) {
  const id = idSchema.parse(params.rawId);
  const input = mediaPatchSchema.parse(params.body);
  const asset = await updateMediaAssetInTx({
    id,
    input,
    actorId: params.actorId,
    verifyOwnership: params.verifyOwnership,
    enqueueCache: (tx) => enqueueInvalidation(tx),
  });
  return {
    asset: asset.result,
    cacheInvalidated: await notifyInvalidation(asset.event.id),
  };
}

export async function resolveAdminMediaAssetService(
  rawId: unknown,
  verifyOwnership: (ownerId: string | null | undefined) => void,
) {
  const id = idSchema.parse(rawId);
  const asset = await findActiveMediaAssetById(id);
  if (!asset) throw new CmsError(404, 'NOT_FOUND', 'Media not found');
  if (asset.visibility === 'PRIVATE') verifyOwnership(asset.ownerId);
  return asset;
}

export async function resolvePublicMediaAssetService(
  rawId: unknown,
  rawVariant: unknown,
) {
  const id = idSchema.parse(rawId);
  const asset = await findPublicMediaAssetById(id);
  if (!asset) throw new CmsError(404, 'NOT_FOUND', 'Media not found');
  const variant = mediaVariantSchema.parse(rawVariant);
  if (variant && asset.mimeType.startsWith('image/')) {
    const key = variantKey(asset.storageKey, variant);
    try {
      await stat(filePath(key));
      return { ...asset, storageKey: key, mimeType: 'image/webp' };
    } catch {
      /* Older uploads remain readable using the already compressed original. */
    }
  }
  return asset;
}
