import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import {
  createPublicGuestBookService,
  getAdminGuestBookDetailService,
  getAdminGuestBookStatsService,
  getPublicTicketStatusService,
  listAdminGuestBookService,
  updateAdminGuestBookStatusService,
} from '../services/guestbook.service.js';
import {
  guestbookInput,
  guestbookQuery,
  guestbookStatusUpdate,
} from '../validators/guestbook.validator.js';

export const createPublicGuestbookController: RequestHandler = async (
  req,
  res,
) => {
  const parsed = guestbookInput.parse(req.body);
  const data = await createPublicGuestBookService(parsed);
  sendSuccess(res, req, data, 201);
};

export const getPublicTicketStatusController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getPublicTicketStatusService(
    String(req.params.ticketNumber),
  );
  sendSuccess(res, req, data);
};

export const listAdminGuestbookController: RequestHandler = async (
  req,
  res,
) => {
  const query = guestbookQuery.parse(req.query);
  const data = await listAdminGuestBookService(query);
  sendSuccess(res, req, data);
};

export const getAdminGuestbookDetailController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getAdminGuestBookDetailService(String(req.params.id));
  sendSuccess(res, req, data);
};

export const patchAdminGuestbookStatusController: RequestHandler = async (
  req,
  res,
) => {
  const parsed = guestbookStatusUpdate.parse(req.body);
  const actorId = req.auth?.userId;
  const data = await updateAdminGuestBookStatusService(
    String(req.params.id),
    parsed,
    actorId,
  );
  sendSuccess(res, req, data);
};

export const getAdminGuestbookStatsController: RequestHandler = async (
  req,
  res,
) => {
  const data = await getAdminGuestBookStatsService();
  sendSuccess(res, req, data);
};
