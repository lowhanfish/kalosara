import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import {
  getPublicRegionPlaceDetailService,
  listRegionPlacesService,
  listRegionStatisticsService,
  saveRegionPlaceService,
  saveRegionStatisticService,
} from '../services/cms-region.service.js';

export const listAdminRegionStatisticsController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listRegionStatisticsService(req.query, true);
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, req, data);
};

export const listPublicRegionStatisticsController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listRegionStatisticsService(req.query, false);
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, req, data);
};

export const listAdminRegionPlacesController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listRegionPlacesService(req.params.kind, req.query, true);
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, req, data);
};

export const listPublicRegionPlacesController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listRegionPlacesService(req.params.kind, req.query, false);
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, req, data);
};

export const putAdminRegionStatisticController: RequestHandler = async (
  req,
  res,
) => {
  const data = await saveRegionStatisticService(
    req.params.id,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};

export const putAdminRegionPlaceController: RequestHandler = async (
  req,
  res,
) => {
  const data = await saveRegionPlaceService(
    req.params.kind,
    req.params.id,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};

export const getPublicRegionPlaceDetailController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getPublicRegionPlaceDetailService(
    req.params.kind,
    req.params.id,
  );
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, req, data);
};
