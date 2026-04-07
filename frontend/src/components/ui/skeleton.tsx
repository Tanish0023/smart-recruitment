import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200/80 dark:bg-slate-700/70",
        className
      )}
    />
  );
}
