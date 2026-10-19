"use client";
import { useState } from "react";
import Image from "next/image";
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
  const [mediaSearch, setMediaSearch] = useState("");
  const [photos, setPhotos] = useState(item?.gallery?.photos ?? []);
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
            ? { category: value("category"), fileId: value("fileId") }
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
          defaultValue={item?.title}
        />
      </label>
      <div>
        <label className="block font-semibold text-slate-800">
          Isi Konten
        </label>
        <p className="mt-1 mb-2.5 text-xs text-muted">
          Gunakan editor WYSIWYG untuk menyusun format teks (Heading Bab H2/H3, Poin/Daftar, Penomoran, Kutipan, Tebal/Miring, dan Sisip Gambar/Tautan).
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
        <>
          <label className="block">
            Tambah foto publik (maksimal 12)
            <select
              className="cms-input"
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
              <option value="">Pilih gambar</option>
              {media.data?.items
                .filter((m) => m.mimeType.startsWith("image/"))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.originalName}
                  </option>
                ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2 mt-3">
            {photos.map((p, i) => (
              <div
                key={p.mediaId}
                className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <Image
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
        </>
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
      <button
        className="yellow-button"
        disabled={save.isPending || save.isSuccess}
      >
        {save.isPending ? "Menyimpan…" : "Simpan"}
      </button>
      {save.isError && <p role="alert">{cmsError(save.error)}</p>}
      {notice && (
        <p role="status">{notice} Buka ulang item untuk menyunting lagi.</p>
      )}
    </form>
  );
}
