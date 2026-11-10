import type { LetterRequest } from "./types";

/**
 * Fetch citizen's submitted letters
 */
export async function getCitizenLetters(): Promise<LetterRequest[]> {
  const res = await fetch("/api/v1/citizen/letters", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error("Gagal mengambil riwayat surat");
  }
  const json = await res.json();
  return json.data ?? [];
}

/**
 * Submit a letter request with multipart/form-data for attachments
 */
export async function submitLetterRequest(
  data: Record<string, unknown>,
  files: File[],
  csrfToken?: string,
): Promise<LetterRequest> {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(data));
  for (const file of files) {
    formData.append("attachments", file);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const res = await fetch("/api/v1/citizen/letters", {
    method: "POST",
    headers,
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Gagal mengirim permohonan surat");
  }
  return json.data;
}

/**
 * Delete / cancel a submitted or rejected letter request
 */
export async function deleteLetterRequest(
  id: string,
  csrfToken?: string,
): Promise<{ success: boolean; message: string }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const res = await fetch(`/api/v1/citizen/letters/${id}`, {
    method: "DELETE",
    headers,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Gagal menghapus permohonan surat");
  }
  return json.data;
}
