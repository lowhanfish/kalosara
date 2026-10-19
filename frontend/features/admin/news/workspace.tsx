"use client";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { AdminAccess } from "@/features/cms/admin-access";
import { Categories } from "@/features/cms/categories";
import { MediaLibrary } from "@/features/cms/media-library";
import { NewsEditor } from "@/features/cms/news-editor";
import { AdminPagination } from "@/components/admin/pagination";
import {
  cmsError,
  type News,
  type List,
  type Category,
} from "@/features/cms/client";
type Row = Pick<News, "id" | "title" | "slug" | "status" | "version"> & {
  category: { name: string };
};
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
    <div className="space-y-7">
      <div role="group" aria-label="Modul CMS" className="cms-channel-tabs">
        {["berita", "kategori", "media"].map((value) => (
          <button
            key={value}
            className="rounded border border-border px-4 py-3 capitalize"
            aria-pressed={tab === value}
            onClick={() => {
              if (confirmLeave()) {
                setSelected(null);
                setTab(value);
              }
            }}
          >
            {value}
          </button>
        ))}
      </div>
      {tab === "media" && <MediaLibrary />}
      {tab === "kategori" && <Categories />}
      {tab === "berita" && (
        <>
          {!selected && (
            <>
              <p>
                Buat dan kelola berita yang akan dibaca warga. Pilih status
                Terbit untuk menampilkannya pada website.
              </p>
              <button
                className="yellow-button"
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
              >
                Buat berita baru
              </button>
              <form
                className="grid items-end gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  setSearch(
                    String(new FormData(e.currentTarget).get("search") ?? ""),
                  );
                }}
              >
                <label>
                  Cari berita
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
                    <option value="">Semua status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Terbit</option>
                    <option value="ARCHIVED">Arsip</option>
                  </select>
                </label>
                <label>
                  Filter kategori
                  <select
                    className="cms-input"
                    value={categoryId}
                    onChange={(e) => {
                      setPage(1);
                      setCategoryId(e.target.value);
                    }}
                  >
                    <option value="">Semua kategori</option>
                    {categories.data?.items.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Urutkan
                  <select
                    className="cms-input"
                    value={sort}
                    onChange={(e) => {
                      setPage(1);
                      setSort(e.target.value);
                    }}
                  >
                    <option value="newest">Terbaru diperbarui</option>
                    <option value="oldest">Terlama diperbarui</option>
                    <option value="title">Judul A–Z</option>
                  </select>
                </label>
                <button className="yellow-button">Cari berita</button>
              </form>
              {query.isPending && <AdminLoading />}
              {query.isError && (
                <AdminError
                  error={query.error}
                  onRetry={() => void query.refetch()}
                />
              )}
              {query.data?.items.length === 0 && (
                <AdminEmptyState
                  title="Belum ada berita"
                  description="Buat berita pertama untuk berbagi kabar dengan warga, atau ubah filter pencarian."
                />
              )}
              <ul className="space-y-3">
                {query.data?.items.map((row) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
                    key={row.id}
                  >
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold">{row.title}</h2>
                      <p className="text-[15px]">
                        {row.status} · {row.category.name} · versi {row.version}
                      </p>
                    </div>
                    <button
                      className="underline"
                      disabled={open.isPending}
                      onClick={() => {
                        if (confirmLeave()) open.mutate(row.id);
                      }}
                    >
                      Edit {row.title}
                    </button>
                  </li>
                ))}
              </ul>
              <AdminPagination
                page={page}
                total={query.data?.total ?? 0}
                limit={10}
                onPageChange={setPage}
                itemName="berita"
              />
              {open.isError && <p role="alert">{cmsError(open.error)}</p>}
            </>
          )}
          {selected && (
            <button
              type="button"
              className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
              onClick={() => {
                if (confirmLeave()) setSelected(null);
              }}
            >
              ← Kembali ke daftar berita
            </button>
          )}
          {notice && (
            <p
              role="status"
              className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[15px] text-emerald-800"
            >
              {notice}
            </p>
          )}
          {selected && (
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
          )}
        </>
      )}
    </div>
  );
}
export default function NewsAdmin() {
  return (
    <main id="konten" tabIndex={-1} className="min-w-0">
      <AdminPageHeader
        title="Berita & media"
        description="Terbitkan kabar kelurahan, atur kategori, dan kelola pustaka media."
        icon={Newspaper}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
