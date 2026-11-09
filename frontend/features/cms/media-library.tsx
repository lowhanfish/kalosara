"use client";

import { SkeletonImage } from "@/components/ui/skeleton-image";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type MediaAsset, type List } from "./client";
import { AdminPagination } from "@/components/admin/pagination";
import {
  Eye,
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  Search,
  ExternalLink,
  Archive,
  Save,
} from "lucide-react";

export function MediaLibrary() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("");
  const form = useRef<HTMLFormElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewModalAsset, setPreviewModalAsset] =
    useState<MediaAsset | null>(null);

  const query = useQuery({
    queryKey: ["user", auth.user?.id, "cms-media", page, search, visibility],
    queryFn: () =>
      runtime.request<List<MediaAsset>>(
        `/admin/media?page=${page}&limit=10&search=${encodeURIComponent(search)}${visibility ? `&visibility=${visibility}` : ""}`,
      ),
  });

  const invalidate = () =>
    cache.invalidateQueries({ queryKey: ["user", auth.user?.id, "cms-media"] });

  const clearUploadPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const upload = useMutation({
    mutationFn: (data: FormData) =>
      cmsMutate(runtime.request, "/admin/media", data, "POST"),
    onSuccess: () => {
      form.current?.reset();
      clearUploadPreview();
      void invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      alt,
      caption,
      archived,
    }: {
      id: string;
      alt: string;
      caption: string;
      archived: boolean;
    }) =>
      cmsMutate(
        runtime.request,
        `/admin/media/${id}`,
        { alt, caption, archived },
        "PATCH",
      ),
    onSuccess: invalidate,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    if (file && file.size > 20 * 1024 * 1024) {
      e.target.setCustomValidity("Ukuran file maksimal 20 MB.");
    } else {
      e.target.setCustomValidity("");
    }
  };

  return (
    <section
      className="cms-media-library space-y-6"
      aria-labelledby="media-title"
    >
      {/* Upload Form Glass Card */}
      <div className="glass-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-3.5 border-b border-blue-100/80 pb-4">
          <div className="glass-icon-box size-11">
            <UploadCloud size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 id="media-title" className="text-lg font-extrabold text-slate-900">
              Unggah Media & Berkas Baru
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Unggah foto dokumentasi kegiatan, dokumen PDF publik, dan lampiran resmi kelurahan.
            </p>
          </div>
        </div>

        <form
          ref={form}
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const file = data.get("file");
            if (file instanceof File && file.size > 20 * 1024 * 1024) {
              e.currentTarget.reportValidity();
              return;
            }
            upload.mutate(data);
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Pilih File (JPG, PNG, WebP, PDF · Maks 20 MB)
              </label>
              <input
                className="cms-input"
                type="file"
                name="file"
                required
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
              />

              {selectedFile && (
                <div className="mt-3 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5">
                  {previewUrl ? (
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-blue-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Pratinjau unggahan"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-white border border-blue-200 text-blue-600">
                      <FileText className="h-8 w-8" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      Ukuran: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      Tipe: {selectedFile.type || "Dokumen"}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Siap diunggah
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Asal Upload
                  <select
                    className="cms-input"
                    name="source"
                    defaultValue="news"
                  >
                    <option value="news">Berita</option>
                    <option value="profile">Profil kelurahan</option>
                    <option value="officials">Aparatur</option>
                    <option value="settings">Pengaturan / identitas</option>
                    <option value="announcements">Pengumuman</option>
                    <option value="events">Agenda</option>
                    <option value="galleries">Galeri</option>
                    <option value="documents">Informasi publik</option>
                    <option value="facilities">Fasilitas publik</option>
                    <option value="potentials">Potensi lokal</option>
                    <option value="general">Umum</option>
                  </select>
                </label>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Akses Media
                  <select
                    className="cms-input"
                    aria-label="Akses media"
                    name="visibility"
                    defaultValue="PRIVATE"
                  >
                    <option value="PRIVATE">Privat — hanya pengunggah</option>
                    <option value="PUBLIC">
                      Publik — dapat diakses tanpa login
                    </option>
                  </select>
                </label>
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Teks Alternatif (Deskripsi Gambar)
                <input
                  className="cms-input"
                  name="alt"
                  maxLength={300}
                  placeholder="Contoh: Rapat musyawarah warga RT 02 di balai kantor"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Keterangan / Caption
                <input
                  className="cms-input"
                  name="caption"
                  maxLength={1000}
                  placeholder="Keterangan opsional yang tampil di bawah gambar"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-blue-100/80">
            <button
              className="glass-button-primary"
              disabled={upload.isPending}
            >
              <UploadCloud size={15} strokeWidth={2.2} />
              <span>{upload.isPending ? "Mengunggah…" : "Unggah Media"}</span>
            </button>
            {upload.isError && (
              <p role="alert" className="text-xs text-red-600 font-bold">
                {cmsError(upload.error)}
              </p>
            )}
            {upload.isSuccess && (
              <p
                role="status"
                className="text-xs text-emerald-600 font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Media berhasil disimpan ke
                pustaka.
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Filter Media Glass Toolbar */}
      <form
        className="glass-toolbar grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(String(new FormData(e.currentTarget).get("search") ?? ""));
        }}
      >
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Cari Nama / Keterangan Media
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
            <input
              className="cms-input pl-10 text-xs"
              name="search"
              maxLength={100}
              placeholder="Ketik kata kunci pencarian media..."
            />
          </div>
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Filter Akses
          <select
            className="cms-input text-xs font-semibold"
            aria-label="Filter akses media"
            value={visibility}
            onChange={(e) => {
              setPage(1);
              setVisibility(e.target.value);
            }}
          >
            <option value="">Semua akses saya</option>
            <option value="PUBLIC">Publik</option>
            <option value="PRIVATE">Privat saya</option>
          </select>
        </label>
        <button className="glass-button-primary h-10">
          <Search size={14} strokeWidth={2.4} />
          <span>Cari Media</span>
        </button>
      </form>

      {query.isLoading && (
        <div className="glass-card py-12 text-center text-sm font-semibold text-blue-700">
          Memuat pustaka media…
        </div>
      )}

      {query.isError && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
        >
          {cmsError(query.error)}{" "}
          <button
            className="underline font-bold"
            onClick={() => void query.refetch()}
          >
            Coba lagi
          </button>
        </p>
      )}

      {query.data?.items.length === 0 && (
        <div className="glass-card border-dashed border-blue-300 p-12 text-center text-sm font-medium text-slate-500">
          Belum ada media yang sesuai dengan kriteria pencarian.
        </div>
      )}

      {/* Media Grid */}
      <div className="cms-media-grid">
        {query.data?.items.map((asset) => {
          const isImg = asset.mimeType.startsWith("image/");
          const fileSrc = asset.url ?? `/api/v1/admin/media/${asset.id}/file`;

          return (
            <form
              key={`${asset.id}-${asset.alt}-${asset.caption}`}
              className="glass-list-card group min-w-0 flex flex-col justify-between p-5"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                update.mutate({
                  id: asset.id,
                  alt: String(data.get("alt") ?? ""),
                  caption: String(data.get("caption") ?? ""),
                  archived: false,
                });
              }}
            >
              <div>
                {isImg ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-blue-100 bg-slate-100">
                    <SkeletonImage
                      src={fileSrc}
                      fill
                      alt={asset.alt || asset.originalName}
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewModalAsset(asset)}
                      className="absolute inset-0 flex items-center justify-center bg-blue-950/45 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-1.5 backdrop-blur-xs"
                      title="Buka pratinjau penuh"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Lihat Pratinjau</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 text-blue-600">
                    <FileText className="h-12 w-12" />
                  </div>
                )}

                <div className="mt-3.5">
                  <p
                    className="break-all font-extrabold text-sm text-slate-900 truncate"
                    title={asset.originalName}
                  >
                    {asset.originalName}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span
                      className={`font-bold rounded-full px-2.5 py-0.5 text-[10px] border ${
                        asset.visibility === "PUBLIC"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {asset.visibility}
                    </span>
                    <span className="font-semibold">
                      {(asset.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Teks Alternatif
                    <input
                      className="cms-input text-xs"
                      name="alt"
                      defaultValue={asset.alt}
                      maxLength={300}
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Keterangan
                    <input
                      className="cms-input text-xs"
                      name="caption"
                      defaultValue={asset.caption}
                      maxLength={1000}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-blue-100/80 flex items-center justify-between gap-2 text-xs">
                <button
                  type="submit"
                  className="glass-button-secondary py-1.5 px-3 min-h-0 h-8 text-xs"
                  disabled={update.isPending}
                >
                  <Save size={13} />
                  <span>Simpan Info</span>
                </button>
                <div className="flex items-center gap-2">
                  <a
                    className="inline-flex h-8 items-center gap-1 rounded-xl border border-blue-200/70 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    href={fileSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={12} />
                    <span>Buka</span>
                  </a>
                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1 rounded-xl border border-red-200/80 bg-red-50/70 px-2.5 text-xs font-bold text-red-600 hover:bg-red-100"
                    disabled={update.isPending}
                    onClick={() => {
                      if (
                        confirm(
                          "Arsipkan media ini? Media yang masih dirujuk konten atau revisi tidak dapat diarsipkan.",
                        )
                      ) {
                        update.mutate({
                          id: asset.id,
                          alt: asset.alt,
                          caption: asset.caption,
                          archived: true,
                        });
                      }
                    }}
                  >
                    <Archive size={12} />
                    <span>Arsipkan</span>
                  </button>
                </div>
              </div>
            </form>
          );
        })}
      </div>

      {update.isError && (
        <p role="alert" className="text-xs text-red-600">
          {cmsError(update.error)}
        </p>
      )}

      <AdminPagination
        page={page}
        total={query.data?.total ?? 0}
        limit={10}
        onPageChange={setPage}
        itemName="media"
      />

      {previewModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-blue-200/60 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-blue-100 px-6 py-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base truncate max-w-lg">
                  {previewModalAsset.originalName}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  {previewModalAsset.visibility} ·{" "}
                  {(previewModalAsset.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalAsset(null)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1 min-h-[360px] max-h-[60vh] bg-slate-950 flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  previewModalAsset.url ??
                  `/api/v1/admin/media/${previewModalAsset.id}/file`
                }
                alt={previewModalAsset.alt || previewModalAsset.originalName}
                className="max-h-full max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="p-4 bg-blue-50/50 border-t border-blue-100 text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-bold text-slate-900">
                  Teks alternatif:
                </span>{" "}
                {previewModalAsset.alt || "—"}
              </p>
              <p>
                <span className="font-bold text-slate-900">Keterangan:</span>{" "}
                {previewModalAsset.caption || "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
