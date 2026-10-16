"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { createHttpClient, ApiError } from "@/services/http-client";
import type { ProfilePage, Official } from "@/lib/profile";
const http = createHttpClient();
const assets = [
  "/images/watundehoa/amirulah.webp",
  "/images/watundehoa/kantor.webp",
  "/images/watundehoa/papan-kantor.webp",
  "/images/reference/crest.webp",
];
const slugs = [
  "sejarah",
  "visi-misi",
  "tugas-fungsi",
  "struktur-organisasi",
  "sambutan-lurah",
];
type Settings = {
  name: string;
  district: string;
  regency: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  heroUrl: string | null;
  relatedLinks: { label: string; href: string }[];
};
type Data = { settings: Settings; pages: ProfilePage[]; officials: Official[] };
async function mutate(
  path: string,
  body: unknown,
  method = "PUT",
  request = http,
) {
  if (path.startsWith("/admin/")) await request("/auth/me");
  const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
  return request(path, {
    method,
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify(body),
  });
}
function message(error: unknown) {
  return error instanceof ApiError
    ? `${error.message} (${error.code}; ${error.requestId})`
    : "Permintaan gagal";
}
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      {" "}
      <span>{label}</span>
      <input
        className="w-full rounded border border-border p-3"
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Media({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <label className="block">
      {label}
      <select
        className="mt-1 w-full rounded border border-border p-3"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Belum diisi</option>
        {assets.map((asset) => (
          <option key={asset}>{asset}</option>
        ))}
      </select>
    </label>
  );
}
function Editor({ data, reload }: { data: Data; reload: () => void }) {
  const runtime = useAuthRuntime();
  const [settings, setSettings] = useState(data.settings);
  const [slug, setSlug] = useState(slugs[0]);
  const [page, setPage] = useState<ProfilePage>(
    data.pages.find((p) => p.slug === slugs[0]) ?? {
      slug: slugs[0],
      title: "Sejarah",
      content: "",
      status: "DRAFT",
    },
  );
  const blankOfficial = (): Official => ({
    id: crypto.randomUUID(),
    name: "",
    position: "",
    unit: "",
    sortOrder: 0,
    active: true,
    photoUrl: null,
    termStart: null,
    termEnd: null,
    status: "DRAFT",
  });
  const [official, setOfficial] = useState<Official>(blankOfficial);
  const [preview, setPreview] = useState(false);
  const save = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) =>
      mutate(path, body, "PUT", runtime.request),
    onSuccess: reload,
  });
  const status = (value: string, change: (v: string) => void) => (
    <label className="block">
      Status
      <select
        className="m-2 rounded border p-2"
        aria-label="Status publikasi"
        value={value}
        onChange={(e) => change(e.target.value)}
      >
        <option>DRAFT</option>
        <option>PUBLISHED</option>
        <option>ARCHIVED</option>
      </select>
    </label>
  );
  return (
    <div className="space-y-10">
      <p>
        Kelola satu kelurahan. Unggah media tersedia pada tahap berikutnya; saat
        ini pilih aset lokal yang telah tersedia. Materi profil berupa teks
        biasa.
      </p>
      <form
        className="space-y-4 rounded-xl border border-border p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({ path: "/admin/profile/settings", body: settings });
        }}
      >
        <h2 className="text-2xl font-semibold">Pengaturan website</h2>
        {(
          [
            ["name", "Nama kelurahan"],
            ["district", "Kecamatan"],
            ["regency", "Kabupaten"],
            ["address", "Alamat"],
            ["phone", "Telepon"],
            ["email", "Email"],
            ["hours", "Jam kerja"],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={settings[key] ?? ""}
            onChange={(v) => setSettings({ ...settings, [key]: v || null })}
          />
        ))}
        {(["latitude", "longitude"] as const).map((key) => (
          <Field
            key={key}
            label={key === "latitude" ? "Lintang" : "Bujur"}
            type="number"
            value={settings[key]?.toString() ?? ""}
            onChange={(v) =>
              setSettings({ ...settings, [key]: v === "" ? null : Number(v) })
            }
          />
        ))}
        <Media
          label="Logo"
          value={settings.logoUrl}
          onChange={(v) => setSettings({ ...settings, logoUrl: v })}
        />
        <Media
          label="Hero"
          value={settings.heroUrl}
          onChange={(v) => setSettings({ ...settings, heroUrl: v })}
        />
        <h3 className="font-semibold">Tautan terkait / media sosial (HTTPS)</h3>
        {settings.relatedLinks.map((link, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-2">
            <Field
              label="Label tautan"
              value={link.label}
              onChange={(v) =>
                setSettings({
                  ...settings,
                  relatedLinks: settings.relatedLinks.map((l, n) =>
                    n === i ? { ...l, label: v } : l,
                  ),
                })
              }
            />
            <Field
              label="URL HTTPS"
              value={link.href}
              onChange={(v) =>
                setSettings({
                  ...settings,
                  relatedLinks: settings.relatedLinks.map((l, n) =>
                    n === i ? { ...l, href: v } : l,
                  ),
                })
              }
            />
            <button
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  relatedLinks: settings.relatedLinks.filter((_, n) => n !== i),
                })
              }
            >
              Hapus tautan
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={settings.relatedLinks.length >= 10}
          onClick={() =>
            setSettings({
              ...settings,
              relatedLinks: [...settings.relatedLinks, { label: "", href: "" }],
            })
          }
        >
          Tambah tautan
        </button>
        <br />
        <button className="yellow-button" disabled={save.isPending}>
          Simpan pengaturan
        </button>
      </form>
      <form
        className="space-y-4 rounded-xl border border-border p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const { title, content, status } = page;
          save.mutate({
            path: `/admin/profile/pages/${slug}`,
            body: { title, content, status },
          });
        }}
      >
        <h2 className="text-2xl font-semibold">Halaman profil</h2>
        <label>
          Bagian
          <select
            className="m-2 rounded border p-2"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setPage(
                data.pages.find((p) => p.slug === e.target.value) ?? {
                  slug: e.target.value,
                  title: e.target.value,
                  content: "",
                  status: "DRAFT",
                },
              );
              setPreview(false);
            }}
          >
            {slugs.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Field
          label="Judul"
          value={page.title}
          onChange={(v) => setPage({ ...page, title: v })}
        />
        <label className="block">
          Isi (teks biasa)
          <textarea
            className="mt-2 min-h-60 w-full rounded border border-border p-3"
            maxLength={30000}
            value={page.content}
            onChange={(e) => setPage({ ...page, content: e.target.value })}
          />
        </label>
        {status(page.status, (v) => setPage({ ...page, status: v }))}
        <button
          type="button"
          className="mr-5 underline"
          onClick={() => setPreview(!preview)}
        >
          Preview aman
        </button>
        <button className="yellow-button" disabled={save.isPending}>
          Simpan halaman
        </button>
        {preview && (
          <article className="break-words rounded border p-5">
            <p>Preview privat — {page.status}</p>
            <h3 className="text-xl font-bold">{page.title}</h3>
            <p className="whitespace-pre-wrap">{page.content}</p>
          </article>
        )}
      </form>
      <form
        className="space-y-4 rounded-xl border border-border p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const {
            id,
            name,
            position,
            unit,
            sortOrder,
            active,
            photoUrl,
            termStart,
            termEnd,
            status,
          } = official;
          save.mutate({
            path: `/admin/profile/officials/${id}`,
            body: {
              name,
              position,
              unit,
              sortOrder,
              active,
              photoUrl,
              termStart: termStart?.slice(0, 10) ?? null,
              termEnd: termEnd?.slice(0, 10) ?? null,
              status,
            },
          });
        }}
      >
        <h2 className="text-2xl font-semibold">Aparatur dan unit organisasi</h2>
        <label>
          Pilih aparatur
          <select
            className="m-2 max-w-full rounded border p-2"
            value={
              data.officials.some((o) => o.id === official.id)
                ? official.id
                : ""
            }
            onChange={(e) =>
              setOfficial(
                data.officials.find((o) => o.id === e.target.value) ??
                  blankOfficial(),
              )
            }
          >
            <option value="">Aparatur baru</option>
            {data.officials.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} — {o.status}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["name", "Nama"],
            ["position", "Jabatan"],
            ["unit", "Unit organisasi"],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={official[key]}
            onChange={(v) => setOfficial({ ...official, [key]: v })}
          />
        ))}
        <Field
          label="Urutan"
          type="number"
          value={String(official.sortOrder)}
          onChange={(v) => setOfficial({ ...official, sortOrder: Number(v) })}
        />
        <Media
          label="Foto opsional"
          value={official.photoUrl}
          onChange={(v) => setOfficial({ ...official, photoUrl: v })}
        />
        {(["termStart", "termEnd"] as const).map((key) => (
          <Field
            key={key}
            label={
              key === "termStart" ? "Mulai masa tugas" : "Akhir masa tugas"
            }
            type="date"
            value={official[key]?.slice(0, 10) ?? ""}
            onChange={(v) => setOfficial({ ...official, [key]: v || null })}
          />
        ))}
        <label className="block">
          <input
            type="checkbox"
            checked={official.active}
            onChange={(e) =>
              setOfficial({ ...official, active: e.target.checked })
            }
          />{" "}
          Aktif
        </label>
        {status(official.status, (v) =>
          setOfficial({ ...official, status: v }),
        )}
        <button className="yellow-button" disabled={save.isPending}>
          Simpan aparatur
        </button>
      </form>
      <div role="status" aria-live="polite">
        {save.isPending
          ? "Menyimpan…"
          : save.isError
            ? message(save.error)
            : save.isSuccess
              ? "Tersimpan. Muat ulang halaman publik untuk melihat perubahan published."
              : ""}
      </div>
    </div>
  );
}
export default function ProfileAdmin() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => mutate("/auth/login", { email, password }, "POST"),
    onSuccess: async () => {
      setPassword("");
      await runtime.bootstrap();
    },
  });
  const logout = useMutation({
    mutationFn: () => mutate("/auth/logout", {}, "POST"),
    onSuccess: () => runtime.bootstrap(),
  });
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "profile-editor"],
    enabled:
      auth.status === "AUTHENTICATED" && auth.user?.role === "ADMIN_KELURAHAN",
    queryFn: () => runtime.request<Data>("/admin/profile"),
  });
  return (
    <main id="konten" tabIndex={-1} className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Kelola profil kelurahan</h1>
      {auth.user && (
        <button
          type="button"
          className="mb-6 underline"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Keluar
        </button>
      )}
      {logout.isError && <p role="alert">{message(logout.error)}</p>}
      {auth.status === "INITIALIZING" && <p>Memeriksa sesi…</p>}
      {auth.status === "GUEST" && (
        <form
          className="max-w-md space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <p>Masuk menggunakan akun admin yang telah diprovisikan.</p>
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field
            label="Kata sandi"
            type="password"
            value={password}
            onChange={setPassword}
          />
          <button className="yellow-button" disabled={login.isPending}>
            Masuk
          </button>
          {login.isError && <p role="alert">{message(login.error)}</p>}
        </form>
      )}
      {auth.status === "AUTHENTICATED" &&
        auth.user?.role !== "ADMIN_KELURAHAN" && (
          <p role="alert">Akses kelola profil hanya untuk ADMIN_KELURAHAN.</p>
        )}
      {query.isLoading && <p>Memuat editor…</p>}
      {query.isError && (
        <p role="alert">
          {message(query.error)}{" "}
          <button onClick={() => void query.refetch()}>Coba lagi</button>
        </p>
      )}
      {query.data &&
        (auth.status === "AUTHENTICATED" || auth.status === "INITIALIZING") &&
        auth.user?.role === "ADMIN_KELURAHAN" && (
          <Editor
            key={auth.user.id}
            data={query.data}
            reload={() => void query.refetch()}
          />
        )}
    </main>
  );
}
