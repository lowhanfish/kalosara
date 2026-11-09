"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type List, type MediaAsset } from "@/features/cms/client";
import { RichEditor } from "@/features/cms/rich-editor";
import type { ProfilePage } from "@/lib/profile";

export default function Editor({ page }: { page?: ProfilePage }) {
  const auth = useAuth();
  const { request } = useAuthRuntime();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [title, setTitle] = useState(
    page?.title ?? "Panduan pelayanan kelurahan",
  );
  const [content, setContent] = useState(page?.content ?? "");
  const [status, setStatus] = useState(page?.status ?? "DRAFT");

  const media = useQuery({
    queryKey: ["user", auth.user?.id, "service-media"],
    queryFn: () =>
      request<List<MediaAsset>>("/admin/media?visibility=PUBLIC&limit=50"),
  });

  const save = useMutation({
    mutationFn: () =>
      cmsMutate<{ cacheInvalidated: boolean }>(
        request,
        "/admin/profile/pages/pelayanan",
        { title, content, status },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user", auth.user?.id, "service-page"],
      });
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
  }[status] ?? {
    text: status,
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
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
                  /pelayanan
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Pusat panduan resmi untuk warga. Mengatur alur pengurusan berkas, persyaratan administrasi, dan informasi loket kantor Kelurahan Watundehoa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/pelayanan"
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
                title="Edit Panduan Pelayanan"
                aria-label="Edit Panduan Pelayanan"
                className="glass-button-primary px-4 py-2.5 text-xs"
              >
                <Pencil size={16} />
                <span>Sunting Panduan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Preview Container */}
        <section className="glass-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-blue-100/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="glass-icon-box size-10 rounded-xl">
                <FileText size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Isi Halaman Panduan Pelayanan
                </h3>
                <p className="text-xs text-slate-500">
                  Pratinjau tampilan format dokumen yang dapat dibaca warga
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Edit Dokumen"
              aria-label="Edit Dokumen"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-blue-200/80 bg-white/90 text-blue-600 shadow-2xs hover:bg-blue-50 hover:text-blue-800 transition-colors"
            >
              <Pencil size={15} />
            </button>
          </div>

          {content ? (
            <div
              className="cms-rich text-slate-700 leading-relaxed text-sm bg-white/75 rounded-2xl p-6 sm:p-8 border border-blue-100/80 shadow-inner"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="py-16 text-center text-slate-400 bg-white/60 rounded-2xl border border-dashed border-blue-200">
              <AlertCircle size={36} className="mx-auto mb-3 opacity-40 text-blue-500" />
              <p className="text-sm font-extrabold text-slate-800">Belum ada konten panduan yang ditulis</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Masyarakat belum dapat melihat panduan alur pelayanan. Klik tombol di bawah untuk mulai menulis.
              </p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 underline hover:text-blue-800"
              >
                Mulai susun alur pelayanan &rarr;
              </button>
            </div>
          )}
        </section>
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
            if (
              content !== (page?.content ?? "") ||
              title !== (page?.title ?? "Panduan pelayanan kelurahan") ||
              status !== (page?.status ?? "DRAFT")
            ) {
              if (!confirm("Perubahan belum disimpan. Kembali ke ringkasan?")) return;
            }
            setIsEditing(false);
          }}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Ringkasan
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full">
          <Sparkles size={13} className="text-blue-600" />
          Mode Sunting Panduan
        </span>
      </div>

      <form
        className="cms-editor glass-card space-y-6 p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined, {
            onSuccess: () => {
              setIsEditing(false);
            },
          });
        }}
      >
        <div className="border-b border-blue-100/70 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900">
            Form Panduan Pelayanan
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Perbarui judul bab, nomor alur, dokumen persyaratan, dan status tayang.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Judul Halaman
          </span>
          <input
            className="cms-input"
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Isi Panduan, Alur, & Persyaratan Dokumen
          </label>
          <p className="text-xs text-slate-500">
            Gunakan editor WYSIWYG untuk memformat teks (Heading Bab H2/H3, Poin Persyaratan, Nomor Langkah Alur, Kutipan/Catatan, dan Gambar/Tautan).
          </p>
          <div className="pt-2">
            <RichEditor
              initial={content}
              onChange={(html) => setContent(html)}
              images={media.data?.items ?? []}
            />
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Status Publikasi
          </span>
          <select
            className="cms-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="DRAFT">Draft — Belum ditampilkan di website publik</option>
            <option value="PUBLISHED">Terbit — Ditampilkan di halaman /pelayanan</option>
            <option value="ARCHIVED">Arsip — Dinonaktifkan sementara</option>
          </select>
        </label>

        <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-blue-100/70">
          <button
            className="glass-button-primary px-6 py-2.5 text-sm disabled:opacity-50"
            disabled={save.isPending}
          >
            {save.isPending ? "Menyimpan…" : "Simpan Perubahan"}
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
            {livePreview ? "Tutup Pratinjau" : "Pratinjau Panduan"}
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
              {cmsError(save.error)}
            </p>
          )}
          {save.isSuccess && (
            <p role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 size={15} />
              Panduan pelayanan berhasil disimpan.
            </p>
          )}
        </div>
      </form>
      {livePreview && (
        <article className="glass-card overflow-hidden p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100/70 pb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700">
              <Eye size={13} /> Pratinjau Langsung &mdash; Status: {status}
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
            {title || "(Judul halaman panduan)"}
          </h2>
          <div
            className="cms-rich text-slate-800 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html:
                content ||
                "<p class='text-slate-400 italic'>Belum ada isi panduan pelayanan.</p>",
            }}
          />
        </article>
      )}
    </div>
  );
}
