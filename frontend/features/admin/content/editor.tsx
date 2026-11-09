"use client";
import { useState } from "react";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { useQuery, useMutation } from "@tanstack/react-query";

import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import {
  cmsMutate,
  cmsError,
  type List,
  type MediaAsset,
} from "@/features/cms/client";
import { RichEditor } from "@/features/cms/rich-editor";
import { channels, type ContentKind, type ContentItem } from "@/lib/content";
import { Eye, EyeOff, UploadCloud, RefreshCw, AlertCircle } from "lucide-react";

export default function Editor({
  kind,
  item,
  onSaved,
}: {
  kind: ContentKind;
  item: ContentItem | null;
  onSaved: (item: ContentItem) => void;
}) {
  const runtime = useAuthRuntime();
  const auth = useAuth();
  const [editorId] = useState(() => item?.id ?? crypto.randomUUID());
  const [title, setTitle] = useState(item?.title ?? "");
  const [livePreview, setLivePreview] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [photos, setPhotos] = useState(item?.gallery?.photos ?? []);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photos.length + files.length > 12) {
      setGalleryUploadError(
        `Maksimal 12 foto galeri (saat ini sudah ada ${photos.length} foto).`,
      );
      return;
    }
    setIsUploadingGallery(true);
    setGalleryUploadError(null);
    try {
      const newPhotos = [...photos];
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) continue;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("visibility", "PUBLIC");
        const alt =
          file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim()
            .slice(0, 100) || "Foto galeri";
        formData.append("alt", alt);
        formData.append("caption", "");
        formData.append("source", "galleries");
        const res = await cmsMutate<{ asset: MediaAsset }>(
          runtime.request,
          "/admin/media",
          formData,
          "POST",
        );
        newPhotos.push({
          mediaId: res.asset.id,
          alt: res.asset.alt || alt,
          sortOrder: newPhotos.length,
        });
      }
      setPhotos(newPhotos);
    } catch (err) {
      setGalleryUploadError(cmsError(err));
    } finally {
      setIsUploadingGallery(false);
      e.target.value = "";
    }
  };
  const [content, setContent] = useState(item?.content ?? "");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(item?.version ?? 0);
  const media = useQuery({
    queryKey: ["user", auth.user?.id, "content-media", kind, mediaSearch],
    queryFn: () =>
      runtime.request<List<MediaAsset>>(
        `/admin/media?limit=50&search=${encodeURIComponent(mediaSearch)}${kind === "galleries" ? "&visibility=PUBLIC" : ""}`,
      ),
  });
  const save = useMutation({
    mutationFn: (body: unknown) =>
      cmsMutate<{ item: ContentItem; cacheInvalidated: boolean }>(
        runtime.request,
        `/admin/content/${kind}/${editorId}`,
        body,
      ),
    onSuccess: (data) => {
      setNotice(
        data.cacheInvalidated
          ? "Konten tersimpan."
          : "Konten tersimpan. Perubahan pada website sedang disinkronkan.",
      );
      setVersion(data.item.version);
      onSaved(data.item);
    },
  });
  const inputDate = (value: string | null | undefined) =>
    value
      ? new Date(
          new Date(value).getTime() -
            new Date(value).getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16)
      : "";
  return (
    <div className="space-y-6">
      <form
        className="cms-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const value = (key: string) => String(f.get(key) ?? "");
        const iso = (key: string) =>
          value(key) ? new Date(value(key)).toISOString() : null;
        const status = value("status");
        if (
          status === "ARCHIVED" &&
          !confirm("Arsipkan konten ini dari website publik?")
        )
          return;
        save.mutate({
          kind,
          title: value("title"),
          content,
          status,
          expectedVersion: version,
          ...(kind === "announcements"
            ? {
                pinned: f.has("pinned"),
                startsAt: iso("startsAt"),
                expiredAt: iso("expiredAt"),
              }
            : {}),
          ...(kind === "events"
            ? {
                start: iso("start"),
                end: iso("end"),
                location: value("location"),
              }
            : {}),
          ...(kind === "documents"
            ? {
                category: value("category"),
                classification: value("classification") || null,
                fileId: value("fileId"),
              }
            : {}),
          ...(kind === "galleries"
            ? { photos: photos.map(({ mediaId, alt }) => ({ mediaId, alt })) }
            : {}),
        });
      }}
    >
      <h2 className="text-xl font-bold">
        {item ? "Edit" : "Buat"} {channels[kind].title}
      </h2>
      <label className="block">
        Judul
        <input
          className="cms-input"
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <div>
        <label className="block font-semibold text-slate-800">Isi Konten</label>
        <p className="mt-1 mb-2.5 text-xs text-muted">
          Gunakan editor WYSIWYG untuk menyusun format teks (Heading Bab H2/H3,
          Poin/Daftar, Penomoran, Kutipan, Tebal/Miring, dan Sisip
          Gambar/Tautan).
        </p>
        <RichEditor
          key={item?.id ?? kind}
          initial={content}
          onChange={(html) => setContent(html)}
          images={media.data?.items ?? []}
        />
      </div>
      {kind === "announcements" && (
        <>
          <label className="block">
            <input
              type="checkbox"
              name="pinned"
              defaultChecked={item?.announcement?.pinned}
            />{" "}
            Sematkan
          </label>
          {(["startsAt", "expiredAt"] as const).map((key) => (
            <label className="block" key={key}>
              {key === "startsAt" ? "Mulai berlaku" : "Kedaluwarsa"} (waktu
              lokal perangkat)
              <input
                className="cms-input"
                type="datetime-local"
                name={key}
                defaultValue={inputDate(item?.announcement?.[key])}
              />
            </label>
          ))}
        </>
      )}
      {kind === "events" && (
        <>
          {(["start", "end"] as const).map((key) => (
            <label className="block" key={key}>
              {key === "start" ? "Mulai" : "Selesai"} (waktu lokal perangkat)
              <input
                className="cms-input"
                type="datetime-local"
                name={key}
                required
                defaultValue={inputDate(item?.event?.[key])}
              />
            </label>
          ))}
          <label className="block">
            Tempat
            <input
              name="location"
              className="cms-input"
              required
              maxLength={300}
              defaultValue={item?.event?.location}
            />
          </label>
        </>
      )}
      {(kind === "documents" || kind === "galleries") && (
        <label className="block">
          Cari file pada pustaka media
          <input
            className="cms-input"
            value={mediaSearch}
            maxLength={100}
            onChange={(e) => setMediaSearch(e.target.value)}
          />
        </label>
      )}
      {kind === "documents" && (
        <>
          <label>
            Klasifikasi PPID
            <select
              className="cms-input"
              name="classification"
              defaultValue={item?.document?.classification ?? ""}
            >
              <option value="">Belum diklasifikasikan</option>
              <option value="BERKALA">Informasi berkala</option>
              <option value="SERTA_MERTA">Informasi serta-merta</option>
              <option value="SETIAP_SAAT">Informasi setiap saat</option>
            </select>
          </label>
          <label className="block">
            Kategori
            <input
              name="category"
              className="cms-input"
              required
              maxLength={120}
              defaultValue={item?.document?.category}
              list="document-categories"
            />
            <datalist id="document-categories">
              <option>Standar pelayanan</option>
              <option>Maklumat</option>
              <option>Kontak</option>
            </datalist>
          </label>
          <label className="block">
            PDF
            <select
              name="fileId"
              className="cms-input"
              required
              defaultValue={item?.document?.fileId ?? ""}
            >
              <option value="">Pilih PDF</option>
              {item?.document &&
                !media.data?.items.some(
                  (m) => m.id === item.document?.fileId,
                ) && (
                  <option value={item.document.fileId}>
                    PDF tersimpan ({item.document.fileId})
                  </option>
                )}
              {media.data?.items
                .filter((m) => m.mimeType === "application/pdf")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.originalName} · {m.visibility}
                  </option>
                ))}
            </select>
          </label>
          <p>
            PDF privat hanya dapat dipakai dalam draft/arsip oleh pengunggah.
            Untuk terbit, pilih PDF PUBLIC yang telah disetujui.
          </p>
        </>
      )}
      {kind === "galleries" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Foto Album Galeri ({photos.length} / 12 Foto)
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah file foto langsung dari perangkat Anda. Setiap foto akan diproses dan disimpan ke direktori upload backend via Express & Multer.
            </p>
          </div>

          {/* Direct File Upload Button */}
          <div className="flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer ${
                photos.length >= 12 || isUploadingGallery
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              {isUploadingGallery ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Mengunggah Foto ke Server...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>Unggah Foto Langsung (Bisa Pilih Banyak)</span>
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={photos.length >= 12 || isUploadingGallery}
                onChange={handleGalleryUpload}
                className="sr-only"
              />
            </label>

            {photos.length < 12 && (
              <span className="text-xs text-slate-400">
                JPG, PNG, WebP · Maks 20 MB / file
              </span>
            )}
          </div>

          {galleryUploadError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{galleryUploadError}</span>
            </div>
          )}

          {/* Secondary: Pick from library */}
          <details className="text-xs text-slate-500 pt-1">
            <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Atau tambahkan dari pustaka media yang sudah ada
            </summary>
            <div className="mt-3">
              <select
                className="cms-input text-xs"
                value=""
                onChange={(e) => {
                  const m = media.data?.items.find(
                    (m) => m.id === e.target.value,
                  );
                  if (
                    m &&
                    photos.length < 12 &&
                    !photos.some((p) => p.mediaId === m.id)
                  )
                    setPhotos([
                      ...photos,
                      { mediaId: m.id, alt: m.alt, sortOrder: photos.length },
                    ]);
                }}
              >
                <option value="">Pilih gambar dari pustaka</option>
                {media.data?.items
                  .filter((m) => m.mimeType.startsWith("image/"))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.originalName}
                    </option>
                  ))}
              </select>
            </div>
          </details>
          <div className="grid gap-3 sm:grid-cols-2 mt-3">
            {photos.map((p, i) => (
              <div
                key={p.mediaId}
                className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <SkeletonImage
                    src={`/api/v1/public/media/${p.mediaId}`}
                    alt={p.alt || `Foto ${i + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Teks alternatif foto {i + 1}
                    <input
                      className="cms-input mt-1 text-xs"
                      required
                      maxLength={300}
                      value={p.alt}
                      onChange={(e) =>
                        setPhotos(
                          photos.map((v, n) =>
                            n === i ? { ...v, alt: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:underline"
                    onClick={() => setPhotos(photos.filter((_, n) => n !== i))}
                  >
                    Hapus foto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {(kind === "documents" || kind === "galleries") && (
        <>
          <p>
            Buka pustaka media di bawah untuk mengunggah file. Gunakan pencarian
            untuk menemukan file lama.
          </p>
          <button
            type="button"
            className="underline"
            onClick={() => void media.refetch()}
          >
            Muat ulang pilihan media
          </button>
          {media.isError && <p role="alert">{cmsError(media.error)}</p>}
        </>
      )}
      <label className="block">
        Status
        <select
          className="cms-input"
          name="status"
          defaultValue={item?.status ?? "DRAFT"}
        >
          <option>DRAFT</option>
          <option>PUBLISHED</option>
          <option>ARCHIVED</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
          disabled={save.isPending || save.isSuccess}
        >
          {save.isPending ? "Menyimpan…" : "Simpan Konten"}
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
          {livePreview ? "Tutup Pratinjau" : "Pratinjau Konten"}
        </button>
      </div>
      {save.isError && <p role="alert">{cmsError(save.error)}</p>}
      {notice && (
        <p role="status">{notice} Buka ulang item untuk menyunting lagi.</p>
      )}
    </form>
    {livePreview && (
      <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
            <Eye size={13} /> Pratinjau {channels[kind].title}
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
          {title || "(Judul konten belum diisi)"}
        </h2>
        <div
          className="cms-rich text-slate-800 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{
            __html:
              content ||
              "<p class='text-slate-400 italic'>Belum ada isi konten.</p>",
          }}
        />
        {kind === "galleries" && photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <div
                key={i}
                className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
              >
                <SkeletonImage
                  src={`/media/${p.mediaId}`}
                  alt={p.alt || "Foto"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </article>
    )}
    </div>
  );
}
