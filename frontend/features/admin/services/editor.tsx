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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 size-40 rounded-full bg-gradient-to-br from-blue-50/60 to-indigo-50/40 blur-2xl pointer-events-none" />

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
                  /pelayanan
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-500">
                Pusat panduan resmi untuk warga. Mengatur alur pengurusan berkas, persyaratan administrasi, dan informasi loket kantor Kelurahan Watundehoa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/pelayanan"
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
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all"
              >
                <Pencil size={15} />
                Ubah Panduan Pelayanan
              </button>
            </div>
          </div>
        </div>

        {/* Content Preview Container */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Isi Halaman Panduan Pelayanan
                </h3>
                <p className="text-xs text-slate-400">
                  Pratinjau tampilan format dokumen yang dapat dibaca warga
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <Pencil size={12} /> Edit Dokumen
            </button>
          </div>

          {content ? (
            <div
              className="cms-rich text-slate-700 leading-relaxed text-sm bg-slate-50/60 rounded-xl p-6 sm:p-8 border border-slate-100 shadow-inner"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <AlertCircle size={36} className="mx-auto mb-3 opacity-40 text-slate-500" />
              <p className="text-sm font-semibold text-slate-700">Belum ada konten panduan yang ditulis</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Masyarakat belum dapat melihat panduan alur pelayanan. Klik tombol di bawah untuk mulai menulis.
              </p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline hover:text-primary-hover"
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
      <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
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
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Ringkasan
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
          <Sparkles size={13} className="text-amber-500" />
          Mode Sunting Panduan
        </span>
      </div>

      <form
        className="cms-editor space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined, {
            onSuccess: () => {
              setIsEditing(false);
            },
          });
        }}
      >
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">
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

        <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-slate-100">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow transition-all disabled:opacity-50"
            disabled={save.isPending}
          >
            {save.isPending ? "Menyimpan…" : "Simpan Perubahan"}
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
    </div>
  );
}
