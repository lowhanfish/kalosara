"use client";
import { useState } from "react";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { useQuery, useMutation } from "@tanstack/react-query";

import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import {
  cmsError,
  cmsMutate,
  type List,
  type MediaAsset,
} from "@/features/cms/client";
import { metricLabels } from "@/lib/region";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { modules, type Kind, type Row } from "./types";

export default function Editor({
  kind,
  item,
  onSaved,
}: {
  kind: Kind;
  item: Row | null;
  onSaved: (item: Row, pending: boolean) => void;
}) {
  const runtime = useAuthRuntime();
  const auth = useAuth();
  const [id] = useState(() => item?.id ?? crypto.randomUUID());
  const [mediaSearch, setMediaSearch] = useState("");
  const stat = item && "period" in item ? item : null;
  const place = item && "name" in item ? item : null;
  const [selectedPhotoId, setSelectedPhotoId] = useState(place?.photoId ?? "");
  const media = useQuery({
    queryKey: ["user", auth.user?.id, "region-media", mediaSearch],
    enabled: kind !== "statistics",
    queryFn: () =>
      runtime.request<List<MediaAsset>>(
        `/admin/media?visibility=PUBLIC&limit=50&search=${encodeURIComponent(mediaSearch)}`,
      ),
  });
  const save = useMutation({
    mutationFn: (body: unknown) =>
      cmsMutate<{ item: Row; cacheInvalidated: boolean }>(
        runtime.request,
        `/admin/region/${kind}/${id}`,
        body,
      ),
    onSuccess: (data) => onSaved(data.item, !data.cacheInvalidated),
  });
  return (
    <form
      className="cms-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const text = (key: string) => String(f.get(key) ?? "");
        const num = (key: string) =>
          text(key) === "" ? null : Number(text(key));
        const status = text("status");
        if (
          status === "ARCHIVED" &&
          !confirm("Arsipkan data ini dari website publik?")
        )
          return;
        save.mutate({
          status,
          expectedVersion: item?.version ?? 0,
          ...(kind === "statistics"
            ? {
                period: text("period"),
                source: text("source"),
                referenceDate: text("referenceDate"),
                ...Object.fromEntries(
                  Object.keys(metricLabels).map((key) => [key, num(key)]),
                ),
              }
            : {
                name: text("name"),
                description: text("description"),
                category: text("category"),
                location: text("location"),
                latitude: num("latitude"),
                longitude: num("longitude"),
                photoId: text("photoId") || null,
                photoAlt: text("photoAlt"),
              }),
        });
      }}
    >
      <h2>
        {item ? "Edit" : "Buat"} {modules[kind]}
      </h2>
      {kind === "statistics" ? (
        <>
          <p>
            Hanya angka agregat. Jangan masukkan NIK, nomor KK atau daftar
            penduduk. Kosong berarti belum tersedia, bukan nol. Jumlah laki-laki
            dan perempuan harus sama dengan total penduduk bila ketiganya diisi.
          </p>
          <label>
            Periode (YYYY atau YYYY-MM)
            <input
              className="cms-input"
              name="period"
              required
              pattern="[0-9]{4}(-[0-9]{2})?"
              maxLength={7}
              placeholder="YYYY-MM"
              defaultValue={stat?.period}
            />
          </label>
          <label>
            Sumber data
            <input
              className="cms-input"
              name="source"
              required
              maxLength={300}
              defaultValue={stat?.source}
            />
          </label>
          <label>
            Tanggal data
            <input
              className="cms-input"
              type="date"
              name="referenceDate"
              required
              defaultValue={stat?.referenceDate.slice(0, 10)}
            />
          </label>
          {Object.entries(metricLabels).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                className="cms-input"
                name={key}
                type="number"
                min={0}
                max={10000000}
                step={1}
                defaultValue={stat?.[key as keyof typeof metricLabels] ?? ""}
              />
            </label>
          ))}
        </>
      ) : (
        <>
          <label>
            Nama fasilitas / potensi
            <input
              className="cms-input"
              name="name"
              required
              maxLength={160}
              defaultValue={place?.name}
            />
          </label>
          <label>
            Deskripsi publik
            <textarea
              className="cms-input"
              name="description"
              maxLength={10000}
              defaultValue={place?.description}
            />
          </label>
          <label>
            Kategori
            <input
              className="cms-input"
              name="category"
              list="place-categories"
              required
              maxLength={100}
              defaultValue={place?.category}
            />
            <datalist id="place-categories">
              <option value="Wisata" />
              <option value="Produk UMKM" />
              <option value="Potensi kelurahan" />
              <option value="Pendidikan" />
              <option value="Kesehatan" />
              <option value="Ibadah" />
            </datalist>
          </label>
          <label>
            Lokasi / alamat publik
            <input
              className="cms-input"
              name="location"
              required
              maxLength={300}
              defaultValue={place?.location}
            />
          </label>
          <label>
            Latitude (opsional)
            <input
              className="cms-input"
              name="latitude"
              type="number"
              step="any"
              min={-90}
              max={90}
              defaultValue={place?.latitude ?? ""}
            />
          </label>
          <label>
            Longitude (opsional)
            <input
              className="cms-input"
              name="longitude"
              type="number"
              step="any"
              min={-180}
              max={180}
              defaultValue={place?.longitude ?? ""}
            />
          </label>
          <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Foto {kind === "facilities" ? "Fasilitas" : "Potensi"} (Opsional)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah file gambar langsung dari komputer yang disimpan ke server backend via Multer.
              </p>
            </div>

            <input type="hidden" name="photoId" value={selectedPhotoId} />

            <ImageUploadField
              value={selectedPhotoId}
              onChange={(id) => setSelectedPhotoId(id ?? "")}
              valueType="id"
              source={kind === "facilities" ? "facilities" : "potentials"}
              aspectRatio="video"
            />

            <details className="text-xs text-slate-500 pt-1">
              <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Atau pilih dari pustaka media yang sudah ada
              </summary>
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <input
                  className="cms-input text-xs"
                  placeholder="Cari gambar di pustaka..."
                  value={mediaSearch}
                  maxLength={100}
                  onChange={(e) => setMediaSearch(e.target.value)}
                />
                <select
                  className="cms-input text-xs"
                  aria-label="Pilih foto dari pustaka"
                  value={selectedPhotoId}
                  onChange={(e) => setSelectedPhotoId(e.target.value)}
                >
                  <option value="">Tanpa foto</option>
                  {place?.photoId &&
                    !media.data?.items.some((m) => m.id === place.photoId) && (
                      <option value={place.photoId}>Foto tersimpan</option>
                    )}
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
          </div>
          <label>
            Teks alternatif foto
            <input
              className="cms-input"
              name="photoAlt"
              maxLength={300}
              defaultValue={place?.photoAlt}
            />
          </label>
          <button
            type="button"
            className="underline"
            onClick={() => void media.refetch()}
          >
            Muat ulang pilihan foto
          </button>
          <p>
            Foto harus PUBLIC aktif. Gunakan pustaka media di bawah.
            Publikasikan hanya lokasi/deskripsi yang disetujui; jangan
            memasukkan data pribadi pemilik UMKM.
          </p>
          {media.isError && <p role="alert">{cmsError(media.error)}</p>}
        </>
      )}
      <label>
        Status
        <select
          className="cms-input"
          name="status"
          defaultValue={item?.status ?? "DRAFT"}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Terbit</option>
          <option value="ARCHIVED">Arsip</option>
        </select>
      </label>
      <button className="yellow-button" disabled={save.isPending}>
        {save.isPending ? "Menyimpan…" : "Simpan"}
      </button>
      {save.isError && <p role="alert">{cmsError(save.error)}</p>}
    </form>
  );
}
