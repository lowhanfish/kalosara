import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LetterRepository } from '../repositories/letter.repository.js';
import { LetterPdfService } from './letter-pdf.service.js';
import { EmailService } from './email.service.js';
import { ApiError } from '../lib/errors.js';
import type { LetterRequest, LetterStatus, LetterType } from '@prisma/client';

export class LetterService {
  getUploadDir(): string {
    if (process.env.UPLOAD_ROOT) {
      return process.env.UPLOAD_ROOT;
    }
    const vpsShared = '/srv/kalosara/shared/uploads';
    if (fsSync.existsSync(vpsShared)) {
      return vpsShared;
    }
    return path.resolve(process.cwd(), '../shared/uploads');
  }

  constructor(
    private letterRepo: LetterRepository,
    private pdfService: LetterPdfService,
    private emailService: EmailService,
  ) {}

  async createRequest(
    userId: string,
    data: {
      type: LetterType;
      applicantName: string;
      applicantNik: string;
      birthPlace: string;
      birthDate: string;
      gender: string;
      religion: string;
      maritalStatus: string;
      occupation: string;
      address: string;
      details: Record<string, unknown>;
    },
    files: Express.Multer.File[] = [],
  ) {
    const ticketNumber = await this.letterRepo.generateTicketNumber();

    // Process file attachments
    const uploadDir = this.getUploadDir();
    const attachmentsDir = path.join(uploadDir, 'attachments');
    await fs.mkdir(attachmentsDir, { recursive: true });

    const attachmentsData: Array<{
      originalName: string;
      storagePath: string;
      fileSize: number;
      mimeType: string;
    }> = [];

    for (const file of files) {
      const ext = path.extname(file.originalname) || '.pdf';
      const randomName = `${crypto.randomUUID()}${ext}`;
      const destPath = path.join(attachmentsDir, randomName);
      if (file.buffer) {
        await fs.writeFile(destPath, file.buffer);
      } else if (file.path) {
        await fs.copyFile(file.path, destPath);
      }

      attachmentsData.push({
        originalName: file.originalname,
        storagePath: `/uploads/attachments/${randomName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    }

    return this.letterRepo.create({
      ticketNumber,
      type: data.type,
      userId,
      applicantName: data.applicantName,
      applicantNik: data.applicantNik,
      birthPlace: data.birthPlace,
      birthDate: data.birthDate,
      gender: data.gender,
      religion: data.religion,
      maritalStatus: data.maritalStatus,
      occupation: data.occupation,
      address: data.address,
      details: data.details,
      attachments: attachmentsData,
    });
  }

  async listCitizenRequests(userId: string) {
    const items = await this.letterRepo.listByUserId(userId);
    return items.map((item) => ({
      ...item,
      pdfUrl: item.pdfPath
        ? `/api/v1/public/letters/download/${item.id}`
        : null,
      qrCodeUrl: item.qrToken
        ? `https://watundehoa.digital/verifikasi-surat/${item.qrToken}`
        : null,
      attachments: item.attachments.map((att) => ({
        id: att.id,
        name: att.originalName,
        url: `/api/v1/public/letters/attachments/${path.basename(att.storagePath)}`,
        size: att.fileSize,
        type: att.mimeType,
      })),
    }));
  }

  async listAdminRequests(params: {
    page: number;
    limit: number;
    search?: string;
    status?: LetterStatus;
    type?: LetterType;
  }) {
    const result = await this.letterRepo.listAdmin(params);
    const mappedItems = result.items.map((item) => ({
      ...item,
      pdfUrl: item.pdfPath
        ? `/api/v1/public/letters/download/${item.id}`
        : null,
      qrCodeUrl: item.qrToken
        ? `https://watundehoa.digital/verifikasi-surat/${item.qrToken}`
        : null,
      attachments: item.attachments.map((att) => ({
        id: att.id,
        name: att.originalName,
        url: `/api/v1/public/letters/attachments/${path.basename(att.storagePath)}`,
        size: att.fileSize,
        type: att.mimeType,
      })),
    }));

    return {
      ...result,
      items: mappedItems,
    };
  }

