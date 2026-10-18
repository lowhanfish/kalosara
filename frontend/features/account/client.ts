import { cmsMutate, type CmsRequest } from "@/features/cms/client";
export type ContactChange = {
  id: string;
  newEmail: string | null;
  newPhone: string | null;
  requestedAt: string;
  expiresAt: string;
};
export type Account = {
  id: string;
  email: string;
  phone: string | null;
  verifiedAt: string | null;
  updatedAt: string;
  profile: { displayName: string | null; address: string | null } | null;
  contactChange: ContactChange | null;
};
export async function accountMutation<T>(
  request: CmsRequest,
  path: string,
  body: Record<string, unknown>,
  method = "POST",
) {
  try {
    return await cmsMutate<T>(request, path, body, method);
  } finally {
    for (const key of ["password", "currentPassword", "newPassword"])
      delete body[key];
  }
}
