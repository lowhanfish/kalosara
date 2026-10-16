import Link from "next/link";
import { ChevronRight } from "lucide-react";
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Jejak halaman" className="py-5 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight aria-hidden="true" className="size-3" />
            )}
            {item.href ? (
              <Link
                className="underline-offset-4 hover:underline"
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
