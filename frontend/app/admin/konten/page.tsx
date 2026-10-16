"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminAccess } from "@/features/cms/admin-access";
import { MediaLibrary } from "@/features/cms/media-library";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import {
  cmsMutate,
  cmsError,
  type List,
  type MediaAsset,
} from "@/features/cms/client";
import {
  channels,
  type ContentKind,
  type ContentItem,
  type ContentList,
} from "@/lib/content";
function Editor({
  kind,
  item,
  onSaved,
}: {
  kind: ContentKind;
  item: ContentItem | null;
  onSaved: () => void;
}) {
  const runtime = useAuthRuntime();
  const auth = useAuth();
  const [editorId] = useState(() => item?.id ?? crypto.randomUUID());
  const [mediaSearch, setMediaSearch] = useState("");
  const [photos, setPhotos] = useState(item?.gallery?.photos ?? []);
  const [notice, setNotice] = useState("");
  const media = useQuery({
    queryKey: ["user", auth.user?.id, "content-media", kind, mediaSearch],
    queryFn: () =>
      runtime.request<List<MediaAsset>>(
        `/admin/media?limit=50&search=${encodeURIComponent(mediaSearch)}${kind === "galleries" ? "&visibility=PUBLIC" : ""}`,
      ),
  });
  const save = useMutation({
    mutationFn: (body: unknown) =>
      cmsMutate<{ cacheInvalidated: boolean }>(
        runtime.request,
        `/admin/content/${kind}/${editorId}`,
        body,
      ),
    onSuccess: (data) => {
      setNotice(
        data.cacheInvalidated
          ? "Konten tersimpan."
          : "Konten tersimpan; invalidasi cache tertunda dan akan dicoba ulang.",
      );
      onSaved();
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
          expectedVersion: item?.version ?? 0,
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
function Workspace() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [kind, setKind] = useState<ContentKind>("announcements");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<ContentItem | null | undefined>();
  const [epoch, setEpoch] = useState(0);
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "content", kind, page, search, status],
    queryFn: () =>
      runtime.request<ContentList>(
        `/admin/content/${kind}?page=${page}&search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`,
      ),
  });
  const leave = () =>
    selected === undefined ||
    confirm("Tutup editor? Pastikan perubahan sudah disimpan.");
  return (
    <>
      <div className="cms-channel-tabs">
        {Object.entries(channels).map(([key, c]) => (
          <button
            className="rounded border p-3"
            aria-pressed={kind === key}
            key={key}
            onClick={() => {
              if (leave()) {
                setKind(key as ContentKind);
                setPage(1);
                setSelected(undefined);
              }
            }}
          >
            {c.title}
          </button>
        ))}
      </div>
      <form
        className="cms-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(String(new FormData(e.currentTarget).get("search") ?? ""));
        }}
      >
        <label>
          Cari judul
          <input className="cms-input" name="search" maxLength={100} />
        </label>
        <label>
          Filter status
          <select
            className="cms-input"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Semua</option>
            <option>DRAFT</option>
            <option>PUBLISHED</option>
            <option>ARCHIVED</option>
          </select>
        </label>
        <button className="yellow-button">Cari</button>
      </form>
      <button
        className="yellow-button"
        onClick={() => {
          if (leave()) {
            setSelected(null);
            setEpoch(epoch + 1);
          }
        }}
      >
        Buat {channels[kind].title}
      </button>
      {query.isLoading && <p role="status">Memuat…</p>}
      {query.isError && (
        <p role="alert">
          {cmsError(query.error)}{" "}
          <button onClick={() => void query.refetch()}>Coba lagi</button>
        </p>
      )}
      {query.data?.items.length === 0 && (
        <p className="py-5">Belum ada konten yang sesuai.</p>
      )}
      <ul className="cms-content-list">
        {query.data?.items.map((item) => (
          <li className="cms-content-row" key={item.id}>
            <div className="cms-row-title">
              <h2>{item.title}</h2>
              <span className="cms-status" data-status={item.status}>
                {
                  { DRAFT: "Draft", PUBLISHED: "Terbit", ARCHIVED: "Arsip" }[
                    item.status
                  ]
                }
              </span>
            </div>
            <button
              className="cms-edit-button"
              aria-label={`Edit ${item.title}`}
              onClick={() => {
                if (leave()) {
                  setSelected(item);
                  setEpoch(epoch + 1);
                }
              }}
            >
              Edit konten
            </button>
          </li>
        ))}
      </ul>
      <nav aria-label="Halaman CMS" className="cms-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Sebelumnya
        </button>
        <span>
          Halaman {page} · {query.data?.total ?? 0} item
        </span>
        <button
          disabled={!query.data || page * 10 >= query.data.total}
          onClick={() => setPage(page + 1)}
        >
          Berikutnya
        </button>
      </nav>
      {selected !== undefined && (
        <Editor
          key={`${kind}-${epoch}`}
          kind={kind}
          item={selected}
          onSaved={() => void query.refetch()}
        />
      )}
      <details className="cms-media-drawer">
        <summary>
          Pustaka media <span>Unggah dan kelola gambar atau PDF</span>
        </summary>
        <div className="cms-media-content">
          <MediaLibrary />
        </div>
      </details>
    </>
  );
}
export default function Page() {
  return (
    <main id="konten" tabIndex={-1} className="container py-10">
      <header className="cms-page-heading">
        <p className="eyebrow">Pengelolaan website</p>
        <h1>Kelola kanal informasi</h1>
        <p>
          Atur pengumuman, agenda, galeri, dan dokumen yang akan tampil di
          website kelurahan.
        </p>
      </header>
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
