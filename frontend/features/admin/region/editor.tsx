"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, RefreshCw } from "lucide-react";

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
      <div className="border-b border-blue-100/80 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          {item ? "Sunting" : "Tambah"} {modules[kind]}
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {kind === "statistics"
            ? "Masukkan hanya angka agregat kependudukan. Kosong berarti belum tersedia, bukan nol. Jumlah laki-laki dan perempuan harus sama dengan total penduduk bila ketiganya diisi."
            : "Lengkapi nama, deskripsi, alamat lokasi, dan titik koordinat peta fasilitas atau potensi lokal."}
        </p>
      </div>

      {kind === "statistics" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-blue-200/75 bg-blue-50/40 p-5">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Periode (YYYY atau YYYY-MM) <span className="text-red-500">*</span>
              </span>
              <input
                className="cms-input font-mono"
                name="period"
                required
                pattern="[0-9]{4}(-[0-9]{2})?"
                maxLength={7}
                placeholder="misal: 2026-10"
                defaultValue={stat?.period}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Sumber Data Resmi <span className="text-red-500">*</span>
              </span>
              <input
                className="cms-input"
                name="source"
                required
                maxLength={300}
                placeholder="misal: Registrasi Kependudukan Kelurahan"
                defaultValue={stat?.source}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tanggal Referensi Data <span className="text-red-500">*</span>
              </span>
              <input
                className="cms-input"
                type="date"
                name="referenceDate"
                required
                defaultValue={stat?.referenceDate.slice(0, 10)}
              />
            </label>
          </div>

          <div className="space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-blue-900">
              Indikator Agregat Kependudukan & Wilayah
            </span>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(metricLabels).map(([key, label]) => (
                <label
                  key={key}
                  className="block rounded-2xl border border-blue-200/70 bg-white/80 p-4 shadow-2xs space-y-1.5"
                >
                  <span className="text-xs font-bold text-slate-700 block">
                    {label}
                  </span>
                  <input
                    className="cms-input font-bold"
                    name={key}
                    type="number"
                    min={0}
                    max={10000000}
                    step={1}
                    placeholder="Kosong jika belum ada"
                    defaultValue={
                      stat?.[key as keyof typeof metricLabels] ?? ""
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Nama {kind === "facilities" ? "Fasilitas Publik" : "Potensi Kelurahan"}{" "}
                <span className="text-red-500">*</span>
              </span>
              <input
                className="cms-input"
                name="name"
                required
                maxLength={160}
                placeholder="Masukkan nama..."
                defaultValue={place?.name}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Kategori <span className="text-red-500">*</span>
              </span>
              <input
                className="cms-input"
                name="category"
                list="place-categories"
                required
                maxLength={100}
                placeholder="Pilih atau ketik kategori..."
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
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Deskripsi Publik
            </span>
            <textarea
              className="cms-input"
              name="description"
              maxLength={10000}
              placeholder="Jelaskan profil fasilitas atau potensi ini untuk warga..."
              defaultValue={place?.description}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-blue-200/75 bg-blue-50/40 p-5">
            <label className="block space-y-1.5 sm:col-span-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Lokasi / Alamat Publik <span className="text-red-500">*</span>
              </span>
              <input
                className="cms-input"
                name="location"
                required
                maxLength={300}
                placeholder="misal: RT 02 / RW 01 Watundehoa"
                defaultValue={place?.location}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Latitude (Garis Lintang)
              </span>
              <input
                className="cms-input font-mono text-xs"
                name="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                placeholder="-4.05..."
                defaultValue={place?.latitude ?? ""}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Longitude (Garis Bujur)
              </span>
              <input
                className="cms-input font-mono text-xs"
                name="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                placeholder="122.12..."
                defaultValue={place?.longitude ?? ""}
              />
            </label>
          </div>

          <div className="space-y-4 rounded-2xl border border-blue-200/75 bg-white/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-blue-900">
                  Foto Dokumentasi (Opsional)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah file gambar langsung dari komputer ke server kelurahan.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                onClick={() => void media.refetch()}
              >
                <RefreshCw size={12} />
                <span>Segarkan Pustaka</span>
              </button>
            </div>

            <input type="hidden" name="photoId" value={selectedPhotoId} />

            <ImageUploadField
              value={selectedPhotoId}
              onChange={(id) => setSelectedPhotoId(id ?? "")}
              valueType="id"
              source={kind === "facilities" ? "facilities" : "potentials"}
              aspectRatio="video"
            />

            <label className="block space-y-1.5 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Teks Alternatif Foto (Alt Text)
              </span>
              <input
                className="cms-input"
                name="photoAlt"
                maxLength={300}
                placeholder="Deskripsi singkat foto untuk aksesibilitas..."
                defaultValue={place?.photoAlt}
              />
            </label>

            <details className="text-xs text-slate-500 pt-1">
              <summary className="cursor-pointer font-bold text-blue-700 hover:text-blue-900 transition-colors">
                Atau pilih foto dari pustaka media yang sudah ada
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 border-t border-blue-100/80 pt-3">
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
          {media.isError && <p role="alert">{cmsError(media.error)}</p>}
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end pt-4 border-t border-blue-100/80">
        <label className="block space-y-1.5 max-w-xs">
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

        <button
          className="glass-button-primary h-10"
          disabled={save.isPending}
        >
          <Save size={15} strokeWidth={2.2} />
          <span>{save.isPending ? "Menyimpan…" : "Simpan Data Wilayah"}</span>
        </button>
      </div>

      {save.isError && <p role="alert">{cmsError(save.error)}</p>}
    </form>
  );
}
