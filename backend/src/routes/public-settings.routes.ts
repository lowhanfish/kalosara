import { Router } from 'express';
import { getPublicSettingsController } from '../controllers/public-settings.controller.js';

export const publicSettingsRouter = Router();
publicSettingsRouter.get('/', getPublicSettingsController);
