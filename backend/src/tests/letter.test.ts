import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { citizenCreateLetterSchema, adminLetterActionSchema } from "../validators/letter.validator.js";
import { LetterService } from "../services/letter.service.js";
import { LetterPdfService } from "../services/letter-pdf.service.js";
import { EmailService } from "../services/email.service.js";
import { LetterController } from "../controllers/letter.controller.js";
import type { LetterRepository } from "../repositories/letter.repository.js";
import { ApiError } from "../lib/errors.js";

// Mock repository
const mockLetterRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  listByUserId: vi.fn(),
  listAll: vi.fn(),
  updateStatus: vi.fn(),
  generateTicketNumber: vi.fn(),
  generateLetterNumber: vi.fn(),
  findByQrToken: vi.fn(),
};

describe("Letter Workflow & Persuratan KALOSARA", () => {
  let letterService: LetterService;
  let pdfService: LetterPdfService;
  let emailService: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    pdfService = new LetterPdfService();
    emailService = new EmailService();
    letterService = new LetterService(
      mockLetterRepo as unknown as LetterRepository,
      pdfService,
      emailService,
    );
  });

  describe("Validation Schemas", () => {
    it("accepts valid citizen SKU request payload", () => {
      const validPayload = {
        type: "SKU",
        applicantName: "La Ode Muhammad",
        applicantNik: "7402010101900001",
        birthPlace: "Watundehoa",
        birthDate: "1990-01-01",
        gender: "Laki-laki",
        religion: "Islam",
        maritalStatus: "Kawin",
        occupation: "Wiraswasta",
        address: "Jl. Poros Watunohu RT 02 Dusun I",
        details: {
          businessName: "Kios Berkah Tani",
          businessType: "Perdagangan Sembako",
          businessAddress: "Jl. Poros Watunohu",
          startedYear: 2021,
          purpose: "Pengajuan KUR BRI",
        },
      };

      const result = citizenCreateLetterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("rejects invalid citizen request with short NIK", () => {
      const invalidPayload = {
        type: "SKU",
        applicantName: "La Ode Muhammad",
        applicantNik: "123", // Too short
        birthPlace: "Watundehoa",
        birthDate: "1990-01-01",
        gender: "Laki-laki",
        religion: "Islam",
        maritalStatus: "Kawin",
        occupation: "Wiraswasta",
        address: "Watundehoa",
      };

      const result = citizenCreateLetterSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("validates admin action payload for REJECT requiring no mandatory string, but schema allows optional reason", () => {
      const rejectAction = {
        action: "REJECT",
        reason: "Lampiran foto KTP buram dan tidak terbaca",
      };
      const result = adminLetterActionSchema.safeParse(rejectAction);
      expect(result.success).toBe(true);
    });
  });

  describe("Step 1: Citizen Submission", () => {
    it("creates letter request with generated ticket number", async () => {
      mockLetterRepo.generateTicketNumber.mockResolvedValue("SRT-20261110-0001");
      mockLetterRepo.create.mockResolvedValue({
        id: "letter-123",
        ticketNumber: "SRT-20261110-0001",
        status: "SUBMITTED",
        type: "SKTM",
        applicantName: "Hasanuddin",
      });

      const result = await letterService.createRequest(
        "user-abc",
        {
          type: "SKTM",
          applicantName: "Hasanuddin",
          applicantNik: "7402011212850002",
          birthPlace: "Watundehoa",
          birthDate: "1985-12-12",
          gender: "Laki-laki",
          religion: "Islam",
          maritalStatus: "Kawin",
          occupation: "Petani",
          address: "Dusun II Watundehoa",
          details: { purpose: "Beasiswa Kuliah Anak" },
        },
        [],
      );

      expect(mockLetterRepo.generateTicketNumber).toHaveBeenCalled();
      expect(mockLetterRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketNumber: "SRT-20261110-0001",
          userId: "user-abc",
          applicantName: "Hasanuddin",
        }),
      );
      expect(result.ticketNumber).toBe("SRT-20261110-0001");
    });
  });

  describe("Step 2 & 3: Admin Review and Rejection with Reason", () => {
    it("verifies letter request when admin approves", async () => {
      mockLetterRepo.findById.mockResolvedValue({
        id: "letter-123",
        status: "SUBMITTED",
        ticketNumber: "SRT-20261110-0001",
        applicantName: "Hasanuddin",
        user: { email: "hasan@example.com" },
        attachments: [],
      });
      mockLetterRepo.updateStatus.mockResolvedValue({
        id: "letter-123",
        status: "VERIFIED",
      });

      await letterService.processAction("letter-123", "Admin Kelurahan", "VERIFY");

      expect(mockLetterRepo.updateStatus).toHaveBeenCalledWith(
        "letter-123",
        expect.objectContaining({
          status: "VERIFIED",
          rejectionReason: null,
        }),
      );
    });

    it("rejects letter with reason and sends email notification", async () => {
      const sendRejectionSpy = vi.spyOn(emailService, "sendRejectionEmail").mockResolvedValue();

      mockLetterRepo.findById.mockResolvedValue({
        id: "letter-123",
        status: "SUBMITTED",
        type: "SKTM",
        ticketNumber: "SRT-20261110-0001",
        applicantName: "Hasanuddin",
        user: { email: "hasan@example.com" },
        attachments: [],
      });
      mockLetterRepo.updateStatus.mockResolvedValue({
        id: "letter-123",
        status: "REJECTED",
        rejectionReason: "Foto KK tidak jelas",
      });

      await letterService.processAction(
        "letter-123",
        "Admin Kelurahan",
        "REJECT",
        "Foto KK tidak jelas",
      );

      expect(mockLetterRepo.updateStatus).toHaveBeenCalledWith("letter-123", {
        status: "REJECTED",
        rejectionReason: "Foto KK tidak jelas",
      });
      expect(sendRejectionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "hasan@example.com",
          ticketNumber: "SRT-20261110-0001",
          reason: "Foto KK tidak jelas",
        }),
      );
    });
  });

  describe("Step 4 & 5: Lurah TTE Signing & PDF Generation", () => {
    it("prevents Admin Kelurahan from signing (TTE) letters with 403 Forbidden", async () => {
      const controller = new LetterController(letterService);
      const req = {
        params: { id: "letter-123" },
        body: { action: "SIGN" },
      } as unknown as Request;
      const res = {
        locals: {
          principal: { role: "ADMIN_KELURAHAN", id: "admin-1" },
        },
      } as unknown as Response;

      await expect(controller.processAdminLetterAction(req, res)).rejects.toThrowError(
        ApiError,
      );
      await expect(controller.processAdminLetterAction(req, res)).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });
    });

    it("allows Lurah to sign (TTE) letters", async () => {
      const controller = new LetterController(letterService);
      vi.spyOn(letterService, "processAction").mockResolvedValue(
        { id: "letter-123", status: "SIGNED" } as unknown as Awaited<
          ReturnType<LetterService["processAction"]>
        >,
      );

      const req = {
        params: { id: "letter-123" },
        body: { action: "SIGN" },
      } as unknown as Request;
      const res = {
        locals: {
          principal: { role: "LURAH", id: "lurah-1" },
        },
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.processAdminLetterAction(req, res);
      expect(letterService.processAction).toHaveBeenCalledWith(
        "letter-123",
        "Lurah Watundehoa",
        "SIGN",
        undefined,
      );
    });

    it("signs letter, generates official PDF with QR code and updates status to SIGNED", async () => {
      const sendCompletionSpy = vi.spyOn(emailService, "sendCompletionEmail").mockResolvedValue();

      const existingLetter = {
        id: "letter-123",
        status: "VERIFIED",
        type: "SKU",
        ticketNumber: "SRT-20261110-0001",
        applicantName: "La Ode Muhammad",
        applicantNik: "7402010101900001",
        birthPlace: "Watundehoa",
        birthDate: "01 Januari 1990",
        gender: "Laki-laki",
        religion: "Islam",
        maritalStatus: "Kawin",
        occupation: "Wiraswasta",
        address: "Jl. Poros Watunohu RT 02 Dusun I",
        details: {
          businessName: "Kios Berkah Tani",
          businessType: "Perdagangan Sembako",
          startedYear: 2021,
          purpose: "Pengajuan KUR BRI",
        },
        user: { email: "warga@example.com" },
        attachments: [],
      };

      mockLetterRepo.findById.mockResolvedValue(existingLetter);
      mockLetterRepo.generateLetterNumber.mockResolvedValue("500/01/WTDH/XI/2026");
      mockLetterRepo.updateStatus.mockResolvedValue({
        ...existingLetter,
        status: "SIGNED",
        letterNumber: "500/01/WTDH/XI/2026",
        pdfPath: "/uploads/letters/SKU-SRT-20261110-0001.pdf",
      });

      const pdfSpy = vi.spyOn(pdfService, "generatePdf").mockResolvedValue({
        storagePath: "/uploads/letters/SKU-SRT-20261110-0001.pdf",
        pdfBuffer: Buffer.from("%PDF-1.4 test"),
      });

      await letterService.processAction("letter-123", "Lurah Watundehoa", "SIGN");

      expect(mockLetterRepo.generateLetterNumber).toHaveBeenCalledWith("SKU");
      expect(pdfSpy).toHaveBeenCalled();
      expect(mockLetterRepo.updateStatus).toHaveBeenCalledWith(
        "letter-123",
        expect.objectContaining({
          status: "SIGNED",
          letterNumber: "500/01/WTDH/XI/2026",
          pdfPath: "/uploads/letters/SKU-SRT-20261110-0001.pdf",
        }),
      );
      expect(sendCompletionSpy).toHaveBeenCalled();
    });
  });

  describe("Step 6: Public QR Code Verification", () => {
    it("returns verified document details for valid QR token", async () => {
      mockLetterRepo.findByQrToken.mockResolvedValue({
        id: "letter-123",
        status: "SIGNED",
        ticketNumber: "SRT-20261110-0001",
        letterNumber: "500/01/WTDH/XI/2026",
        type: "SKU",
        applicantName: "La Ode Muhammad",
        applicantNik: "7402010101900001",
        signedBy: "Lurah Watundehoa",
        signedAt: new Date("2026-11-10T08:00:00Z"),
        pdfPath: "/uploads/letters/test.pdf",
      });

      const verification = await letterService.verifyPublicLetter("valid-qr-token-uuid");

      expect(verification).not.toBeNull();
      expect(verification?.isValid).toBe(true);
      expect(verification?.letterNumber).toBe("500/01/WTDH/XI/2026");
      expect(verification?.applicantName).toBe("La Ode Muhammad");
      expect(verification?.pdfUrl).toBe("/api/v1/public/letters/download/letter-123");
    });

    it("returns null when QR token is not found", async () => {
      mockLetterRepo.findByQrToken.mockResolvedValue(null);

      const verification = await letterService.verifyPublicLetter("invalid-token");
      expect(verification).toBeNull();
    });
  });

  describe("Real PDF Generation with pdf-lib & QR Code", () => {
    it("generates a valid binary PDF with embedded QR code and Indonesian Kop Surat", async () => {
      const sampleLetter = {
        id: "test-pdf-123",
        ticketNumber: "SRT-20261110-9999",
        letterNumber: "500/99/WTDH/XI/2026",
        type: "SKTM" as const,
        userId: "user-test",
        applicantName: "Ahmad Fauzi",
        applicantNik: "7402010101900001",
        birthPlace: "Watundehoa",
        birthDate: "01 Januari 1990",
        gender: "Laki-laki",
        religion: "Islam",
        maritalStatus: "Kawin",
        occupation: "Petani",
        address: "RT 01 Lingkungan I Kelurahan Watundehoa",
        details: {
          purpose: "Beasiswa Kuliah Anak",
          familyMemberName: "Rizky Ramadhan",
          schoolOrHospital: "Universitas Halu Oleo",
        },
        status: "SIGNED" as const,
        rejectionReason: null,
        verifiedAt: null,
        verifiedBy: null,
        signedAt: new Date(),
        signedBy: "Lurah Watundehoa",
        pdfPath: null,
        qrToken: "test-qr-token-12345",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await pdfService.generatePdf(sampleLetter);

      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.pdfBuffer.length).toBeGreaterThan(1000);
      // Valid PDF files start with %PDF
      const header = result.pdfBuffer.subarray(0, 5).toString("utf-8");
      expect(header).toBe("%PDF-");
    });
  });
});
