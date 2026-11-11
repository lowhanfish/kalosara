import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { LetterRepository } from '../repositories/letter.repository.js';
import { LetterPdfService } from '../services/letter-pdf.service.js';
import { EmailService } from '../services/email.service.js';
import { LetterService } from '../services/letter.service.js';
import { LetterController } from '../controllers/letter.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import {
  privateNoStore,
  noStore,
} from '../middlewares/cache-control.middleware.js';
import { createRateLimiter } from '../middlewares/rate-limit.middleware.js';

const letterRepo = new LetterRepository(prisma);
const pdfService = new LetterPdfService();
const emailService = new EmailService();
const letterService = new LetterService(letterRepo, pdfService, emailService);
const letterController = new LetterController(letterService);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Format file tidak didukung. Gunakan PDF, JPG, PNG, atau WebP.',
        ),
      );
    }
  },
});

const submitRateLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: 20,
  code: 'SUBMIT_LETTER_LIMITED',
  message: 'Terlalu banyak permohonan surat dikirim dalam waktu singkat.',
});

// Citizen routes
export const citizenLetterRouter = Router();
citizenLetterRouter.use(
  privateNoStore,
  authenticate,
  loadActivePrincipal,
  requireRoles('MASYARAKAT'),
);
citizenLetterRouter.get('/', letterController.getCitizenLetters);
citizenLetterRouter.post(
  '/',
  requireMutation,
  submitRateLimit,
  upload.array('attachments', 10),
  letterController.submitCitizenLetter,
);
citizenLetterRouter.delete(
  '/:id',
  requireMutation,
  letterController.deleteCitizenLetter,
);

// Admin / Lurah routes
export const adminLetterRouter = Router();
adminLetterRouter.use(
  privateNoStore,
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN', 'LURAH'),
);
adminLetterRouter.get('/', letterController.getAdminLetters);
adminLetterRouter.get('/:id', letterController.getAdminLetterDetail);
adminLetterRouter.post(
  '/:id/action',
  requireMutation,
  letterController.processAdminLetterAction,
);
adminLetterRouter.delete(
  '/:id',
  requireMutation,
  letterController.deleteAdminLetter,
);

// Public routes (PDF download, attachments & QR verification)
export const publicLetterRouter = Router();
publicLetterRouter.use(noStore);
publicLetterRouter.get('/download/:id', letterController.downloadLetterPdf);
publicLetterRouter.get(
  '/attachments/:filename',
  letterController.downloadAttachment,
);
publicLetterRouter.get('/verify/:token', letterController.verifyPublicLetter);
