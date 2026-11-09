import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import {
  listContentService,
  saveAdminContentService,
} from '../services/cms-content.service.js';

export const listAdminContentController: RequestHandler = async (req, res) => {
  const data = await listContentService(req.params.kind, req.query, true);
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, req, data);
};

export const listPublicContentController: RequestHandler = async (req, res) => {
  const data = await listContentService(req.params.kind, req.query, false);
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, req, data);
};

export const putAdminContentController: RequestHandler = async (req, res) => {
  const data = await saveAdminContentService(
    req.params.kind,
    req.params.id,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};
