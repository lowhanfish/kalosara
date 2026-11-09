import React from "react";
import { Badge, type BadgeVariant } from "./badge";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  badge?: {
    text: string;
    variant?: BadgeVariant;
  };
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow = "Panel Administrasi Kelurahan",
  icon: IconComp,
  badge,
  action,
}: PageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-heading">
        {IconComp && (
          <div className="admin-page-icon" aria-hidden="true">
            <IconComp size={24} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="admin-eyebrow !mb-0">{eyebrow}</p>
            {badge && (
              <Badge variant={badge.variant ?? "sky"} size="sm" dot>
                {badge.text}
              </Badge>
            )}
          </div>
          <h1 className="admin-page-title mt-0.5">{title}</h1>
          {description && (
            <p className="admin-page-description">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="admin-page-actions flex flex-wrap items-center gap-2 shrink-0">
          {action}
        </div>
      )}
    </header>
  );
}
