"use client";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Files } from "lucide-react";
import Editor from "./editor";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminAccess } from "@/features/cms/admin-access";
import { MediaLibrary } from "@/features/cms/media-library";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import {
  channels,
  type ContentKind,
  type ContentItem,
  type ContentList,
} from "@/lib/content";

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
                window.location.hash = key;
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
      {selected === undefined && (
        <>
          <form
            className="cms-filters"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(
                String(new FormData(e.currentTarget).get("search") ?? ""),
              );
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
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Terbit</option>
                <option value="ARCHIVED">Arsip</option>
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
          {query.isPending && <AdminLoading />}
          {query.isError && (
            <AdminError
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          )}
          {query.data?.items.length === 0 && (
            <AdminEmptyState
              title="Belum ada konten"
              description="Mulai dengan menambahkan konten baru, atau ubah filter pencarian Anda."
            />
          )}
          <ul className="cms-content-list">
            {query.data?.items.map((item) => (
              <li className="cms-content-row" key={item.id}>
                <div className="cms-row-title">
                  <h2>{item.title}</h2>
                  <span className="cms-status" data-status={item.status}>
                    {
                      {
                        DRAFT: "Draft",
                        PUBLISHED: "Terbit",
                        ARCHIVED: "Arsip",
                      }[item.status]
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
        </>
      )}
      {selected !== undefined && (
        <button
          type="button"
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary"
          onClick={() => {
            if (leave()) setSelected(undefined);
          }}
        >
          ← Kembali ke daftar
        </button>
      )}
      {selected !== undefined && (
        <Editor
          key={`${kind}-${epoch}`}
          kind={kind}
          item={selected}
          onSaved={(item) => {
            setSelected(item);
            void query.refetch();
          }}
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
    <main id="konten" tabIndex={-1} className="min-w-0">
      <AdminPageHeader
        title="Kanal informasi"
        description="Kelola pengumuman, agenda, galeri, dan dokumen publik."
        icon={Files}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
