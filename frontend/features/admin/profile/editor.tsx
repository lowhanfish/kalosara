"use client";
import Link from "next/link";
import { cmsError } from "@/features/cms/client";
import type { MediaAsset, List } from "@/features/cms/client";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { createHttpClient } from "@/services/http-client";
import type { ProfilePage, Official } from "@/lib/profile";
const http = createHttpClient();
const assets = [
  "/images/watundehoa/amirulah.webp",
  "/images/watundehoa/kantor.webp",
  "/images/watundehoa/papan-kantor.webp",
  "/images/watundehoa/konawe.png",
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
export type Data = {
  settings: Settings;
  pages: ProfilePage[];
  officials: Official[];
};
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
  return cmsError(error);
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
        className="cms-input"
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
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "cms-media", "profile-picker", search],
    queryFn: () =>
      runtime.request<List<MediaAsset>>(
        `/admin/media?visibility=PUBLIC&limit=50&search=${encodeURIComponent(search)}`,
      ),
  });
  const uploaded =
    query.data?.items.filter(
      (item) => item.mimeType.startsWith("image/") && item.url,
    ) ?? [];
  return (
    <div>
      <label className="block">
        {label}
        <select
          className="mt-1 w-full rounded border border-border p-3"
          aria-label={label}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">Belum diisi</option>
          {value &&
            !assets.includes(value) &&
            !uploaded.some((item) => item.url === value) && (
              <option value={value}>Gambar tersimpan</option>
            )}
          {uploaded.map((item) => (
            <option key={item.id} value={item.url!}>
              {item.alt || item.originalName}
            </option>
          ))}
          {assets.map((asset) => (
            <option key={asset}>{asset}</option>
          ))}
        </select>
      </label>
      <label className="mt-2 block text-[15px]">
        Cari gambar untuk {label}
        <input
          className="mt-1 w-full rounded border border-border p-2"
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {query.isError && <p role="alert">Pustaka media belum dapat dimuat.</p>}
      <p className="mt-2 text-sm text-muted">
        Maksimal 50 hasil gambar publik.{" "}
        <Link className="underline" href="/admin/berita">
          Unggah atau kelola media
        </Link>
      </p>
    </div>
  );
}

export default function Editor({
  data,
  reload,
}: {
  data: Data;
  reload: () => void;
}) {
  const [section, setSection] = useState("pengaturan");
  useEffect(() => {
    const sync = () => {
      const value = window.location.hash.slice(1);
      if (["pengaturan", "halaman-profil", "aparatur"].includes(value))
        setSection(value);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
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
        className="cms-input"
        aria-label="Status publikasi"
        value={value}
        onChange={(e) => change(e.target.value)}
      >
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Terbit</option>
        <option value="ARCHIVED">Arsip</option>
      </select>
    </label>
  );
  return (
    <div>
      <nav aria-label="Bagian profil" className="cms-channel-tabs">
        {[
          ["pengaturan", "Identitas & kontak"],
          ["halaman-profil", "Halaman profil"],
          ["aparatur", "Aparatur"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={section === key}
            onClick={() => {
              setSection(key);
              window.location.hash = key;
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {section === "pengaturan" && (
        <form
          className="space-y-4 rounded-xl border border-border p-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ path: "/admin/profile/settings", body: settings });
          }}
        >
          <h2 id="pengaturan" className="text-2xl font-semibold">
            Pengaturan website
          </h2>
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
            label="Gambar utama beranda"
            value={settings.heroUrl}
            onChange={(v) => setSettings({ ...settings, heroUrl: v })}
          />
          <h3 className="font-semibold">
            Tautan terkait / media sosial (HTTPS)
          </h3>
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
                    relatedLinks: settings.relatedLinks.filter(
                      (_, n) => n !== i,
                    ),
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
                relatedLinks: [
                  ...settings.relatedLinks,
                  { label: "", href: "" },
                ],
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
      )}
      {section === "halaman-profil" && (
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
          <h2 id="halaman-profil" className="text-2xl font-semibold">
            Halaman profil
          </h2>
          <label>
            Bagian
            <select
              className="cms-input"
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
                <option key={s} value={s}>
                  {
                    {
                      sejarah: "Sejarah",
                      "visi-misi": "Visi dan misi",
                      "tugas-fungsi": "Tugas dan fungsi",
                      "struktur-organisasi": "Struktur organisasi",
                      "sambutan-lurah": "Sambutan lurah",
                    }[s]
                  }
                </option>
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
            Lihat pratinjau
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
      )}
      {section === "aparatur" && (
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
          <h2 id="aparatur" className="text-2xl font-semibold">
            Aparatur dan unit organisasi
          </h2>
          <label>
            Pilih aparatur
            <select
              className="cms-input"
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
      )}
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
