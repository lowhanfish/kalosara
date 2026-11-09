import { AdminLoading } from "@/components/admin/feedback";

export default function AdminRouteLoading() {
  return (
    <main className="min-w-0 space-y-6">
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="size-13 shrink-0 animate-pulse rounded-2xl bg-sky-200/60" />
          <div className="space-y-2.5">
            <div className="h-3 w-36 animate-pulse rounded-full bg-sky-200/55" />
            <div className="h-6 w-56 animate-pulse rounded-lg bg-sky-200/70" />
            <div className="h-3.5 w-72 animate-pulse rounded-md bg-sky-100/80" />
          </div>
        </div>
        <div className="h-10 w-36 animate-pulse rounded-xl bg-sky-200/65" />
      </div>
      <AdminLoading variant="list" label="Memuat halaman admin…" />
    </main>
  );
}
