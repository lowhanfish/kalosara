"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
};
function Workspace() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [tab, setTab] = useState("berita");
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [selected, setSelected] = useState<News | null>(null);
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
      <div role="group" aria-label="Modul CMS" className="flex flex-wrap gap-3">
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
          <p>
            Kelola dan pratinjau berita resmi di sini. Berita berstatus
            PUBLISHED tampil pada website publik.
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
            className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
                <option>DRAFT</option>
                <option>PUBLISHED</option>
                <option>ARCHIVED</option>
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
          {query.isLoading && <p>Memuat berita…</p>}
          {query.isError && (
            <p role="alert">
              {cmsError(query.error)}{" "}
              <button
                className="underline"
                onClick={() => void query.refetch()}
              >
                Coba lagi
              </button>
            </p>
          )}
          {query.data?.items.length === 0 && (
            <p>Belum ada berita yang sesuai.</p>
          )}
          <ul className="space-y-3">
            {query.data?.items.map((row) => (
              <li
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
                key={row.id}
              >
                <div className="min-w-0">
                  <h2 className="break-words font-semibold">{row.title}</h2>
                  <p className="text-sm">
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
          <div className="flex items-center gap-4">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Sebelumnya
            </button>
            <span>
              Halaman {page} · {query.data?.total ?? 0} berita
            </span>
            <button
              disabled={!query.data || page * 10 >= query.data.total}
              onClick={() => setPage(page + 1)}
            >
              Berikutnya
            </button>
          </div>
          {open.isError && <p role="alert">{cmsError(open.error)}</p>}
          {notice && <p role="status">{notice}</p>}
          {selected && (
            <NewsEditor
              key={`${selected.id}-${selected.version}-${editorEpoch}`}
              initial={selected}
              onSaved={(news, cacheInvalidated) => {
                setEditorEpoch((value) => value + 1);
                setSelected(news);
                setNotice(
                  `Berita tersimpan — ${news.status}, versi ${news.version}.${cacheInvalidated === false ? " Pembaruan cache publik tertunda dan akan dicoba ulang otomatis." : ""}`,
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
    <main id="konten" tabIndex={-1} className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Kelola berita dan media</h1>
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
