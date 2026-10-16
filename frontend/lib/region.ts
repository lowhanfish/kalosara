export const metricLabels = {
  population: "Penduduk",
  male: "Laki-laki",
  female: "Perempuan",
  households: "Kepala keluarga",
  rt: "RT",
  rw: "RW",
} as const;
export type Statistic = {
  id: string;
  period: string;
  source: string;
  referenceDate: string;
  updatedAt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
} & Record<keyof typeof metricLabels, number | null>;
export type Place = {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  photoId: string | null;
  photoAlt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  updatedAt: string;
};
export type RegionList<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
export async function getRegion<T>(
  kind: "statistics" | "facilities" | "potentials",
  params = new URLSearchParams(),
): Promise<RegionList<T>> {
  const response = await fetch(
    `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/region/${kind}?${params}`,
    { cache: "no-store", signal: AbortSignal.timeout(5000) },
  );
  if (!response.ok)
    throw new Error("Informasi wilayah sementara tidak dapat dimuat.");
  const data = await response.json();
  if (data.success !== true) throw new Error("Respons wilayah tidak valid.");
  return data.data;
}
export const aggregateText = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "Belum tersedia"
    : new Intl.NumberFormat("id-ID").format(value);
export const regionDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Makassar",
  }).format(new Date(value));
export function mapUrls(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null;
  const west = Math.max(-180, longitude - 0.005);
  const east = Math.min(180, longitude + 0.005);
  const south = Math.max(-90, latitude - 0.005);
  const north = Math.min(90, latitude + 0.005);
  return {
    embed: `https://www.openstreetmap.org/export/embed.html?${new URLSearchParams({ bbox: `${west},${south},${east},${north}`, layer: "mapnik", marker: `${latitude},${longitude}` })}`,
    link: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
  };
}
