import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A small on/off or pick-one button. */
export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "tap h-9 shrink-0 rounded-full border px-3 text-sm",
        active ? "border-transparent bg-accent text-accent-foreground" : "border-border text-muted hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
