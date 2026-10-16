const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createAuthRuntime,
  userQueryKey,
} = require("../.test-build/features/auth/runtime.js");
const { createHttpClient } = require("../.test-build/services/http-client.js");
const ok = (data) =>
  Response.json({ success: true, data, requestId: "server-id" });
const fail = (status, code) =>
  Response.json(
    { success: false, error: { code, message: code }, requestId: "failure-id" },
    { status },
  );
const user = (id) => ({ id, role: "MASYARAKAT" });

test("reload expired access: CSRF, one refresh and one me retry", async () => {
  const calls = [];
  const runtime = createAuthRuntime(async (url, options) => {
    calls.push(url);
    assert.equal(options.credentials, "same-origin");
    if (url.endsWith("/csrf")) return ok({ csrfToken: "csrf" });
    if (url.endsWith("/refresh")) {
      assert.equal(options.headers.get("X-CSRF-Token"), "csrf");
      return ok({ refreshed: true });
    }
    return calls.filter((x) => x.endsWith("/me")).length === 1
      ? fail(401, "TOKEN_EXPIRED")
      : ok({ user: user("A") });
  });
  await runtime.bootstrap();
  assert.equal(runtime.store.getState().status, "AUTHENTICATED");
  assert.deepEqual(calls, [
    "/api/v1/auth/me",
    "/api/v1/auth/csrf",
    "/api/v1/auth/refresh",
    "/api/v1/auth/me",
  ]);
});

test("10 parallel 401 including a late response trigger exactly one refresh", async () => {
  let refreshes = 0,
    initial = 0;
  const runtime = createAuthRuntime(async (url) => {
    if (url.endsWith("/csrf")) return ok({ csrfToken: "csrf" });
    if (url.endsWith("/refresh")) {
      refreshes++;
      return ok({});
    }
    if (++initial <= 10) {
      if (initial === 10) await new Promise((r) => setTimeout(r, 30));
      return fail(401, "TOKEN_EXPIRED");
    }
    return ok({ value: true });
  });
  await Promise.all(
    Array.from({ length: 10 }, () => runtime.request("/private")),
  );
  assert.equal(refreshes, 1);
  assert.equal(initial, 20);
});

for (const code of ["SESSION_REVOKED", "UNAUTHENTICATED", "TOKEN_EXPIRED"]) {
  test(`definitive refresh ${code} clears state/cache before redirect`, async () => {
    let redirected = 0;
    const runtime = createAuthRuntime(
      async (url) =>
        url.endsWith("/csrf")
          ? ok({ csrfToken: "csrf" })
          : fail(401, url.endsWith("/refresh") ? code : "TOKEN_EXPIRED"),
      () => {
        redirected++;
        assert.equal(runtime.store.getState().user, null);
        assert.equal(runtime.queryClient.getQueryCache().getAll().length, 0);
      },
    );
    runtime.store.setState({ user: user("A"), status: "AUTHENTICATED" });
    runtime.queryClient.setQueryData(userQueryKey("A", "secret"), "private");
    await runtime.bootstrap();
    assert.equal(runtime.store.getState().status, "GUEST");
    assert.equal(redirected, 1);
  });
}
for (const outage of ["network", 502, 503, 409, 429]) {
  test(`refresh outage ${outage} retains identity/cache with recovery state`, async () => {
    const runtime = createAuthRuntime(
      async (url) => {
        if (url.endsWith("/csrf")) return ok({ csrfToken: "csrf" });
        if (url.endsWith("/refresh")) {
          if (outage === "network") throw new TypeError("offline");
          return fail(outage, "TEMPORARY");
        }
        return fail(401, "TOKEN_EXPIRED");
      },
      () => assert.fail("must not redirect"),
    );
    runtime.store.setState({ user: user("A"), status: "AUTHENTICATED" });
    runtime.queryClient.setQueryData(userQueryKey("A"), "private");
    await runtime.bootstrap();
    assert.equal(runtime.store.getState().status, "TEMPORARY_ERROR");
    assert.equal(runtime.store.getState().user.id, "A");
    assert.equal(
      runtime.queryClient.getQueryData(userQueryKey("A")),
      "private",
    );
  });
}

