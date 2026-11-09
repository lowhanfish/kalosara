"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pencil,
  Plus,
  FolderTree,
  Search,
  RotateCw,
  X,
  Calendar,
  Layers,
} from "lucide-react";
import {
  NewsPaperSvg,
  GalleryPhotoSvg,
} from "@/components/admin/admin-icons";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { AdminAccess } from "@/features/cms/admin-access";
import { Categories } from "@/features/cms/categories";
import { MediaLibrary } from "@/features/cms/media-library";
import { NewsEditor } from "@/features/cms/news-editor";
import {
  cmsError,
  type News,
  type List,
  type Category,
} from "@/features/cms/client";

type Row = Pick<News, "id" | "title" | "slug" | "status" | "version"> & {
  category: { name: string };
  updatedAt?: string;
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
  const [tab, setTab] = useState("berita");
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [selected, setSelected] = useState<News | null>(null);
  const editorOpen = selected !== null;

  useEffect(() => {
    if (editorOpen) window.scrollTo(0, 0);
  }, [editorOpen]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [categoryId, setCategoryId] = useState("");
  const [notice, setNotice] = useState("");

  const query = useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "cms-news",
      page,
      search,
      status,
      sort,
      categoryId,
    ],
    queryFn: () =>
      runtime.request<List<Row>>(
        `/admin/news?page=${page}&search=${encodeURIComponent(search)}&sort=${sort}${status ? `&status=${status}` : ""}${categoryId ? `&categoryId=${categoryId}` : ""}`,
      ),
  });

  const categories = useQuery({
    queryKey: ["user", auth.user?.id, "cms-categories", "filter"],
    queryFn: () =>
      runtime.request<List<Category>>("/admin/news/categories?limit=50"),
  });

  const open = useMutation({
    mutationFn: (id: string) =>
      runtime.request<{ news: News }>(`/admin/news/${id}`),
    onSuccess: (data) => {
      setEditorEpoch((value) => value + 1);
      setSelected(data.news);
      setNotice("");
    },
  });

  const confirmLeave = () =>
    !selected ||
    confirm(
      "Beralih akan menutup editor. Pastikan perubahan sudah disimpan. Lanjutkan?",
    );

  return (
    <div className="space-y-6">
      {/* Segmented Glass Pill Tabs */}
      <nav aria-label="Kanal berita dan media" className="cms-channel-tabs">
        {[
          { id: "berita", label: "Daftar Berita", icon: NewsPaperSvg },
          { id: "kategori", label: "Kategori Berita", icon: FolderTree },
          { id: "media", label: "Pustaka Media", icon: GalleryPhotoSvg },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                if (confirmLeave()) {
                  setSelected(null);
                  setTab(id);
                }
              }}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {tab === "media" && <MediaLibrary />}
      {tab === "kategori" && <Categories />}
      {tab === "berita" && (
        <>
          {!selected && (
            <div className="space-y-5">
              {/* Unified Glass Toolbar & Filter Panel */}
              <div className="glass-toolbar space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100/80 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Arsip & Publikasi Berita Kelurahan
                    </h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Kelola kabar kegiatan, pengumuman pers, dan artikel liputan warga Kelurahan Watundehoa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmLeave()) {
                        setSelected({
                          id: crypto.randomUUID(),
                          slug: "",
                          title: "",
                          excerpt: "",
                          bodyHtml: "<p></p>",
                          categoryId: "",
                          coverId: null,
                          status: "DRAFT",
                          version: 0,
                        });
                        setNotice("");
                      }
                    }}
                    className="glass-button-primary shrink-0 self-start sm:self-auto"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Buat Berita Baru</span>
                  </button>
                </div>

                {/* Filter Controls Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] items-center">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <input
                      className="cms-input pl-10 pr-9 text-xs"
                      placeholder="Cari judul berita atau slug..."
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
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
                    <option value="">Semua Status</option>
                    <option value="PUBLISHED">Status: Terbit</option>
                    <option value="DRAFT">Status: Draft</option>
                    <option value="ARCHIVED">Status: Arsip</option>
                  </select>

                  <select
                    className="cms-input text-xs font-semibold"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.data?.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="cms-input text-xs font-semibold"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="newest">Terbaru Diperbarui</option>
                    <option value="oldest">Terlama Diperbarui</option>
                    <option value="title">Abjad Judul A–Z</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => void query.refetch()}
                    className="glass-button-secondary w-full lg:w-auto"
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
                <AdminError
                  error={query.error}
                  onRetry={() => void query.refetch()}
                />
              )}

              {query.data?.items.length === 0 && (
                <AdminEmptyState
                  title="Belum ada berita yang sesuai"
                  description="Buat berita pertama untuk berbagi kabar dengan warga, atau sesuaikan filter pencarian Anda."
                />
              )}

              {query.data && query.data.items.length > 0 && (
                <div className="space-y-4">
                  <div className="grid gap-3.5">
                    {query.data.items.map((row) => {
                      const badgeInfo = statusBadge(row.status);
                      const formattedDate = row.updatedAt
                        ? new Date(row.updatedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : null;

                      return (
                        <article
                          key={row.id}
                          className="glass-list-card group flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
                        >
                          <span
                            className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${badgeInfo.accent}`}
                          />
                          <div className="flex items-start gap-4 min-w-0 pl-1">
                            <div className="glass-icon-box size-12">
                              <NewsPaperSvg size={22} strokeWidth={2} />
                            </div>

                            <div className="min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                                  {row.category?.name || "Umum"}
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeInfo.badge}`}
                                >
                                  <span
                                    className={`size-1.5 rounded-full ${badgeInfo.dot} ${
                                      row.status === "PUBLISHED"
                                        ? "animate-pulse"
                                        : ""
                                    }`}
                                  />
                                  {badgeInfo.label}
                                </span>

                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                  <Layers size={11} />
                                  Revisi v{row.version}
                                </span>

                                {formattedDate && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                    <Calendar size={12} className="text-blue-500" />
                                    {formattedDate}
                                  </span>
                                )}
                              </div>

                              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors break-words">
                                {row.title}
                              </h3>

                              {row.slug && (
                                <p className="text-xs text-slate-400 font-mono">
                                  /berita/{row.slug}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              className="glass-button-secondary"
                              title="Edit Berita"
                              aria-label={`Edit ${row.title}`}
                              disabled={open.isPending}
                              onClick={() => {
                                if (confirmLeave()) open.mutate(row.id);
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
                    itemName="berita"
                  />
                </div>
              )}

              {open.isError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <p role="alert">{cmsError(open.error)}</p>
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (confirmLeave()) {
                      setSelected(null);
                    }
                  }}
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  <ArrowLeft size={17} strokeWidth={2.2} />
                  <span>Kembali ke Daftar Berita</span>
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200/80 px-3.5 py-1.5 rounded-xl w-fit">
                  {selected.title
                    ? `Menyunting: ${selected.title.slice(0, 48)}`
                    : "Menulis Berita Baru"}
                </span>
              </div>

              {notice && (
                <p
                  role="status"
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/90 backdrop-blur-md p-4 text-xs font-bold text-emerald-800 shadow-xs"
                >
                  {notice}
                </p>
              )}

              <NewsEditor
                key={`${selected.id}-${selected.version}-${editorEpoch}`}
                initial={selected}
                onSaved={(news, cacheInvalidated) => {
                  setEditorEpoch((value) => value + 1);
                  setSelected(news);
                  setNotice(
                    `Berita berhasil disimpan.${cacheInvalidated === false ? " Perubahan pada website sedang disinkronkan." : ""}`,
                  );
                  void query.refetch();
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Publikasi Berita & Media"
        description="Kelola informasi terkini, liputan kegiatan, kategori artikel, dan pustaka media website kelurahan."
        icon={NewsPaperSvg}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
