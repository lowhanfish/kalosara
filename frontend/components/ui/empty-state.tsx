import { FolderOpen } from "lucide-react";
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-[#a8bbae] bg-white px-6 py-14 text-center">
      <FolderOpen
        aria-hidden="true"
        className="mb-5 size-9 text-primary"
        strokeWidth={1.3}
      />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-lg text-sm text-muted">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
