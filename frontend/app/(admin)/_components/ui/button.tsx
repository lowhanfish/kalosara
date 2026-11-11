import React from "react";

export type ButtonVariant =
  "primary" | "sky" | "gold" | "secondary" | "outline" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "glass-button-primary text-white",
  sky: "glass-button-primary text-white",
  gold: "glass-button-primary text-white",
  secondary: "glass-button-secondary text-sky-800",
  outline:
    "bg-white/75 hover:bg-sky-50/90 text-slate-700 hover:text-sky-700 border border-sky-200/80 shadow-2xs backdrop-blur-md",
  ghost:
    "bg-transparent hover:bg-sky-500/10 text-slate-600 hover:text-sky-700 border border-transparent",
  danger:
    "bg-linear-to-b from-red-500 to-rose-600 hover:from-red-500 hover:to-rose-700 text-white border border-red-400/80 shadow-sm shadow-red-500/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-xl gap-1.5",
  md: "h-10 px-4 text-[13px] rounded-[13px] gap-2",
  lg: "h-11 px-5 text-sm rounded-2xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
