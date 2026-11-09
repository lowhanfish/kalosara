import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import {
  getAdminCommunityRequestDetailService,
  getAdminCommunitySectionService,
  getPublishedCommunitySectionService,
  listAdminCommunityRequestsService,
  saveAdminCommunitySectionService,
  submitCommunityRequestService,
  updateAdminCommunityRequestService,
} from '../services/community.service.js';

export const getPublicCommunitySectionController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getPublishedCommunitySectionService(req.params.slug);
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, req, data);
};

export const createPublicCommunityRequestController: RequestHandler = async (
  req,
  res,
) => {
  const data = await submitCommunityRequestService(req.body);
  sendSuccess(res, req, data, 201);
};

export const getAdminCommunitySectionController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getAdminCommunitySectionService(req.params.slug);
  sendSuccess(res, req, data);
};

export const putAdminCommunitySectionController: RequestHandler = async (
  req,
  res,
) => {
  const data = await saveAdminCommunitySectionService(
    req.params.slug,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};

export const listAdminCommunityRequestsController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listAdminCommunityRequestsService(req.query);
  sendSuccess(res, req, data);
};

export const getAdminCommunityRequestDetailController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getAdminCommunityRequestDetailService(
    req.params.id,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};

export const patchAdminCommunityRequestController: RequestHandler = async (
  req,
  res,
) => {
  const data = await updateAdminCommunityRequestService(
    req.params.id,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};
