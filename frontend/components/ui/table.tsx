import { cn } from "@/lib/utils";
export function Table({
  label,
  className,
  ...props
}: React.ComponentProps<"table"> & { label: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="w-full overflow-x-auto rounded-card border border-border"
    >
      <table
        className={cn(
          "w-full min-w-[36rem] text-left text-[15px] [&_th]:bg-soft [&_th]:p-4 [&_th]:font-semibold [&_td]:border-t [&_td]:border-border [&_td]:p-4",
          className,
        )}
        {...props}
      />
    </div>
  );
}
