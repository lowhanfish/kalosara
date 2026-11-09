"use client";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import {
  cmsMutate,
  cmsError,
  type News,
  type Category,
  type List,
  type MediaAsset,
} from "./client";
import { RichEditor } from "./rich-editor";
import { AdminPagination } from "@/components/admin/pagination";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Eye, EyeOff } from "lucide-react";
type Preview = {
  news: {
    title: string;
    excerpt: string;
    bodyHtml: string;
    status: string;
    cover: { id: string; alt: string; caption: string } | null;
  };
};
export function NewsEditor({
  initial,
  onSaved,
}: {
  initial: News;
  onSaved: (news: News, cacheInvalidated?: boolean) => void;
}) {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [draft, setDraft] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [imageSearch, setImageSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [revisionPage, setRevisionPage] = useState(1);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const categories = useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "cms-categories",
      "picker",
      categorySearch,
    ],
    queryFn: () =>
      runtime.request<List<Category>>(
        `/admin/news/categories?limit=50&search=${encodeURIComponent(categorySearch)}`,
      ),
  });
  const images = useQuery({
    queryKey: ["user", auth.user?.id, "cms-media", "picker", imageSearch],
    queryFn: () =>
      runtime.request<List<MediaAsset>>(
        `/admin/media?visibility=PUBLIC&limit=50&search=${encodeURIComponent(imageSearch)}`,
      ),
  });
  const revisions = useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "cms-revisions",
      draft.id,
      draft.version,
      revisionPage,
    ],
    enabled: draft.version > 0,
    queryFn: () =>
      runtime.request<List<{ id: string; version: number; createdAt: string }>>(
        `/admin/news/${draft.id}/revisions?page=${revisionPage}`,
      ),
  });
  const save = useMutation({
    mutationFn: () =>
      cmsMutate<{ news: News; cacheInvalidated: boolean }>(
        runtime.request,
        `/admin/news/${draft.id}`,
        {
          slug: draft.slug,
          title: draft.title,
          excerpt: draft.excerpt,
          bodyHtml: draft.bodyHtml,
          categoryId: draft.categoryId,
          coverId: draft.coverId,
          status: draft.status,
          expectedVersion: draft.version,
        },
      ),
    onSuccess: (data) => {
      setDirty(false);
      onSaved(
        data.news,
        "cacheInvalidated" in data ? Boolean(data.cacheInvalidated) : undefined,
      );
    },
  });
  const preview = useMutation({
    mutationFn: () =>
      runtime.request<Preview>(`/admin/news/${draft.id}/preview`),
  });
  const rollback = useMutation({
    mutationFn: (revisionId: string) =>
      cmsMutate<{ news: News; cacheInvalidated: boolean }>(
        runtime.request,
        `/admin/news/${draft.id}/rollback`,
        { revisionId, expectedVersion: draft.version },
        "POST",
      ),
    onSuccess: (data) => {
      setDirty(false);
      onSaved(
        data.news,
        "cacheInvalidated" in data ? Boolean(data.cacheInvalidated) : undefined,
      );
    },
  });
  const reload = useMutation({
    mutationFn: () =>
      runtime.request<{ news: News }>(`/admin/news/${draft.id}`),
    onSuccess: (data) => {
      setDirty(false);
      onSaved(
        data.news,
        "cacheInvalidated" in data ? Boolean(data.cacheInvalidated) : undefined,
      );
    },
  });
  function change<K extends keyof News>(key: K, value: News[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  }
  const imageOptions =
    images.data?.items.filter((asset) => asset.mimeType.startsWith("image/")) ??
    [];
  return (
    <section
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"
      aria-labelledby="editor-title"
    >
      <h2 id="editor-title" className="text-2xl font-semibold">
        {draft.version ? "Edit berita" : "Buat berita"}
      </h2>
      <p className="text-[15px]">
        {draft.version
          ? `Versi ${draft.version} · ${initial.status}`
          : "Berita baru"}{" "}
        ·{" "}
        {dirty ? "Ada perubahan belum disimpan." : "Belum ada perubahan baru."}{" "}
        Simpan untuk melihat pratinjau. Berita draft dan arsip tidak ditampilkan
        pada website.
      </p>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <label className="block">
          Judul berita
          <input
            className="cms-input"
            required
            maxLength={200}
            value={draft.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </label>
        <label className="block">
          Slug berita
          <input
            className="cms-input"
            required
            maxLength={180}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={draft.slug}
            onChange={(e) => change("slug", e.target.value)}
          />
        </label>
        <label className="block">
          Ringkasan
          <textarea
            className="cms-input min-h-24"
            maxLength={1000}
            value={draft.excerpt}
            onChange={(e) => change("excerpt", e.target.value)}
          />
        </label>
        <label className="block">
          Cari pilihan kategori
          <input
            className="cms-input"
            maxLength={100}
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
        </label>
        <label className="block">
          Kategori berita
          <select
            className="cms-input"
            required
            aria-label="Kategori berita"
            value={draft.categoryId}
            onChange={(e) => change("categoryId", e.target.value)}
          >
            <option value="">Pilih kategori aktif</option>
            {draft.categoryId &&
              !categories.data?.items.some(
                (category) => category.id === draft.categoryId,
              ) && (
                <option aria-label="Kategori berita" value={draft.categoryId}>
                  Kategori tersimpan
                </option>
              )}
            {categories.data?.items
              .filter(
                (category) =>
                  !category.archived || category.id === draft.categoryId,
              )
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.archived ? " (arsip)" : ""}
                </option>
              ))}
          </select>
        </label>
        {categories.isError && <p role="alert">{cmsError(categories.error)}</p>}
        <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Cover Berita
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah file gambar sampul (JPG, PNG, WebP) yang akan disimpan ke direktori server backend.
            </p>
          </div>

          <ImageUploadField
            value={draft.coverId}
            onChange={(id) => change("coverId", id)}
            valueType="id"
            source="news"
            aspectRatio="video"
          />

          <details className="text-xs text-slate-500 pt-1">
            <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Atau pilih dari pustaka media yang sudah ada ({imageOptions.length} gambar)
            </summary>
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              <input
                className="cms-input text-xs"
                placeholder="Cari gambar di pustaka..."
                maxLength={100}
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
              />
              <select
                className="cms-input text-xs"
                aria-label="Cover berita dari pustaka"
                value={draft.coverId ?? ""}
                onChange={(e) => change("coverId", e.target.value || null)}
              >
                <option value="">Tanpa cover</option>
                {draft.coverId &&
                  !imageOptions.some((image) => image.id === draft.coverId) && (
                    <option value={draft.coverId}>Cover tersimpan</option>
                  )}
                {imageOptions.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.alt || image.originalName}
                  </option>
                ))}
              </select>
            </div>
          </details>
        </div>
        {images.isError && <p role="alert">{cmsError(images.error)}</p>}
        <div>
          <p className="mb-3 font-semibold">Isi berita</p>
          <RichEditor
            initial={initial.bodyHtml}
            images={imageOptions}
            onChange={(html) => change("bodyHtml", html)}
          />
        </div>
        <label className="block">
          Status berita
          <select
            className="cms-input"
            aria-label="Status berita"
            value={draft.status}
            onChange={(e) => change("status", e.target.value as News["status"])}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Terbit</option>
            <option value="ARCHIVED">Arsip</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
            disabled={save.isPending || rollback.isPending}
          >
            {save.isPending ? "Menyimpan…" : "Simpan Berita"}
          </button>
          <button
            type="button"
            onClick={() => setLivePreview(!livePreview)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              livePreview
                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50"
            }`}
          >
            {livePreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {livePreview ? "Tutup Pratinjau" : "Pratinjau Berita"}
          </button>
          {draft.version > 0 && !dirty && (
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-600 underline ml-auto"
              disabled={preview.isPending}
              onClick={() => preview.mutate()}
            >
              Pratinjau Versi Tersimpan
            </button>
          )}
        </div>
        {save.isError && (
          <p role="alert">
            {cmsError(save.error)}{" "}
            <button
              type="button"
              className="underline"
              disabled={!draft.version || reload.isPending}
              onClick={() => {
                if (confirm("Muat ulang data server dan buang perubahan form?"))
                  reload.mutate();
              }}
            >
              Muat ulang data server
            </button>
          </p>
        )}
      </form>
      {livePreview && (
        <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Eye size={13} /> Pratinjau Langsung &mdash; Status: {draft.status}
            </span>
            <button
              type="button"
              onClick={() => setLivePreview(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium"
            >
              Tutup Pratinjau &times;
            </button>
          </div>

          {draft.coverId && (
            <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <SkeletonImage
                src={`/media/${draft.coverId}`}
                alt={draft.title || "Cover Berita"}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {draft.title || "(Judul berita belum diisi)"}
          </h2>

          {draft.excerpt && (
            <p className="text-base font-medium italic text-slate-600 border-l-4 border-slate-300 pl-4 py-1">
              {draft.excerpt}
            </p>
          )}

          <div
            className="cms-rich text-slate-800 text-sm leading-relaxed pt-2"
            dangerouslySetInnerHTML={{
              __html:
                draft.bodyHtml ||
                "<p class='text-slate-400 italic'>Belum ada isi naskah berita.</p>",
            }}
          />
        </article>
      )}
      {reload.isError && <p role="alert">{cmsError(reload.error)}</p>}
      {preview.isError && <p role="alert">{cmsError(preview.error)}</p>}
      {preview.data && (
        <article className="cms-rich rounded-xl border border-border p-5">
          <p>Preview privat — {preview.data.news.status}</p>
          <h2>{preview.data.news.title}</h2>
          <p>{preview.data.news.excerpt}</p>
          {preview.data.news.cover && (
            <figure>
              <SkeletonImage
                src={`/api/v1/public/media/${preview.data.news.cover.id}`}
                alt={preview.data.news.cover.alt}
                width={800}
                height={450}
                unoptimized
                className="h-auto w-full rounded-xl"
              />
              <figcaption>{preview.data.news.cover.caption}</figcaption>
            </figure>
          )}
          <div
            dangerouslySetInnerHTML={{ __html: preview.data.news.bodyHtml }}
          />
        </article>
      )}
      {draft.version > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Riwayat revisi</h3>
          {revisions.isLoading && <p>Memuat revisi…</p>}
          {revisions.isError && <p role="alert">{cmsError(revisions.error)}</p>}
          <ul className="space-y-3">
            {revisions.data?.items.map((revision) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-border p-3"
                key={revision.id}
              >
                <span>
                  Versi {revision.version} ·{" "}
                  {new Date(revision.createdAt).toLocaleString("id-ID", {
                    timeZone: "Asia/Makassar",
                  })}
                </span>
                <button
                  type="button"
                  className="underline"
                  disabled={
                    rollback.isPending || revision.version === draft.version
                  }
                  onClick={() => {
                    if (
                      confirm(
                        `Pulihkan versi ${revision.version} sebagai DRAFT baru? Perubahan form akan diganti.`,
                      )
                    )
                      rollback.mutate(revision.id);
                  }}
                >
                  Pulihkan versi {revision.version}
                </button>
              </li>
            ))}
          </ul>
          <AdminPagination
            page={revisionPage}
            total={revisions.data?.total ?? 0}
            limit={10}
            onPageChange={setRevisionPage}
            itemName="revisi"
          />
          {rollback.isError && <p role="alert">{cmsError(rollback.error)}</p>}
        </section>
      )}
    </section>
  );
}
