"use client";

import React from "react";
import { PageHeader, Card, type BadgeVariant } from "./ui";

export interface AdminPageScaffoldProps {
  title: string;
  description?: string;
  eyebrow?: string;
  badge?: { text: string; variant?: BadgeVariant };
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function AdminPageScaffold({
  title,
  description,
  eyebrow,
  badge,
  action,
  children,
}: AdminPageScaffoldProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        badge={badge}
        action={action}
      />
      <Card>{children}</Card>
    </div>
  );
}
