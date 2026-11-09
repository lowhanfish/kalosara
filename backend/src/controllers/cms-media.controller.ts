import type { RequestHandler, Response } from 'express';
import { extname } from 'node:path';
import { sendSuccess } from '../lib/http-response.js';
import { assertOwner } from '../middlewares/auth.middleware.js';
import { filePath } from '../services/cms-storage.service.js';
import {
  listAdminMediaService,
  resolveAdminMediaAssetService,
  resolvePublicMediaAssetService,
  updateAdminMediaService,
  uploadAdminMediaService,
} from '../services/cms-media.service.js';

function serveMediaFile(
  res: Response,
  asset: { storageKey: string; mimeType: string; size: number; id: string },
) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('Cache-Control', 'no-store');
  res.type(asset.mimeType);
  res.setHeader(
    'Content-Disposition',
    `${asset.mimeType === 'application/pdf' ? 'attachment' : 'inline'}; filename="${asset.id}.${extname(asset.storageKey).slice(1)}"`,
  );
  res.sendFile(filePath(asset.storageKey), (error) => {
    if (error && !res.headersSent) res.status(404).end();
  });
}

export const listAdminMediaController: RequestHandler = async (req, res) => {
  const data = await listAdminMediaService(req.auth!.userId, req.query);
  sendSuccess(res, req, data);
};

export const uploadAdminMediaController: RequestHandler = async (req, res) => {
  const data = await uploadAdminMediaService(req, res, req.auth!.userId);
  sendSuccess(res, req, data, 201);
};

export const patchAdminMediaController: RequestHandler = async (req, res) => {
  const data = await updateAdminMediaService({
    rawId: req.params.id,
    body: req.body,
    actorId: req.auth!.userId,
    verifyOwnership: (ownerId) => assertOwner(res.locals.principal, ownerId),
  });
  sendSuccess(res, req, data);
};

export const getAdminMediaFileController: RequestHandler = async (req, res) => {
  const asset = await resolveAdminMediaAssetService(req.params.id, (ownerId) =>
    assertOwner(res.locals.principal, ownerId),
  );
  serveMediaFile(res, asset);
};

export const getPublicMediaFileController: RequestHandler = async (
  req,
  res,
) => {
  const asset = await resolvePublicMediaAssetService(
    req.params.id,
    req.query.variant,
  );
  serveMediaFile(res, asset);
};
