"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useAuthRuntime } from "@/features/auth/auth-provider";

import { cmsMutate, cmsError } from "@/features/cms/client";
import type { ProfilePage } from "@/lib/profile";

export default function Editor({ page }: { page?: ProfilePage }) {
  const { request } = useAuthRuntime();
  const [title, setTitle] = useState(
    page?.title ?? "Panduan pelayanan kelurahan",
  );
  const [content, setContent] = useState(page?.content ?? "");
  const [status, setStatus] = useState(page?.status ?? "DRAFT");
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
      className="cms-editor space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <label className="block">
        Judul halaman
        <input
          className="cms-input"
          required
          maxLength={160}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="block">
        Persyaratan, alur, dan informasi pelayanan
        <textarea
          className="cms-input"
          style={{ minHeight: 320 }}
          maxLength={30000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>
      <label className="block">
        Status publikasi
        <select
          className="cms-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Terbit</option>
          <option value="ARCHIVED">Arsip</option>
        </select>
      </label>
      <button className="yellow-button" disabled={save.isPending}>
        {save.isPending ? "Menyimpan…" : "Simpan pelayanan"}
      </button>
      {save.isError && <p role="alert">{cmsError(save.error)}</p>}
      {save.isSuccess && (
        <p role="status">
          Panduan pelayanan tersimpan.
          {!save.data.cacheInvalidated &&
            " Perubahan publik sedang disinkronkan."}
        </p>
      )}
    </form>
  );
}
