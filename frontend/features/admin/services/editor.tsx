"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type List, type MediaAsset } from "@/features/cms/client";
import { RichEditor } from "@/features/cms/rich-editor";
import type { ProfilePage } from "@/lib/profile";

export default function Editor({ page }: { page?: ProfilePage }) {
  const auth = useAuth();
  const { request } = useAuthRuntime();
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
  });

  return (
    <form
      className="cms-editor space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
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

      <div className="pt-2 flex items-center gap-4">
        <button className="yellow-button" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan Pelayanan"}
        </button>
        {save.isError && (
          <p role="alert" className="text-xs text-red-600 font-medium">
            {cmsError(save.error)}
          </p>
        )}
        {save.isSuccess && (
          <p role="status" className="text-xs text-emerald-600 font-semibold">
            Panduan pelayanan berhasil disimpan.
            {!save.data.cacheInvalidated &&
              " Perubahan publik sedang disinkronkan."}
          </p>
        )}
      </div>
    </form>
  );
}
