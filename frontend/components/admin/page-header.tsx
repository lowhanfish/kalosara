import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-heading">
        <span className="admin-page-icon">
          <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <p className="admin-eyebrow">Pengelolaan website</p>
          <h1 className="admin-page-title">{title}</h1>
          <p className="admin-page-description">{description}</p>
        </div>
      </div>
      {children}
    </header>
  );
}