test("account switch clears A cache, cancels in-flight A query, keys isolate B", async () => {
  let id = "A";
  const runtime = createAuthRuntime(async () => ok({ user: user(id) }));
  await runtime.bootstrap();
  runtime.queryClient.setQueryData(userQueryKey("A", "profile"), "secret A");
  let resolve;
  const pending = runtime.queryClient
    .fetchQuery({
      queryKey: userQueryKey("A", "slow"),
      queryFn: () =>
        new Promise((r) => {
          resolve = r;
        }),
    })
    .catch(() => {});
  id = "B";
  await runtime.bootstrap();
  resolve("late A");
  await pending;
  assert.equal(runtime.store.getState().user.id, "B");
  assert.equal(
    runtime.queryClient.getQueryData(userQueryKey("A", "profile")),
    undefined,
  );
  assert.equal(
    runtime.queryClient.getQueryData(userQueryKey("A", "slow")),
    undefined,
  );
  assert.equal(
    runtime.queryClient.getQueryData(userQueryKey("B", "profile")),
    undefined,
  );
});

test("retry 401 stops after one refresh; refresh endpoint never retries", async () => {
  let refreshes = 0;
  const runtime = createAuthRuntime(async (url) => {
    if (url.endsWith("/csrf")) return ok({ csrfToken: "csrf" });
    if (url.endsWith("/refresh")) {
      refreshes++;
      return ok({});
    }
    return fail(401, "TOKEN_EXPIRED");
  });
  await runtime.bootstrap();
  assert.equal(refreshes, 1);
  assert.equal(runtime.store.getState().status, "GUEST");
  let calls = 0;
  const raw = createAuthRuntime(async () => {
    calls++;
    return fail(401, "TOKEN_EXPIRED");
  });
  await assert.rejects(raw.request("/auth/refresh", { method: "POST" }));
  assert.equal(calls, 1);
});

test("HTTP timeout, external abort, malformed response and server requestId", async () => {
  const http = createHttpClient(
    async (_, options) =>
      new Promise((resolve, reject) => {
        if (options.signal.aborted) reject(new Error("aborted"));
        options.signal.addEventListener("abort", () =>
          reject(new Error("aborted")),
        );
      }),
  );
  await assert.rejects(
    http("/slow", { timeoutMs: 5 }),
    (e) => e.code === "TIMEOUT" && !!e.requestId,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    http("/slow", { signal: controller.signal }),
    (e) => e.code === "ABORTED",
  );
  await assert.rejects(
    createHttpClient(async () => new Response("bad"))("/x"),
    (e) => e.code === "INVALID_RESPONSE",
  );
  await assert.rejects(
    createHttpClient(async () => fail(403, "FORBIDDEN"))("/x"),
    (e) => e.code === "FORBIDDEN" && e.requestId === "failure-id",
  );
});

test("10 parallel 401 share even a failed refresh, recovery can retry later", async () => {
  let attempts = 0,
    requests = 0,
    recovered = false;
  const runtime = createAuthRuntime(async (url) => {
    if (url.endsWith("/csrf")) return ok({ csrfToken: "csrf" });
    if (url.endsWith("/refresh")) {
      attempts++;
      return fail(503, "UNAVAILABLE");
    }
    if (recovered) return ok({ user: user("A") });
    if (++requests === 10) await new Promise((r) => setTimeout(r, 30));
    return fail(401, "TOKEN_EXPIRED");
  });
  await Promise.allSettled(
    Array.from({ length: 10 }, () => runtime.request("/private")),
  );
  assert.equal(attempts, 1);
  assert.equal(runtime.store.getState().status, "TEMPORARY_ERROR");
  recovered = true;
  await runtime.bootstrap();
  assert.equal(runtime.store.getState().status, "AUTHENTICATED");
});

