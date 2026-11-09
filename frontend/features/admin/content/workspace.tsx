"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Files,
  ArrowLeft,
  Pencil,
  Plus,
  Megaphone,
  CalendarDays,
  Images,
  FileText,
  Search,
  RotateCw,
  X,
  Pin,
  MapPin,
  Clock,
} from "lucide-react";
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
  announcements: Megaphone,
  events: CalendarDays,
  galleries: Images,
  documents: FileText,
};

const channelThemes = {
  announcements: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  events: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  galleries: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
  },
  documents: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
};

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Terbit",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
      };
    case "DRAFT":
      return {
        label: "Draft",
        badge: "bg-amber-50 text-amber-700 border-amber-200/80",
        dot: "bg-amber-500",
      };
    case "ARCHIVED":
      return {
        label: "Arsip",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
      };
    default:
      return {
        label: status,
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
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

  const ActiveIcon = channelIcons[kind] ?? Files;
  const currentTheme = channelThemes[kind] ?? channelThemes.announcements;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6">
        {(Object.entries(channels) as [ContentKind, { title: string }][]).map(
          ([key, c]) => {
            const isActive = kind === key;
            const Icon = channelIcons[key] ?? Files;
            return (
              <button
                key={key}
                aria-pressed={isActive}
                onClick={() => {
                  if (leave()) {
                    window.location.hash = key;
                    setKind(key);
                    setPage(1);
                    setSelected(undefined);
                  }
                }}
                className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                <span>{c.title}</span>
              </button>
            );
          },
        )}
      </div>

      {selected === undefined && (
        <div className="space-y-6">
          {/* Top Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Daftar {channels[kind].title}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kelola data {channels[kind].title.toLowerCase()} untuk ditampilkan pada portal website kelurahan.
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
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-95 self-start sm:self-auto"
            >
              <Plus size={15} />
              <span>+ Buat {channels[kind].title} Baru</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="cms-input pl-9 text-xs"
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
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="cms-input text-xs font-semibold py-2 px-3 pr-8 shrink-0"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Status</option>
                <option value="PUBLISHED">Terbit</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Arsip</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => void query.refetch()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <RotateCw
                size={13}
                className={query.isFetching ? "animate-spin text-primary" : ""}
              />
              <span>Segarkan</span>
            </button>
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
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden divide-y divide-slate-100">
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
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors group"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${currentTheme.bg} ${currentTheme.text} border ${currentTheme.border} shadow-2xs`}
                        >
                          <ActiveIcon size={18} />
                        </div>

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeInfo.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${badgeInfo.dot} ${
                                  item.status === "PUBLISHED" ? "animate-pulse" : ""
                                }`}
                              />
                              {badgeInfo.label}
                            </span>

                            {item.announcement?.pinned && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                                <Pin size={10} />
                                <span>Disematkan</span>
                              </span>
                            )}

                            {item.document?.category && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {item.document.category}
                              </span>
                            )}

                            {item.gallery?.photos && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {item.gallery.photos.length} Foto
                              </span>
                            )}

                            {formattedDate && (
                              <>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-[11px] text-slate-400">
                                  Diperbarui {formattedDate}
                                </span>
                              </>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-primary transition-colors break-words">
                            {item.title}
                          </h3>

                          {item.event && (
                            <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5 flex-wrap">
                              {item.event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} className="text-slate-400" />
                                  <span>{item.event.location}</span>
                                </span>
                              )}
                              {item.event.start && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} className="text-slate-400" />
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
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          title="Edit Konten"
                          aria-label={`Edit ${item.title}`}
                          onClick={() => {
                            if (leave()) {
                              setSelected(item);
                              setEpoch(epoch + 1);
                            }
                          }}
                        >
                          <Pencil size={13} className="text-primary" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
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
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              onClick={() => {
                if (leave()) setSelected(undefined);
              }}
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar {channels[kind].title}</span>
            </button>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              {selected
                ? `Mengedit: ${selected.title.slice(0, 45)}...`
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
      <details className="cms-media-drawer rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <summary className="p-4 font-semibold text-slate-800 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors">
          <span>Pustaka Media & Lampiran</span>
          <span className="text-xs text-slate-400 font-normal">
            Unggah dan kelola gambar atau berkas PDF
          </span>
        </summary>
        <div className="cms-media-content p-4 border-t border-slate-100">
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
        description="Kelola pengumuman warga, agenda kelurahan, galeri kegiatan, dan dokumen publik."
        icon={Files}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
