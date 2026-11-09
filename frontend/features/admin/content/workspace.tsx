"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Search,
  RotateCw,
  X,
  Pin,
  MapPin,
  Clock,
  FolderOpen,
} from "lucide-react";
import {
  MegaphoneSvg,
  CalendarEventSvg,
  GalleryPhotoSvg,
  DocumentSealSvg,
} from "@/components/admin/admin-icons";
import Editor from "./editor";
import { AdminPagination } from "@/components/admin/pagination";
import { AdminAccess } from "@/features/cms/admin-access";
import { MediaLibrary } from "@/features/cms/media-library";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  channels,
  type ContentKind,
  type ContentItem,
  type ContentList,
} from "@/lib/content";

const channelIcons = {
  announcements: MegaphoneSvg,
  events: CalendarEventSvg,
  galleries: GalleryPhotoSvg,
  documents: DocumentSealSvg,
};

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Terbit",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
        dot: "bg-emerald-500",
        accent: "from-emerald-500 to-teal-500",
      };
    case "DRAFT":
      return {
        label: "Draft",
        badge: "bg-amber-50 text-amber-700 border-amber-200/90",
        dot: "bg-amber-500",
        accent: "from-amber-400 to-orange-500",
      };
    case "ARCHIVED":
      return {
        label: "Arsip",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
        accent: "from-slate-400 to-slate-500",
      };
    default:
      return {
        label: status,
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
        accent: "from-blue-500 to-indigo-600",
      };
  }
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

  const editorOpen = selected !== undefined;
  useEffect(() => {
    if (editorOpen) window.scrollTo(0, 0);
  }, [editorOpen]);

  useEffect(() => {
    const sync = () => {
      const key = window.location.hash.slice(1);
      if (["announcements", "events", "galleries", "documents"].includes(key)) {
        setKind(key as ContentKind);
        setPage(1);
        setSelected(undefined);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

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

  const ActiveIcon = channelIcons[kind] ?? MegaphoneSvg;

  return (
    <div className="space-y-6">
      {/* Segmented Glass Pill Tabs */}
      <nav aria-label="Kanal konten" className="cms-channel-tabs">
        {(Object.entries(channels) as [ContentKind, { title: string }][]).map(
          ([key, c]) => {
            const isActive = kind === key;
            const Icon = channelIcons[key] ?? MegaphoneSvg;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  if (leave()) {
                    window.location.hash = key;
                    setKind(key);
                    setPage(1);
                    setSelected(undefined);
                  }
                }}
              >
                <Icon size={17} strokeWidth={2} />
                <span>{c.title}</span>
              </button>
            );
          },
        )}
      </nav>

      {selected === undefined && (
        <div className="space-y-5">
          {/* Unified Glass Toolbar & Filter Panel */}
          <div className="glass-toolbar space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100/80 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Daftar {channels[kind].title}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Kelola publikasi {channels[kind].title.toLowerCase()} untuk ditampilkan pada portal website kelurahan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (leave()) {
                    setSelected(null);
                    setEpoch(epoch + 1);
                  }
                }}
                className="glass-button-primary shrink-0 self-start sm:self-auto"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Tambah {channels[kind].title}</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_auto] items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                <input
                  className="cms-input pl-10 pr-9 text-xs"
                  placeholder={`Cari judul ${channels[kind].title.toLowerCase()}...`}
                  value={search}
                  maxLength={100}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-md text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="cms-input text-xs font-semibold"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Status Publikasi</option>
                <option value="PUBLISHED">Status: Terbit</option>
                <option value="DRAFT">Status: Draft</option>
                <option value="ARCHIVED">Status: Arsip</option>
              </select>

              <button
                type="button"
                onClick={() => void query.refetch()}
                className="glass-button-secondary"
              >
                <RotateCw
                  size={14}
                  strokeWidth={2.2}
                  className={query.isFetching ? "animate-spin text-blue-600" : ""}
                />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          {query.isPending && <AdminLoading />}
          {query.isError && (
            <AdminError error={query.error} onRetry={() => void query.refetch()} />
          )}

          {query.data?.items.length === 0 && (
            <AdminEmptyState
              title={`Belum ada ${channels[kind].title.toLowerCase()}`}
              description="Mulai dengan menambahkan data baru, atau sesuaikan filter pencarian Anda."
            />
          )}

          {query.data && query.data.items.length > 0 && (
            <div className="space-y-4">
              <div className="grid gap-3.5">
                {query.data.items.map((item) => {
                  const badgeInfo = statusBadge(item.status);
                  const formattedDate = item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;

                  return (
                    <article
                      key={item.id}
                      className="glass-list-card group flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
                    >
                      <span
                        className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${badgeInfo.accent}`}
                      />
                      <div className="flex items-start gap-4 min-w-0 pl-1">
                        <div className="glass-icon-box size-12">
                          <ActiveIcon size={22} strokeWidth={2} />
                        </div>

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeInfo.badge}`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${badgeInfo.dot} ${
                                  item.status === "PUBLISHED" ? "animate-pulse" : ""
                                }`}
                              />
                              {badgeInfo.label}
                            </span>

                            {item.announcement?.pinned && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold">
                                <Pin size={11} />
                                <span>Disematkan</span>
                              </span>
                            )}

                            {item.document?.category && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                                {item.document.category}
                              </span>
                            )}

                            {item.gallery?.photos && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                                {item.gallery.photos.length} Foto
                              </span>
                            )}

                            {formattedDate && (
                              <span className="text-[11px] font-medium text-slate-400">
                                Diperbarui {formattedDate}
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors break-words">
                            {item.title}
                          </h3>

                          {item.event && (
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 pt-0.5 flex-wrap">
                              {item.event.location && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50/70 px-2 py-0.5 text-blue-800">
                                  <MapPin size={12} className="text-blue-600" />
                                  <span>{item.event.location}</span>
                                </span>
                              )}
                              {item.event.start && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-slate-700">
                                  <Clock size={12} className="text-slate-500" />
                                  <span>{item.event.start.slice(0, 10)}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          className="glass-button-secondary"
                          title="Sunting Konten"
                          aria-label={`Edit ${item.title}`}
                          onClick={() => {
                            if (leave()) {
                              setSelected(item);
                              setEpoch(epoch + 1);
                            }
                          }}
                        >
                          <Pencil size={14} strokeWidth={2.2} />
                          <span>Sunting</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <AdminPagination
                page={page}
                total={query.data.total ?? 0}
                limit={10}
                onPageChange={setPage}
                itemName="konten"
              />
            </div>
          )}
        </div>
      )}

      {selected !== undefined && (
        <div className="space-y-4">
          <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors"
              onClick={() => {
                if (leave()) setSelected(undefined);
              }}
            >
              <ArrowLeft size={17} strokeWidth={2.2} />
              <span>Kembali ke Daftar {channels[kind].title}</span>
            </button>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200/80 px-3.5 py-1.5 rounded-xl w-fit">
              {selected
                ? `Menyunting: ${selected.title.slice(0, 45)}`
                : `Tambah ${channels[kind].title} Baru`}
            </span>
          </div>

          <Editor
            key={`${kind}-${epoch}`}
            kind={kind}
            item={selected}
            onSaved={(item) => {
              setSelected(item);
              void query.refetch();
            }}
          />
        </div>
      )}

      {/* Media Library Drawer */}
      <details className="cms-media-drawer overflow-hidden">
        <summary className="cursor-pointer flex items-center justify-between hover:bg-blue-50/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="glass-icon-box size-9">
              <FolderOpen size={17} strokeWidth={2} />
            </div>
            <div>
              <strong className="text-sm font-extrabold text-slate-900 block">
                Pustaka Media & Lampiran Berkas
              </strong>
              <span className="text-xs text-slate-500">
                Klik untuk membuka panel unggah gambar atau berkas PDF
              </span>
            </div>
          </div>
        </summary>
        <div className="cms-media-content">
          <MediaLibrary />
        </div>
      </details>
    </div>
  );
}

export default function Page() {
  return (
    <main id="konten" tabIndex={-1} className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Kanal Konten & Informasi"
        description="Kelola pengumuman warga, agenda kegiatan, album galeri dokumentasi, dan dokumen informasi publik (PPID)."
        icon={MegaphoneSvg}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
