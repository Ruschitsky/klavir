import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "tap inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,opacity] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const variants = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-border bg-background text-foreground hover:bg-card",
  ghost: "bg-transparent text-foreground hover:bg-background",
};
const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm" };

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ className, variant = "outline", size = "md", type, ...props }: Props) {
  return <button className={cn(base, variants[variant], sizes[size], className)} type={type ?? "button"} {...props} />;
}
