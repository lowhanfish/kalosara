"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError } from "@/features/cms/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { InfographicPieSvg } from "@/components/admin/admin-icons";
import {
  ChartColumn,
  Pencil,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  Sparkles,
  Coins,
  HeartHandshake,
  Baby,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  communitySections,
  type SectionSlug,
  type CommunitySection,
} from "@/lib/community";

const sectionIcons = {
  anggaran: Coins,
  bansos: HeartHandshake,
  stunting: Baby,
};

function Editor({
  slug,
  initial,
}: {
  slug: SectionSlug;
  initial: CommunitySection | null;
}) {
  const runtime = useAuthRuntime();
  const config = communitySections[slug];
  const Icon = sectionIcons[slug] ?? ChartColumn;

  const [isEditing, setIsEditing] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [form, setForm] = useState<CommunitySection>(
    initial ?? {
      title: config.title,
      content: "",
      period: "",
      source: "",
      status: "DRAFT",
      version: 0,
      metrics: config.metrics.map((label) => ({
        label,
        value: null,
        unit:
          slug === "anggaran"
            ? "Rp"
            : label.startsWith("Program")
              ? "program"
              : label.startsWith("Keluarga")
                ? "keluarga"
                : "orang",
      })),
    },
  );
  const [notice, setNotice] = useState("");
  const save = useMutation({
    mutationFn: () =>
      cmsMutate<{ version: number }>(
        runtime.request,
        `/admin/community/sections/${slug}`,
        form,
      ),
    onSuccess: (result) => {
      setForm((v) => ({ ...v, version: result.version }));
      setNotice(
        "Informasi tersimpan. Status: " +
          (form.status === "PUBLISHED"
            ? "Terbit"
            : form.status === "DRAFT"
              ? "Draft"
              : "Arsip"),
      );
    },
  });

  const statusLabel = {
    PUBLISHED: {
      text: "Terbit di Website",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs",
      dot: "bg-emerald-500",
    },
    DRAFT: {
      text: "Draft (Belum Terbit)",
      badge: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-xs",
      dot: "bg-amber-500",
    },
    ARCHIVED: {
      text: "Arsip (Non-aktif)",
      badge: "bg-slate-100 text-slate-600 border-slate-200 shadow-xs",
      dot: "bg-slate-400",
    },
  }[form.status] ?? {
    text: form.status,
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };

  const formatMetricValue = (val: number | null, unit: string) => {
    if (val === null || val === undefined) return "Belum diisi";
    if (unit === "Rp") {
      return `Rp ${val.toLocaleString("id-ID")}`;
    }
    return `${val.toLocaleString("id-ID")} ${unit}`;
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Hero Card Overview */}
        <div className="glass-card relative overflow-hidden p-6 sm:p-8">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 size-48 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/15 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusLabel.badge}`}
                >
                  <span className={`size-1.5 rounded-full ${statusLabel.dot} animate-pulse`} />
                  {statusLabel.text}
                </span>
                <span className="inline-flex items-center rounded-lg border border-blue-200/70 bg-blue-50/80 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-700">
                  /{slug}
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="glass-icon-box size-11 rounded-2xl">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {form.title}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/70 bg-white/80 px-3 py-1.5 font-semibold text-slate-700 shadow-2xs">
                  <Calendar size={14} className="text-blue-600" />
                  {form.period ? form.period : "Periode belum ditentukan"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/70 bg-white/80 px-3 py-1.5 font-semibold text-slate-700 shadow-2xs">
                  <Building2 size={14} className="text-blue-600" />
                  {form.source ? form.source : "Sumber data belum ditentukan"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={`/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="glass-button-secondary px-4 py-2.5 text-xs"
              >
                <ExternalLink size={16} className="text-blue-600" />
                Buka di Website
              </Link>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Edit Data Infografis"
                aria-label="Edit Data Infografis"
                className="glass-button-primary px-4 py-2.5 text-xs"
              >
                <Pencil size={16} />
                <span>Sunting Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Indikator Metrics Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Indikator & Realisasi Data ({form.metrics.length})
            </h3>
            <span className="text-xs font-semibold text-blue-600">
              Diperbarui sesuai dokumen resmi
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.metrics.map((m, i) => (
              <div
                key={i}
                className="glass-list-card group relative p-5 sm:p-6 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                      Indikator {i + 1}
                    </span>
                    <span className="rounded-lg border border-blue-200/70 bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                      {m.unit}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-2">
                    {m.label}
                  </h4>
                </div>

                <div className="mt-5 pt-3.5 border-t border-blue-100/70">
                  <span className="text-2xl font-black tracking-tight text-slate-900 block">
                    {formatMetricValue(m.value, m.unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Penjelasan Deskriptif */}
        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 border-b border-blue-100/70 pb-3.5">
            <div className="glass-icon-box size-10 rounded-xl">
              <FileText size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Catatan & Narasi Penjelasan
              </h3>
              <p className="text-xs text-slate-500">
                Keterangan tambahan untuk membantu warga memahami data
              </p>
            </div>
          </div>
          {form.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 bg-white/75 p-5 rounded-2xl border border-blue-100/80">
              {form.content}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic py-4">
              Belum ada penjelasan deskriptif yang ditambahkan. Klik &ldquo;Sunting Data&rdquo; untuk melengkapi keterangan.
            </p>
          )}
        </section>

        {notice && (
          <p role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 size={15} />
            {notice}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header in Edit Mode */}
      <div className="glass-toolbar flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
          }}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Ringkasan Infografis
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full">
          <Sparkles size={13} className="text-blue-600" />
          Mode Sunting: {config.title}
        </span>
      </div>

      <form
        className="cms-editor glass-card p-6 sm:p-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setNotice("");
          save.mutate(undefined, {
            onSuccess: () => {
              setIsEditing(false);
            },
          });
        }}
      >
        <div className="border-b border-blue-100/70 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900">{config.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Gunakan data agregat yang sudah diperiksa. Jangan masukkan identitas
            penerima bansos, anak, atau pasien. Nilai kosong berarti belum tersedia.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Judul Bagian Infografis
          </span>
          <input
            className="cms-input"
            required
            maxLength={160}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Periode Data
            </span>
            <input
              className="cms-input"
              required={form.status === "PUBLISHED"}
              maxLength={80}
              placeholder="Contoh: Tahun 2026"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Sumber Data
            </span>
            <input
              className="cms-input"
              required={form.status === "PUBLISHED"}
              maxLength={300}
              placeholder="Contoh: DPA Kelurahan Watundehoa 2026"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Penjelasan & Ringkasan Deskriptif
          </span>
          <textarea
            className="cms-input"
            maxLength={15000}
            rows={5}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </label>
        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
            Kelola Nilai Indikator
          </span>
          <div className="grid gap-4 sm:grid-cols-2">
            {form.metrics.map((m, i) => (
              <fieldset
                key={i}
                className="grid gap-3 rounded-2xl border border-blue-200/70 p-5 bg-white/75 shadow-2xs"
              >
                <legend className="px-2.5 py-0.5 text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200/80 rounded-lg shadow-2xs">
                  Indikator {i + 1}
                </legend>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Nama Indikator</span>
                  <input
                    className="cms-input"
                    required
                    maxLength={100}
                    value={m.label}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metrics: form.metrics.map((n, j) =>
                          j === i ? { ...n, label: e.target.value } : n,
                        ),
                      })
                    }
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Nilai Angka</span>
                    <input
                      className="cms-input"
                      type="number"
                      min={0}
                      max={Number.MAX_SAFE_INTEGER}
                      step={1}
                      value={m.value ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          metrics: form.metrics.map((n, j) =>
                            j === i
                              ? {
                                  ...n,
                                  value:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                }
                              : n,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Satuan</span>
                    <select
                      className="cms-input"
                      value={m.unit}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          metrics: form.metrics.map((n, j) =>
                            j === i
                              ? { ...n, unit: e.target.value as typeof m.unit }
                              : n,
                          ),
                        })
                      }
                    >
                      {["Rp", "orang", "keluarga", "program", "kasus"].map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>
            ))}
          </div>
        </div>
        <label className="block space-y-1.5 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Status Publikasi
          </span>
          <select
            className="cms-input"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as CommunitySection["status"],
              })
            }
          >
            <option value="DRAFT">Draft — Belum ditampilkan di website publik</option>
            <option value="PUBLISHED">Terbit — Ditampilkan di halaman /{slug}</option>
            <option value="ARCHIVED">Arsip — Dinonaktifkan</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-blue-100/70">
          <button
            className="glass-button-primary px-6 py-2.5 text-sm disabled:opacity-50"
            disabled={save.isPending}
          >
            {save.isPending ? "Menyimpan…" : "Simpan Informasi"}
          </button>
          <button
            type="button"
            onClick={() => setLivePreview(!livePreview)}
            className={`px-4 py-2.5 text-xs ${
              livePreview
                ? "glass-button-primary"
                : "glass-button-secondary"
            }`}
          >
            {livePreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {livePreview ? "Tutup Pratinjau" : "Pratinjau Infografis"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="glass-button-secondary px-5 py-2.5 text-sm"
          >
            Batal
          </button>
          {save.isError && (
            <p role="alert" className="text-xs text-red-600 font-medium">
              {cmsError(save.error)} Muat ulang halaman jika versi data telah berubah.
            </p>
          )}
          {notice && (
            <p role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 size={15} />
              {notice}
            </p>
          )}
        </div>
      </form>
      {livePreview && (
        <article className="glass-card overflow-hidden p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100/70 pb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700">
              <Eye size={13} /> Pratinjau Langsung &mdash; Status: {form.status}
            </span>
            <button
              type="button"
              onClick={() => setLivePreview(false)}
              className="text-xs text-slate-500 hover:text-blue-700 font-bold"
            >
              Tutup Pratinjau &times;
            </button>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {form.title || "(Judul infografis)"}
          </h2>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span>Periode: {form.period || "-"}</span>
            <span>&bull;</span>
            <span>Sumber: {form.source || "-"}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
            {form.metrics.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border border-blue-200/70 p-4 bg-white/80"
              >
                <span className="text-[11px] font-bold uppercase text-blue-600 block">
                  {m.label}
                </span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {formatMetricValue(m.value, m.unit)}
                </span>
              </div>
            ))}
          </div>
          {form.content && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 bg-white/80 p-4 rounded-xl border border-blue-100/80">
              {form.content}
            </p>
          )}
        </article>
      )}
    </div>
  );
}

