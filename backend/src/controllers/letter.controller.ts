import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { LetterService } from "../services/letter.service.js";
import {
  citizenCreateLetterSchema,
  adminLetterActionSchema,
  listLettersQuerySchema,
} from "../validators/letter.validator.js";
import { sendSuccess } from "../lib/http-response.js";
import { ApiError } from "../lib/errors.js";

export class LetterController {
  constructor(private letterService: LetterService) {}

  getCitizenLetters = async (req: Request, res: Response) => {
    const userId = req.auth?.userId || res.locals.principal?.id;
    if (!userId) {
      throw new ApiError(401, "UNAUTHENTICATED", "Autentikasi diperlukan");
    }
    const letters = await this.letterService.listCitizenRequests(userId);
    return sendSuccess(res, req, letters);
  };

  submitCitizenLetter = async (req: Request, res: Response) => {
    const userId = req.auth?.userId || res.locals.principal?.id;
    if (!userId) {
      throw new ApiError(401, "UNAUTHENTICATED", "Autentikasi diperlukan");
    }

    let payloadRaw = req.body.payload;
    if (typeof payloadRaw === "string") {
      try {
        payloadRaw = JSON.parse(payloadRaw);
      } catch {
        throw new ApiError(400, "VALIDATION_ERROR", "Format payload JSON tidak valid");
      }
    }

    const validated = citizenCreateLetterSchema.parse(payloadRaw);
    const files = (req.files as Express.Multer.File[]) || [];

    const letter = await this.letterService.createRequest(userId, validated, files);
    return sendSuccess(res, req, letter, 201);
  };

  getAdminLetters = async (req: Request, res: Response) => {
    const query = listLettersQuerySchema.parse(req.query);
    const result = await this.letterService.listAdminRequests(query);
    return sendSuccess(res, req, result);
  };

  getAdminLetterDetail = async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new ApiError(400, "BAD_REQUEST", "ID permohonan diperlukan");
    }
    const detail = await this.letterService.getRequestDetail(id);
    if (!detail) {
      throw new ApiError(404, "NOT_FOUND", "Permohonan surat tidak ditemukan");
    }
    return sendSuccess(res, req, detail);
  };

  processAdminLetterAction = async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new ApiError(400, "BAD_REQUEST", "ID permohonan diperlukan");
    }
    const actorRole = res.locals.principal?.role;
    const actorName =
      actorRole === "LURAH"
        ? "Lurah Watundehoa"
        : "Petugas Kelurahan";
    const { action, reason } = adminLetterActionSchema.parse(req.body);

    // Guard: Only LURAH can perform electronic signature (TTE)
    if (action === "SIGN" && actorRole !== "LURAH") {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Hanya akun Lurah yang berwenang menandatangani surat secara elektronik (TTE). Admin Kelurahan bertugas memverifikasi berkas dan meneruskannya ke meja Lurah.",
      );
    }

    const updated = await this.letterService.processAction(
      id,
      actorName,
      action,
      reason,
    );
    return sendSuccess(res, req, updated);
  };

  downloadLetterPdf = async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new ApiError(400, "BAD_REQUEST", "ID permohonan diperlukan");
    }
    const letter = await this.letterService.getRequestDetail(id);
    if (!letter || !letter.pdfPath) {
      throw new ApiError(404, "NOT_FOUND", "Dokumen PDF belum tersedia atau belum ditandatangani");
    }

    const uploadRoot =
      process.env.UPLOAD_ROOT ||
      path.resolve(process.cwd(), "../shared/uploads");
    const relativePath = letter.pdfPath.replace(/^\/uploads\//, "");
    const fullPath = path.join(uploadRoot, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new ApiError(404, "NOT_FOUND", "File fisik PDF tidak ditemukan di server");
    }

    const safeFilename = `${letter.ticketNumber}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);
    const stream = fs.createReadStream(fullPath);
    return stream.pipe(res);
  };

  verifyPublicLetter = async (req: Request, res: Response) => {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    if (!token) {
      throw new ApiError(400, "BAD_REQUEST", "Token verifikasi diperlukan");
    }
    const verification = await this.letterService.verifyPublicLetter(token);
    if (!verification) {
      throw new ApiError(
        404,
        "INVALID_DOCUMENT",
        "Dokumen tidak valid, belum ditandatangani, atau tidak terdaftar di sistem KALOSARA",
      );
    }
    return sendSuccess(res, req, verification);
  };
}
