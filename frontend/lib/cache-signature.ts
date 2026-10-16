import { createHmac, timingSafeEqual } from "node:crypto";
export const cacheTags = [
  "news",
  "site-settings",
  "public-profile",
  "public-content",
] as const;
export function verifyCacheSignature(
  body: string,
  timestamp: string | null,
  signature: string | null,
  secret: string | undefined,
  now = Date.now(),
) {
  if (
    !secret ||
    secret.length < 32 ||
    !timestamp ||
    !/^\d{13}$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > 300000 ||
    !signature ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function parseCacheEvent(
  value: unknown,
): { id: string; tags: (typeof cacheTags)[number][] } | null {
  if (!value || typeof value !== "object") return null;
  const event = value as Record<string, unknown>;
  if (
    Object.keys(event).some((key) => !["id", "tags"].includes(key)) ||
    typeof event.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      event.id,
    ) ||
    !Array.isArray(event.tags) ||
    !event.tags.length ||
    event.tags.length > 4 ||
    new Set(event.tags).size !== event.tags.length ||
    !event.tags.every((tag) => cacheTags.includes(tag))
  )
    return null;
  return { id: event.id, tags: [...new Set(event.tags)] };
}
