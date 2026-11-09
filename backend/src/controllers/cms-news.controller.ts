import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import {
  getAdminNewsDetailService,
  getAdminNewsPreviewService,
  getPublicNewsArticleService,
  getPublicNewsRedirectService,
  getPublicNewsSitemapService,
  listAdminCategoriesService,
  listAdminNewsRevisionsService,
  listAdminNewsService,
  listPublicNewsCategoriesService,
  listPublicNewsService,
  resolvePublicNewsCategorySlugService,
  resolvePublicNewsSlugService,
  rollbackAdminNewsService,
  saveAdminCategoryService,
  saveAdminNewsService,
} from '../services/cms-news.service.js';

export const listAdminNewsCategoriesController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listAdminCategoriesService(req.query);
  sendSuccess(res, req, data);
};

export const putAdminNewsCategoryController: RequestHandler = async (
  req,
  res,
) => {
  const data = await saveAdminCategoryService(
    req.params.id,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};

export const listAdminNewsController: RequestHandler = async (req, res) => {
  const data = await listAdminNewsService(req.query);
  sendSuccess(res, req, data);
};

export const getAdminNewsDetailController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getAdminNewsDetailService(req.params.id);
  sendSuccess(res, req, data);
};

export const listAdminNewsRevisionsController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listAdminNewsRevisionsService(req.params.id, req.query);
  sendSuccess(res, req, data);
};

export const putAdminNewsController: RequestHandler = async (req, res) => {
  const data = await saveAdminNewsService(
    req.params.id,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};

export const rollbackAdminNewsController: RequestHandler = async (req, res) => {
  const data = await rollbackAdminNewsService(
    req.params.id,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};

export const getAdminNewsPreviewController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getAdminNewsPreviewService(req.params.id);
  sendSuccess(res, req, data);
};

export const listPublicNewsController: RequestHandler = async (req, res) => {
  const data = await listPublicNewsService(req.query);
  sendSuccess(res, req, data);
};

export const listPublicNewsCategoriesController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listPublicNewsCategoriesService();
  sendSuccess(res, req, data);
};

export const getPublicNewsSitemapController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getPublicNewsSitemapService();
  sendSuccess(res, req, data);
};

export const resolvePublicNewsSlugController: RequestHandler = async (
  req,
  res,
) => {
  const data = await resolvePublicNewsSlugService(req.params.slug);
  sendSuccess(res, req, data);
};

export const resolvePublicNewsCategorySlugController: RequestHandler = async (
  req,
  res,
) => {
  const data = await resolvePublicNewsCategorySlugService(req.params.slug);
  sendSuccess(res, req, data);
};

export const getPublicNewsRedirectController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getPublicNewsRedirectService(req.params.slug);
  sendSuccess(res, req, data);
};

export const getPublicNewsArticleController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getPublicNewsArticleService(req.params.slug);
  sendSuccess(res, req, data);
};
