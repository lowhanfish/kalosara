const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseSiteSettings,
  fallbackSettings,
} = require("../.test-build/lib/site-settings.js");
const { searchPages } = require("../.test-build/lib/public-pages.js");

test("public identity cannot introduce script or protocol-relative URLs", () => {
  const settings = parseSiteSettings({
    name: "Kelurahan Uji",
    logoUrl: "javascript:alert(1)",
    relatedLinks: [
      { label: "Unsafe", href: "//evil.invalid" },
      { label: "Safe", href: "/kontak" },
    ],
    isExample: false,
  });
  assert.equal(settings.logoUrl, null);
  assert.deepEqual(settings.relatedLinks, [{ label: "Safe", href: "/kontak" }]);
  assert.equal(settings.isExample, false);
  assert.equal(parseSiteSettings({ name: 12 }), null);
  assert.equal(fallbackSettings.isExample, true);
  assert.equal(fallbackSettings.phone, null);
});

test("menu search handles empty, whitespace, case and literal malicious text", () => {
  assert.deepEqual(searchPages(" "), []);
  assert.ok(
    searchPages("  PeLaYaNaN ").some((page) => page.href === "/pelayanan"),
  );
  assert.deepEqual(searchPages("<script>alert(1)</script>"), []);
  assert.ok(searchPages("kontak").some((page) => page.href === "/kontak"));
});
