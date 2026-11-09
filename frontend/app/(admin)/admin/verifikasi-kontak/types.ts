import type { List } from "@/features/cms/client";
import type { ContactChange } from "@/features/account/client";

export type PendingContactChange = ContactChange & {
  userId: string;
  user: { email: string; phone: string | null };
};

export interface CreateInterface {
  decision: "APPROVE" | "REJECT";
  currentPassword: string;
  identityVerified: boolean;
  contactOwnershipVerified: boolean;
}

export type ResponseInterface = PendingContactChange;
export type ResponseListInterface = List<PendingContactChange>;
