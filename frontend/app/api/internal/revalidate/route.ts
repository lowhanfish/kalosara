import { revalidateTag, revalidatePath } from "next/cache";
import { parseCacheEvent, verifyCacheSignature } from "@/lib/cache-signature";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.CACHE_INVALIDATION_SECRET)
    return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 2048)
    return Response.json({ error: "BODY_TOO_LARGE" }, { status: 413 });
  const reader = request.body?.getReader();
  let body = "";
  if (!reader) return Response.json({ error: "INVALID_BODY" }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 2048) {
      await reader.cancel();
      return Response.json({ error: "BODY_TOO_LARGE" }, { status: 413 });
    }
    chunks.push(value);
  }
  body = Buffer.concat(chunks).toString("utf8");
  if (
    !verifyCacheSignature(
      body,
      request.headers.get("x-cache-timestamp"),
      request.headers.get("x-cache-signature"),
      process.env.CACHE_INVALIDATION_SECRET,
    )
  )
    return Response.json({ error: "INVALID_SIGNATURE" }, { status: 403 });
  let event;
  try {
    event = parseCacheEvent(JSON.parse(body));
  } catch {
    /* Invalid JSON */
  }
  if (!event) return Response.json({ error: "INVALID_EVENT" }, { status: 400 });
  for (const tag of event.tags) revalidateTag(tag, { expire: 0 });
  if (event.tags.includes("news")) {
    revalidatePath("/berita", "layout");
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
  }
  if (event.tags.some((tag) => tag !== "news")) revalidatePath("/", "layout");
  return Response.json(
    { revalidated: true, id: event.id },
    { headers: { "Cache-Control": "no-store" } },
  );
}
