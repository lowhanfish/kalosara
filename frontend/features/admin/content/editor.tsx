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
import {
  Eye,
  EyeOff,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";

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
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(
    null,
  );

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
        <div className="border-b border-blue-100/80 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900">
            {item ? "Sunting" : "Buat"} {channels[kind].title}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Lengkapi judul, isi materi, dan atribut publikasi{" "}
            {channels[kind].title.toLowerCase()}.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Judul {channels[kind].title}{" "}
              <span className="text-red-500">*</span>
            </span>
            <input
              className="cms-input"
              name="title"
              required
              maxLength={200}
              placeholder={`Masukkan judul ${channels[kind].title.toLowerCase()}...`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Status Publikasi
            </span>
            <select
              className="cms-input font-semibold"
              name="status"
              defaultValue={item?.status ?? "DRAFT"}
            >
              <option value="DRAFT">Draft (Belum Tayang)</option>
              <option value="PUBLISHED">Terbit (Tayang Publik)</option>
              <option value="ARCHIVED">Arsip (Nonaktif)</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Isi Konten & Penjelasan
          </span>
          <p className="text-xs text-slate-500">
            Gunakan editor WYSIWYG untuk menyusun format teks (Heading Bab
            H2/H3, Poin/Daftar, Penomoran, Kutipan, Tebal/Miring, dan Sisip
            Gambar).
          </p>
          <RichEditor
            key={item?.id ?? kind}
            initial={content}
            onChange={(html) => setContent(html)}
            images={media.data?.items ?? []}
          />
        </div>

        {kind === "announcements" && (
          <div className="space-y-4 rounded-2xl border border-blue-200/75 bg-blue-50/40 p-5">
            <label className="flex items-center gap-2.5 text-sm font-bold text-blue-900 cursor-pointer">
              <input
                type="checkbox"
                name="pinned"
                defaultChecked={item?.announcement?.pinned}
              />
              <span>Sematkan pengumuman ini di urutan teratas halaman</span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["startsAt", "expiredAt"] as const).map((key) => (
                <label className="block space-y-1.5" key={key}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {key === "startsAt"
                      ? "Waktu Mulai Berlaku"
                      : "Waktu Kedaluwarsa"}{" "}
                    (WITA)
                  </span>
                  <input
                    className="cms-input"
                    type="datetime-local"
                    name={key}
                    defaultValue={inputDate(item?.announcement?.[key])}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {kind === "events" && (
          <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-blue-200/75 bg-blue-50/40 p-5">
            {(["start", "end"] as const).map((key) => (
              <label className="block space-y-1.5" key={key}>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Waktu {key === "start" ? "Mulai" : "Selesai"} Acara{" "}
                  <span className="text-red-500">*</span>
                </span>
                <input
                  className="cms-input"
                  type="datetime-local"
                  name={key}
                  required
                  defaultValue={inputDate(item?.event?.[key])}
                />
              </label>
            ))}
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Lokasi / Tempat Acara <span className="text-red-500">*</span>
              </span>
              <input
                name="location"
                className="cms-input"
                required
                maxLength={300}
                placeholder="misal: Aula Kantor Kelurahan Watundehoa"
                defaultValue={item?.event?.location}
              />
            </label>
          </div>
        )}

        {kind === "documents" && (
          <div className="space-y-4 rounded-2xl border border-blue-200/75 bg-blue-50/40 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Klasifikasi PPID
                </span>
                <select
                  className="cms-input"
                  name="classification"
                  defaultValue={item?.document?.classification ?? ""}
                >
                  <option value="">Belum diklasifikasikan</option>
                  <option value="BERKALA">Informasi Berkala</option>
                  <option value="SERTA_MERTA">Informasi Serta-Merta</option>
                  <option value="SETIAP_SAAT">Informasi Setiap Saat</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kategori Dokumen <span className="text-red-500">*</span>
                </span>
                <input
                  name="category"
                  className="cms-input"
                  required
                  maxLength={120}
                  defaultValue={item?.document?.category}
                  list="document-categories"
                  placeholder="misal: Standar pelayanan"
                />
                <datalist id="document-categories">
                  <option>Standar pelayanan</option>
                  <option>Maklumat</option>
                  <option>Kontak</option>
                </datalist>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 items-end">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Filter Berkas PDF di Pustaka
                </span>
                <input
                  className="cms-input"
                  value={mediaSearch}
                  maxLength={100}
                  placeholder="Ketik nama file PDF..."
                  onChange={(e) => setMediaSearch(e.target.value)}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pilih Berkas PDF <span className="text-red-500">*</span>
                </span>
                <select
                  name="fileId"
                  className="cms-input"
                  required
                  defaultValue={item?.document?.fileId ?? ""}
                >
                  <option value="">Pilih berkas PDF</option>
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
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
              <span>
                Untuk dokumen yang diterbitkan, pastikan berkas PDF berstatus{" "}
                <strong>PUBLIC</strong>.
              </span>
              <button
                type="button"
                className="font-bold text-blue-700 hover:underline"
                onClick={() => void media.refetch()}
              >
                Segarkan daftar PDF
              </button>
            </div>
          </div>
        )}

        {kind === "galleries" && (
          <div className="space-y-4 rounded-2xl border border-blue-200/75 bg-white/80 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-blue-900">
                  Foto Album Galeri ({photos.length} / 12 Foto)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah file foto langsung dari perangkat Anda ke server
                  kelurahan.
                </p>
              </div>

              <label
                className={`glass-button-primary cursor-pointer ${
                  photos.length >= 12 || isUploadingGallery
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                {isUploadingGallery ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Mengunggah Foto...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} strokeWidth={2.2} />
                    <span>Unggah Foto Album</span>
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
            </div>

            {galleryUploadError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{galleryUploadError}</span>
              </div>
            )}

            <details className="text-xs text-slate-500 pt-1">
              <summary className="cursor-pointer font-bold text-blue-700 hover:text-blue-900 transition-colors">
                Atau tambahkan foto yang sudah ada di pustaka media
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 border-t border-blue-100/80 pt-3">
                <input
                  className="cms-input text-xs"
                  placeholder="Cari nama gambar di pustaka..."
                  value={mediaSearch}
                  maxLength={100}
                  onChange={(e) => setMediaSearch(e.target.value)}
                />
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
                        {
                          mediaId: m.id,
                          alt: m.alt,
                          sortOrder: photos.length,
                        },
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

            {photos.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                {photos.map((p, i) => (
                  <div
                    key={p.mediaId}
                    className="flex gap-3 rounded-2xl border border-blue-200/75 bg-blue-50/40 p-3"
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-blue-200 bg-white">
                      <SkeletonImage
                        src={`/api/v1/public/media/${p.mediaId}`}
                        alt={p.alt || `Foto ${i + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Deskripsi Foto {i + 1}
                        <input
                          className="cms-input text-xs"
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
                        className="text-xs font-bold text-red-600 hover:underline"
                        onClick={() =>
                          setPhotos(photos.filter((_, n) => n !== i))
                        }
                      >
                        Hapus foto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {media.isError && <p role="alert">{cmsError(media.error)}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-blue-100/80">
          <button
            className="glass-button-primary"
            disabled={save.isPending || save.isSuccess}
          >
            <Save size={15} strokeWidth={2.2} />
            <span>{save.isPending ? "Menyimpan…" : "Simpan Konten"}</span>
          </button>
          <button
            type="button"
            onClick={() => setLivePreview(!livePreview)}
            className="glass-button-secondary"
          >
            {livePreview ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{livePreview ? "Tutup Pratinjau" : "Pratinjau Konten"}</span>
          </button>
        </div>

        {save.isError && <p role="alert">{cmsError(save.error)}</p>}
        {notice && (
          <p
            role="status"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"
          >
            <CheckCircle2 size={15} />
            <span>{notice} Buka ulang item untuk menyunting lagi.</span>
          </p>
        )}
      </form>

      {livePreview && (
        <article className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700">
              <Eye size={13} /> Pratinjau {channels[kind].title}
            </span>
            <button
              type="button"
              onClick={() => setLivePreview(false)}
              className="text-xs text-slate-500 hover:text-slate-900 font-bold"
            >
              Tutup Pratinjau &times;
            </button>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
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
                  className="relative aspect-video rounded-xl overflow-hidden border border-blue-200 bg-slate-100"
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
