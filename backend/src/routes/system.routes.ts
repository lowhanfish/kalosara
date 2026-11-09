import { Router } from 'express';
import {
  getHealthController,
  getReadyController,
} from '../controllers/system.controller.js';

export const systemRouter = Router();

systemRouter.get('/health', getHealthController);
systemRouter.get('/ready', getReadyController);
