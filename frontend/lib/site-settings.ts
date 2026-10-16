import { siteIdentity } from "./site-identity";
export type SiteSettings = {
  name: string;
  district?: string;
  regency?: string;
  heroUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  logoUrl: string | null;
  relatedLinks: { label: string; href: string }[];
  isExample: boolean;
};
export const fallbackSettings: SiteSettings = {
  name: siteIdentity.name,
  address: siteIdentity.location,
  phone: null,
  email: null,
  hours: null,
  logoUrl: siteIdentity.logo,
  relatedLinks: [],
  isExample: false,
};
const safeUrl = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    value.length > 500 ||
    value.includes("\\") ||
    Array.from(value).some((char) => char.charCodeAt(0) <= 32)
  )
    return false;
  if (/^\/(?!\/)/.test(value)) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};
export function parseSiteSettings(value: unknown): SiteSettings | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.name !== "string" || !data.name.trim()) return null;
  // Ignore only the known development seed; explicit backend settings still take precedence.
  const legacyExample = data.name === "Kelurahan Contoh";
  const text = (key: string) =>
    typeof data[key] === "string" && data[key].length <= 300
      ? (data[key] as string)
      : null;
  return {
    district: text("district") ?? siteIdentity.district,
    regency: text("regency") ?? siteIdentity.regency,
    heroUrl: safeUrl(data.heroUrl) ? data.heroUrl : null,
    latitude:
      typeof data.latitude === "number" && Math.abs(data.latitude) <= 90
        ? data.latitude
        : null,
    longitude:
      typeof data.longitude === "number" && Math.abs(data.longitude) <= 180
        ? data.longitude
        : null,
    name: legacyExample ? fallbackSettings.name : data.name.slice(0, 300),
    address:
      text("address") ?? (legacyExample ? fallbackSettings.address : null),
    phone: text("phone"),
    email: text("email"),
    hours: text("hours"),
    logoUrl:
      data.logoUrl === "/images/reference/crest.webp"
        ? siteIdentity.logo
        : safeUrl(data.logoUrl)
          ? data.logoUrl
          : null,
    relatedLinks: Array.isArray(data.relatedLinks)
      ? data.relatedLinks
          .filter(
            (link): link is { label: string; href: string } =>
              !!link && typeof link.label === "string" && safeUrl(link.href),
          )
          .slice(0, 10)
      : [],
    isExample: legacyExample ? false : data.isExample !== false,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/settings`,
      {
        next: { revalidate: 60, tags: ["site-settings"] },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok) return fallbackSettings;
    const body = await response.json();
    return body.success === true
      ? (parseSiteSettings(body.data?.settings) ?? fallbackSettings)
      : fallbackSettings;
  } catch {
    return fallbackSettings;
  }
}
