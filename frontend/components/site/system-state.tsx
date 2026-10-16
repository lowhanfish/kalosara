import Link from "next/link";
import { Button } from "@/components/ui/button";
export function SystemState({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <main
      id="konten"
      tabIndex={-1}
      className="container flex min-h-[55vh] flex-col items-center justify-center py-20 text-center"
    >
      <p className="eyebrow">{code}</p>
      <h1 className="display-title mt-5 text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-5 max-w-lg text-muted">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {children}
        <Button asChild variant="outline">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </main>
  );
}