test("public me client uses refresh while unrelated forbidden does not logout", async () => {
  let calls = 0;
  const runtime = createAuthRuntime(async (url) => {
    if (url.endsWith("/csrf")) return ok({ csrfToken: "csrf" });
    if (url.endsWith("/refresh")) return ok({});
    if (url.endsWith("/me"))
      return ++calls === 1
        ? fail(401, "TOKEN_EXPIRED")
        : ok({ user: user("A") });
    return fail(403, "FORBIDDEN");
  });
  assert.equal((await runtime.request("/auth/me")).user.id, "A");
  await runtime.bootstrap();
  await assert.rejects(runtime.request("/forbidden"));
  assert.notEqual(runtime.store.getState().status, "GUEST");
});

test("late A response cannot log B out or return A data after identity switch", async () => {
  let id = "A",
    finish;
  const runtime = createAuthRuntime(async (url) => {
    if (url.endsWith("/me")) return ok({ user: user(id) });
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await runtime.bootstrap();
  const old = runtime.request("/slow");
  id = "B";
  await runtime.bootstrap();
  finish(fail(401, "SESSION_REVOKED"));
  await assert.rejects(old, (e) => e.code === "STALE_SESSION");
  assert.equal(runtime.store.getState().status, "AUTHENTICATED");
  assert.equal(runtime.store.getState().user.id, "B");
});

test("guest callback distinguishes first visit from invalidation of a known identity", async () => {
  for (const hadIdentity of [false, true]) {
    let outcome;
    const runtime = createAuthRuntime(
      async (url) =>
        url.endsWith("/csrf")
          ? ok({ csrfToken: "csrf" })
          : fail(401, "UNAUTHENTICATED"),
      (error, known) => {
        outcome = { code: error.code, known };
      },
    );
    if (hadIdentity)
      runtime.store.setState({ user: user("A"), status: "AUTHENTICATED" });
    await runtime.bootstrap();
    assert.deepEqual(outcome, { code: "UNAUTHENTICATED", known: hadIdentity });
    assert.equal(runtime.store.getState().status, "GUEST");
  }
});

for (const status of [400, 403, 404, 409, 413]) {
  test(`CMS business HTTP ${status} preserves authenticated identity and cache`, async () => {
    const runtime = createAuthRuntime(async (url) =>
      url.endsWith("/me")
        ? ok({ user: user("admin") })
        : fail(status, "CMS_BUSINESS_ERROR"),
    );
    await runtime.bootstrap();
    runtime.queryClient.setQueryData(userQueryKey("admin", "cms-draft"), {
      title: "unsaved",
    });
    await assert.rejects(
      runtime.request("/admin/news/record", { method: "PUT" }),
    );
    assert.equal(runtime.store.getState().status, "AUTHENTICATED");
    assert.equal(runtime.store.getState().user.id, "admin");
    assert.deepEqual(
      runtime.queryClient.getQueryData(userQueryKey("admin", "cms-draft")),
      { title: "unsaved" },
    );
  });
}
test("a business conflict after an access refresh retry does not change authentication", async () => {
  let newsCalls = 0;
  const runtime = createAuthRuntime(async (url) => {
    if (url.endsWith("/me")) return ok({ user: user("admin") });
    if (url.endsWith("/csrf")) return ok({ csrfToken: "csrf" });
    if (url.endsWith("/refresh")) return ok({});
    return ++newsCalls === 1
      ? fail(401, "TOKEN_EXPIRED")
      : fail(409, "VERSION_CONFLICT");
  });
  await runtime.bootstrap();
  await assert.rejects(runtime.request("/admin/news/record"));
  assert.equal(newsCalls, 2);
  assert.equal(runtime.store.getState().status, "AUTHENTICATED");
});
