import { cn } from "@/lib/utils";
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-6 shadow-card",
        className,
      )}
      {...props}
    />
  );
}
