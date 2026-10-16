const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const {
  verifyCacheSignature,
  parseCacheEvent,
} = require("../.test-build/lib/cache-signature.js");
const {
  absoluteUrl,
  articlePath,
  categoryPath,
  jsonLd,
  xmlText,
  validSlug,
  newsQuery,
} = require("../.test-build/lib/news-seo.js");
const secret = "test-only-cache-secret-at-least-32-characters";
const body = JSON.stringify({
  id: "9cad3488-0dab-4b40-9537-f177765fe067",
  tags: ["news"],
});
const now = 1792150000000;
const signature = createHmac("sha256", secret)
  .update(`${now}.${body}`)
  .digest("hex");
test("cache HMAC binds body and timestamp, rejects tampering, expiry, invalid/missing secret/signature", () => {
  assert.equal(
    verifyCacheSignature(body, String(now), signature, secret, now),
    true,
  );
  for (const [b, t, s, key] of [
    [body + " ", String(now), signature, secret],
    [body, String(now + 1), signature, secret],
    [body, String(now), signature, undefined],
    [body, String(now), "short", secret],
    [body, "not-time", signature, secret],
  ])
    assert.equal(verifyCacheSignature(b, t, s, key, now), false);
  assert.equal(
    verifyCacheSignature(body, String(now), signature, secret, now + 300001),
    false,
  );
  assert.equal(
    verifyCacheSignature(body, String(now), signature, secret, now - 300001),
    false,
  );
});
test("cache events allow only public tags, UUID and bounded tag counts", () => {
  assert.deepEqual(parseCacheEvent(JSON.parse(body)), JSON.parse(body));
  for (const event of [
    { id: "not-uuid", tags: ["news"] },
    { ...JSON.parse(body), tags: ["user-private"] },
    { ...JSON.parse(body), tags: [] },
    { ...JSON.parse(body), path: "/admin" },
    { ...JSON.parse(body), tags: ["news", "news", "news", "news"] },
  ])
    assert.equal(parseCacheEvent(event), null);
});
test("JSON-LD escapes script closing and round trips hostile titles without creating markup", () => {
  const input = { headline: '</script><script>alert(1)</script> & "quoted"' };
  const output = jsonLd(input);
  assert.equal(output.includes("<"), false);
  assert.equal(output.includes("&"), false);
  assert.deepEqual(JSON.parse(output), input);
});
test("canonical paths and XML escape data, search query encodes literal metacharacters", () => {
  assert.equal(articlePath("warga"), "/berita/warga");
  assert.equal(categoryPath("kegiatan"), "/berita/kategori/kegiatan");
  assert.equal(validSlug("../admin"), false);
  assert.equal(validSlug("berita-baik"), true);
  assert.equal(xmlText("a<&\"'"), "a&lt;&amp;&quot;&apos;");
  const query = new URLSearchParams(
    newsQuery(2, "<script>&x=1", "kegiatan", 9),
  );
  assert.equal(query.get("search"), "<script>&x=1");
  assert.equal(query.get("page"), "2");
});
test("origin is explicit and rejects credentials, subpath, query and non HTTP schemes", () => {
  const old = process.env.SITE_ORIGIN;
  try {
    process.env.SITE_ORIGIN = "https://kelurahan.example";
    assert.equal(
      absoluteUrl("/berita/baru"),
      "https://kelurahan.example/berita/baru",
    );
    for (const value of [
      "https://user:password@example.invalid",
      "https://example.invalid/path",
      "javascript:alert(1)",
      "https://example.invalid/?x=1",
    ]) {
      process.env.SITE_ORIGIN = value;
      assert.throws(() => absoluteUrl("/berita"));
    }
  } finally {
    if (old === undefined) delete process.env.SITE_ORIGIN;
    else process.env.SITE_ORIGIN = old;
  }
});

test("Prompt 09 invalidation accepts public-content with signed public tags only", () => {
  const event = { id: JSON.parse(body).id, tags: ["public-content", "news", "site-settings", "public-profile"] };
  assert.deepEqual(parseCacheEvent(event), event);
  assert.equal(parseCacheEvent({ ...event, tags: ["public-content", "user-private"] }), null);
});
