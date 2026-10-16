import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      id="konten"
      tabIndex={-1}
      aria-busy="true"
      aria-label="Memuat halaman"
      className="container py-12"
    >
      <p role="status" className="mb-6 text-sm text-muted">
        Memuat informasi…
      </p>
      <Skeleton className="mb-5 h-10 max-w-sm" />
      <Skeleton className="mb-10 h-5 max-w-lg" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((id) => (
          <Skeleton key={id} className="h-52" />
        ))}
      </div>
    </main>
  );
}
