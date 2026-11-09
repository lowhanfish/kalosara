"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, ExternalLink, ArrowLeft, CheckCircle2, FileText, AlertCircle } from "lucide-react";

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
    PUBLISHED: { text: "Terbit", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    DRAFT: { text: "Draft (Belum Terbit)", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    ARCHIVED: { text: "Arsip", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  }[status] ?? { text: status, badge: "bg-slate-100 text-slate-700 border-slate-200" };

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
              <span className="text-xs text-slate-500 font-mono">/pelayanan</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">
              Halaman ini memuat informasi alur, syarat, dan panduan administrasi warga kelurahan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pelayanan"
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
              Ubah Panduan Pelayanan
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <FileText size={18} className="text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800">
              Pratinjau Isi Halaman Panduan
            </h3>
          </div>

          {content ? (
            <div
              className="cms-rich text-slate-700 leading-relaxed text-sm bg-slate-50/50 rounded-xl p-6 border border-slate-100"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Belum ada konten panduan yang ditulis.</p>
              <p className="text-xs mt-1">Klik tombol &ldquo;Ubah Panduan Pelayanan&rdquo; untuk mulai menyusun persyaratan dan alur pelayanan.</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
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
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Ringkasan Pelayanan
        </button>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Mode Pengeditan
        </span>
      </div>

      <form
        className="cms-editor space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined, {
            onSuccess: () => {
              setIsEditing(false);
            },
          });
        }}
      >
        <label className="block">
          <span className="font-semibold text-slate-800">Judul Halaman</span>
          <input
            className="cms-input mt-1.5"
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <div>
          <label className="block font-semibold text-slate-800">
            Persyaratan, alur, dan informasi pelayanan
          </label>
          <p className="text-xs text-muted mt-1 mb-3">
            Gunakan editor WYSIWYG di bawah untuk menyusun dan memformat panduan (Judul Bab H2/H3, Poin Persyaratan, Nomor Langkah Alur, Kutipan/Catatan, dan Gambar/Tautan).
          </p>
          <RichEditor
            initial={content}
            onChange={(html) => setContent(html)}
            images={media.data?.items ?? []}
          />
        </div>

        <label className="block">
          <span className="font-semibold text-slate-800">Status Publikasi</span>
          <select
            className="cms-input mt-1.5"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="DRAFT">Draft — Belum ditampilkan di website publik</option>
            <option value="PUBLISHED">Terbit — Ditampilkan di halaman /pelayanan</option>
            <option value="ARCHIVED">Arsip — Dinonaktifkan</option>
          </select>
        </label>

        <div className="pt-2 flex flex-wrap items-center gap-4 border-t border-slate-100">
          <button className="yellow-button" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan Pelayanan"}
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
              {cmsError(save.error)}
            </p>
          )}
          {save.isSuccess && (
            <p role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 size={14} />
              Panduan pelayanan berhasil disimpan.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
