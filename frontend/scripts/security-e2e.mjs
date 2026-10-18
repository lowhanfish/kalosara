// Run only against QA frontend3002/backend4002 with disposable DB fixture.
// PLAYWRIGHT_MODULE may point to the bundled Playwright entry; no production credentials.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const base = process.env.QA_ORIGIN ?? "http://localhost:3002";
if (base !== "http://localhost:3002")
  throw new Error("QA only: localhost:3002 required");
const fixturePath = process.env.QA_FIXTURE_FILE;
if (!fixturePath?.startsWith("/tmp/kalosara-"))
  throw new Error("Disposable fixture file required");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const checks = [];
const pageErrors = [];
const cspErrors = [];
const check = (name) => {
  checks.push(name);
};
async function login(page, kind, path) {
  await page.goto(base + path);
  await page.getByLabel("Email", { exact: true }).fill(fixture[kind].email);
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(fixture[kind].password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
async function api(page, path, method = "GET", body) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const csrf = await (await fetch("/api/v1/auth/csrf")).json();
      const r = await fetch("/api/v1" + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf.data.csrfToken,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: r.status,
        headers: Object.fromEntries(r.headers),
        body: await r.json(),
      };
    },
    { path, method, body },
  );
}
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    if (/Content Security Policy|violates.*directive/i.test(m.text()))
      cspErrors.push(m.text());
  });
  const home = await page.goto(base);
  assert.equal(home.status(), 200);
  assert.match(
    home.headers()["content-security-policy"],
    /frame-ancestors 'none'/,
  );
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(base);
    await page.locator(".modern-hero").waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.equal(await page.locator(".hero-leader-photo img").count(), 1);
  }
  check("headers, preserved hero and three responsive widths");
  const denied = await api(page, "/admin/news");
  assert.equal(denied.status, 401);
  assert.match(denied.headers["cache-control"], /no-store/);
  const forbiddenImage = await context.request.get(
    base + "/_next/image?url=%2Fapi%2Fv1%2Faccount%2Fprofile&w=360&q=75",
  );
  assert.equal(forbiddenImage.status(), 400);
  const remoteImage = await context.request.get(
    base + "/_next/image?url=https%3A%2F%2Fexample.invalid%2Fx.png&w=360&q=75",
  );
  assert.equal(remoteImage.status(), 400);
  check("anonymous API and optimizer private/remote URL rejection");
  await login(page, "citizen", "/masyarakat/profil");
  await page
    .getByRole("heading", { name: "Profil saya", exact: true })
    .waitFor();
  const hostile = "<img src=x onerror=window.p13xss=1> QA";
  await page.getByLabel("Nama", { exact: true }).fill(hostile);
  await page
    .getByLabel("Alamat (opsional)", { exact: true })
    .fill("Alamat QA sementara");
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await page.getByText("Profil tersimpan.", { exact: true }).waitFor();
  await page.reload();
  await page
    .getByRole("heading", { name: "Profil saya", exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Nama", { exact: true }).inputValue(),
    hostile,
  );
  assert.equal(await page.evaluate(() => window.p13xss), undefined);
  assert.equal((await api(page, "/admin/news")).status, 403);
  const idor = await api(page, "/account/profile", "PATCH", {
    userId: fixture.admin.id,
    role: "LURAH",
    displayName: "Unauthorized",
  });
  assert.equal(idor.status, 400);
  check("citizen login, edit, reload, escaped content, RBAC and IDOR");
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await page.waitForURL(base + "/");
  assert.equal((await api(page, "/account/profile")).status, 401);
  await page.goto(base + "/masyarakat/profil?next=https://attacker.invalid");
  await page.getByRole("heading", { name: "Masuk akun masyarakat" }).waitFor();
  assert.equal(new URL(page.url()).origin, base);
  check("logout clears access and hostile return URL stays local");
  await login(page, "admin", "/admin/berita");
  await page.getByRole("button", { name: "kategori", exact: true }).click();
  const slug = "qa-" + randomUUID();
  const categoryName = "Kategori " + slug;
  await page.getByLabel("Nama kategori", { exact: true }).fill(categoryName);
  await page.getByLabel("Slug kategori", { exact: true }).fill(slug);
  await page
    .getByRole("button", { name: "Simpan kategori", exact: true })
    .click();
  await page.getByText("Kategori tersimpan.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "berita", exact: true }).click();
  await page
    .getByRole("button", { name: "Buat berita baru", exact: true })
    .click();
  await page
    .getByLabel("Judul berita", { exact: true })
    .fill("Berita QA Prompt 13");
  await page.getByLabel("Slug berita", { exact: true }).fill(slug);
  await page
    .getByLabel("Ringkasan", { exact: true })
    .fill("Ringkasan QA terisolasi");
  await page
    .getByLabel("Kategori berita", { exact: true })
    .selectOption({ label: categoryName });
  await page
    .getByRole("textbox", { name: "Isi berita", exact: true })
    .fill("Isi QA terisolasi");
  await page
    .getByRole("button", { name: "Simpan berita", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Preview tersimpan", exact: true })
    .waitFor({ state: "visible" });
  await page.waitForFunction(
    () =>
      ![...document.querySelectorAll("button")].find(
        (b) => b.textContent === "Preview tersimpan",
      )?.disabled,
  );
  assert.equal(
    (await context.request.get(base + "/berita/" + slug)).status(),
    404,
  );
  await page
    .getByLabel("Status berita", { exact: true })
    .selectOption("PUBLISHED");
  await page
    .getByRole("button", { name: "Simpan berita", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      ![...document.querySelectorAll("button")].find(
        (b) => b.textContent === "Preview tersimpan",
      )?.disabled,
  );
  const article = await context.request.get(base + "/berita/" + slug);
  assert.equal(article.status(), 200);
  const html = await article.text();
  assert.match(html, /property="og:title" content="Berita QA Prompt 13"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /rel="canonical"/);
  check("CMS category, draft404, publish and SEO in raw server HTML");
  await page.goto(base + "/berita/" + slug);
  await page
    .getByRole("heading", { name: "Berita QA Prompt 13", exact: true })
    .waitFor();
  await page.screenshot({
    path: "/tmp/kalosara-p13-article.png",
    fullPage: true,
  });
  await page.goto(base + "/admin/berita");
  await page.setViewportSize({ width: 360, height: 960 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "/tmp/kalosara-p13-admin.png",
    fullPage: true,
  });
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(cspErrors, []);
  check("hydration and CSP console, CMS mobile layout");
  console.log(JSON.stringify({ passed: checks.length, checks }));
} finally {
  await browser.close();
}
