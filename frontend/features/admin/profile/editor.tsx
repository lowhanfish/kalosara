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
  Building2,
  Phone,
  Users,
  Sparkles,
  BookOpen,
  Target,
  Briefcase,
  Network,
  MessageSquare,
  Globe,
  ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";

const http = createHttpClient();
import { ImageUploadField } from "@/components/admin/image-upload-field";

const slugs = [
  "sejarah",
  "visi-misi",
  "tugas-fungsi",
  "struktur-organisasi",
  "sambutan-lurah",
];

const pageMetadata: Record<
  string,
  { name: string; desc: string; icon: typeof BookOpen }
> = {
  sejarah: {
    name: "Sejarah Kelurahan",
    desc: "Asal-usul, tokoh pendiri, dan riwayat perkembangan wilayah Watundehoa.",
    icon: BookOpen,
  },
  "visi-misi": {
    name: "Visi dan Misi",
    desc: "Arah pembangunan strategis, tujuan utama, dan program prioritas kelurahan.",
    icon: Target,
  },
  "tugas-fungsi": {
    name: "Tugas Pokok & Fungsi",
    desc: "Landasan hukum ketugasan, kewenangan lurah, dan pelayanan publik.",
    icon: Briefcase,
  },
  "struktur-organisasi": {
    name: "Bagan Struktur Organisasi",
    desc: "Bagan tata kelola kelembagaan, seksi pemerintahan, dan aparatur.",
    icon: Network,
  },
  "sambutan-lurah": {
    name: "Sambutan Lurah",
    desc: "Pesan resmi kepemimpinan lurah aktif untuk menyapa warga dan pengunjung.",
    icon: MessageSquare,
  },
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
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </span>
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
  source = "profile",
  aspectRatio = "video",
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  source?: "profile" | "settings" | "officials";
  aspectRatio?: "square" | "video" | "wide" | "portrait";
}) {
  return (
    <ImageUploadField
      label={label}
      value={value}
      onChange={onChange}
      source={source}
      aspectRatio={aspectRatio}
    />
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

  const [editingProfileSlug, setEditingProfileSlug] = useState<string | null>(
    null,
  );
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
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(
    null,
  );
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
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
        Status Publikasi
      </span>
      <select
        className="cms-input"
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Terbit
        </span>
      );
    }
    if (s === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" /> Draft
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
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
              {/* Header Hero */}
              <div className="glass-card relative overflow-hidden p-6 sm:p-8">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 size-48 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/15 blur-2xl pointer-events-none" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-700">
                        Identitas Resmi
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                      {settings.name || "Kelurahan Watundehoa"}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Konfigurasi identitas wilayah, nomor kontak darurat, jam kerja pelayanan, titik koordinat peta, dan tautan luar.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <Link
                      href="/kontak"
                      target="_blank"
                      rel="noreferrer"
                      className="glass-button-secondary px-4 py-2.5 text-xs"
                    >
                      <ExternalLink size={16} className="text-blue-600" />
                      Buka Kontak Publik
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsEditingSettings(true)}
                      title="Edit Pengaturan Website"
                      aria-label="Edit Pengaturan Website"
                      className="glass-button-primary px-4 py-2.5 text-xs"
                    >
                      <Pencil size={16} />
                      <span>Sunting Identitas</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Cards Identitas & Kontak */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Info Identitas Wilayah */}
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-blue-100/70 pb-3.5">
                    <div className="glass-icon-box size-10 rounded-xl">
                      <Building2 size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                        Wilayah Pemerintahan
                      </h3>
                      <p className="text-[11px] text-slate-500">Nomenklatur resmi daerah</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <dt className="text-slate-500">Kelurahan</dt>
                    <dd className="col-span-2 font-bold text-slate-900">
                      {settings.name || "-"}
                    </dd>
                    <dt className="text-slate-500">Kecamatan</dt>
                    <dd className="col-span-2 font-semibold text-slate-800">
                      {settings.district || "-"}
                    </dd>
                    <dt className="text-slate-500">Kabupaten</dt>
                    <dd className="col-span-2 font-semibold text-slate-800">
                      {settings.regency || "-"}
                    </dd>
                    <dt className="text-slate-500">Alamat Kantor</dt>
                    <dd className="col-span-2 font-medium text-slate-800 leading-snug">
                      {settings.address || "-"}
                    </dd>
                  </dl>
                </div>

                {/* Info Kontak & Operasional */}
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-blue-100/70 pb-3.5">
                    <div className="glass-icon-box size-10 rounded-xl">
                      <Phone size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                        Kontak & Lokasi Kantor
                      </h3>
                      <p className="text-[11px] text-slate-500">Saluran layanan masyarakat</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <dt className="text-slate-500">Telepon / WA</dt>
                    <dd className="col-span-2 font-bold text-slate-900">
                      {settings.phone || "-"}
                    </dd>
                    <dt className="text-slate-500">Email Resmi</dt>
                    <dd className="col-span-2 font-semibold text-slate-800">
                      {settings.email || "-"}
                    </dd>
                    <dt className="text-slate-500">Jam Layanan</dt>
                    <dd className="col-span-2 font-semibold text-slate-800">
                      {settings.hours || "-"}
                    </dd>
                    <dt className="text-slate-500">Koordinat Peta</dt>
                    <dd className="col-span-2 font-mono text-xs font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/60 px-2.5 py-1 rounded-lg inline-block w-fit">
                      {settings.latitude && settings.longitude
                        ? `${settings.latitude}, ${settings.longitude}`
                        : "Belum disetel"}
                    </dd>
                  </dl>
                </div>
              </div>

              {/* Media Logo & Hero Preview */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-card p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-slate-800">
                    <div className="glass-icon-box size-9 rounded-xl">
                      <ImageIcon size={18} strokeWidth={2} />
                    </div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider">
                      Logo Kelurahan
                    </h4>
                  </div>
                  {settings.logoUrl ? (
                    <div className="relative h-28 w-28 rounded-2xl border border-blue-200/70 bg-white/80 overflow-hidden flex items-center justify-center p-2 shadow-xs">
                      <SkeletonImage
                        src={settings.logoUrl}
                        alt="Logo"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada logo terpasang.</p>
                  )}
                </div>

                <div className="glass-card p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-slate-800">
                    <div className="glass-icon-box size-9 rounded-xl">
                      <ImageIcon size={18} strokeWidth={2} />
                    </div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider">
                      Banner Beranda Utama
                    </h4>
                  </div>
                  {settings.heroUrl ? (
                    <div className="relative h-28 w-full rounded-2xl border border-blue-200/70 bg-white/80 overflow-hidden shadow-xs">
                      <SkeletonImage
                        src={settings.heroUrl}
                        alt="Hero Banner"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada gambar hero terpasang.</p>
                  )}
                </div>
              </div>

              {/* Tautan Terkait */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-blue-100/70 pb-3">
                  <div className="glass-icon-box size-9 rounded-xl">
                    <Globe size={18} strokeWidth={2} />
                  </div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                    Tautan Eksternal & Jejaring ({settings.relatedLinks.length})
                  </h3>
                </div>
                {settings.relatedLinks.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {settings.relatedLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-blue-200/60 p-3.5 bg-white/75 shadow-2xs"
                      >
                        <span className="font-bold text-slate-800 text-sm">
                          {link.label || "(Tanpa label)"}
                        </span>
                        <span className="text-xs text-blue-600 font-mono truncate max-w-[200px]">
                          {link.href}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada tautan terkait yang ditambahkan.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-toolbar flex items-center justify-between p-4">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Ringkasan
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full">
                  <Sparkles size={13} className="text-blue-600" />
                  Mode Pengeditan Pengaturan
                </span>
              </div>

              <form
                className="admin-settings-form glass-card space-y-6 p-6 sm:p-8"
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
                <div className="border-b border-blue-100/70 pb-4">
                  <h2
                    id="pengaturan"
                    className="text-xl font-extrabold text-slate-900"
                  >
                    Form Pengaturan Website
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Pastikan nama dan nomor kontak sesuai dengan data pemerintah kelurahan.
                  </p>
                </div>

                <div className="admin-settings-fields">
                  {(
                    [
                      ["name", "Nama kelurahan"],
                      ["district", "Kecamatan"],
                      ["regency", "Kabupaten"],
                      ["address", "Alamat kantor"],
                      ["phone", "Telepon / WhatsApp"],
                      ["email", "Email resmi"],
                      ["hours", "Jam operasional"],
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
                    label="Latitude (Garis Lintang)"
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
                    label="Longitude (Garis Bujur)"
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

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <Media
                    label="Logo kelurahan"
                    value={settings.logoUrl}
                    onChange={(v) => setSettings({ ...settings, logoUrl: v })}
                    source="settings"
                    aspectRatio="square"
                  />
                  <Media
                    label="Gambar beranda utama"
                    value={settings.heroUrl}
                    onChange={(v) => setSettings({ ...settings, heroUrl: v })}
                    source="profile"
                    aspectRatio="wide"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-blue-100/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                        Tautan Terkait Eksternal
                      </h3>
                      <p className="text-xs text-slate-500">Maksimal 10 tautan rujukan untuk publik.</p>
                    </div>
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
                      className="glass-button-secondary px-3.5 py-1.5 text-xs"
                    >
                      + Tambah Baris
                    </button>
                  </div>

                  {settings.relatedLinks.map((l, i) => (
                    <div
                      key={i}
                      className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] items-end rounded-2xl border border-blue-200/70 p-4 bg-white/75"
                    >
                      <Field
                        label="Label Tautan"
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
                        className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 h-[42px] transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-blue-100/70">
                  <button
                    className="glass-button-primary px-6 py-2.5 text-sm disabled:opacity-50"
                    disabled={save.isPending}
                  >
                    {save.isPending ? "Menyimpan…" : "Simpan Pengaturan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(false)}
                    className="glass-button-secondary px-5 py-2.5 text-sm"
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
              <div className="glass-card relative overflow-hidden p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                      Halaman Profil Kelurahan
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Kelola 5 naskah dan dokumen resmi kelurahan yang disajikan untuk masyarakat dan arsip publik.
                    </p>
                  </div>
                  <Link
                    href="/profil"
                    target="_blank"
                    rel="noreferrer"
                    className="glass-button-secondary px-4 py-2.5 text-xs shrink-0"
                  >
                    <ExternalLink size={16} className="text-blue-600" />
                    Buka Profil Publik
                  </Link>
                </div>
              </div>

              {/* Grid 5 Official Profile Pages */}
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {slugs.map((s) => {
                  const meta = pageMetadata[s];
                  const Icon = meta.icon;
                  const targetPage = data.pages.find((p) => p.slug === s) ?? {
                    slug: s,
                    title: meta.name,
                    content: "",
                    status: "DRAFT",
                  };
                  return (
                    <div
                      key={s}
                      className="glass-list-card group relative flex flex-col justify-between p-6"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="glass-icon-box size-11 rounded-2xl">
                            <Icon size={20} strokeWidth={2} />
                          </div>
                          {statusBadge(targetPage.status)}
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {meta.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {meta.desc}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/75 p-3.5 border border-blue-100/80 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {targetPage.content
                            ? targetPage.content
                                .replace(/<[^>]+>/g, " ")
                                .trim()
                                .slice(0, 160)
                            : "Belum ada materi konten yang ditulis."}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-blue-100/70">
                        <Link
                          href={`/profil#${s}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
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
                          title={`Edit ${meta.name}`}
                          aria-label={`Edit ${meta.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-xl border border-blue-200/80 bg-white/90 text-blue-600 shadow-2xs hover:bg-blue-50 hover:text-blue-800 transition-all"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-toolbar flex items-center justify-between p-4">
                <button
                  type="button"
                  onClick={() => setEditingProfileSlug(null)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Daftar Halaman
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full">
                  <Sparkles size={13} className="text-blue-600" />
                  Mengedit: {pageMetadata[editingProfileSlug]?.name}
                </span>
              </div>

              <form
                className="glass-card space-y-6 p-6 sm:p-8"
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
                <div className="border-b border-blue-100/70 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Sunting Naskah {pageMetadata[editingProfileSlug]?.name}
                  </h2>
                </div>

                <Field
                  label="Judul Halaman"
                  value={page.title}
                  onChange={(v) => setPage({ ...page, title: v })}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Isi Halaman Profil Dokumen
                  </label>
                  <p className="text-xs text-slate-500">
                    Gunakan editor WYSIWYG untuk menyusun format dokumen resmi
                    (Heading Bab H2/H3, Poin/Daftar, Penomoran, Kutipan, Tebal/Miring,
                    dan Sisip Gambar).
                  </p>
                  <div className="pt-2">
                    <RichEditor
                      key={editingProfileSlug}
                      initial={page.content}
                      onChange={(html) => setPage({ ...page, content: html })}
                      images={mediaList.data?.items ?? []}
                    />
                  </div>
                </div>
                {status(page.status, (v) => setPage({ ...page, status: v }))}
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-blue-100/70">
                  <button
                    className="glass-button-primary px-6 py-2.5 text-sm disabled:opacity-50"
                    disabled={save.isPending}
                  >
                    {save.isPending ? "Menyimpan…" : "Simpan Halaman"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfileSlug(null)}
                    className="glass-button-secondary px-5 py-2.5 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(!preview)}
                    className={`ml-auto px-4 py-2.5 text-xs ${
                      preview
                        ? "glass-button-primary"
                        : "glass-button-secondary"
                    }`}
                  >
                    {preview ? <EyeOff size={16} /> : <Eye size={16} />}
                    {preview ? "Tutup Pratinjau" : "Pratinjau Halaman"}
                  </button>
                </div>
                {preview && (
                  <article className="glass-card break-words p-6 sm:p-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-2">
                      Pratinjau Halaman — Status: {page.status}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-3">
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
              <div className="glass-card relative overflow-hidden p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                      Aparatur & Struktur Organisasi
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Kelola profil kepemimpinan lurah, sekretaris, kepala seksi, dan staf kelurahan ({data.officials.length} terdaftar).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficial(blankOfficial());
                      setEditingOfficialId("new");
                    }}
                    className="glass-button-primary px-5 py-2.5 text-xs shrink-0"
                  >
                    <Plus size={16} />
                    Tambah Aparatur Baru
                  </button>
                </div>
              </div>

              {data.officials.length === 0 ? (
                <div className="glass-card p-16 text-center text-slate-400">
                  <Users size={40} className="mx-auto mb-3 opacity-40 text-blue-500" />
                  <p className="text-base font-extrabold text-slate-800">Belum ada aparatur yang ditambahkan</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Data aparatur akan ditampilkan pada bagan organisasi dan laman profil publik kelurahan.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {data.officials
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((o) => (
                      <div
                        key={o.id}
                        className="glass-list-card flex items-center justify-between p-4 sm:p-5 gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative size-14 rounded-2xl overflow-hidden bg-blue-50 border border-blue-200/80 shrink-0 shadow-xs">
                            {o.photoUrl ? (
                              <SkeletonImage
                                src={o.photoUrl}
                                alt={o.name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="grid size-full place-items-center text-sm font-black text-blue-700 bg-gradient-to-br from-blue-100 to-indigo-100">
                                {o.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                                #{o.sortOrder}
                              </span>
                              <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                                {o.name}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-blue-700 truncate">
                              {o.position || "-"} · <span className="font-medium text-slate-500">{o.unit || "-"}</span>
                            </p>
                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                              {o.active ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                  Non-aktif
                                </span>
                              )}
                              {statusBadge(o.status)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOfficial(o);
                            setEditingOfficialId(o.id);
                          }}
                          title={`Edit aparatur ${o.name}`}
                          aria-label={`Edit aparatur ${o.name}`}
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-white/90 text-blue-600 shadow-2xs hover:bg-blue-50 hover:text-blue-800 transition-all"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-toolbar flex items-center justify-between p-4">
                <button
                  type="button"
                  onClick={() => setEditingOfficialId(null)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Daftar Aparatur
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full">
                  <Sparkles size={13} className="text-blue-600" />
                  {editingOfficialId === "new"
                    ? "Tambah Aparatur Baru"
                    : `Ubah: ${official.name}`}
                </span>
              </div>

              <form
                className="glass-card space-y-6 p-6 sm:p-8"
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
                <div className="border-b border-blue-100/70 pb-4">
                  <h2
                    id="aparatur"
                    className="text-xl font-extrabold text-slate-900"
                  >
                    {editingOfficialId === "new"
                      ? "Form Tambah Aparatur"
                      : "Form Sunting Aparatur"}
                  </h2>
                </div>

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
                    label="Nomor Urutan Tampil (Bagan)"
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
                  source="officials"
                  aspectRatio="portrait"
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

                <label className="inline-flex items-center gap-2.5 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    className="size-4 rounded text-blue-600 focus:ring-blue-600"
                    checked={official.active}
                    onChange={(e) =>
                      setOfficial({ ...official, active: e.target.checked })
                    }
                  />
                  <span className="text-sm font-bold text-slate-800">
                    Aparatur Masih Aktif Menjabat
                  </span>
                </label>

                {status(official.status, (v) =>
                  setOfficial({ ...official, status: v }),
                )}

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-blue-100/70">
                  <button
                    className="glass-button-primary px-6 py-2.5 text-sm disabled:opacity-50"
                    disabled={save.isPending}
                  >
                    {save.isPending ? "Menyimpan…" : "Simpan Aparatur"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOfficialId(null)}
                    className="glass-button-secondary px-5 py-2.5 text-sm"
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
