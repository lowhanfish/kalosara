export type GuestType = "WARGA" | "KEDINASAN" | "SWASTA_LEMBAGA" | "UMUM";
export type GuestStatus = "WAITING" | "SERVED" | "CANCELLED";

export interface GuestBookItem {
  id: string;
  ticketNumber: string;
  fullName: string;
  phone: string;
  nik: string | null;
  guestType: GuestType;
  institution: string | null;
  addressOrRt: string | null;
  purpose: string;
  destinationStaff: string;
  notes: string | null;
  status: GuestStatus;
  servedAt: string | null;
  servedBy: string | null;
  internalNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestBookStats {
  todayTotal: number;
  todayWaiting: number;
  todayServed: number;
  totalAllTime: number;
}

export interface GuestBookListResponse {
  items: GuestBookItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
