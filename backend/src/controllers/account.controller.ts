import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import {
  cancelOwnContactChangeService,
  changeOwnPasswordService,
  getOwnAccountProfileService,
  listAdminContactChangesService,
  requestOwnContactChangeService,
  reviewAdminContactChangeService,
  updateOwnAccountProfileService,
} from '../services/account.service.js';

export const getOwnProfileController: RequestHandler = async (req, res) => {
  const user = await getOwnAccountProfileService(
    req.auth!.userId,
    Object.keys(req.query).length,
  );
  sendSuccess(res, req, { user });
};

export const updateOwnProfileController: RequestHandler = async (req, res) => {
  const { userId, sessionId } = req.auth!;
  const user = await updateOwnAccountProfileService(
    userId,
    sessionId,
    req.body,
  );
  sendSuccess(res, req, { user });
};

export const createContactChangeController: RequestHandler = async (
  req,
  res,
) => {
  const { userId, sessionId } = req.auth!;
  const data = await requestOwnContactChangeService(
    userId,
    sessionId,
    req.body,
  );
  sendSuccess(res, req, data, 202);
};

export const deleteContactChangeController: RequestHandler = async (
  req,
  res,
) => {
  const { userId, sessionId } = req.auth!;
  const data = await cancelOwnContactChangeService(
    userId,
    sessionId,
    req.params.id,
  );
  sendSuccess(res, req, data);
};

export const changeOwnPasswordController: RequestHandler = async (req, res) => {
  const { userId, sessionId } = req.auth!;
  const data = await changeOwnPasswordService(userId, sessionId, req.body);
  sendSuccess(res, req, data);
};

export const listAdminContactChangesController: RequestHandler = async (
  req,
  res,
) => {
  const data = await listAdminContactChangesService(req.query);
  sendSuccess(res, req, data);
};

export const reviewAdminContactChangeController: RequestHandler = async (
  req,
  res,
) => {
  const { userId: actorId, sessionId } = req.auth!;
  const data = await reviewAdminContactChangeService(
    actorId,
    sessionId,
    req.params.id,
    req.body,
  );
  sendSuccess(res, req, data);
};
