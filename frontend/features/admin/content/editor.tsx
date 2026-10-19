"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import {
  cmsMutate,
  cmsError,
  type List,
  type MediaAsset,
} from "@/features/cms/client";
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
          content: value("content"),
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
      <label className="block">
        Isi (teks aman)
        <textarea
          className="cms-input"
          name="content"
          maxLength={30000}
          rows={5}
          defaultValue={item?.content}
        />
      </label>
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
          {photos.map((p, i) => (
            <div key={p.mediaId}>
              <label>
                Teks alternatif foto {i + 1}
                <input
                  className="cms-input"
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
                className="underline"
                onClick={() => setPhotos(photos.filter((_, n) => n !== i))}
              >
                Hapus foto {i + 1} dari album
              </button>
            </div>
          ))}
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
