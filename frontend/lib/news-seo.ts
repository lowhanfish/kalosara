export function siteOrigin() {
  const url = new URL(process.env.SITE_ORIGIN ?? "http://localhost:3000");
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("SITE_ORIGIN must be an HTTP(S) origin");
  return url.origin;
}
export const absoluteUrl = (path: string) =>
  new URL(path, siteOrigin()).toString();
export const articlePath = (slug: string) =>
  `/berita/${encodeURIComponent(slug)}`;
export const categoryPath = (slug: string) =>
  `/berita/kategori/${encodeURIComponent(slug)}`;
export function jsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
export function xmlText(value: string) {
  return value.replace(
    /[<>&"']/g,
    (char) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[char]!,
  );
}
export const validSlug = (value: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 180;
export function newsQuery(
  page: number,
  search = "",
  category?: string,
  limit = 9,
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) query.set("search", search.slice(0, 100));
  if (category) query.set("category", category);
  return query.toString();
}
export const newsDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(new Date(date));
