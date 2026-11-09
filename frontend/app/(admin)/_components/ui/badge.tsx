import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "sky"
  | "gold"
  | "neutral";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/12 text-emerald-700 border-emerald-300/80",
  warning: "bg-amber-500/12 text-amber-700 border-amber-300/80",
  danger: "bg-rose-500/12 text-rose-700 border-rose-300/80",
  info: "bg-sky-500/12 text-sky-700 border-sky-300/80",
  sky: "bg-sky-500/15 text-sky-800 border-sky-300/90",
  gold: "bg-sky-500/15 text-sky-800 border-sky-300/90",
  neutral: "bg-slate-500/10 text-slate-600 border-slate-300/80",
};

const dotClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  sky: "bg-sky-600",
  gold: "bg-sky-600",
  neutral: "bg-slate-400",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-[11px]",
};

export function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold tracking-tight ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`size-1.5 rounded-full ${dotClasses[variant]}`} />
      )}
      {children}
    </span>
  );
}
