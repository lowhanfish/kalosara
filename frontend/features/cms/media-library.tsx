"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type MediaAsset, type List } from "./client";
import { AdminPagination } from "@/components/admin/pagination";
import { Eye, X, FileText, UploadCloud, CheckCircle2 } from "lucide-react";

export function MediaLibrary() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("");
  const form = useRef<HTMLFormElement>(null);

  // Local upload preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fullscreen modal preview state
  const [previewModalAsset, setPreviewModalAsset] = useState<MediaAsset | null>(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 id="media-title" className="text-2xl font-bold text-slate-900">
            Pustaka Media
          </h2>
          <p className="text-sm text-muted mt-1">
            Unggah dan kelola foto kegiatan, dokumen publik, dan lampiran resmi kelurahan.
          </p>
        </div>
      </div>

      {/* Upload Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" />
          <span>Unggah Media Baru</span>
        </h3>

        <form
          ref={form}
          className="space-y-4"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
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

              {/* Local File Preview Card */}
              {selectedFile && (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                  {previewUrl ? (
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Pratinjau unggahan"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-slate-500 mt-0.5">
                      Ukuran: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      Tipe: {selectedFile.type || "Dokumen"}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                      <CheckCircle2 className="h-3 w-3" /> Siap diunggah
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Asal Upload
                  <select className="cms-input mt-1" name="source" defaultValue="news">
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Akses Media
                  <select
                    className="cms-input mt-1"
                    aria-label="Akses media"
                    name="visibility"
                    defaultValue="PRIVATE"
                  >
                    <option value="PRIVATE">Privat — hanya pengunggah</option>
                    <option value="PUBLIC">Publik — dapat diakses tanpa login</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Teks Alternatif (Deskripsi Gambar untuk Aksesibilitas)
                <input
                  className="cms-input mt-1"
                  name="alt"
                  maxLength={300}
                  placeholder="Contoh: Rapat musyawarah warga RT 02 di balai kantor"
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Keterangan / Caption
                <input
                  className="cms-input mt-1"
                  name="caption"
                  maxLength={1000}
                  placeholder="Keterangan opsional yang tampil di bawah gambar"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button className="yellow-button" disabled={upload.isPending}>
              {upload.isPending ? "Mengunggah…" : "Unggah Media"}
            </button>
            {upload.isError && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {cmsError(upload.error)}
              </p>
            )}
            {upload.isSuccess && (
              <p role="status" className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Media berhasil disimpan ke pustaka.
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Filter Media Form */}
      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(String(new FormData(e.currentTarget).get("search") ?? ""));
        }}
      >
        <label className="min-w-0 flex-1 text-xs font-semibold text-slate-700">
          Cari Nama / Keterangan Media
          <input
            className="cms-input mt-1"
            name="search"
            maxLength={100}
            placeholder="Ketik kata kunci pencarian..."
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Filter Akses
          <select
            className="cms-input mt-1"
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
        <button className="yellow-button">Cari Media</button>
      </form>

      {query.isLoading && (
        <div className="py-12 text-center text-sm text-slate-500">Memuat media…</div>
      )}

      {query.isError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          {cmsError(query.error)}{" "}
          <button className="underline font-semibold" onClick={() => void query.refetch()}>
            Coba lagi
          </button>
        </p>
      )}

      {query.data?.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
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
              className="group min-w-0 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all"
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
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                    <Image
                      src={fileSrc}
                      fill
                      alt={asset.alt || asset.originalName}
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewModalAsset(asset)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold gap-1.5 backdrop-blur-2xs"
                      title="Buka pratinjau penuh"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Lihat Pratinjau</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <FileText className="h-10 w-10 text-primary/70" />
                  </div>
                )}

                <div className="mt-3">
                  <p className="break-all font-bold text-sm text-slate-900 truncate" title={asset.originalName}>
                    {asset.originalName}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted">
                    <span className="font-semibold rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                      {asset.visibility}
                    </span>
                    <span>{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Teks Alternatif
                    <input
                      className="cms-input mt-1 text-xs"
                      name="alt"
                      defaultValue={asset.alt}
                      maxLength={300}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Keterangan
                    <input
                      className="cms-input mt-1 text-xs"
                      name="caption"
                      defaultValue={asset.caption}
                      maxLength={1000}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="submit"
                  className="font-semibold text-primary hover:underline"
                  disabled={update.isPending}
                >
                  Simpan Info
                </button>
                <div className="flex items-center gap-3">
                  <a
                    className="font-semibold text-slate-600 hover:text-slate-900 underline"
                    href={fileSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buka
                  </a>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
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
                    Arsipkan
                  </button>
                </div>
              </div>
            </form>
          );
        })}
      </div>

      {update.isError && (
        <p role="alert" className="text-xs text-red-600">{cmsError(update.error)}</p>
      )}

      {/* Button-based Pagination */}
      <AdminPagination
        page={page}
        total={query.data?.total ?? 0}
        limit={10}
        onPageChange={setPage}
        itemName="media"
      />

      {/* Modal Pratinjau Gambar Penuh */}
      {previewModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base truncate max-w-lg">
                  {previewModalAsset.originalName}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewModalAsset.visibility} · {(previewModalAsset.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalAsset(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1 min-h-[360px] max-h-[60vh] bg-slate-900 flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewModalAsset.url ?? `/api/v1/admin/media/${previewModalAsset.id}/file`}
                alt={previewModalAsset.alt || previewModalAsset.originalName}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-semibold text-slate-800">Teks alternatif:</span>{" "}
                {previewModalAsset.alt || "—"}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Keterangan:</span>{" "}
                {previewModalAsset.caption || "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
