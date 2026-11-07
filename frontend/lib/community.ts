export const communitySections = {
  anggaran: {
    title: "Anggaran kelurahan",
    description: "Transparansi pendapatan, belanja, dan pembiayaan kelurahan.",
    metrics: [
      "Pendapatan",
      "Belanja",
      "Penerimaan pembiayaan",
      "Pengeluaran pembiayaan",
    ],
  },
  bansos: {
    title: "Bantuan sosial",
    description:
      "Informasi program dan rekapitulasi bantuan sosial untuk masyarakat.",
    metrics: ["Program bantuan", "Keluarga penerima"],
  },
  stunting: {
    title: "Data stunting",
    description: "Informasi dan rekapitulasi penanganan stunting di kelurahan.",
    metrics: ["Balita", "Balita berisiko", "Balita stunting"],
  },
} as const;
export type SectionSlug = keyof typeof communitySections;
export type CommunitySection = {
  title: string;
  content: string;
  period: string;
  source: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  metrics: {
    label: string;
    value: number | null;
    unit: "Rp" | "orang" | "keluarga" | "program" | "kasus";
  }[];
};
export const requestLabels = {
  NEW: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  ARCHIVED: "Arsip",
} as const;
export type CitizenRequest = {
  id: string;
  kind: "COMPLAINT" | "INFORMATION";
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  status: keyof typeof requestLabels;
  internalNote: string;
  version: number;
  createdAt: string;
};
export async function getSection(
  slug: SectionSlug,
): Promise<CommunitySection | null> {
  const r = await fetch(
    `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/community/sections/${slug}`,
    { cache: "no-store", signal: AbortSignal.timeout(5000) },
  );
  if (!r.ok) throw new Error("Informasi sementara tidak dapat dimuat.");
  return (await r.json()).data.section;
}
