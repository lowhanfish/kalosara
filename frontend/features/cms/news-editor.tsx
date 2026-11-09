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
import { Eye, EyeOff, History, RotateCcw, Save } from "lucide-react";

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

  const handleTitleChange = (val: string) => {
    if (!draft.version && !draft.slug) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 120);
      setDraft((prev) => ({ ...prev, title: val, slug: autoSlug }));
      setDirty(true);
    } else {
      change("title", val);
    }
  };

  const imageOptions =
    images.data?.items.filter((asset) => asset.mimeType.startsWith("image/")) ??
    [];

  return (
    <section
      className="glass-card space-y-6 p-6 sm:p-8"
      aria-labelledby="editor-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100/80 pb-4">
        <div>
          <h2 id="editor-title" className="text-xl font-extrabold text-slate-900">
            {draft.version ? "Sunting Artikel Berita" : "Tulis Artikel Berita Baru"}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {draft.version
              ? `Revisi Versi ${draft.version} · Status Saat Ini: ${initial.status}`
              : "Artikel Baru"}{" "}
            ·{" "}
            <span className={dirty ? "font-bold text-amber-600" : "text-slate-500"}>
              {dirty ? "Ada perubahan belum disimpan" : "Tersinkronisasi"}
            </span>
          </p>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Judul Berita <span className="text-red-500">*</span>
            </span>
            <input
              className="cms-input"
              required
              maxLength={200}
              placeholder="Masukkan judul utama berita..."
              value={draft.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Slug URL Berita <span className="text-red-500">*</span>
            </span>
            <input
              className="cms-input font-mono text-xs"
              required
              maxLength={180}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="misal: kerja-bakti-kelurahan-watundehoa"
              value={draft.slug}
              onChange={(e) => change("slug", e.target.value)}
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Ringkasan Singkat (Excerpt)
          </span>
          <textarea
            className="cms-input min-h-24"
            maxLength={1000}
            placeholder="Tulis pengantar singkat berita yang akan ditampilkan pada kartu daftar berita..."
            value={draft.excerpt}
            onChange={(e) => change("excerpt", e.target.value)}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-3 rounded-2xl border border-blue-200/70 bg-blue-50/40 p-5">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Kategori Berita <span className="text-red-500">*</span>
            </span>
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

          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filter Pilihan Kategori
            </span>
            <input
              className="cms-input"
              maxLength={100}
              placeholder="Ketik untuk memfilter kategori..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Status Publikasi
            </span>
            <select
              className="cms-input font-semibold"
              aria-label="Status berita"
              value={draft.status}
              onChange={(e) => change("status", e.target.value as News["status"])}
            >
              <option value="DRAFT">Draft (Belum Tayang)</option>
              <option value="PUBLISHED">Terbit (Tayang Publik)</option>
              <option value="ARCHIVED">Arsip (Nonaktif)</option>
            </select>
          </label>
        </div>

        {categories.isError && <p role="alert">{cmsError(categories.error)}</p>}

        <div className="space-y-4 rounded-2xl border border-blue-200/75 bg-white/80 p-5 shadow-2xs">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-blue-900">
              Gambar Sampul (Cover Berita)
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah file gambar sampul (JPG, PNG, WebP) langsung ke server kelurahan.
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
            <summary className="cursor-pointer font-bold text-blue-700 hover:text-blue-900 transition-colors">
              Atau pilih gambar yang sudah ada di pustaka media ({imageOptions.length} gambar)
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 border-t border-blue-100/80 pt-3">
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

        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Isi Naskah Berita
          </span>
          <RichEditor
            initial={initial.bodyHtml}
            images={imageOptions}
            onChange={(html) => change("bodyHtml", html)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-blue-100/80">
          <button
            className="glass-button-primary"
            disabled={save.isPending || rollback.isPending}
          >
            <Save size={15} strokeWidth={2.2} />
            <span>{save.isPending ? "Menyimpan…" : "Simpan Berita"}</span>
          </button>

          <button
            type="button"
            onClick={() => setLivePreview(!livePreview)}
            className="glass-button-secondary"
          >
            {livePreview ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{livePreview ? "Tutup Pratinjau" : "Pratinjau Berita"}</span>
          </button>

          {draft.version > 0 && !dirty && (
            <button
              type="button"
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline ml-auto"
              disabled={preview.isPending}
              onClick={() => preview.mutate()}
            >
              Pratinjau Versi Server
            </button>
          )}
        </div>

        {save.isError && (
          <p role="alert">
            {cmsError(save.error)}{" "}
            <button
              type="button"
              className="underline font-bold"
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
        <article className="glass-card p-6 sm:p-8 space-y-5 border-blue-300/80">
          <div className="flex items-center justify-between border-b border-blue-100 pb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <Eye size={13} /> Pratinjau Langsung &mdash; Status: {draft.status}
            </span>
            <button
              type="button"
              onClick={() => setLivePreview(false)}
              className="text-xs text-slate-500 hover:text-slate-900 font-bold"
            >
              Tutup Pratinjau &times;
            </button>
          </div>

          {draft.coverId && (
            <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-200/80 bg-slate-100">
              <SkeletonImage
                src={`/media/${draft.coverId}`}
                alt={draft.title || "Cover Berita"}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {draft.title || "(Judul berita belum diisi)"}
          </h2>

          {draft.excerpt && (
            <p className="text-base font-medium italic text-slate-600 border-l-4 border-blue-500 pl-4 py-1">
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
        <article className="cms-rich glass-card p-6">
          <p className="text-xs font-bold uppercase text-blue-700">
            Preview Server — {preview.data.news.status}
          </p>
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
        <section className="space-y-4 pt-4 border-t border-blue-100/80">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            <span>Riwayat Revisi Artikel</span>
          </h3>
          {revisions.isLoading && <p className="text-xs text-slate-500">Memuat revisi…</p>}
          {revisions.isError && <p role="alert">{cmsError(revisions.error)}</p>}
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {revisions.data?.items.map((revision) => (
              <li
                className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/70 bg-white/80 px-4 py-3 text-xs shadow-2xs"
                key={revision.id}
              >
                <div>
                  <span className="font-bold text-slate-900 block">
                    Versi {revision.version}
                  </span>
                  <span className="text-slate-500">
                    {new Date(revision.createdAt).toLocaleString("id-ID", {
                      timeZone: "Asia/Makassar",
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40"
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
                  <RotateCcw size={12} />
                  <span>Pulihkan</span>
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
