import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import { getPublicSettingsService } from '../services/public-settings.service.js';

export const getPublicSettingsController: RequestHandler = async (req, res) => {
  const data = await getPublicSettingsService();
  sendSuccess(res, req, data);
};
