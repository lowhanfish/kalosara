import { cn } from "@/lib/utils";
export function Badge({
  children,
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-soft px-2.5 py-1 text-sm font-semibold text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
