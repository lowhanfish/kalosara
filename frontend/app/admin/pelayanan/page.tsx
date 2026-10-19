"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { AdminAccess } from "@/features/cms/admin-access";
import { cmsMutate, cmsError } from "@/features/cms/client";
import type { ProfilePage } from "@/lib/profile";
function Editor({ page }: { page?: ProfilePage }) {
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
function Workspace() {
  const auth = useAuth();
  const { request } = useAuthRuntime();
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "service-page"],
    queryFn: () => request<{ pages: ProfilePage[] }>("/admin/profile"),
  });
  return (
    <>
      {query.isPending && <p role="status">Memuat panduan…</p>}
      {query.isError && (
        <p role="alert">
          {cmsError(query.error)}{" "}
          <button onClick={() => void query.refetch()}>Coba lagi</button>
        </p>
      )}
      {query.data && (
        <Editor page={query.data.pages.find((p) => p.slug === "pelayanan")} />
      )}
    </>
  );
}
export default function Page() {
  return (
    <main className="container">
      <h1>Pelayanan</h1>
      <p className="admin-intro">
        Atur panduan dan persyaratan yang ditampilkan pada menu Pelayanan.{" "}
        <Link className="underline" href="/pelayanan" target="_blank">
          Lihat halaman publik ↗
        </Link>
      </p>
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
