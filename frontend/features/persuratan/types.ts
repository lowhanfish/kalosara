export type LetterType =
  | "SKU"
  | "SKTM"
  | "DOMISILI"
  | "PENGANTAR_SKCK"
  | "BELUM_MENIKAH"
  | "BELUM_BEKERJA"
  | "BELUM_MEMILIKI_RUMAH"
  | "PENGHASILAN"
  | "PENGANTAR_NIKAH"
  | "AHLI_WARIS"
  | "LAINNYA";

export type LetterStatus = "SUBMITTED" | "REJECTED" | "VERIFIED" | "SIGNED";

export interface LetterAttachmentItem {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface LetterRequest {
  id: string;
  ticketNumber: string;
  letterNumber: string | null;
  type: LetterType;
  title: string;
  status: LetterStatus;
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
  rejectionReason: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  signedAt: string | null;
  signedBy: string | null;
  pdfUrl: string | null;
  qrCodeUrl: string | null;
  attachments: LetterAttachmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LetterMeta {
  code: LetterType;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  requirements: string[];
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "number" | "select" | "textarea";
    placeholder?: string;
    options?: string[];
    required?: boolean;
    helper?: string;
  }>;
}
