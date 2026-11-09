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
    <div className="space-y-3 rounded-2xl border border-slate-200/90 p-5 bg-white shadow-2xs">
      <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
      </span>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-500 block">
          Pilih dari aset bawaan kelurahan
          <select
            className="cms-input mt-1.5"
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
        <label className="text-xs text-slate-500 block">
          Cari dari pustaka media publik
          <input
            className="cms-input mt-1.5"
            placeholder="Ketik kata kunci media…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {query.data && query.data.items.length > 0 && (
        <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2 bg-slate-50 space-y-1">
          {query.data.items.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`block w-full text-left truncate rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                value === `/media/${m.id}`
                  ? "bg-slate-900 text-white font-semibold"
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
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-3 bg-slate-50/80">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 border border-slate-300">
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
              className="text-red-600 hover:underline mt-1.5 inline-block font-semibold"
            >
              Hapus gambar
            </button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        Maksimal 50 hasil media publik.{" "}
        <Link className="underline hover:text-slate-700" href="/admin/berita">
          Kelola pustaka media &rarr;
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
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 size-40 rounded-full bg-gradient-to-br from-blue-50/60 to-slate-100/50 blur-2xl pointer-events-none" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-600">
                        Identitas Resmi
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {settings.name || "Kelurahan Watundehoa"}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-500">
                      Konfigurasi identitas wilayah, nomor kontak darurat, jam kerja pelayanan, titik koordinat peta, dan tautan luar.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <Link
                      href="/kontak"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink size={16} className="text-slate-400" />
                      Buka Kontak Publik
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsEditingSettings(true)}
                      title="Edit Pengaturan Website"
                      aria-label="Edit Pengaturan Website"
                      className="inline-flex size-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all"
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Cards Identitas & Kontak */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Info Identitas Wilayah */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <Building2 size={18} />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Wilayah Pemerintahan
                    </h3>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <dt className="text-slate-500">Kelurahan</dt>
                    <dd className="col-span-2 font-semibold text-slate-900">
                      {settings.name || "-"}
                    </dd>
                    <dt className="text-slate-500">Kecamatan</dt>
                    <dd className="col-span-2 font-medium text-slate-800">
                      {settings.district || "-"}
                    </dd>
                    <dt className="text-slate-500">Kabupaten</dt>
                    <dd className="col-span-2 font-medium text-slate-800">
                      {settings.regency || "-"}
                    </dd>
                    <dt className="text-slate-500">Alamat Kantor</dt>
                    <dd className="col-span-2 font-medium text-slate-800 leading-snug">
                      {settings.address || "-"}
                    </dd>
                  </dl>
                </div>

                {/* Info Kontak & Operasional */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Phone size={18} />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Kontak & Lokasi Kantor
                    </h3>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <dt className="text-slate-500">Telepon / WA</dt>
                    <dd className="col-span-2 font-semibold text-slate-900">
                      {settings.phone || "-"}
                    </dd>
                    <dt className="text-slate-500">Email Resmi</dt>
                    <dd className="col-span-2 font-medium text-slate-800">
                      {settings.email || "-"}
                    </dd>
                    <dt className="text-slate-500">Jam Layanan</dt>
                    <dd className="col-span-2 font-medium text-slate-800">
                      {settings.hours || "-"}
                    </dd>
                    <dt className="text-slate-500">Koordinat Peta</dt>
                    <dd className="col-span-2 font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block w-fit">
                      {settings.latitude && settings.longitude
                        ? `${settings.latitude}, ${settings.longitude}`
                        : "Belum disetel"}
                    </dd>
                  </dl>
                </div>
              </div>

              {/* Media Logo & Hero Preview */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ImageIcon size={18} className="text-slate-400" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">
                      Logo Kelurahan
                    </h4>
                  </div>
                  {settings.logoUrl ? (
                    <div className="relative h-28 w-28 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center p-2">
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

                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ImageIcon size={18} className="text-slate-400" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">
                      Banner Beranda Utama
                    </h4>
                  </div>
                  {settings.heroUrl ? (
                    <div className="relative h-28 w-full rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
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
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Globe size={18} className="text-slate-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Tautan Eksternal & Jejaring ({settings.relatedLinks.length})
                  </h3>
                </div>
                {settings.relatedLinks.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {settings.relatedLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3 bg-slate-50/50"
                      >
                        <span className="font-semibold text-slate-800 text-sm">
                          {link.label || "(Tanpa label)"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
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
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Ringkasan
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  <Sparkles size={13} className="text-amber-500" />
                  Mode Pengeditan Pengaturan
                </span>
              </div>

              <form
                className="admin-settings-form space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs"
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
                <div className="border-b border-slate-100 pb-4">
                  <h2
                    id="pengaturan"
                    className="text-xl font-bold text-slate-900"
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
                  />
                  <Media
                    label="Gambar beranda utama"
                    value={settings.heroUrl}
                    onChange={(v) => setSettings({ ...settings, heroUrl: v })}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
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
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      + Tambah Baris
                    </button>
                  </div>

                  {settings.relatedLinks.map((l, i) => (
                    <div
                      key={i}
                      className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] items-end rounded-xl border border-slate-200 p-4 bg-slate-50/50"
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
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 h-[42px] transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all disabled:opacity-50"
                    disabled={save.isPending}
                  >
                    {save.isPending ? "Menyimpan…" : "Simpan Pengaturan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(false)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Halaman Profil Kelurahan
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Kelola 5 naskah dan dokumen resmi kelurahan yang disajikan untuk masyarakat dan arsip publik.
                    </p>
                  </div>
                  <Link
                    href="/profil"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0"
                  >
                    <ExternalLink size={16} className="text-slate-400" />
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
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <Icon size={19} />
                          </div>
                          {statusBadge(targetPage.status)}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {meta.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {meta.desc}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50/70 p-3 border border-slate-100 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {targetPage.content
                            ? targetPage.content
                                .replace(/<[^>]+>/g, " ")
                                .trim()
                                .slice(0, 160)
                            : "Belum ada materi konten yang ditulis."}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
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
                          title={`Edit ${meta.name}`}
                          aria-label={`Edit ${meta.name}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => setEditingProfileSlug(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Daftar Halaman
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  <Sparkles size={13} className="text-amber-500" />
                  Mengedit: {pageMetadata[editingProfileSlug]?.name}
                </span>
              </div>

              <form
                className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs"
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
                  <h2 className="text-xl font-bold text-slate-900">
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
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all disabled:opacity-50"
                    disabled={save.isPending}
                  >
                    {save.isPending ? "Menyimpan…" : "Simpan Halaman"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfileSlug(null)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(!preview)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ml-auto ${
                      preview
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50"
                    }`}
                  >
                    {preview ? <EyeOff size={16} /> : <Eye size={16} />}
                    {preview ? "Tutup Pratinjau" : "Pratinjau Halaman"}
                  </button>
                </div>
                {preview && (
                  <article className="break-words rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
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
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Aparatur & Struktur Organisasi
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Kelola profil kepemimpinan lurah, sekretaris, kepala seksi, dan staf kelurahan ({data.officials.length} terdaftar).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficial(blankOfficial());
                      setEditingOfficialId("new");
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all shrink-0"
                  >
                    <Plus size={16} />
                    Tambah Aparatur Baru
                  </button>
                </div>
              </div>

              {data.officials.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center text-slate-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-base font-bold text-slate-800">Belum ada aparatur yang ditambahkan</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Data aparatur akan ditampilkan pada bagan organisasi dan laman profil publik kelurahan.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <table className="w-full text-left text-sm divide-y divide-slate-100">
                    <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                          <tr
                            key={o.id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3.5">
                                <div className="relative size-11 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                                  {o.photoUrl ? (
                                    <SkeletonImage
                                      src={o.photoUrl}
                                      alt={o.name}
                                      fill
                                      unoptimized
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="grid size-full place-items-center text-xs font-extrabold text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
                                      {o.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block text-[15px]">
                                    {o.name}
                                  </span>
                                  {o.termStart && (
                                    <span className="text-xs text-slate-400">
                                      Masa tugas: {o.termStart.slice(0, 10)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-800 block">
                                {o.position || "-"}
                              </span>
                              <span className="text-xs text-slate-500">
                                {o.unit || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                                #{o.sortOrder}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {o.active ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
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
                                title={`Edit aparatur ${o.name}`}
                                aria-label={`Edit aparatur ${o.name}`}
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition-all"
                              >
                                <Pencil size={14} />
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
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => setEditingOfficialId(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Daftar Aparatur
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  <Sparkles size={13} className="text-amber-500" />
                  {editingOfficialId === "new"
                    ? "Tambah Aparatur Baru"
                    : `Ubah: ${official.name}`}
                </span>
              </div>

              <form
                className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs"
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
                <div className="border-b border-slate-100 pb-4">
                  <h2
                    id="aparatur"
                    className="text-xl font-bold text-slate-900"
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
                    className="size-4 rounded text-slate-900 focus:ring-slate-900"
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
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all disabled:opacity-50"
                    disabled={save.isPending}
                  >
                    {save.isPending ? "Menyimpan…" : "Simpan Aparatur"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOfficialId(null)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
