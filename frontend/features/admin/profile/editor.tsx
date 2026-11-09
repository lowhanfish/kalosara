"use client";
import Link from "next/link";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { cmsError } from "@/features/cms/client";
import type { MediaAsset, List } from "@/features/cms/client";
import { RichEditor } from "@/features/cms/rich-editor";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { createHttpClient } from "@/services/http-client";
import type { ProfilePage, Official } from "@/lib/profile";
import {
  Pencil,
  Plus,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  Clock,
  MapPin,
  Users,
  FileText,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
} from "lucide-react";

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

const pageNames: Record<string, string> = {
  sejarah: "Sejarah",
  "visi-misi": "Visi dan Misi",
  "tugas-fungsi": "Tugas dan Fungsi",
  "struktur-organisasi": "Struktur Organisasi",
  "sambutan-lurah": "Sambutan Lurah",
};

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
      <span className="text-xs font-semibold text-slate-700">{label}</span>
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
  return (
    <div className="space-y-2 rounded-xl border border-border p-4 bg-white shadow-xs">
      <span className="block text-xs font-semibold text-slate-700">{label}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-muted block">
          Pilih dari aset bawaan kelurahan
          <select
            className="cms-input mt-1"
            value={assets.includes(value ?? "") ? (value ?? "") : ""}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">(Tanpa gambar bawaan)</option>
            {assets.map((path) => (
              <option key={path} value={path}>
                {path.split("/").pop()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted block">
          Cari dari pustaka media publik
          <input
            className="cms-input mt-1"
            placeholder="Ketik kata kunci media…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {query.data && query.data.items.length > 0 && (
        <div className="max-h-36 overflow-y-auto rounded border border-border p-2 bg-slate-50 space-y-1">
          {query.data.items.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`block w-full text-left truncate rounded px-2 py-1 text-xs transition-colors ${
                value === `/media/${m.id}`
                  ? "bg-primary text-white font-semibold"
                  : "hover:bg-slate-200 text-slate-700"
              }`}
              onClick={() => onChange(`/media/${m.id}`)}
            >
              {m.originalName} ({m.mimeType})
            </button>
          ))}
        </div>
      )}
      {value && (
        <div className="flex items-center gap-4 rounded-lg border border-border p-3 bg-slate-50">
          <div className="relative size-14 shrink-0 overflow-hidden rounded bg-slate-200">
            <SkeletonImage
              src={value}
              alt={label}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-semibold text-slate-800 truncate">{value}</p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-red-600 hover:underline mt-1 block font-medium"
            >
              Hapus gambar
            </button>
          </div>
        </div>
      )}
      <p className="mt-1 text-xs text-muted">
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

  const auth = useAuth();
  const runtime = useAuthRuntime();
  const mediaList = useQuery({
    queryKey: ["user", auth.user?.id, "profile-rich-media"],
    queryFn: () =>
      runtime.request<List<MediaAsset>>(
        "/admin/media?visibility=PUBLIC&limit=50",
      ),
  });

  const [settings, setSettings] = useState(data.settings);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const [editingProfileSlug, setEditingProfileSlug] = useState<string | null>(null);
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
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  const [official, setOfficial] = useState<Official>(blankOfficial);
  const [preview, setPreview] = useState(false);

  const save = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) =>
      mutate(path, body, "PUT", runtime.request),
    onSuccess: () => {
      reload();
    },
  });

  const status = (value: string, change: (v: string) => void) => (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">Status Publikasi</span>
      <select
        className="cms-input mt-1"
        aria-label="Status publikasi"
        value={value}
        onChange={(e) => change(e.target.value)}
      >
        <option value="DRAFT">Draft — Belum ditampilkan ke publik</option>
        <option value="PUBLISHED">Terbit — Ditampilkan di website</option>
        <option value="ARCHIVED">Arsip — Dinonaktifkan</option>
      </select>
    </label>
  );

  const statusBadge = (s: string) => {
    if (s === "PUBLISHED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-600" /> Terbit
        </span>
      );
    }
    if (s === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" /> Draft
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
        Arsip
      </span>
    );
  };

  return (
    <div className="space-y-6">
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
              setEditingProfileSlug(null);
              setEditingOfficialId(null);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* SECTION 1: PENGATURAN IDENTITAS & KONTAK */}
      {section === "pengaturan" && (
        <>
          {!isEditingSettings ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Identitas & Kontak Website
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Informasi resmi kelurahan yang ditampilkan pada header, footer, dan halaman kontak.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/kontak"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink size={15} />
                    Lihat Kontak Publik
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(true)}
                    className="yellow-button inline-flex min-h-10 items-center gap-2"
                  >
                    <Pencil size={15} />
                    Ubah Pengaturan Website
                  </button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Info Identitas */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Building2 size={18} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-800">
                      Identitas Wilayah
                    </h3>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <dt className="text-slate-500">Nama Wilayah</dt>
                    <dd className="col-span-2 font-medium text-slate-900">{settings.name || "-"}</dd>
                    <dt className="text-slate-500">Kecamatan</dt>
                    <dd className="col-span-2 font-medium text-slate-900">{settings.district || "-"}</dd>
                    <dt className="text-slate-500">Kabupaten</dt>
                    <dd className="col-span-2 font-medium text-slate-900">{settings.regency || "-"}</dd>
                    <dt className="text-slate-500">Alamat Kantor</dt>
                    <dd className="col-span-2 font-medium text-slate-900">{settings.address || "-"}</dd>
                  </dl>
                </div>

                {/* Info Kontak & Operasional */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Phone size={18} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-800">
                      Kontak & Operasional
                    </h3>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <dt className="text-slate-500">Telepon</dt>
                    <dd className="col-span-2 font-medium text-slate-900">{settings.phone || "-"}</dd>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="col-span-2 font-medium text-slate-900">{settings.email || "-"}</dd>
                    <dt className="text-slate-500">Jam Kerja</dt>
                    <dd className="col-span-2 font-medium text-slate-900">{settings.hours || "-"}</dd>
                    <dt className="text-slate-500">Koordinat Peta</dt>
                    <dd className="col-span-2 font-mono text-xs text-slate-700">
                      {settings.latitude && settings.longitude
                        ? `${settings.latitude}, ${settings.longitude}`
                        : "Belum ditentukan"}
                    </dd>
                  </dl>
                </div>
              </div>

              {/* Tautan Terkait */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Tautan Terkait Eksternal ({settings.relatedLinks.length})
                </h3>
                {settings.relatedLinks.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {settings.relatedLinks.map((link, idx) => (
                      <li key={idx} className="flex items-center justify-between py-2 text-sm">
                        <span className="font-medium text-slate-800">{link.label || "(Tanpa label)"}</span>
                        <span className="text-xs text-slate-500 font-mono">{link.href}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada tautan terkait yang ditambahkan.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Ringkasan Identitas
                </button>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Mode Pengeditan Pengaturan
                </span>
              </div>

              <form
                className="admin-settings-form space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
                onSubmit={(e) => {
                  e.preventDefault();
                  save.mutate(
                    { path: "/admin/profile/settings", body: settings },
                    {
                      onSuccess: () => {
                        setIsEditingSettings(false);
                      },
                    },
                  );
                }}
              >
                <h2 id="pengaturan" className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Form Pengaturan Website
                </h2>
                <div className="admin-settings-fields">
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
                      onChange={(v) =>
                        setSettings({ ...settings, [key]: v || null })
                      }
                    />
                  ))}
                  <Field
                    label="Latitude"
                    type="number"
                    value={settings.latitude ? String(settings.latitude) : ""}
                    onChange={(v) =>
                      setSettings({
                        ...settings,
                        latitude: v === "" ? null : Number(v),
                      })
                    }
                  />
                  <Field
                    label="Longitude"
                    type="number"
                    value={settings.longitude ? String(settings.longitude) : ""}
                    onChange={(v) =>
                      setSettings({
                        ...settings,
                        longitude: v === "" ? null : Number(v),
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Media
                    label="Logo kelurahan"
                    value={settings.logoUrl}
                    onChange={(v) => setSettings({ ...settings, logoUrl: v })}
                  />
                  <Media
                    label="Gambar beranda utama"
                    value={settings.heroUrl}
                    onChange={(v) => setSettings({ ...settings, heroUrl: v })}
                  />
                </div>
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Tautan terkait (maksimal 10)
                  </h3>
                  {settings.relatedLinks.map((l, i) => (
                    <div
                      key={i}
                      className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] items-end rounded-lg border border-slate-200 p-3 bg-slate-50/50"
                    >
                      <Field
                        label="Label tautan"
                        value={l.label}
                        onChange={(v) =>
                          setSettings({
                            ...settings,
                            relatedLinks: settings.relatedLinks.map((item, n) =>
                              n === i ? { ...item, label: v } : item,
                            ),
                          })
                        }
                      />
                      <Field
                        label="Alamat URL (http/https)"
                        value={l.href}
                        onChange={(v) =>
                          setSettings({
                            ...settings,
                            relatedLinks: settings.relatedLinks.map((item, n) =>
                              n === i ? { ...item, href: v } : item,
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
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 h-[38px]"
                      >
                        Hapus
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    + Tambah Tautan
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                  <button className="yellow-button" disabled={save.isPending}>
                    {save.isPending ? "Menyimpan…" : "Simpan Pengaturan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* SECTION 2: HALAMAN PROFIL */}
      {section === "halaman-profil" && (
        <>
          {editingProfileSlug === null ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Daftar Halaman Profil Kelurahan
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Kelola 5 halaman profil resmi kelurahan yang dapat diakses oleh publik.
                  </p>
                </div>
                <Link
                  href="/profil"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                >
                  <ExternalLink size={15} />
                  Lihat Profil Publik
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {slugs.map((s) => {
                  const targetPage = data.pages.find((p) => p.slug === s) ?? {
                    slug: s,
                    title: pageNames[s],
                    content: "",
                    status: "DRAFT",
                  };
                  return (
                    <div
                      key={s}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-slate-400">
                            /{s}
                          </span>
                          {statusBadge(targetPage.status)}
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {pageNames[s]}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {targetPage.content
                            ? targetPage.content.replace(/<[^>]+>/g, "").slice(0, 150)
                            : "Belum ada konten tertulis untuk halaman ini."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <Link
                          href={`/profil#${s}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> Pratinjau
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setPage(targetPage);
                            setEditingProfileSlug(s);
                            setPreview(false);
                          }}
                          className="yellow-button text-xs py-1.5 px-3 min-h-8 inline-flex items-center gap-1.5"
                        >
                          <Pencil size={13} />
                          Ubah Halaman
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <button
                  type="button"
                  onClick={() => setEditingProfileSlug(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Daftar Halaman Profil
                </button>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Mengedit: {pageNames[editingProfileSlug] || editingProfileSlug}
                </span>
              </div>

              <form
                className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
                onSubmit={(e) => {
                  e.preventDefault();
                  const { title, content, status } = page;
                  save.mutate(
                    {
                      path: `/admin/profile/pages/${editingProfileSlug}`,
                      body: { title, content, status },
                    },
                    {
                      onSuccess: () => {
                        setEditingProfileSlug(null);
                      },
                    },
                  );
                }}
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Sunting Halaman {pageNames[editingProfileSlug]}
                  </h2>
                </div>

                <Field
                  label="Judul Halaman"
                  value={page.title}
                  onChange={(v) => setPage({ ...page, title: v })}
                />
                <div>
                  <label className="block font-semibold text-slate-800 text-sm">
                    Isi Halaman Profil
                  </label>
                  <p className="mt-1 mb-2.5 text-xs text-muted">
                    Gunakan editor WYSIWYG untuk menyusun format dokumen resmi
                    (Heading Bab H2/H3, Poin/Daftar, Penomoran, Kutipan, Tebal/Miring,
                    dan Sisip Gambar).
                  </p>
                  <RichEditor
                    key={editingProfileSlug}
                    initial={page.content}
                    onChange={(html) => setPage({ ...page, content: html })}
                    images={mediaList.data?.items ?? []}
                  />
                </div>
                {status(page.status, (v) => setPage({ ...page, status: v }))}
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                  <button className="yellow-button" disabled={save.isPending}>
                    {save.isPending ? "Menyimpan…" : "Simpan Halaman"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfileSlug(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-slate-600 underline hover:text-primary transition-colors ml-auto"
                    onClick={() => setPreview(!preview)}
                  >
                    {preview ? "Sembunyikan pratinjau" : "Lihat pratinjau"}
                  </button>
                </div>
                {preview && (
                  <article className="break-words rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                      Pratinjau Halaman — Status: {page.status}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {page.title}
                    </h3>
                    {page.content.includes("<") ? (
                      <div
                        className="cms-rich text-sm leading-relaxed text-slate-600"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                        {page.content}
                      </p>
                    )}
                  </article>
                )}
              </form>
            </div>
          )}
        </>
      )}

      {/* SECTION 3: APARATUR KELURAHAN */}
      {section === "aparatur" && (
        <>
          {editingOfficialId === null ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Aparatur & Struktur Organisasi
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Kelola nama, jabatan, foto, dan masa tugas aparatur kelurahan ({data.officials.length} terdaftar).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOfficial(blankOfficial());
                    setEditingOfficialId("new");
                  }}
                  className="yellow-button inline-flex min-h-10 items-center gap-2 shrink-0"
                >
                  <Plus size={16} />
                  Tambah Aparatur Baru
                </button>
              </div>

              {data.officials.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                  <Users size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-slate-700">Belum ada aparatur yang ditambahkan</p>
                  <p className="text-xs mt-1">Klik tombol &ldquo;Tambah Aparatur Baru&rdquo; untuk menambahkan data aparatur.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-sm divide-y divide-slate-100">
                    <thead className="bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Aparatur</th>
                        <th className="px-6 py-4">Jabatan & Unit</th>
                        <th className="px-6 py-4">Urutan</th>
                        <th className="px-6 py-4">Status Aktif</th>
                        <th className="px-6 py-4">Publikasi</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.officials
                        .slice()
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative size-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                  {o.photoUrl ? (
                                    <SkeletonImage
                                      src={o.photoUrl}
                                      alt={o.name}
                                      fill
                                      unoptimized
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="grid size-full place-items-center text-xs font-bold text-slate-400">
                                      {o.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block">{o.name}</span>
                                  {o.termStart && (
                                    <span className="text-xs text-slate-400">
                                      Masa tugas: {o.termStart.slice(0, 10)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-medium text-slate-800 block">{o.position || "-"}</span>
                              <span className="text-xs text-slate-500">{o.unit || "-"}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                              {o.sortOrder}
                            </td>
                            <td className="px-6 py-4">
                              {o.active ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                                  Non-aktif
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {statusBadge(o.status)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setOfficial(o);
                                  setEditingOfficialId(o.id);
                                }}
                                className="yellow-button text-xs py-1.5 px-3 min-h-8 inline-flex items-center gap-1.5"
                              >
                                <Pencil size={13} />
                                Ubah
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <button
                  type="button"
                  onClick={() => setEditingOfficialId(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Daftar Aparatur
                </button>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {editingOfficialId === "new" ? "Tambah Aparatur Baru" : `Ubah: ${official.name}`}
                </span>
              </div>

              <form
                className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
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
                    status: officialStatus,
                  } = official;
                  save.mutate(
                    {
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
                        status: officialStatus,
                      },
                    },
                    {
                      onSuccess: () => {
                        setEditingOfficialId(null);
                      },
                    },
                  );
                }}
              >
                <h2 id="aparatur" className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                  {editingOfficialId === "new" ? "Form Tambah Aparatur" : "Form Sunting Aparatur"}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Nama Lengkap & Gelar"
                    value={official.name}
                    onChange={(v) => setOfficial({ ...official, name: v })}
                  />
                  <Field
                    label="Jabatan"
                    value={official.position}
                    onChange={(v) => setOfficial({ ...official, position: v })}
                  />
                  <Field
                    label="Unit Organisasi"
                    value={official.unit}
                    onChange={(v) => setOfficial({ ...official, unit: v })}
                  />
                  <Field
                    label="Nomor Urutan Tampil"
                    type="number"
                    value={String(official.sortOrder)}
                    onChange={(v) =>
                      setOfficial({ ...official, sortOrder: Number(v) })
                    }
                  />
                </div>

                <Media
                  label="Foto aparatur (opsional)"
                  value={official.photoUrl}
                  onChange={(v) => setOfficial({ ...official, photoUrl: v })}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Mulai masa tugas"
                    type="date"
                    value={official.termStart?.slice(0, 10) ?? ""}
                    onChange={(v) =>
                      setOfficial({ ...official, termStart: v || null })
                    }
                  />
                  <Field
                    label="Akhir masa tugas"
                    type="date"
                    value={official.termEnd?.slice(0, 10) ?? ""}
                    onChange={(v) =>
                      setOfficial({ ...official, termEnd: v || null })
                    }
                  />
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    className="size-4 rounded text-primary focus:ring-primary"
                    checked={official.active}
                    onChange={(e) =>
                      setOfficial({ ...official, active: e.target.checked })
                    }
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    Aparatur Masih Aktif Menjabat
                  </span>
                </label>

                {status(official.status, (v) =>
                  setOfficial({ ...official, status: v }),
                )}

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                  <button className="yellow-button" disabled={save.isPending}>
                    {save.isPending ? "Menyimpan…" : "Simpan Aparatur"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOfficialId(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
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