  async getRequestDetail(id: string) {
    const item = await this.letterRepo.findById(id);
    if (!item) return null;
    return {
      ...item,
      pdfUrl: item.pdfPath
        ? `/api/v1/public/letters/download/${item.id}`
        : null,
      qrCodeUrl: item.qrToken
        ? `https://watundehoa.digital/verifikasi-surat/${item.qrToken}`
        : null,
      attachments: item.attachments.map((att) => ({
        id: att.id,
        name: att.originalName,
        url: `/api/v1/public/letters/attachments/${path.basename(att.storagePath)}`,
        size: att.fileSize,
        type: att.mimeType,
      })),
    };
  }

  async processAction(
    id: string,
    actorName: string,
    action: 'VERIFY' | 'REJECT' | 'SIGN',
    reason?: string,
  ) {
    const existing = await this.letterRepo.findById(id);
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'Permohonan surat tidak ditemukan');
    }

    if (action === 'VERIFY') {
      const updated = await this.letterRepo.updateStatus(id, {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: actorName,
        rejectionReason: null,
      });
      return this.getRequestDetail(updated.id);
    }

    if (action === 'REJECT') {
      if (!reason?.trim()) {
        throw new ApiError(
          400,
          'BAD_REQUEST',
          'Alasan penolakan / catatan perbaikan wajib diisi',
        );
      }
      const updated = await this.letterRepo.updateStatus(id, {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
      });

      // Send email notification to citizen
      if (existing.user?.email) {
        await this.emailService.sendRejectionEmail({
          to: existing.user.email,
          applicantName: existing.applicantName,
          ticketNumber: existing.ticketNumber,
          letterTitle: existing.type,
          reason: reason.trim(),
        });
      }

      return this.getRequestDetail(updated.id);
    }

    if (action === 'SIGN') {
      const letterNumber = await this.letterRepo.generateLetterNumber(
        existing.type,
      );
      const qrToken = crypto.randomUUID();

      // Temporarily assign letterNumber and qrToken for PDF generation
      const letterForPdf = {
        ...existing,
        letterNumber,
        qrToken,
        signedAt: new Date(),
        signedBy: actorName || 'Lurah Watundehoa',
      };

      // Generate PDF
      const { storagePath } = await this.pdfService.generatePdf(
        letterForPdf as unknown as LetterRequest,
      );

      const updated = await this.letterRepo.updateStatus(id, {
        status: 'SIGNED',
        letterNumber,
        qrToken,
        signedAt: new Date(),
        signedBy: actorName || 'Lurah Watundehoa',
        pdfPath: storagePath,
      });

      // Send completion email notification to citizen
      if (existing.user?.email) {
        const downloadUrl = `https://watundehoa.digital/api/v1/public/letters/download/${updated.id}`;
        const qrVerifyUrl = `https://watundehoa.digital/verifikasi-surat/${qrToken}`;
        await this.emailService.sendCompletionEmail({
          to: existing.user.email,
          applicantName: existing.applicantName,
          ticketNumber: existing.ticketNumber,
          letterNumber,
          letterTitle: existing.type,
          downloadUrl,
          qrVerifyUrl,
        });
      }

      return this.getRequestDetail(updated.id);
    }

    throw new ApiError(400, 'BAD_REQUEST', 'Aksi tidak valid');
  }

  async verifyPublicLetter(token: string) {
    const letter = await this.letterRepo.findByQrToken(token);
    if (!letter || letter.status !== 'SIGNED') {
      return null;
    }
    return {
      isValid: true,
      id: letter.id,
      ticketNumber: letter.ticketNumber,
      letterNumber: letter.letterNumber,
      type: letter.type,
      applicantName: letter.applicantName,
      applicantNik: letter.applicantNik,
      signedAt: letter.signedAt,
      signedBy: letter.signedBy,
      downloadUrl: `/api/v1/public/letters/download/${letter.id}`,
      pdfUrl: `/api/v1/public/letters/download/${letter.id}`,
    };
  }

  async deleteCitizenLetter(id: string, userId: string) {
    const letter = await this.letterRepo.findById(id);
    if (!letter) {
      throw new ApiError(404, 'NOT_FOUND', 'Permohonan surat tidak ditemukan');
    }

    if (letter.userId !== userId) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Anda tidak memiliki wewenang untuk menghapus permohonan ini',
      );
    }

    if (letter.status === 'SIGNED') {
      throw new ApiError(
        400,
        'BAD_REQUEST',
        'Surat yang telah selesai ditandatangani Lurah berstatus arsip resmi dan tidak dapat dihapus.',
      );
    }

    // Clean up physical attachments on disk
    const uploadDir = this.getUploadDir();
    if (letter.attachments && letter.attachments.length > 0) {
      for (const att of letter.attachments) {
        try {
          const safeName = path.basename(att.storagePath);
          const fullPath = path.join(uploadDir, 'attachments', safeName);
          await fs.unlink(fullPath).catch(() => {});
        } catch {
          // ignore error if file missing
        }
      }
    }

    // Clean up pdf if exists
    if (letter.pdfPath) {
      try {
        const safePdf = path.basename(letter.pdfPath);
        const fullPdfPath = path.join(uploadDir, 'letters', safePdf);
        await fs.unlink(fullPdfPath).catch(() => {});
      } catch {
        // ignore error
      }
    }

    await this.letterRepo.delete(id);
    return { success: true, message: 'Permohonan surat berhasil dihapus' };
  }

  async deleteAdminLetter(id: string) {
    const letter = await this.letterRepo.findById(id);
    if (!letter) {
      throw new ApiError(404, 'NOT_FOUND', 'Permohonan surat tidak ditemukan');
    }

    const uploadDir = this.getUploadDir();

    // Clean up physical attachments on disk
    if (letter.attachments && letter.attachments.length > 0) {
      for (const att of letter.attachments) {
        try {
          const safeName = path.basename(att.storagePath);
          const fullPath = path.join(uploadDir, 'attachments', safeName);
          await fs.unlink(fullPath).catch(() => {});
        } catch {
          // ignore cleanup error
        }
      }
    }

    // Clean up pdf if exists
    if (letter.pdfPath) {
      try {
        const safePdf = path.basename(letter.pdfPath);
        const fullPdfPath = path.join(uploadDir, 'letters', safePdf);
        await fs.unlink(fullPdfPath).catch(() => {});
      } catch {
        // ignore cleanup error
      }
    }

    await this.letterRepo.delete(id);
    return {
      success: true,
      message: 'Permohonan surat berhasil dihapus oleh admin',
    };
  }

  async getOrGeneratePdfFile(
    id: string,
  ): Promise<{ fullPath: string; filename: string }> {
    const letter = await this.letterRepo.findById(id);
    if (!letter || letter.status !== 'SIGNED') {
      throw new ApiError(
        404,
        'NOT_FOUND',
        'Dokumen PDF belum tersedia atau belum ditandatangani',
      );
    }

    const safeTicket = letter.ticketNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTicket}.pdf`;
    const uploadRoot = this.getUploadDir();
    const relativePath = (
      letter.pdfPath || `/uploads/letters/${filename}`
    ).replace(/^\/uploads\//, '');
    const fullPath = path.join(uploadRoot, relativePath);

    if (!fsSync.existsSync(fullPath)) {
      const fallbackPath = path.resolve(
        process.cwd(),
        '../shared/uploads',
        relativePath,
      );
      if (fsSync.existsSync(fallbackPath)) {
        return { fullPath: fallbackPath, filename };
      }
      // Re-generate authentic signed PDF on the fly
      await this.pdfService.generatePdf(letter);
      if (fsSync.existsSync(fullPath)) {
        return { fullPath, filename };
      }
      if (fsSync.existsSync(fallbackPath)) {
        return { fullPath: fallbackPath, filename };
      }
    }

    return { fullPath, filename };
  }
}