export default function SectionWorkspace() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [slug, setSlug] = useState<SectionSlug>("anggaran");
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (Object.hasOwn(communitySections, hash)) setSlug(hash as SectionSlug);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const data = useQuery({
    queryKey: ["user", auth.user?.id, "community-section", slug],
    enabled: auth.user?.role === "ADMIN_KELURAHAN",
    queryFn: () =>
      runtime.request<{ section: CommunitySection | null }>(
        `/admin/community/sections/${slug}`,
      ),
  });
  return (
    <main id="konten" className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Infografis & Program"
        description="Kelola data transparansi anggaran, bantuan sosial, dan penanganan stunting pada portal publik."
        icon={InfographicPieSvg}
      />
      {auth.user?.role !== "ADMIN_KELURAHAN" ? (
        <div role="alert" className="glass-card p-6 text-sm font-semibold text-amber-800 border-amber-200/80 bg-amber-50/75">
          Bagian ini khusus administrator.
        </div>
      ) : (
        <>
          <nav className="cms-channel-tabs" aria-label="Bagian infografis">
            {Object.entries(communitySections).map(([key, c]) => (
              <button
                key={key}
                aria-pressed={slug === key}
                onClick={() => {
                  if (key === slug) return;
                  if (
                    window.confirm(
                      "Pastikan perubahan sudah disimpan sebelum berpindah. Lanjutkan?",
                    )
                  ) {
                    window.location.hash = key;
                    setSlug(key as SectionSlug);
                  }
                }}
              >
                {c.title}
              </button>
            ))}
          </nav>
          {data.isPending && <AdminLoading variant="cards" />}
          {data.isError && (
            <AdminError
              error={data.error}
              onRetry={() => void data.refetch()}
            />
          )}
          {data.data && (
            <Editor key={slug} slug={slug} initial={data.data.section} />
          )}
        </>
      )}
    </main>
  );
}
