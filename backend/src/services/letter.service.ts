import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { LetterRepository } from "../repositories/letter.repository.js";
import { LetterPdfService } from "./letter-pdf.service.js";
import { EmailService } from "./email.service.js";
import type { LetterRequest, LetterStatus, LetterType } from "@prisma/client";

export class LetterService {
  private uploadDir: string;

  constructor(
    private letterRepo: LetterRepository,
    private pdfService: LetterPdfService,
    private emailService: EmailService,
  ) {
    this.uploadDir =
      process.env.UPLOAD_ROOT ||
      path.resolve(process.cwd(), "../shared/uploads");
  }

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
    const attachmentsDir = path.join(this.uploadDir, "attachments");
    await fs.mkdir(attachmentsDir, { recursive: true });

    const attachmentsData: Array<{
      originalName: string;
      storagePath: string;
      fileSize: number;
      mimeType: string;
    }> = [];

    for (const file of files) {
      const ext = path.extname(file.originalname) || ".pdf";
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
      pdfUrl: item.pdfPath ? `/api/v1/public/letters/download/${item.id}` : null,
      qrCodeUrl: item.qrToken
        ? `https://watundehoa.digital/verifikasi-surat/${item.qrToken}`
        : null,
      attachments: item.attachments.map((att) => ({
        id: att.id,
        name: att.originalName,
        url: att.storagePath,
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
      pdfUrl: item.pdfPath ? `/api/v1/public/letters/download/${item.id}` : null,
      qrCodeUrl: item.qrToken
        ? `https://watundehoa.digital/verifikasi-surat/${item.qrToken}`
        : null,
      attachments: item.attachments.map((att) => ({
        id: att.id,
        name: att.originalName,
        url: att.storagePath,
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
      pdfUrl: item.pdfPath ? `/api/v1/public/letters/download/${item.id}` : null,
      qrCodeUrl: item.qrToken
        ? `https://watundehoa.digital/verifikasi-surat/${item.qrToken}`
        : null,
      attachments: item.attachments.map((att) => ({
        id: att.id,
        name: att.originalName,
        url: att.storagePath,
        size: att.fileSize,
        type: att.mimeType,
      })),
    };
  }

  async processAction(
    id: string,
    actorName: string,
    action: "VERIFY" | "REJECT" | "SIGN",
    reason?: string,
  ) {
    const existing = await this.letterRepo.findById(id);
    if (!existing) {
      throw new Error("Permohonan surat tidak ditemukan");
    }

    if (action === "VERIFY") {
      const updated = await this.letterRepo.updateStatus(id, {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: actorName,
        rejectionReason: null,
      });
      return this.getRequestDetail(updated.id);
    }

    if (action === "REJECT") {
      if (!reason?.trim()) {
        throw new Error("Alasan penolakan / catatan perbaikan wajib diisi");
      }
      const updated = await this.letterRepo.updateStatus(id, {
        status: "REJECTED",
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

    if (action === "SIGN") {
      const letterNumber = await this.letterRepo.generateLetterNumber(existing.type);
      const qrToken = crypto.randomUUID();

      // Temporarily assign letterNumber and qrToken for PDF generation
      const letterForPdf = {
        ...existing,
        letterNumber,
        qrToken,
        signedAt: new Date(),
        signedBy: actorName || "Lurah Watundehoa",
      };

      // Generate PDF
      const { storagePath } = await this.pdfService.generatePdf(
        letterForPdf as unknown as LetterRequest,
      );

      const updated = await this.letterRepo.updateStatus(id, {
        status: "SIGNED",
        letterNumber,
        qrToken,
        signedAt: new Date(),
        signedBy: actorName || "Lurah Watundehoa",
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

    throw new Error("Aksi tidak valid");
  }

  async verifyPublicLetter(token: string) {
    const letter = await this.letterRepo.findByQrToken(token);
    if (!letter || letter.status !== "SIGNED") {
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
}
