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
} from "lucide-react";
import {
  communitySections,
  type SectionSlug,
  type CommunitySection,
} from "@/lib/community";

function Editor({
  slug,
  initial,
}: {
  slug: SectionSlug;
  initial: CommunitySection | null;
}) {
  const runtime = useAuthRuntime();
  const config = communitySections[slug];
  const [isEditing, setIsEditing] = useState(false);
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
      text: "Terbit",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    DRAFT: {
      text: "Draft (Belum Terbit)",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    ARCHIVED: {
      text: "Arsip",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
    },
  }[form.status] ?? {
    text: form.status,
    badge: "bg-slate-100 text-slate-700 border-slate-200",
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${statusLabel.badge}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {statusLabel.text}
              </span>
              <span className="text-xs text-slate-500 font-mono">/{slug}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{form.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                {form.period ? form.period : "Periode belum ditentukan"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" />
                {form.source ? form.source : "Sumber belum ditentukan"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink size={15} />
              Lihat di Website
            </Link>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="yellow-button inline-flex min-h-10 items-center gap-2"
            >
              <Pencil size={15} />
              Ubah Data Infografis
            </button>
          </div>
        </div>

        {/* Indikator Metrics Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Daftar Indikator yang Ditampilkan
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.metrics.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
              >
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {m.label}
                </span>
                <div className="mt-3">
                  <span className="text-xl font-bold text-slate-900">
                    {formatMetricValue(m.value, m.unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Penjelasan Deskriptif */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText size={18} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">
              Penjelasan & Catatan Informasi
            </h3>
          </div>
          {form.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {form.content}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">
              Belum ada penjelasan deskriptif yang ditambahkan.
            </p>
          )}
        </section>

        {notice && (
          <p role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 size={14} />
            {notice}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Ringkasan Infografis
        </button>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Mode Pengeditan
        </span>
      </div>

      <form
        className="cms-editor rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6"
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
          <h2 className="text-lg font-bold text-slate-900">{config.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Gunakan data agregat yang sudah diperiksa. Jangan masukkan identitas
            penerima bansos, anak, atau pasien. Nilai kosong berarti belum tersedia.
          </p>
        </div>

        <label>
          Judul
          <input
            className="cms-input"
            required
            maxLength={160}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            Periode
            <input
              className="cms-input"
              required={form.status === "PUBLISHED"}
              maxLength={80}
              placeholder="Contoh: Tahun 2026"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            />
          </label>
          <label>
            Sumber data
            <input
              className="cms-input"
              required={form.status === "PUBLISHED"}
              maxLength={300}
              placeholder="Contoh: Dokumen APBD Kelurahan"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </label>
        </div>
        <label>
          Penjelasan
          <textarea
            className="cms-input"
            maxLength={15000}
            rows={5}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {form.metrics.map((m, i) => (
            <fieldset
              key={i}
              className="grid gap-3 rounded-xl border border-slate-200 p-4 bg-slate-50/50"
            >
              <legend className="px-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md">
                Indikator {i + 1}
              </legend>
              <label>
                Nama indikator
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
                <label>
                  Nilai
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
                <label>
                  Satuan
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
        <label>
          Status
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
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Terbit</option>
            <option value="ARCHIVED">Arsip</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
          <button className="yellow-button" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan informasi"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
              <CheckCircle2 size={14} />
              {notice}
            </p>
          )}
        </div>
      </form>
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
