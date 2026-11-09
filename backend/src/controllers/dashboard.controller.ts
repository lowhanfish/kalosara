import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import {
  createDashboardUserService,
  getDashboardSummaryService,
  listDashboardAuditLogsService,
  listDashboardUploadsService,
  listDashboardUsersService,
  updateDashboardUserAccessService,
} from '../services/dashboard.service.js';

export const getDashboardSummaryController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getDashboardSummaryService();
  sendSuccess(res, req, data);
};

export const listDashboardUsersController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listDashboardUsersService(
    req.query as Record<string, unknown>,
  );
  sendSuccess(res, req, data);
};

export const createDashboardUserController: RequestHandler = async (
  req,
  res,
) => {
  const data = await createDashboardUserService(req.auth!.userId, req.body);
  sendSuccess(res, req, data, 201);
};

export const updateDashboardUserAccessController: RequestHandler = async (
  req,
  res,
) => {
  const data = await updateDashboardUserAccessService(
    req.auth!.userId,
    req.params.id,
    req.body,
  );
  sendSuccess(res, req, data);
};

export const listDashboardAuditLogsController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listDashboardAuditLogsService(req.query);
  sendSuccess(res, req, data);
};

export const listDashboardUploadsController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listDashboardUploadsService(req.auth!.userId, req.query);
  sendSuccess(res, req, data);
};
