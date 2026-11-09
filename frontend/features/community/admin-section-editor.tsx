"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError } from "@/features/cms/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 size-40 rounded-full bg-gradient-to-br from-emerald-50/60 to-blue-50/40 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusLabel.badge}`}
                >
                  <span className={`size-1.5 rounded-full ${statusLabel.dot} animate-pulse`} />
                  {statusLabel.text}
                </span>
                <span className="inline-flex items-center rounded-md bg-slate-100/80 px-2.5 py-0.5 font-mono text-xs text-slate-500">
                  /{slug}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white shrink-0 shadow-xs">
                  <Icon size={20} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {form.title}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 font-medium">
                  <Calendar size={14} className="text-slate-400" />
                  {form.period ? form.period : "Periode belum ditentukan"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 font-medium">
                  <Building2 size={14} className="text-slate-400" />
                  {form.source ? form.source : "Sumber data belum ditentukan"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={`/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <ExternalLink size={16} className="text-slate-400" />
                Buka di Website
              </Link>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Edit Data Infografis"
                aria-label="Edit Data Infografis"
                className="inline-flex size-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all"
              >
                <Pencil size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Indikator Metrics Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Indikator & Realisasi Data ({form.metrics.length})
            </h3>
            <span className="text-xs text-slate-400">
              Diperbarui sesuai dokumen resmi
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.metrics.map((m, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Indikator {i + 1}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {m.unit}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 line-clamp-2">
                    {m.label}
                  </h4>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900 block">
                    {formatMetricValue(m.value, m.unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Penjelasan Deskriptif */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Catatan & Narasi Penjelasan
              </h3>
              <p className="text-xs text-slate-400">
                Keterangan tambahan untuk membantu warga memahami data
              </p>
            </div>
          </div>
          {form.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 bg-slate-50/60 p-5 rounded-xl border border-slate-100">
              {form.content}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic py-4">
              Belum ada penjelasan deskriptif yang ditambahkan. Klik &ldquo;Ubah Data Infografis&rdquo; untuk melengkapi keterangan.
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
      <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Ringkasan Infografis
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
          <Sparkles size={13} className="text-amber-500" />
          Mode Sunting: {config.title}
        </span>
      </div>

      <form
        className="cms-editor rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6"
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
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">{config.title}</h2>
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
                className="grid gap-3 rounded-xl border border-slate-200/90 p-5 bg-slate-50/50 shadow-2xs"
              >
                <legend className="px-2.5 py-0.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-md shadow-2xs">
                  Indikator {i + 1}
                </legend>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600">Nama Indikator</span>
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
                    <span className="text-xs font-medium text-slate-600">Nilai Angka</span>
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
                    <span className="text-xs font-medium text-slate-600">Satuan</span>
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
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all disabled:opacity-50"
            disabled={save.isPending}
          >
            {save.isPending ? "Menyimpan…" : "Simpan Informasi"}
          </button>
          <button
            type="button"
            onClick={() => setLivePreview(!livePreview)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
              livePreview
                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50"
            }`}
          >
            {livePreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {livePreview ? "Tutup Pratinjau" : "Pratinjau Infografis"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
        <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
              <Eye size={13} /> Pratinjau Langsung &mdash; Status: {form.status}
            </span>
            <button
              type="button"
              onClick={() => setLivePreview(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium"
            >
              Tutup Pratinjau &times;
            </button>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
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
                className="rounded-xl border border-slate-200 p-4 bg-slate-50/50"
              >
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                  {m.label}
                </span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {formatMetricValue(m.value, m.unit)}
                </span>
              </div>
            ))}
          </div>
          {form.content && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
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
    <main id="konten">
      <AdminPageHeader
        title="Infografis & program"
        description="Kelola data anggaran, bantuan sosial, dan stunting yang ditampilkan pada website."
        icon={ChartColumn}
      />
      {auth.user?.role !== "ADMIN_KELURAHAN" ? (
        <p role="alert">Bagian ini khusus administrator.</p>
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
          {data.isPending && <AdminLoading />}
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
