import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import {
  getAdminProfileService,
  getPublicProfileService,
  saveProfileOfficialService,
  saveProfilePageService,
  updateProfileSettingsService,
} from '../services/profile.service.js';

export const getPublicProfileController: RequestHandler = async (req, res) => {
  const data = await getPublicProfileService();
  sendSuccess(res, req, data);
};

export const getAdminProfileController: RequestHandler = async (req, res) => {
  const data = await getAdminProfileService();
  sendSuccess(res, req, data);
};

export const putProfileSettingsController: RequestHandler = async (
  req,
  res,
) => {
  const data = await updateProfileSettingsService(req.body, req.auth!.userId);
  sendSuccess(res, req, data);
};

export const putProfilePageController: RequestHandler = async (req, res) => {
  const data = await saveProfilePageService(
    req.params.slug,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};

export const putProfileOfficialController: RequestHandler = async (
  req,
  res,
) => {
  const data = await saveProfileOfficialService(
    req.params.id,
    req.body,
    req.auth!.userId,
  );
  sendSuccess(res, req, data);
};
