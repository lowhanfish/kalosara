"use client";
import Image from "next/image";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type MediaAsset, type List } from "./client";
export function MediaLibrary() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "cms-media", page, search, visibility],
    queryFn: () =>
      runtime.request<List<MediaAsset>>(
        `/admin/media?page=${page}&limit=10&search=${encodeURIComponent(search)}${visibility ? `&visibility=${visibility}` : ""}`,
      ),
  });
  const invalidate = () =>
    cache.invalidateQueries({ queryKey: ["user", auth.user?.id, "cms-media"] });
  const upload = useMutation({
    mutationFn: (data: FormData) =>
      cmsMutate(runtime.request, "/admin/media", data, "POST"),
    onSuccess: () => {
      form.current?.reset();
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
  return (
    <section className="space-y-5" aria-labelledby="media-title">
      <h2 id="media-title" className="text-2xl font-semibold">
        Pustaka media
      </h2>
      <p className="text-sm text-muted">
        Satu file JPG/PNG/WebP/PDF, maksimal 20 MB. Gambar maksimal 25
        megapiksel. Media privat hanya dapat dibuka pengunggah; pilih publik
        hanya untuk materi yang disetujui tayang. Visibilitas tidak dapat diubah
        setelah upload.
      </p>
      <form
        ref={form}
        className="space-y-4 rounded-xl border border-border p-5"
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
        <label className="block">
          File
          <input
            className="cms-input"
            type="file"
            name="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => {
              e.target.setCustomValidity(
                (e.target.files?.[0]?.size ?? 0) > 20 * 1024 * 1024
                  ? "Ukuran file maksimal 20 MB."
                  : "",
              );
            }}
          />
        </label>
        <label className="block">
          Akses media
          <select
            className="cms-input"
            aria-label="Akses media"
            name="visibility"
            defaultValue="PRIVATE"
          >
            <option value="PRIVATE">Privat — hanya pengunggah</option>
            <option value="PUBLIC">Publik — dapat diakses tanpa login</option>
          </select>
        </label>
        <label className="block">
          Teks alternatif (wajib untuk gambar)
          <input className="cms-input" name="alt" maxLength={300} />
        </label>
        <label className="block">
          Keterangan media
          <input className="cms-input" name="caption" maxLength={1000} />
        </label>
        <button className="yellow-button" disabled={upload.isPending}>
          {upload.isPending ? "Mengunggah…" : "Unggah media"}
        </button>
        {upload.isError && <p role="alert">{cmsError(upload.error)}</p>}
        {upload.isSuccess && <p role="status">Media tersimpan.</p>}
      </form>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(String(new FormData(e.currentTarget).get("search") ?? ""));
        }}
      >
        <label className="min-w-0 flex-1">
          Cari nama media
          <input className="cms-input" name="search" maxLength={100} />
        </label>
        <label>
          Akses
          <select
            className="cms-input"
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
        <button className="yellow-button">Cari media</button>
      </form>
      {query.isLoading && <p>Memuat media…</p>}
      {query.isError && (
        <p role="alert">
          {cmsError(query.error)}{" "}
          <button className="underline" onClick={() => void query.refetch()}>
            Coba lagi
          </button>
        </p>
      )}
      {query.data?.items.length === 0 && <p>Belum ada media yang sesuai.</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        {query.data?.items.map((asset) => (
          <form
            key={`${asset.id}-${asset.alt}-${asset.caption}`}
            className="min-w-0 space-y-3 rounded-xl border border-border p-4"
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
            {asset.mimeType.startsWith("image/") && (
              <Image
                src={asset.url ?? `/api/v1/admin/media/${asset.id}/file`}
                width={300}
                height={180}
                alt={asset.alt}
                unoptimized
                className="h-40 w-full rounded object-contain"
              />
            )}
            <p className="break-all font-semibold">{asset.originalName}</p>
            <p className="text-sm">
              {asset.visibility} · {(asset.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <a
              className="block break-all underline"
              href={asset.url ?? `/api/v1/admin/media/${asset.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {asset.mimeType === "application/pdf"
                ? "Unduh PDF"
                : "Buka media"}
            </a>
            <label className="block">
              Teks alternatif
              <input
                className="cms-input"
                name="alt"
                defaultValue={asset.alt}
                maxLength={300}
              />
            </label>
            <label className="block">
              Keterangan
              <input
                className="cms-input"
                name="caption"
                defaultValue={asset.caption}
                maxLength={1000}
              />
            </label>
            <div className="flex flex-wrap gap-4">
              <button className="underline" disabled={update.isPending}>
                Simpan metadata
              </button>
              <button
                type="button"
                className="underline"
                disabled={update.isPending}
                onClick={() => {
                  if (
                    confirm(
                      "Arsipkan media ini? Media yang masih dirujuk konten atau revisi tidak dapat diarsipkan.",
                    )
                  )
                    update.mutate({
                      id: asset.id,
                      alt: asset.alt,
                      caption: asset.caption,
                      archived: true,
                    });
                }}
              >
                Arsipkan media
              </button>
            </div>
          </form>
        ))}
      </div>
      {update.isError && <p role="alert">{cmsError(update.error)}</p>}
      {update.isSuccess && <p role="status">Metadata media tersimpan.</p>}
      <div className="flex items-center gap-4">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Sebelumnya
        </button>
        <span>
          Halaman {page} · {query.data?.total ?? 0} media
        </span>
        <button
          disabled={!query.data || page * 10 >= query.data.total}
          onClick={() => setPage(page + 1)}
        >
          Berikutnya
        </button>
      </div>
    </section>
  );
}
