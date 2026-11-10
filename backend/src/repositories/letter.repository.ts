import { PrismaClient, Prisma, LetterStatus, LetterType } from "@prisma/client";

export class LetterRepository {
  constructor(private prisma: PrismaClient) {}

  async generateTicketNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SRT-${dateStr}-${randomSuffix}`;
  }

  async generateLetterNumber(type: LetterType): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const monthRomawi = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ][today.getMonth()];

    // Count letters signed this year
    const startOfYear = new Date(year, 0, 1);
    const count = await this.prisma.letterRequest.count({
      where: {
        status: "SIGNED",
        signedAt: { gte: startOfYear },
      },
    });

    const indexNumber = String(count + 1).padStart(3, "0");
    const codeMap: Record<LetterType, string> = {
      SKU: "510",
      SKTM: "401",
      DOMISILI: "470",
      PENGANTAR_SKCK: "331",
      BELUM_MENIKAH: "474",
      BELUM_BEKERJA: "560",
      BELUM_MEMILIKI_RUMAH: "640",
      PENGHASILAN: "581",
      PENGANTAR_NIKAH: "474.2",
      AHLI_WARIS: "590",
      LAINNYA: "470",
    };

    const classification = codeMap[type] || "470";
    return `${classification} / ${indexNumber} / WTDH / ${monthRomawi} / ${year}`;
  }

  async create(data: {
    ticketNumber: string;
    type: LetterType;
    userId: string;
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
    attachments?: Array<{
      originalName: string;
      storagePath: string;
      fileSize: number;
      mimeType: string;
    }>;
  }) {
    return this.prisma.letterRequest.create({
      data: {
        ticketNumber: data.ticketNumber,
        type: data.type,
        userId: data.userId,
        applicantName: data.applicantName,
        applicantNik: data.applicantNik,
        birthPlace: data.birthPlace,
        birthDate: data.birthDate,
        gender: data.gender,
        religion: data.religion,
        maritalStatus: data.maritalStatus,
        occupation: data.occupation,
        address: data.address,
        details: data.details as unknown as Prisma.InputJsonValue,
        status: "SUBMITTED",
        attachments: data.attachments?.length
          ? {
              create: data.attachments.map((att) => ({
                originalName: att.originalName,
                storagePath: att.storagePath,
                fileSize: att.fileSize,
                mimeType: att.mimeType,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.letterRequest.findUnique({
      where: { id },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findByTicket(ticketNumber: string) {
    return this.prisma.letterRequest.findUnique({
      where: { ticketNumber },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findByQrToken(qrToken: string) {
    return this.prisma.letterRequest.findUnique({
      where: { qrToken },
      include: {
        attachments: true,
      },
    });
  }

  async listByUserId(userId: string) {
    return this.prisma.letterRequest.findMany({
      where: { userId },
      include: {
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listAdmin(params: {
    page: number;
    limit: number;
    search?: string;
    status?: LetterStatus;
    type?: LetterType;
  }) {
    const where: Prisma.LetterRequestWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: "insensitive" } },
        { letterNumber: { contains: q, mode: "insensitive" } },
        { applicantName: { contains: q, mode: "insensitive" } },
        { applicantNik: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.letterRequest.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          attachments: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.letterRequest.count({ where }),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / params.limit) || 1,
    };
  }

  async updateStatus(
    id: string,
    data: {
      status: LetterStatus;
      rejectionReason?: string | null;
      verifiedAt?: Date | null;
      verifiedBy?: string | null;
      signedAt?: Date | null;
      signedBy?: string | null;
      letterNumber?: string | null;
      pdfPath?: string | null;
      qrToken?: string | null;
    },
  ) {
    return this.prisma.letterRequest.update({
      where: { id },
      data,
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.letterAttachment.deleteMany({ where: { letterId: id } });
      return tx.letterRequest.delete({ where: { id } });
    });
  }
}
