export const channels = {
  announcements: { title: "Pengumuman", path: "/pengumuman" },
  events: { title: "Agenda", path: "/agenda" },
  galleries: { title: "Galeri", path: "/galeri" },
  documents: { title: "Informasi publik", path: "/informasi-publik" },
} as const;
export type ContentKind = keyof typeof channels;
export type ContentItem = {
  id: string;
  kind: ContentKind;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  updatedAt: string;
  announcement: {
    pinned: boolean;
    startsAt: string | null;
    expiredAt: string | null;
  } | null;
  event: { start: string; end: string; location: string } | null;
  gallery: {
    photos: { mediaId: string; alt: string; sortOrder: number }[];
  } | null;
  document: { category: string; fileId: string } | null;
};
export type ContentList = {
  items: ContentItem[];
  total: number;
  page: number;
  limit: number;
};
export async function getContent(
  kind: ContentKind,
  params = new URLSearchParams(),
): Promise<ContentList> {
  const res = await fetch(
    `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/content/${kind}?${params}`,
    { cache: "no-store", signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) throw new Error("Informasi sementara tidak dapat dimuat.");
  return (await res.json()).data;
}
export function formatContentDate(date: string) {
  return (
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Makassar",
    }).format(new Date(date)) + " WITA"
  );
}
