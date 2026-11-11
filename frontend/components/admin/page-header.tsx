import type { ComponentType, ReactNode } from "react";

type IconComponent = ComponentType<{
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
}>;

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: IconComponent;
  children?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-heading">
        <span className="admin-page-icon" aria-hidden="true">
          <Icon size={24} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="admin-eyebrow">
            <span className="inline-block size-1.5 rounded-full bg-sky-500" />
            <span>Panel Pengelola · Kelurahan Watundehoa</span>
          </p>
          <h1 className="admin-page-title">{title}</h1>
          <p className="admin-page-description">{description}</p>
        </div>
      </div>
      {children && (
        <div className="admin-page-actions shrink-0">{children}</div>
      )}
    </header>
  );
}
